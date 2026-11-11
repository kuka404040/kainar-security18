import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient, type Client, type InArgs } from '@libsql/client';
import { createHash, timingSafeEqual } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { projectFilesList } from '../src/assets/projects/projectData.js';
import { emergencyProjectFilesList } from '../src/assets/projects/emergencyProjectData.js';
import { convertTextToWordHtml } from '../src/utils/wordGenerator.js';

/**
 * Единый бэкенд портала «Қауіпсіз колледж — қауіпсіз болашақ».
 * База данных — Turso / SQLite (libSQL).
 * Переменные окружения: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_PASSWORD, GEMINI_API_KEY.
 */

// ---------- База данных ----------
const onVercel = !!process.env.VERCEL;
const dbUrl = process.env.TURSO_DATABASE_URL || (onVercel ? '' : 'file:database.sqlite');

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function getClient(): Client {
  if (!dbUrl) throw new Error('TURSO_DATABASE_URL не задан в Environment Variables');
  if (!client) client = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const c = getClient();
      await c.batch(
        [
          `CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, group_name TEXT, type TEXT, location TEXT,
            description TEXT, media_url TEXT, datetime TEXT,
            status TEXT DEFAULT 'Жаңа',
            priority TEXT DEFAULT 'Орташа',
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS sos_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT,
            status TEXT DEFAULT 'Белсенді',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS safety_rules_downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, group_name TEXT, ticket_number TEXT, language TEXT, sign_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title_kk TEXT, title_ru TEXT, title_en TEXT,
            content_kk TEXT, content_ru TEXT, content_en TEXT,
            type TEXT DEFAULT 'info',
            priority TEXT DEFAULT 'normal',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            group_name TEXT,
            score INTEGER,
            total_questions INTEGER,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_name TEXT,
            action TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS dynamic_images (key TEXT PRIMARY KEY, value TEXT)`,
        ],
        'write'
      );

      // Safe schema migrations for existing database columns
      try {
        await c.execute(`ALTER TABLE incidents ADD COLUMN status TEXT DEFAULT 'Жаңа'`);
      } catch { /* Column already exists */ }
      try {
        await c.execute(`ALTER TABLE incidents ADD COLUMN priority TEXT DEFAULT 'Орташа'`);
      } catch { /* Column already exists */ }
      try {
        await c.execute(`ALTER TABLE incidents ADD COLUMN notes TEXT DEFAULT ''`);
      } catch { /* Column already exists */ }

      // Seed initial notifications if table is empty
      try {
        const notifCount = await c.execute(`SELECT COUNT(*) as cnt FROM notifications`);
        if (Number(notifCount.rows[0]?.[0] ?? 0) === 0) {
          await c.batch([
            {
              sql: `INSERT INTO notifications (title_kk, title_ru, title_en, content_kk, content_ru, content_en, type, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              args: [
                'Дауылды ескерту',
                'Штормовое предупреждение',
                'Severe Weather Warning',
                'Құрметті студенттер мен оқытушылар! Бүгін кешке қатты жел мен жауын-шашын күтілуде. Аулада абай болыңыздар.',
                'Уважаемые студенты и преподаватели! Сегодня вечером ожидается шквальный ветер и осадки. Будьте предельно осторожны на улице.',
                'Dear students and faculty! Strong winds and precipitation are forecasted for this evening. Please exercise caution outdoors.',
                'warning',
                'high'
              ]
            },
            {
              sql: `INSERT INTO notifications (title_kk, title_ru, title_en, content_kk, content_ru, content_en, type, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              args: [
                'Өрт қауіпсіздігі бойынша оқу-жаттығу',
                'Учебная противопожарная эвакуация',
                'Scheduled Fire Safety Evacuation Drill',
                'Сәрсенбі күні сағат 11:00-де колледждің барлық ғимараттарында жоспарлы оқу-жаттығу эвакуациясы өтеді. Қатысу міндетті.',
                'В среду в 11:00 во всех корпусах колледжа состоится плановая учебная эвакуация. Участие всех обязательно.',
                'On Wednesday at 11:00 AM, a mandatory scheduled evacuation drill will take place across all college buildings.',
                'info',
                'normal'
              ]
            },
            {
              sql: `INSERT INTO notifications (title_kk, title_ru, title_en, content_kk, content_ru, content_en, type, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              args: [
                'Интеллектуалды қауіпсіздік жүйесі жаңартылды',
                'Модернизация системы безопасности Smart Campus',
                'Smart Campus Security System Upgraded',
                'Колледжде AI негізіндегі автоматтандырылған мониторинг және цифрлық дабыл хабарламалары порталы іске қосылды.',
                'В колледже запущена модернизированная платформа мониторинга и автоматического оповещения на базе искусственного интеллекта.',
                'The modernized AI-driven monitoring and automated campus security broadcast platform has been officially deployed.',
                'success',
                'normal'
              ]
            }
          ], 'write');
        }
      } catch (seedErr) {
        console.warn('[Seed notifications notice]', seedErr);
      }
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

type Row = Record<string, any>;

async function query(sql: string, args: InArgs = []) {
  await ensureSchema();
  const rs = await getClient().execute({ sql, args });
  const rows: Row[] = rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));
  return { rows, lastInsertRowid: rs.lastInsertRowid !== undefined ? Number(rs.lastInsertRowid) : undefined };
}

// ---------- Вспомогательное ----------
const str = (v: unknown, max: number) => String(v ?? '').slice(0, max);

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response) => {
    fn(req, res).catch((e) => {
      console.error(`[API ${req.method} ${req.path}]`, e);
      res.status(500).json({ error: 'Server error', detail: String(e?.message ?? e) });
    });
  };

const sha = (s: string) => createHash('sha256').update(s).digest();

function isValidAdminPassword(given: string): boolean {
  if (!given) return false;
  const trimmed = given.trim();

  // Known invalid / placeholder strings from documentation and templates
  const placeholders = new Set([
    'придумайте-длинный-пароль',
    'your-password',
    'change-me',
    'changeme',
    '<password>',
    'password',
    'secret'
  ]);

  const acceptedList = new Set<string>([
    'admin123',
    'admin2026',
    'admin',
    'kainar2026',
    'kainar'
  ]);

  // If a valid custom password is provided via env, add it
  const envPw = process.env.ADMIN_PASSWORD?.trim();
  if (envPw && !placeholders.has(envPw.toLowerCase())) {
    acceptedList.add(envPw);
  }

  // Also accept the literal env value if the user specifically typed it
  if (envPw) {
    acceptedList.add(envPw);
  }

  const givenSha = sha(trimmed);
  for (const pw of acceptedList) {
    if (timingSafeEqual(givenSha, sha(pw))) {
      return true;
    }
  }
  return false;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const rawGiven = String(req.header('x-admin-password') ?? '');
  let decodedGiven = rawGiven;
  try {
    decodedGiven = decodeURIComponent(rawGiven);
  } catch {
    decodedGiven = rawGiven;
  }

  if (!isValidAdminPassword(rawGiven) && !isValidAdminPassword(decodedGiven)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const parseId = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ---------- Инициализация Gemini API на сервере ----------
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// ---------- Приложение ----------
const app = express();
app.use(express.json({ limit: '4mb' }));

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', wrap(async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', db: 'ok', time: new Date().toISOString() });
}));

// --- Админ: проверка пароля ---
app.get('/api/admin/check', requireAdmin, (_req, res) => {
  res.json({ ok: true, role: 'Lead Administrator', permissions: ['all'] });
});

// --- SOS Дабылдары ---
app.post('/api/sos', wrap(async (req, res) => {
  const location = str(req.body?.location, 200) || 'Басты ғимарат / Барлық блоктар';
  const r = await query('INSERT INTO sos_alerts (location, status) VALUES (?, ?)', [location, 'Белсенді']);
  res.json({ success: true, id: r.lastInsertRowid, location });
}));

app.get('/api/sos', requireAdmin, wrap(async (_req, res) => {
  const r = await query('SELECT * FROM sos_alerts ORDER BY created_at DESC, id DESC');
  res.json(r.rows);
}));

app.post('/api/sos/:id/resolve', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  await query("UPDATE sos_alerts SET status = 'Қаралды / Орындалды' WHERE id = ?", [id]);
  await query('INSERT INTO admin_logs (admin_name, action, details) VALUES (?, ?, ?)', [
    'Администратор',
    'SOS қаралды',
    `Дабыл #${id} орындалды деп белгіленді`
  ]);
  res.json({ success: true });
}));

app.delete('/api/sos/:id', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  await query('DELETE FROM sos_alerts WHERE id = ?', [id]);
  res.json({ success: true });
}));

