import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Bell, PhoneCall, Map, Activity, ShieldCheck, Flame, 
  FileText, ArrowRight, Search, ShieldAlert, Award, ChevronDown, CheckCircle2,
  Clock, MapPin, Sparkles, AlertOctagon, HelpCircle, Siren, Compass, Radio, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { KainarLogo } from '../components/KainarLogo';
import { useLanguage } from '../context/LanguageContext';

interface NotificationItem {
  id: number;
  title_kk: string;
  title_ru: string;
  title_en: string;
  content_kk: string;
  content_ru: string;
  content_en: string;
  type: string;
  priority: string;
  created_at: string;
}

export function Home() {
  const { lang, t } = useLanguage();
  const [sosActive, setSosActive] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosLocation, setSosLocation] = useState('Басты ғимарат / Бас кіреберіс');
  const [sosSending, setSosSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch real announcements
  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.ok ? res.json() : [])
      .then(data => setNotifications(data.slice(0, 3)))
      .catch(err => console.warn('Notif fetch error:', err));
  }, []);

  const handleSosTrigger = async (customLoc?: string) => {
    setSosSending(true);
    const loc = customLoc || sosLocation;
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: loc }),
      });
      if (!res.ok) throw new Error(`SOS failed: HTTP ${res.status}`);
      
      setSosActive(true);
      setShowSosModal(false);
      
      // Play brief Web Audio sound alert
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch { /* Audio not supported */ }

      alert(t('home.sos.sent'));
      setTimeout(() => setSosActive(false), 8000);
    } catch (error) {
      console.error(error);
      alert('⚠️ Дабыл жіберілмеді! Қайталап көріңіз немесе дереу 112 нөміріне қоңырау шалыңыз.\n⚠️ Сигнал не отправлен! Повторите попытку или сразу звоните 112.');
    } finally {
      setSosSending(false);
    }
  };

  // 10 Core Security Directions
  const directions = [
    {
      id: 'civil_defense',
      title: lang === 'en' ? 'Civil Defense' : lang === 'ru' ? 'Гражданская оборона' : 'Азаматтық қорғаныс',
      desc: lang === 'en' ? 'Mass protection protocols, alarm signals, and protective actions' : lang === 'ru' ? 'Защита населения, сигналы оповещения и укрытия' : 'Халықты қорғау, дабыл белгілері мен паналау орындары',
      link: '/emergency',
      icon: ShieldCheck,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Регламент'
    },
    {
      id: 'fire_safety',
      title: lang === 'en' ? 'Fire Safety' : lang === 'ru' ? 'Пожарная безопасность' : 'Өрт қауіпсіздігі',
      desc: lang === 'en' ? 'Extinguisher locations, smoke hazard tactics, emergency response' : lang === 'ru' ? 'Огнетушители, действия при задымлении и вызов 101' : 'Өрт сөндіргіштер, түтіннен қорғану және 101 шақыру',
      link: '/emergency',
      icon: Flame,
      color: 'from-red-600 to-orange-600',
      badge: 'Шұғыл 101'
    },
    {
      id: 'road_safety',
      title: lang === 'en' ? 'Road Safety' : lang === 'ru' ? 'Дорожная безопасность' : 'Жол қауіпсіздігі',
      desc: lang === 'en' ? 'Pedestrian routes at Kabanbay Batyr & Mukhamedkhanov crossing' : lang === 'ru' ? 'Безопасные маршруты на перекрестке Кабанбай батыра' : 'Қабанбай батыр мен Мұхамедханов қиылысы, 20 км/сағ шегі',
      link: '/road-safety',
      icon: Compass,
      color: 'from-emerald-600 to-teal-700',
      badge: 'Карта'
    },
    {
      id: 'emergency_actions',
      title: lang === 'en' ? 'Emergency Actions' : lang === 'ru' ? 'Действия при ЧС' : 'Төтенше жағдайлар',
      desc: lang === 'en' ? 'Earthquake, severe weather, medical crises, and security threats' : lang === 'ru' ? 'Землетрясение, бури, медицинские инциденты и угрозы' : 'Жер сілкінісі, дауыл, медициналық көмек және террорлық қауіп',
      link: '/emergency',
      icon: AlertOctagon,
      color: 'from-amber-600 to-red-600',
      badge: 'Алгоритм'
    },
    {
      id: 'safety_memos',
      title: lang === 'en' ? 'Safety Memos & PDF' : lang === 'ru' ? 'Правила и памятки' : 'Қауіпсіздік ережелері',
      desc: lang === 'en' ? 'Official student instructions with downloadable personalized PDF' : lang === 'ru' ? 'Официальные памятки с именной электронной подписью' : 'Сандық қолтаңба қойып, жеке PDF құжатын жүктеу',
      link: '/memos',
      icon: FileText,
      color: 'from-indigo-600 to-blue-800',
      badge: 'PDF Жүктеу'
    },
    {
      id: 'crime_prevention',
      title: lang === 'en' ? 'Incident Reporting' : lang === 'ru' ? 'Профилактика и отчет' : 'Құқық бұзушылықтың алдын алу',
      desc: lang === 'en' ? 'Rapid direct reporting of hazards or disturbances to guards' : lang === 'ru' ? 'Срочное сообщение охране об угрозах и инцидентах' : 'Күзетке оқиға туралы жедел хабарлама жолдау',
      link: '/report',
      icon: ShieldAlert,
      color: 'from-slate-800 to-slate-900',
      badge: 'Өтініш'
    },
    {
      id: 'cyber_safety',
      title: lang === 'en' ? 'Digital & Cyber Safety' : lang === 'ru' ? 'Цифровая безопасность' : 'Цифрлық қауіпсіздік',
      desc: lang === 'en' ? 'Anti-phishing, cyberbullying prevention, and data protection' : lang === 'ru' ? 'Кибербуллинг, защита аккаунтов и фишинг' : 'Кибербуллингке қарсы күрес, парольдер мен аккаунттарды қорғау',
      link: '/game',
      icon: Activity,
      color: 'from-cyan-600 to-blue-700',
      badge: 'Smart AI'
    },
    {
      id: 'evacuation_plans',
      title: lang === 'en' ? 'Evacuation Plans' : lang === 'ru' ? 'Планы эвакуации' : 'Эвакуациялық сызбалар',
      desc: lang === 'en' ? 'Official architectural floor plans for floors 1, 3, 4, and 5' : lang === 'ru' ? 'Официальные графические схемы 1, 3, 4 и 5 этажей' : '1, 3, 4 және 5-қабаттардың бекітілген эвакуациялық карталары',
      link: '/evacuation',
      icon: Map,
      color: 'from-emerald-700 to-green-800',
      badge: 'Сызбалар'
    },
    {
      id: 'project_files',
      title: lang === 'en' ? 'Research Monographs' : lang === 'ru' ? 'Проектные документы' : 'Құжаттар мен жобалар',
      desc: lang === 'en' ? 'Comprehensive monographs in Kazakh, Russian, and English' : lang === 'ru' ? 'Трехъязычные исследовательские монографии' : 'Үш тілдегі ресми ғылыми зерттеу монографиялары',
      link: '/road-safety',
      icon: Award,
      color: 'from-purple-600 to-indigo-800',
      badge: 'Word / DOC'
    },
    {
      id: 'notifications_hub',
      title: lang === 'en' ? 'Broadcasts & Notices' : lang === 'ru' ? 'Оповещения и новости' : 'Хабарламалар мен өтініштер',
      desc: lang === 'en' ? 'Latest college security updates and operational alerts' : lang === 'ru' ? 'Свежие новости и официальные объявления колледжа' : 'Колледж әкімшілігінің жедел ескертулері мен хабарламалары',
      link: '/notifications',
      icon: Bell,
      color: 'from-blue-700 to-indigo-900',
      badge: 'Хабарлама'
    }
  ];

  const filteredDirections = directions.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q);
  });

  const faqs = [
    {
      q_kk: "Өрт дабылы қосылғанда бірінші кезекте не істеу керек?",
      q_ru: "Что делать в первую очередь при срабатывании пожарной тревоги?",
      q_en: "What should be done immediately upon the fire alarm sounding?",
      a_kk: "Дүрбелеңге түспей, оқытушының нұсқауын тыңдап, құжаттар мен телефонды алып, жақын маңдағы баспалдақпен эвакуация сызбасына сәйкес далаға шығу керек. Лифтті пайдалануға қатаң тыйым салынады. Шыққан соң автотұрақтағы жиналу орнына жиналыңыз.",
      a_ru: "Сохраняйте спокойствие, слушайте указания преподавателя, возьмите документы и телефон, спускайтесь по лестнице согласно схеме эвакуации. Пользоваться лифтом строго запрещено. Место сбора — автопарковка колледжа.",
      a_en: "Stay calm, follow the instructor's commands, take essential documents/phones, and descend via the nearest stairwell following the exit arrows. Do not use elevators. Assemble at the campus parking lot."
    },
    {
      q_kk: "Шұғыл дабыл (SOS) түймесі қалай жұмыс істейді?",
      q_ru: "Как работает кнопка экстренной тревоги (SOS)?",
      q_en: "How does the Emergency Alarm (SOS) button work?",
      a_kk: "Басты беттегі қызыл SOS түймесін басқанда, колледж күзет бекеті мен әкімшілік панеліне оқиға орны мен уақыты көрсетілген шұғыл дыбыстық хабарлама түседі. Кезекші қызмет бірден оқиға орнына жедел әрекет ету тобын жібереді.",
      a_ru: "При нажатии на кнопку SOS дежурный пост охраны и административная панель получают моментальное звуковое и визуальное уведомление с указанием локации. На место немедленно выдвигается дежурная группа.",
      a_en: "Clicking the SOS button instantly dispatches a high-priority audible and visual alert to the central campus security desk with timestamp and location, initiating immediate response."
    },
    {
      q_kk: "Қауіпсіздік ережелері бойынша жеке сертификатты қалай алуға болады?",
      q_ru: "Как получить персональный сертификат ознакомления с правилами?",
      q_en: "How can I obtain a personalized safety compliance certificate?",
      a_kk: "«Қауіпсіздік ережелері» бөліміндегі формаға толық аты-жөніңізді, оқу тобыңызды және билет нөмірін енгізіп, «Жеке PDF жүктеп алу» түймесін басыңыз. Жүйе 7-бетінде ресми сандық қолтаңба қойылған құжатты генерациялайды.",
      a_ru: "В разделе «Правила безопасности» заполните форму (ФИО, группа, билет) и нажмите «Скачать персональный PDF». Система автоматически сформирует официальный документ с электронной подписью на 7 странице.",
      a_en: "Navigate to 'Safety Memos', complete the student form, and download your personalized PDF. The system embeds official digital endorsement data directly onto page 7."
    },
    {
      q_kk: "Колледж аумағында автокөлікпен жүру жылдамдығы қанша?",
      q_ru: "Какова максимальная скорость движения автотранспорта на территории?",
      q_en: "What is the maximum speed limit on campus premises?",
      a_kk: "Колледж аумағында көлік қозғалысының жылдамдығы 20 км/сағ аспауы тиіс. Көліктер тек белгіленген тұрақ орындарына қойылып, жаяу жүргіншілерге әрқашан басымдық беріледі.",
      a_ru: "На территории колледжа действует строгое ограничение скорости до 20 км/ч. Парковка разрешена только на размеченных местах, пешеходы имеют абсолютный приоритет.",
      a_en: "A strict speed limit of 20 km/h applies across college perimeter grounds. Parking is restricted to designated bays, and walking pedestrians always have full right of way."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16 pb-16 animate-fade-in"
    >
      {/* SECTION 1: HERO PRESENTATION BANNER */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border border-slate-800">
        {/* Background Visual Texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-slate-950 to-indigo-950/90 z-10" />
        <div 
          className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-10" 
        />

        <div className="relative z-20 px-6 py-16 sm:px-12 sm:py-20 lg:py-24 max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-slate-300 mb-8 shadow-inner backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-extrabold uppercase tracking-wider">Smart Campus Active</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">Семей «Қайнар» жоғары колледжі</span>
          </div>

          {/* Logo with Glowing Ring */}
          <div className="relative mb-8 group">
            <div className="absolute -inset-3 rounded-full bg-blue-500/20 blur-xl group-hover:bg-blue-500/35 transition-all" />
            <div className="relative bg-white rounded-full p-4 shadow-2xl border-2 border-white/30">
              <KainarLogo className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>
          </div>

          {/* Portal Title & Subtitle */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight uppercase">
            <span className="bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              {t('home.hero.title')}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl font-medium leading-relaxed mb-10">
            {t('home.hero.subtitle')}
          </p>

          {/* Key Navigation CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-xl">
            <a
              href="#directions-section"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-blue-600/30 cursor-pointer"
            >
              <span>{lang === 'en' ? 'Safety Directions' : lang === 'ru' ? 'Направления безопасности' : 'Қауіпсіздік бағыттары'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/memos"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-extrabold text-sm uppercase tracking-wider transition-all border border-slate-700/80 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>{lang === 'en' ? 'Safety Memos' : lang === 'ru' ? 'Инструкции и памятки' : 'Нұсқаулықтарды қарау'}</span>
            </Link>

            <Link
              to="/report"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white font-extrabold text-sm uppercase tracking-wider transition-all border border-red-500/30 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{lang === 'en' ? 'Report Hazard' : lang === 'ru' ? 'Сообщить о ЧС' : 'Оқиға хабарлау'}</span>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="w-full max-w-2xl mt-10">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Search security guidelines, evacuation plans, documents...'
                    : lang === 'ru'
                    ? 'Поиск правил безопасности, планов эвакуации, инструкций...'
                    : 'Қауіпсіздік ережелерін, эвакуация жоспарларын немесе құжаттарды іздеу...'
                }
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white rounded-2xl py-3 pl-12 pr-4 text-xs sm:text-sm font-medium outline-none transition-all placeholder:text-slate-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE SOS PANIC ALARM DISPATCHER */}
      <section className="bg-gradient-to-r from-red-950/60 via-slate-900 to-red-950/60 rounded-3xl p-8 sm:p-10 border border-red-900/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider">
            <Siren className="w-4 h-4 animate-bounce" />
            <span>Жедел әрекет ету / Emergency Dispatch</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Шұғыл дабыл түймесі (SOS)
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Колледж ішінде өрт, күдікті зат, төбелес немесе шұғыл қауіп туындаған кезде осы түймені басыңыз. 
            Хабарлама дереу колледж кезекші күзеті мен диспетчерлік орталыққа жеткізіледі.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-bold text-slate-400 justify-center md:justify-start">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 24/7 Күзет бекеті</span>
            <span>•</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Локация фиксациясы</span>
            <span>•</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Диспетчерлік журнал</span>
          </div>
        </div>

        {/* Big Circular SOS Button */}
        <div className="flex flex-col items-center shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSosModal(true)}
            className={`relative group overflow-hidden rounded-full w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer ${
              sosActive ? 'bg-red-800 animate-pulse ring-8 ring-red-500/50' : 'bg-red-600 hover:bg-red-500 shadow-red-600/40'
            }`}
          >
            <div className="absolute inset-0 rounded-full border-4 border-red-400/40 group-hover:animate-ping" />
            <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-white mb-2 animate-bounce" />
            <span className="text-white font-black text-2xl sm:text-3xl uppercase tracking-widest leading-none">
              {t('home.sos.title')}
            </span>
            <span className="text-red-100 text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider">
              {t('home.sos.btn_text')}
            </span>
          </motion.button>
          <span className="text-[11px] text-slate-400 mt-3 font-medium">
            * Басу арқылы растау терезесі ашылады
          </span>
        </div>
      </section>

      {/* SOS MODAL */}
      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-red-200 space-y-6"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-950">Шұғыл дабыл қағуды растаңыз</h3>
                  <p className="text-xs text-slate-500">Колледж күзет бөліміне хабарлама жолданады</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Қазіргі орналасқан жеріңізді таңдаңыз:
                </label>
                <select
                  value={sosLocation}
                  onChange={(e) => setSosLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="Басты ғимарат / Бас кіреберіс (1-қабат)">Басты ғимарат / Бас кіреберіс (1-қабат)</option>
                  <option value="1-қабат / Дәліз, Асхана, Гардероб">1-қабат / Дәліз, Асхана, Гардероб</option>
                  <option value="3-қабат / Дәрісханалар, Деканат">3-қабат / Дәрісханалар, Деканат</option>
                  <option value="4-қабат / Физика, Химия зертханалары">4-қабат / Физика, Химия зертханалары</option>
                  <option value="5-қабат / Акт залы, Компьютерлік класс">5-қабат / Акт залы, Компьютерлік класс</option>
                  <option value="Спортзал және Киім ауыстыру бөлмелері">Спортзал және Киім ауыстыру бөлмелері</option>
                  <option value="Колледж ауласы / Автотұрақ аймағы">Колледж ауласы / Автотұрақ аймағы</option>
                  <option value="Басқа аймақ / Нақтыланбаған">Басқа аймақ / Нақтыланбаған</option>
                </select>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 leading-relaxed font-semibold">
                ⚠️ Жалған дабыл қағу Қазақстан Республикасы заңнамасына сәйкес әкімшілік жауапкершілікке әкеп соқтырады.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSosModal(false)}
                  disabled={sosSending}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  Бас тарту
                </button>
                <button
                  onClick={() => handleSosTrigger()}
                  disabled={sosSending}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  {sosSending ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <Siren className="w-4 h-4" />
                  )}
                  Дабылды растау
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 3: 10 CORE SAFETY DIRECTIONS */}
      <section id="directions-section" className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Smart Campus Architecture</span>
            </div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              {lang === 'en' ? 'Core Safety Directions' : lang === 'ru' ? 'Основные направления безопасности' : 'Негізгі қауіпсіздік бағыттары'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              {lang === 'en' 
                ? 'Comprehensive protocols covering campus welfare, digital hygiene, and crisis logistics'
                : lang === 'ru'
                ? 'Комплексная система защиты студентов, сотрудников и инфраструктуры колледжа'
                : 'Колледж қауіпсіздігі мен білім алушыларды қорғаудың 10 негізгі жүйелік бағыты'}
            </p>
          </div>

          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
            {filteredDirections.length} / 10 бағыт
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDirections.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.link}
                className="group bg-white rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-3 font-medium">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-blue-600 group-hover:text-blue-700">
                  <span>Толығырақ көру</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: REAL NOTIFICATIONS & CAMPUS ANNOUNCEMENTS TICKER */}
      {notifications.length > 0 && (
        <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  {lang === 'en' ? 'Campus Security Broadcasts' : lang === 'ru' ? 'Актуальные оповещения' : 'Маңызды хабарландырулар'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Колледж әкімшілігінен ресми хабарламалар</p>
              </div>
            </div>
            <Link to="/notifications" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1">
              <span>Барлығы</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {notifications.map((n) => {
              const title = lang === 'en' ? (n.title_en || n.title_kk) : lang === 'ru' ? (n.title_ru || n.title_kk) : n.title_kk;
              const content = lang === 'en' ? (n.content_en || n.content_kk) : lang === 'ru' ? (n.content_ru || n.content_kk) : n.content_kk;
              const isWarning = n.type === 'warning';
              return (
                <div 
                  key={n.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    isWarning ? 'bg-amber-50/60 border-amber-200 text-amber-950' : 'bg-slate-50 border-slate-200/80 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isWarning ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {n.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm mb-1.5 line-clamp-1">{title}</h4>
                  <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">{content}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 5: CAMPUS SAFETY TELEMETRY & STATS */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-extrabold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            <span>Smart Telemetry Data</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Колледждің қауіпсіздік көрсеткіштері
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Нақты уақыт режиміндегі цифрлық мониторинг және инфрақұрылым тұрақтылығы
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">99.4%</span>
            <p className="text-xs font-bold text-slate-300">Қауіпсіздік индексі</p>
            <p className="text-[11px] text-slate-500">Автоматтандырылған мониторинг</p>
          </div>
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <span className="text-3xl sm:text-4xl font-black text-blue-400 font-mono">4</span>
            <p className="text-xs font-bold text-slate-300">Қорғалған қабат</p>
            <p className="text-[11px] text-slate-500">1, 3, 4, 5-ші қабаттар</p>
          </div>
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <span className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono">24/7</span>
            <p className="text-xs font-bold text-slate-300">Күзет бақылауы</p>
            <p className="text-[11px] text-slate-500">Үздіксіз кезекшілік</p>
          </div>
          <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">&lt; 1 мин</span>
            <p className="text-xs font-bold text-slate-300">Жедел жауап уақыты</p>
            <p className="text-[11px] text-slate-500">Дабыл бойынша әрекет</p>
          </div>
        </div>
      </section>

      {/* SECTION 6: EMERGENCY HOTLINES BAR */}
      <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-500" />
              <span>Шұғыл байланыс нөмірлері (Бір рет басу арқылы шалу)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Кез келген төтенше жағдайда қолжетімді тікелей байланыс желілері</p>
          </div>
          <Link to="/contacts" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider">
            Барлық байланыстар →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <a
            href="tel:101"
            className="p-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all text-center group cursor-pointer"
          >
            <span className="block text-2xl font-black group-hover:scale-105 transition-transform">101</span>
            <span className="text-[11px] font-bold block mt-1">Өрт сөндіру</span>
          </a>
          <a
            href="tel:102"
            className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all text-center group cursor-pointer"
          >
            <span className="block text-2xl font-black group-hover:scale-105 transition-transform">102</span>
            <span className="text-[11px] font-bold block mt-1">Полиция</span>
          </a>
          <a
            href="tel:103"
            className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all text-center group cursor-pointer"
          >
            <span className="block text-2xl font-black group-hover:scale-105 transition-transform">103</span>
            <span className="text-[11px] font-bold block mt-1">Жедел жәрдем</span>
          </a>
          <a
            href="tel:112"
            className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all text-center group cursor-pointer"
          >
            <span className="block text-2xl font-black group-hover:scale-105 transition-transform">112</span>
            <span className="text-[11px] font-bold block mt-1">ТЖ Құтқару</span>
          </a>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 transition-all text-center">
            <span className="block text-xl font-black text-slate-800">24/7</span>
            <span className="text-[11px] font-bold text-slate-600 block mt-1">Колледж күзеті</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 transition-all text-center">
            <span className="block text-xl font-black text-slate-800">1-қабат</span>
            <span className="text-[11px] font-bold text-slate-600 block mt-1">Медпункт</span>
          </div>
        </div>
      </section>

      {/* SECTION 7: INTERACTIVE FLOOR PLANS SPOTLIGHT */}
      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
            <Map className="w-4 h-4" />
            <span>Сызбалар мен қауіпсіз жолдар</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ғимараттың бекітілген эвакуациялық карталары
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Колледждің 1-ші, 3-ші, 4-ші және 5-ші қабаттарының ресми сызбаларын қарап, қауіпсіз шығу жолдары мен өртке қарсы құралдардың орналасуын біліп алыңыз.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/evacuation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <Map className="w-4 h-4" />
              <span>Эвакуация жоспарын ашу</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/road-safety"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs uppercase tracking-wider transition-all border border-slate-700"
            >
              <span>Жол сызбасы</span>
            </Link>
          </div>
        </div>

        {/* Floor Quick Badges */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 font-bold text-xs">
          <Link to="/evacuation" className="p-4 bg-slate-850 hover:bg-blue-600/30 border border-slate-700 rounded-2xl transition-all text-center">
            <span className="block text-2xl font-black text-blue-400">1</span>
            <span className="text-[11px] text-slate-300">1-ші қабат</span>
          </Link>
          <Link to="/evacuation" className="p-4 bg-slate-850 hover:bg-blue-600/30 border border-slate-700 rounded-2xl transition-all text-center">
            <span className="block text-2xl font-black text-blue-400">3</span>
            <span className="text-[11px] text-slate-300">3-ші қабат</span>
          </Link>
          <Link to="/evacuation" className="p-4 bg-slate-850 hover:bg-blue-600/30 border border-slate-700 rounded-2xl transition-all text-center">
            <span className="block text-2xl font-black text-blue-400">4</span>
            <span className="text-[11px] text-slate-300">4-ші қабат</span>
          </Link>
          <Link to="/evacuation" className="p-4 bg-slate-850 hover:bg-blue-600/30 border border-slate-700 rounded-2xl transition-all text-center">
            <span className="block text-2xl font-black text-blue-400">5</span>
            <span className="text-[11px] text-slate-300">5-ші қабат</span>
          </Link>
        </div>
      </section>

      {/* SECTION 8: FAQ ACCORDION */}
      <section className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Жиі қойылатын сұрақтар</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Сұрақтар мен жауаптар
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Колледждегі қауіпсіздік пен дабыл ережелері бойынша анықтамалық
          </p>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            const q = lang === 'en' ? faq.q_en : lang === 'ru' ? faq.q_ru : faq.q_kk;
            const a = lang === 'en' ? faq.a_en : lang === 'ru' ? faq.a_ru : faq.a_kk;
            return (
              <div 
                key={index}
                className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-extrabold text-sm text-slate-900 cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <span>{q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium border-t border-slate-200/50 bg-white">
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 9: CTA TEST CERTIFICATE BANNER */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-center sm:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Қауіпсіздік аттестациясы</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Өз біліміңізді тексеріп, нәтижені бекітіңіз
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium leading-relaxed">
            Өрт қауіпсіздігі, азаматтық қорғаныс және жол ережелері бойынша интерактивті тестілеуден өтіп, ресми қауіпсіздік нәтижесін алыңыз.
          </p>
        </div>

        <Link
          to="/game"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider transition-all shadow-xl cursor-pointer shrink-0"
        >
          <span>Тестті бастау</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </motion.div>
  );
}