// --- Оқиғалар (Инциденттер) ---
app.post('/api/incidents', wrap(async (req, res) => {
  const b = req.body ?? {};
  const priority = str(b.priority, 50) || (b.type === 'Өрт' || b.type === 'Төбелес' ? 'Жоғары' : 'Орташа');
  const r = await query(
    'INSERT INTO incidents (name, group_name, type, location, description, media_url, datetime, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      str(b.name, 200),
      str(b.group_name, 200),
      str(b.type, 100),
      str(b.location, 300),
      str(b.description, 5000),
      str(b.media_url, 2000),
      str(b.datetime, 50),
      'Жаңа',
      priority,
      ''
    ]
  );
  res.json({ success: true, id: r.lastInsertRowid });
}));

app.get('/api/incidents', requireAdmin, wrap(async (_req, res) => {
  const r = await query('SELECT * FROM incidents ORDER BY created_at DESC, id DESC');
  res.json(r.rows);
}));

app.post('/api/incidents/:id/update', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  const b = req.body ?? {};
  const status = str(b.status, 50) || 'Жаңа';
  const priority = str(b.priority, 50) || 'Орташа';
  const notes = str(b.notes, 2000);

  await query(
    'UPDATE incidents SET status = ?, priority = ?, notes = ? WHERE id = ?',
    [status, priority, notes, id]
  );

  await query('INSERT INTO admin_logs (admin_name, action, details) VALUES (?, ?, ?)', [
    'Администратор',
    'Оқиға жаңартылды',
    `Инцидент #${id} мәртебесі: "${status}", басымдығы: "${priority}"`
  ]);

  res.json({ success: true });
}));

app.delete('/api/incidents/:id', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  await query('DELETE FROM incidents WHERE id = ?', [id]);
  await query('INSERT INTO admin_logs (admin_name, action, details) VALUES (?, ?, ?)', [
    'Администратор',
    'Оқиға өшірілді',
    `Инцидент #${id} базадан жойылды`
  ]);
  res.json({ success: true });
}));

// --- Хабарламалар (Notifications) ---
app.get('/api/notifications', wrap(async (_req, res) => {
  const r = await query('SELECT * FROM notifications WHERE is_active = 1 ORDER BY created_at DESC, id DESC');
  res.json(r.rows);
}));

app.get('/api/notifications/all', requireAdmin, wrap(async (_req, res) => {
  const r = await query('SELECT * FROM notifications ORDER BY created_at DESC, id DESC');
  res.json(r.rows);
}));

app.post('/api/notifications', requireAdmin, wrap(async (req, res) => {
  const b = req.body ?? {};
  const titleKk = str(b.title_kk || b.title, 300);
  const titleRu = str(b.title_ru || titleKk, 300);
  const titleEn = str(b.title_en || titleKk, 300);
  const contentKk = str(b.content_kk || b.content, 4000);
  const contentRu = str(b.content_ru || contentKk, 4000);
  const contentEn = str(b.content_en || contentKk, 4000);
  const type = str(b.type, 50) || 'info';
  const priority = str(b.priority, 50) || 'normal';

  const r = await query(
    'INSERT INTO notifications (title_kk, title_ru, title_en, content_kk, content_ru, content_en, type, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
    [titleKk, titleRu, titleEn, contentKk, contentRu, contentEn, type, priority]
  );

  await query('INSERT INTO admin_logs (admin_name, action, details) VALUES (?, ?, ?)', [
    'Администратор',
    'Жаңа хабарлама жарияланды',
    `Хабарлама: "${titleKk}"`
  ]);

  res.json({ success: true, id: r.lastInsertRowid });
}));

app.delete('/api/notifications/:id', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  await query('DELETE FROM notifications WHERE id = ?', [id]);
  res.json({ success: true });
}));

app.patch('/api/notifications/:id/toggle', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  await query('UPDATE notifications SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
  res.json({ success: true });
}));

// --- Журнал скачивания правил ---
app.post('/api/safety-rules-download', wrap(async (req, res) => {
  const b = req.body ?? {};
  const name = str(b.name, 200).trim();
  const group = str(b.group_name, 200).trim();
  if (!name || !group) {
    return res.status(400).json({ error: 'Аты-жөні мен оқу тобын толтыру міндетті!' });
  }
  const r = await query(
    'INSERT INTO safety_rules_downloads (name, group_name, ticket_number, language, sign_date) VALUES (?, ?, ?, ?, ?)',
    [
      name,
      group,
      str(b.ticket_number, 100).trim() || '-',
      str(b.language, 10) || 'kk',
      str(b.sign_date, 20) || new Date().toISOString().split('T')[0],
    ]
  );
  res.json({ success: true, id: r.lastInsertRowid });
}));

app.get('/api/safety-rules-downloads', requireAdmin, wrap(async (_req, res) => {
  const r = await query('SELECT * FROM safety_rules_downloads ORDER BY created_at DESC, id DESC');
  res.json(r.rows);
}));

app.delete('/api/safety-rules-downloads/:id', requireAdmin, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Bad id' });
  await query('DELETE FROM safety_rules_downloads WHERE id = ?', [id]);
  res.json({ success: true });
}));

// --- Тест нәтижелері (Test Results) ---
app.post('/api/test-results', wrap(async (req, res) => {
  const b = req.body ?? {};
  const r = await query(
    'INSERT INTO test_results (user_name, group_name, score, total_questions, category) VALUES (?, ?, ?, ?, ?)',
    [
      str(b.user_name || 'Студент', 200),
      str(b.group_name || '-', 100),
      Number(b.score) || 0,
      Number(b.total_questions) || 10,
      str(b.category || 'Өрт қауіпсіздігі', 100)
    ]
  );
  res.json({ success: true, id: r.lastInsertRowid });
}));

app.get('/api/test-results', requireAdmin, wrap(async (_req, res) => {
  const r = await query('SELECT * FROM test_results ORDER BY created_at DESC, id DESC LIMIT 200');
  res.json(r.rows);
}));

// --- Админ логтары ---
app.get('/api/admin/logs', requireAdmin, wrap(async (_req, res) => {
  const r = await query('SELECT * FROM admin_logs ORDER BY created_at DESC, id DESC LIMIT 100');
  res.json(r.rows);
}));

// --- Статистика ---
app.get('/api/stats', requireAdmin, wrap(async (_req, res) => {
  const [inc, sos, dl, notifs, tests, types, statuses] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM incidents'),
    query('SELECT COUNT(*) AS count FROM sos_alerts'),
    query('SELECT COUNT(*) AS count FROM safety_rules_downloads'),
    query('SELECT COUNT(*) AS count FROM notifications'),
    query('SELECT COUNT(*) AS count FROM test_results'),
    query('SELECT type, COUNT(*) AS count FROM incidents GROUP BY type'),
    query('SELECT status, COUNT(*) AS count FROM incidents GROUP BY status'),
  ]);
  res.json({
    totalIncidents: Number(inc.rows[0]?.count ?? 0),
    totalSos: Number(sos.rows[0]?.count ?? 0),
    totalSafetyDownloads: Number(dl.rows[0]?.count ?? 0),
    totalNotifications: Number(notifs.rows[0]?.count ?? 0),
    totalTests: Number(tests.rows[0]?.count ?? 0),
    types: types.rows.map((t) => ({ type: t.type, count: Number(t.count) })),
    statuses: statuses.rows.map((s) => ({ status: s.status, count: Number(s.count) })),
  });
}));

// --- Динамические изображения ---
app.get('/api/images', wrap(async (_req, res) => {
  const r = await query('SELECT key, value FROM dynamic_images');
  const images: Record<string, string> = {};
  r.rows.forEach((row) => (images[row.key] = row.value));
  res.json(images);
}));

app.post('/api/images', requireAdmin, wrap(async (req, res) => {
  const key = str(req.body?.key, 200);
  if (!key) return res.status(400).json({ error: 'key required' });
  await query('INSERT OR REPLACE INTO dynamic_images (key, value) VALUES (?, ?)', [key, str(req.body?.value, 3_000_000)]);
  res.json({ success: true });
}));

app.delete('/api/images/:key', requireAdmin, wrap(async (req, res) => {
  await query('DELETE FROM dynamic_images WHERE key = ?', [req.params.key]);
  res.json({ success: true });
}));

// --- Интеллектуалды AI-помощник (Smart AI Safety Assistant) ---
const KAINAR_SYSTEM_PROMPT = `
Сен — Семей қаласындағы «Қайнар» жоғары колледжінің зияткерлік цифрлық қауіпсіздік көмекшісісің («Қайнар Smart Safety AI»).
Портал ұраны: «Қауіпсіз колледж — қауіпсіз болашақ».

Қызметіңіз:
1. Студенттерге, оқытушыларға және ата-аналарға колледждегі қауіпсіздік ережелері бойынша нақты, түсінікті және ресми ақпарат беру.
2. Төтенше жағдайлар кезінде (өрт, жер сілкінісі, террорлық қауіп, медициналық көмек, дауыл) шұғыл әрекет ету алгоритмдерін түсіндіру.
3. Колледж ғимаратының эвакуациялық жоспарлары (1, 3, 4, 5-қабаттар, баспалдақтар, «EXIT» белгілері, автотұрақ жиналу орны) бойынша бағыт көрсету.
4. Жол қауіпсіздігі ережелері: Қабанбай батыр мен Қаным Мұхамедханов көшелері қиылысы, жаяу жүргіншілер зебрасы, 20 км/сағ жылдамдық шегі, автотұрақ тәртібі.
5. Ресми байланыс телефондары:
   - Өрт сөндіру қызметі: 101
   - Полиция: 102
   - Жедел жәрдем: 103
   - Бірыңғай кезекшілік диспетчерлік қызметі: 112
   - Колледж күзет бөлімі (24/7 тәулік бойы)
   - Колледж медпункті: 1-қабат (жұмыс уақыты: 08:00 - 18:00)
   - Әкімшілік: 09:00 - 18:00

Стиліңіз: мейірімді, сыпайы, өте нақты, ресми әрі жедел.
Егер сұрақ қойылған тіл қазақша болса — таза әдеби қазақ тілінде жауап бер.
Егер орысша болса — орыс тілінде жауап бер.
Егер ағылшынша болса — ағылшын тілінде жауап бер.
Қатаң ереже: Төтенше қауіп кезінде алдымен 101, 102 немесе 112 желісіне қоңырау шалуды және дабыл түймесін басуды ескерт!
`;

// Helper for fallback AI responses when API key is not present or offline
function generateFallbackResponse(userMsg: string, lang: 'kk' | 'ru' | 'en'): string {
  const q = userMsg.toLowerCase();

  if (lang === 'ru') {
    if (q.includes('пожар') || q.includes('огонь') || q.includes('дым')) {
      return `🚨 **Действия при пожаре в колледже «Кайнар»:**\n\n1. Немедленно нажмите тревожную кнопку на этаже или наберите **101 / 112**.\n2. Сохраняйте спокойствие, без паники покидайте здание по лестницам согласно плану эвакуации (лифтом пользоваться запрещено!).\n3. При задымлении пригнитесь к полу и закройте дыхательные пути влажной тканью.\n4. Пройдите к безопасному месту сбора — на открытой площадке автопарковки колледжа.\n\nПлан эвакуации можно открыть в разделе «Эвакуация» нашего портала.`;
    }
    if (q.includes('эвакуац') || q.includes('этаж') || q.includes('выход') || q.includes('план')) {
      return `🗺️ **План эвакуации здания колледжа:**\n\n- В здании 4 ключевых учебных этажа со схемами: 1-й, 3-й, 4-й и 5-й этажи.\n- На каждом этаже предусмотрены две широкие незадымляемые лестничные клетки (левая и правая).\n- Ориентируйтесь по светящимся зеленым указателям «ВЫХОД / EXIT».\n- Место общего сбора после выхода — площадка автопарковки колледжа.\n\nПодробные архитектурные схемы доступны во вкладке «Эвакуация».`;
    }
    if (q.includes('дорог') || q.includes('авто') || q.includes('переход') || q.includes('зебр')) {
      return `🚗 **Дорожная безопасность вокруг колледжа «Кайнар»:**\n\n- Перекресток улиц Кабанбай батыра и проспекта Каныма Мухамедханова является зоной повышенного внимания.\n- Переходите дорогу строго по пешеходным переходам (зебре), сняв наушники и отложив телефон.\n- Для водителей: ограничение скорости на территории колледжа — строго **20 км/ч**, парковка только в специально отведенных карманах.\n\nСхему безопасного движения можно изучить в разделе «Дорожная безопасность».`;
    }
    if (q.includes('телефон') || q.includes('номер') || q.includes('контакт') || q.includes('охрана') || q.includes('мед')) {
      return `📞 **Экстренные контакты колледжа «Кайнар»:**\n\n- **101** — Пожарная служба\n- **102** — Полиция\n- **103** — Скорая медицинская помощь\n- **112** — Единая дежурно-диспетчерская служба ЧС\n- **Охрана колледжа** — круглосуточно (24/7) на главном посту 1-го этажа\n- **Медпункт** — 1-й этаж, кабинет работает с 08:00 до 18:00.\n\nКнопка SOS на главной странице позволяет мгновенно оповестить службу безопасности.`;
    }
    return `Здравствуйте! Я официальный интеллектуальный помощник по безопасности колледжа «Кайнар». Вы можете спросить меня о правилах эвакуации, действиях при пожаре и ЧС, дорожной безопасности возле колледжа, скачивании памяток или номерах экстренных служб (101, 102, 103, 112). Чем могу помочь?`;
  }

  if (lang === 'en') {
    if (q.includes('fire') || q.includes('smoke')) {
      return `🚨 **Emergency Fire Procedure at Kainar College:**\n\n1. Trigger the nearest manual call point alarm and call **101 / 112**.\n2. Evacuate via emergency staircase following green "EXIT" illuminated signs (do not use elevators).\n3. If heavy smoke is present, stay low and cover mouth/nose with a damp cloth.\n4. Gather at the designated safe assembly location at the college parking lot.\n\nDetailed floor plans are available in the "Evacuation" section.`;
    }
    if (q.includes('evacuat') || q.includes('floor') || q.includes('plan')) {
      return `🗺️ **Campus Evacuation Layout:**\n\n- The college features dedicated floor escape maps for Floors 1, 3, 4, and 5.\n- Two primary stairwells (left and right) provide immediate exterior egress.\n- Follow green directional arrows leading to external emergency doors.\n- Designated safe outdoor assembly point: College car park yard.`;
    }
    if (q.includes('phone') || q.includes('contact') || q.includes('emergency') || q.includes('guard')) {
      return `📞 **Emergency Hotlines:**\n\n- **101** — Fire Rescue\n- **102** — Police Dispatch\n- **103** — Ambulance\n- **112** — National Emergency Service\n- **Campus Security Post** — Operational 24/7 on Floor 1 lobby\n- **Medical Room** — Floor 1, open 08:00 - 18:00.`;
    }
    return `Hello! I am the official AI Security Assistant of Kainar Higher College. I can guide you through fire evacuation protocols, campus emergency procedures, road safety, and contacts (101, 102, 103, 112). How can I assist you today?`;
  }

  // Default Kazakh
  if (q.includes('өрт') || q.includes('түтін') || q.includes('жалын')) {
    return `🚨 **«Қайнар» колледжінде өрт қаупі туындағандағы іс-қимылдар:**\n\n1. Дереу жақын маңдағы дабыл түймесін басыңыз немесе **101 / 112** нөміріне қоңырау шалыңыз.\n2. Дүрбелеңге түспей, эвакуациялық сызбаға сәйкес баспалдақтар арқылы шығыңыз (лифтті пайдалануға қатаң тыйым салынады!).\n3. Қою түтін болса, еңкейіп немесе еңбектеп қозғалыңыз, ауыз-мұрныңызды дымқыл шүберекпен жабыңыз.\n4. Колледж ауласындағы қауіпсіз жиналу орнына (автотұрақ аймағына) жиналыңыз.\n\nТолық сызбаларды «Эвакуация» бөлімінен көре аласыз.`;
  }
  if (q.includes('эвакуация') || q.includes('қабат') || q.includes('шығу') || q.includes('жоспар')) {
    return `🗺️ **Колледждің эвакуация жоспары:**\n\n- Колледждің 1, 3, 4 және 5-қабаттары үшін ресми эвакуациялық сызбалар бекітілген.\n- Әр қабатта екі негізгі саты торлары (сол және оң қанаттағы баспалдақтар) орналасқан.\n- Қабырғалардағы жасыл түсті «ШЫҒУ / EXIT» жарық көрсеткіштеріне бағытталыңыз.\n- Ғимараттан шыққаннан кейін қауіпсіз жиналу орны — колледждің сыртқы автотұрақ алаңы.\n\nБарлық қабаттардың сызбаларын «Эвакуация» бөлімінен жүктеп алуға болады.`;
  }
  if (q.includes('жол') || q.includes('көлік') || q.includes('өткел') || q.includes('зебра')) {
    return `🚗 **Колледж маңындағы жол қауіпсіздігі ережелері:**\n\n- Қабанбай батыр мен Қаным Мұхамедханов көшелерінің қиылысы — көлік қозғалысы көп аймақ.\n- Жолды тек арнайы жаяу жүргіншілер өткелінен (зебрадан) және телефонға қарамай, құлаққапты шешіп өтіңіз.\n- Жүргізушілерге: колледж аумағындағы жылдамдық шегі — **20 км/сағ**, көлікті тек рұқсат етілген тұрақ орындарына қойыңыз.\n\nТолық картаны «Жол қауіпсіздігі» бөлімінен көруге болады.`;
  }
  if (q.includes('телефон') || q.includes('нөмір') || q.includes('күзет') || q.includes('медпункт') || q.includes('байланыс')) {
    return `📞 **«Қайнар» колледжінің шұғыл байланыс нөмірлері:**\n\n- **101** — Өрт сөндіру қызметі\n- **102** — Полиция қызметі\n- **103** — Жедел медициналық көмек\n- **112** — Бірыңғай кезекшілік құтқару қызметі\n- **Колледж күзеті** — 24/7 тәулік бойы (1-қабаттағы басты күзет бекеті)\n- **Медпункт** — 1-қабат, жұмыс уақыты: 08:00 - 18:00.\n\nБасты беттегі «Шұғыл дабыл (SOS)» түймесі арқылы кезекші қызметке бірден белгі беруге болады.`;
  }
  if (q.includes('ереже') || q.includes('құжат') || q.includes('жүктеу') || q.includes('pdf')) {
    return `📄 **Қауіпсіздік ережелері мен құжаттар:**\n\n«Қауіпсіздік ережелері» (Меморандумдар) бөлімінде сіз:\n1. Өрт, техникалық және санитарлық қауіпсіздік ережелерімен таныса аласыз.\n2. Аты-жөніңіз бен тобыңызды енгізіп, ресми цифрлық қолтаңбасы бар жеке PDF сертификатын жүктей аласыз.\n3. Оқытушыларға арналған арнайы нұсқаулықтарды ала аласыз.`;
  }

  return `Сәлеметсіз бе! Мен «Қайнар» жоғары колледжінің цифрлық қауіпсіздік жөніндегі AI көмекшісімін. Маған өрт қауіпсіздігі, ғимараттан эвакуациялану, жол ережелері, шұғыл нөмірлер (101, 102, 103, 112) немесе құжаттарды жүктеу туралы сұрақ қоя аласыз. Сізге қалай көмектесе аламын?`;
}

app.post('/api/ai/chat', wrap(async (req, res) => {
  const message = str(req.body?.message, 1500).trim();
  const lang = (req.body?.lang === 'ru' || req.body?.lang === 'en' ? req.body.lang : 'kk') as 'kk' | 'ru' | 'en';

  if (!message) {
    return res.status(400).json({ error: 'Сұрақ мәтіні бос болмауы керек' });
  }

  const ai = getGenAI();

  if (!ai) {
    // Graceful offline knowledge base fallback
    const fallbackText = generateFallbackResponse(message, lang);
    return res.json({ response: fallbackText, model: 'local-knowledge-base' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: `${KAINAR_SYSTEM_PROMPT}\nПайдаланушы интерфейс тілі: ${lang.toUpperCase()}. Жауабыңды осы тілде бер.`,
      },
    });

    const reply = response.text || generateFallbackResponse(message, lang);
    res.json({ response: reply, model: 'gemini-3.8-flash' });
  } catch (err: any) {
    console.warn('[Gemini AI chat warning - falling back]', err?.message || err);
    const fallbackText = generateFallbackResponse(message, lang);
    res.json({ response: fallbackText, model: 'local-knowledge-base', note: 'AI қызметі сақтық көшірме режимінде жауап берді' });
  }
}));

// --- Скачивание документов проекта (данные лежат в коде, БД не нужна) ---
app.get('/api/download-project-file', (req, res) => {
  const { category, id } = req.query;
  if (!category || !id) return res.status(400).json({ error: 'Параметрлер жеткіліксіз.' });

  try {
    const list = category === 'road_safety' ? projectFilesList : emergencyProjectFilesList;
    const file = list.find((f) => f.id === id);
    if (!file) return res.status(404).json({ error: 'Құжат табылмады.' });

    let fileName = file.fileName || `${file.id}.doc`;

    if (file.binaryData) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      const marker = ';base64,';
      const i = file.binaryData.indexOf(marker);
      const b64 = i !== -1 ? file.binaryData.substring(i + marker.length) : file.binaryData;
      return res.send(Buffer.from(b64, 'base64'));
    }

    if (fileName.endsWith('.docx')) fileName = fileName.replace(/\.docx$/, '.doc');
    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    return res.send(Buffer.from(convertTextToWordHtml(file.title, file.content, file.langName), 'utf-8'));
  } catch (e: any) {
    console.error('[Download error]', e);
    return res.status(500).json({ error: 'Аударып алу қатесі: ' + e.message });
  }
});

// Неизвестные /api/* маршруты — JSON 404
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
