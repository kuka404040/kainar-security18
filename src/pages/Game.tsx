import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, Timer, Trophy, AlertTriangle, CheckCircle, XCircle, 
  Flame, ShieldCheck, Footprints, Shield, Award, RotateCcw, ArrowRight, User, Notebook, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type CategoryId = 'fire' | 'civil' | 'road' | 'cyber';

interface Question {
  id: number;
  scenario: string;
  options: { text: string; correct: boolean }[];
}

const quizBank: Record<CategoryId, Record<'kk' | 'ru' | 'en', Question[]>> = {
  fire: {
    kk: [
      {
        id: 1,
        scenario: 'Колледж дәлізінде өрт дабылы қосылды. Сіздің бірінші кезектегі әрекетіңіз?',
        options: [
          { text: 'Терезеден секіріп шығуға ұмтылу', correct: false },
          { text: 'Лифтке мініп, 1-қабатқа жылдам түсу', correct: false },
          { text: 'Мұғалімнің нұсқауын тыңдап, баспалдақпен эвакуация жоспарына сай шығу', correct: true },
          { text: 'Қалған заттарымды жинау үшін аудиторияға қайта оралу', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Дәлізде қою түтін пайда болды. Тыныс алу және қозғалу тәртібі қандай?',
        options: [
          { text: 'Бойды тік ұстап, терең тыныс алып жүгіру', correct: false },
          { text: 'Еңкейіп немесе еңбектеп қозғалып, ауызды дымқыл шүберекпен жабу', correct: true },
          { text: 'Желдеткішті іздеп, кабинеттердің есігін ашу', correct: false },
          { text: 'Еденге жатып, құтқарушылар келгенше күту', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Өрт сөндіру қызметінің ресми шұғыл нөмірі қандай?',
        options: [
          { text: '101 және 112', correct: true },
          { text: '102 және 103', correct: false },
          { text: '104', correct: false },
          { text: 'Тек қана 109', correct: false },
        ]
      },
      {
        id: 4,
        scenario: 'Эвакуация кезінде сыртқа шыққан соң қайда бару қажет?',
        options: [
          { text: 'Үйге бірден қайтып кету', correct: false },
          { text: 'Колледж ауласындағы белгіленген қауіпсіз жиналу орнына (автотұраққа)', correct: true },
          { text: 'Ғимарат қабырғасының түбінде тұру', correct: false },
          { text: 'Өрт сөндіру көліктеріне жақындап суретке түсіру', correct: false },
        ]
      }
    ],
    ru: [
      {
        id: 1,
        scenario: 'В коридоре колледжа сработала пожарная тревога. Каковы ваши первые действия?',
        options: [
          { text: 'Прыгать из окна аудитории', correct: false },
          { text: 'Быстро спуститься на пассажирском лифте', correct: false },
          { text: 'Следовать указаниям преподавателя и спускаться по лестнице по плану эвакуации', correct: true },
          { text: 'Вернуться в аудиторию за оставленными вещами', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Коридор сильно задымлен. Как правильно передвигаться?',
        options: [
          { text: 'Бежать во весь рост, глубоко дыша', correct: false },
          { text: 'Пригнуться или ползти, прикрыв нос и рот влажной тканью', correct: true },
          { text: 'Открывать настежь все окна для притока воздуха', correct: false },
          { text: 'Оставаться на месте посреди коридора', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Какой номер пожарной службы в Казахстане?',
        options: [
          { text: '101 и единый 112', correct: true },
          { text: '102 и 103', correct: false },
          { text: '104', correct: false },
          { text: '09', correct: false },
        ]
      },
      {
        id: 4,
        scenario: 'Куда направляться сразу после выхода из здания колледжа?',
        options: [
          { text: 'Сразу уходить домой', correct: false },
          { text: 'На безопасную площадку сбора — парковку колледжа', correct: true },
          { text: 'Стоять вплотную к стеклянным дверям', correct: false },
          { text: 'Подходить вплотную к пожарным гидрантам', correct: false },
        ]
      }
    ],
    en: [
      {
        id: 1,
        scenario: 'The fire alarm is triggered inside the campus hallway. What is your first priority?',
        options: [
          { text: 'Jump out of class windows', correct: false },
          { text: 'Ride passenger lifts down to escape', correct: false },
          { text: 'Follow instructor directions and exit via stairs following floor emergency paths', correct: true },
          { text: 'Return inside class to pick up luggage and clothes', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Hallway is filled with dense smoke. How to maneuver safely?',
        options: [
          { text: 'Sprint upright while breathing deeply', correct: false },
          { text: 'Crouch low or crawl forward, shielding nose/mouth with a damp cloth', correct: true },
          { text: 'Open all classroom doors to draft air', correct: false },
          { text: 'Lay down in middle of hallway and wait', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Official national fire response line in Kazakhstan?',
        options: [
          { text: '101 and unified 112', correct: true },
          { text: '102 and 103', correct: false },
          { text: '104', correct: false },
          { text: '109', correct: false },
        ]
      },
      {
        id: 4,
        scenario: 'Where to proceed upon exiting the facility building?',
        options: [
          { text: 'Depart immediately off-campus to residence', correct: false },
          { text: 'Assemble on designated safe outdoor yard (car parking lot)', correct: true },
          { text: 'Lean against external building glass facades', correct: false },
          { text: 'Block arriving emergency firefighting trucks', correct: false },
        ]
      }
    ]
  },
  civil: {
    kk: [
      {
        id: 1,
        scenario: 'Жер сілкінісі басталды. Сіз 3-ші немесе 4-ші қабаттағы аудиториядасыз. Әрекетіңіз?',
        options: [
          { text: 'Дереу сыртқа қарай баспалдақпен жүгіру', correct: false },
          { text: 'Мықты үстелдің астына кіріп, басты қорғау немесе ішкі негізгі қабырға бұрышына тұру', correct: true },
          { text: 'Терезенің жанына барып қарау', correct: false },
          { text: 'Лифтпен төмен түсу', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Дәлізде иесіз күдікті сөмке немесе қорап жатыр. Қандай шара қолдану керек?',
        options: [
          { text: 'Ішін ашып тексеру', correct: false },
          { text: 'Оны қоқыс жәшігіне апарып тастау', correct: false },
          { text: 'Оған тиіспей, айналаны босатып, күзетке немесе оқытушыға дереу хабарлау', correct: true },
          { text: 'Ешкімге айтпай жанынан өтіп кету', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Қатты дауылды ескерту жарияланған кезде ғимарат ішіндегі қауіпсіздік:',
        options: [
          { text: 'Терезелердің қасында тұрып, суретке түсіру', correct: false },
          { text: 'Терезелер мен әйнектерден алыс болу, барлық терезелерді жабу', correct: true },
          { text: 'Шатырға немесе балконға шығу', correct: false },
          { text: 'Электр құрылғыларын қосып тастау', correct: false },
        ]
      }
    ],
    ru: [
      {
        id: 1,
        scenario: 'Началось землетрясение. Вы на 3-м или 4-м этаже колледжа. Ваши действия?',
        options: [
          { text: 'Бежать сломя голову по лестницам на улицу', correct: false },
          { text: 'Укрыться под прочным столом или встать в проеме несущей внутренней стены', correct: true },
          { text: 'Подойти вплотную к окнам', correct: false },
          { text: 'Воспользоваться лифтом', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'В коридоре обнаружена бесхозная подозрительная сумка. Ваши действия?',
        options: [
          { text: 'Открыть и проверить содержимое', correct: false },
          { text: 'Передвинуть сумку в угол', correct: false },
          { text: 'Не прикасаясь к предмету, немедленно сообщить охране колледжа или преподавателю', correct: true },
          { text: 'Проигнорировать находку', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Штормовое предупреждение при шквальном ветре. Как вести себя в помещении?',
        options: [
          { text: 'Стоять у окон и снимать видео', correct: false },
          { text: 'Отойти от окон и стекол, плотно закрыть форточки', correct: true },
          { text: 'Подняться на крышу здания', correct: false },
          { text: 'Оставить окна нараспашку', correct: false },
        ]
      }
    ],
    en: [
      {
        id: 1,
        scenario: 'An earthquake began. You are on Floor 3 or 4 inside a classroom. What to do?',
        options: [
          { text: 'Sprint immediately into the staircase rush', correct: false },
          { text: 'Drop under heavy structural desk, protect head, or brace against interior load-bearing walls', correct: true },
          { text: 'Stand beside exterior window glass', correct: false },
          { text: 'Enter elevator', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'An unattended suspicious bag or container is spotted in the corridor:',
        options: [
          { text: 'Open it up to investigate', correct: false },
          { text: 'Move it toward garbage bins', correct: false },
          { text: 'Do not touch; clear perimeter and alert security staff immediately', correct: true },
          { text: 'Ignore and step past', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Severe storm warning. Indoor safety rule:',
        options: [
          { text: 'Stand near large windows and photograph outside', correct: false },
          { text: 'Move away from windows and glass partitions, secure latches', correct: true },
          { text: 'Go up to the roof deck', correct: false },
          { text: 'Open all doors wide', correct: false },
        ]
      }
    ]
  },
  road: {
    kk: [
      {
        id: 1,
        scenario: 'Колледж маңындағы көшелерді (Қабанбай батыр қиылысы) қалай кесіп өту керек?',
        options: [
          { text: 'Құлаққаппен музыка тыңдап, жүгіріп өту', correct: false },
          { text: 'Тек белгіленген жаяу жүргіншілер өткелінен, телефонға қарамай және көліктің тоқтағанына көз жеткізіп', correct: true },
          { text: 'Кез келген ыңғайлы жерден көліктердің арасымен', correct: false },
          { text: 'Көліктерге қол бұлғап, ортасынан жүгіру', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Колледж аумағындағы автокөліктердің жылдамдық шегі қанша?',
        options: [
          { text: '60 км/сағ', correct: false },
          { text: '40 км/сағ', correct: false },
          { text: '20 км/сағ-тан аспауы тиіс', correct: true },
          { text: 'Шектеу жоқ', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Қараңғы уақытта жаяу жүргіншілерге қандай элементтерді тағу ұсынылады?',
        options: [
          { text: 'Қараңғы киім кию', correct: false },
          { text: 'Жарық шағылыстыратын элементтер (фликерлер)', correct: true },
          { text: 'Күннен қорғайтын көзілдірік', correct: false },
          { text: 'Ешқандай элемент қажет емес', correct: false },
        ]
      }
    ],
    ru: [
      {
        id: 1,
        scenario: 'Как правильно переходить перекресток возле колледжа (Кабанбай батыра)?',
        options: [
          { text: 'В наушниках, глядя в смартфон на бегу', correct: false },
          { text: 'Только по пешеходному переходу (зебре), сняв наушники и убедившись, что авто остановились', correct: true },
          { text: 'В любом удобном месте между машинами', correct: false },
          { text: 'Перебегать дорогу по диагонали', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Каков лимит скорости для автомобилей на территории колледжа?',
        options: [
          { text: '60 км/ч', correct: false },
          { text: '40 км/ч', correct: false },
          { text: 'Не более 20 км/ч', correct: true },
          { text: 'Ограничений нет', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Что рекомендуется носить пешеходу в темное время суток?',
        options: [
          { text: 'Темную неприметную одежду', correct: false },
          { text: 'Светоотражающие элементы (фликеры)', correct: true },
          { text: 'Солнцезащитные очки', correct: false },
          { text: 'Ничего особенного не требуется', correct: false },
        ]
      }
    ],
    en: [
      {
        id: 1,
        scenario: 'Proper way to cross roads around campus (Kabanbay Batyr intersection)?',
        options: [
          { text: 'Jogging while wearing noise-canceling headphones', correct: false },
          { text: 'Exclusively via designated crosswalk zebra lines, removing headphones and confirming vehicles stopped', correct: true },
          { text: 'Jaywalking between parked vehicles', correct: false },
          { text: 'Running diagonally across traffic flow', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Speed limit for vehicles moving inside college grounds?',
        options: [
          { text: '60 km/h', correct: false },
          { text: '40 km/h', correct: false },
          { text: 'Strictly maximum 20 km/h', correct: true },
          { text: 'No speed limit', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Recommended gear for walking in low-light night hours?',
        options: [
          { text: 'Black non-reflective clothes', correct: false },
          { text: 'Reflective elements / badges (flickers)', correct: true },
          { text: 'Dark sunglasses', correct: false },
          { text: 'No special measures needed', correct: false },
        ]
      }
    ]
  },
  cyber: {
    kk: [
      {
        id: 1,
        scenario: 'Колледж атынан белгісіз сілтеме арқылы логин мен пароль сұралған хат келді. Әрекетіңіз?',
        options: [
          { text: 'Дереу жеке парольді енгізіп растау', correct: false },
          { text: 'Сілтемеге өтпей, күдікті хат туралы кураторға немесе IT бөліміне хабарлау (бұл фишинг)', correct: true },
          { text: 'Бұл хатты барлық топ чаттарына тарату', correct: false },
          { text: 'Парольді достармен бөлісу', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Әлеуметтік желіде студентті қорлау немесе кибербуллинг орын алса, не істеу қажет?',
        options: [
          { text: 'Жауап ретінде балағат сөздер жазу', correct: false },
          { text: 'Скриншот сақтап, бұғаттау және кураторға, психологқа немесе әкімшілікке жүгіну', correct: true },
          { text: 'Ешкімге айтпай тұйықталу', correct: false },
          { text: 'Аккаунтты өшіріп сабаққа бармау', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Қауіпсіз сенімді парольдің басты белгісі қандай?',
        options: [
          { text: '123456 немесе qwerty', correct: false },
          { text: 'Кемінде 10-12 таңбадан тұратын әріптер, сандар және арнайы белгілер қосындысы', correct: true },
          { text: 'Өз туған жылы мен есімі', correct: false },
          { text: 'Барлық сайттарда бірдей қарапайым пароль қолдану', correct: false },
        ]
      }
    ],
    ru: [
      {
        id: 1,
        scenario: 'Пришло подозрительное письмо от имени колледжа с просьбой ввести пароль. Ваши действия?',
        options: [
          { text: 'Немедленно перейти по ссылке и ввести пароль', correct: false },
          { text: 'Не переходить по ссылке, сообщить куратору или в IT-отдел (это фишинг)', correct: true },
          { text: 'Переслать ссылку одногруппникам', correct: false },
          { text: 'Ввести пароль от почты', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'При столкновении с травлей в интернете (кибербуллингом):',
        options: [
          { text: 'Оскорблять в ответ обидчиков', correct: false },
          { text: 'Сохранить скриншоты, заблокировать агрессора и обратиться к куратору или психологу', correct: true },
          { text: 'Замкнуться в себе и молчать', correct: false },
          { text: 'Удалить аккаунт и бросить учебу', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Главный признак надежного и безопасного пароля:',
        options: [
          { text: '12345678 или пароль', correct: false },
          { text: 'Комбинация из букв разного регистра, цифр и спецсимволов длиной от 10-12 знаков', correct: true },
          { text: 'Имя и год своего рождения', correct: false },
          { text: 'Один одинаковый пароль на все сервисы', correct: false },
        ]
      }
    ],
    en: [
      {
        id: 1,
        scenario: 'You receive a suspicious email claiming to be from the college requesting your password:',
        options: [
          { text: 'Immediately submit password via provided link', correct: false },
          { text: 'Do not click; report phishing attempt to IT desk or college admin', correct: true },
          { text: 'Forward link to all campus group chats', correct: false },
          { text: 'Reply with personal credentials', correct: false },
        ]
      },
      {
        id: 2,
        scenario: 'Handling cyberbullying or online harassment incidents on campus:',
        options: [
          { text: 'Respond with counter abuse and insults', correct: false },
          { text: 'Preserve evidence screenshots, block aggressor, and inform curator or counselor', correct: true },
          { text: 'Isolate yourself in silence', correct: false },
          { text: 'Drop out of classes', correct: false },
        ]
      },
      {
        id: 3,
        scenario: 'Primary indicator of a robust, secure password:',
        options: [
          { text: '123456 or qwerty', correct: false },
          { text: 'Combination of upper/lower case letters, digits, and special characters (10-12+ chars)', correct: true },
          { text: 'Your birth date and name', correct: false },
          { text: 'Single identical simple word across all sites', correct: false },
        ]
      }
    ]
  }
};

export function Game() {
  const { lang, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('fire');
  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'finished'>('welcome');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  const activeQuestions = quizBank[selectedCategory]?.[lang] || quizBank[selectedCategory]?.['kk'];

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      finishGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setCurrentIdx(0);
    setScore(0);
    setTimeLeft(60);
    setSelectedAnswer(null);
  };

  const handleSelectOption = (index: number, isCorrect: boolean) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (isCorrect) {
      setScore(prev => prev + 100);
    }

    setTimeout(() => {
      if (currentIdx < activeQuestions.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishGame(isCorrect ? score + 100 : score);
      }
    }, 1200);
  };

  const finishGame = async (finalScore?: number) => {
    const s = finalScore !== undefined ? finalScore : score;
    setGameState('finished');

    // Submit to server backend telemetry
    try {
      await fetch('/api/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: studentName.trim() || 'Білім алушы',
          group_name: studentGroup.trim() || '-',
          score: s,
          total_questions: activeQuestions.length * 100,
          category: selectedCategory === 'fire' 
            ? 'Өрт қауіпсіздігі' 
            : selectedCategory === 'civil' 
            ? 'Азаматтық қорғаныс' 
            : selectedCategory === 'road' 
            ? 'Жол қауіпсіздігі' 
            : 'Цифрлық қауіпсіздік'
        })
      });
    } catch (e) {
      console.warn('Failed to submit test results:', e);
    }
  };

  const categories = [
    {
      id: 'fire' as CategoryId,
      name: lang === 'en' ? 'Fire Safety' : lang === 'ru' ? 'Пожарная безопасность' : 'Өрт қауіпсіздігі',
      desc: lang === 'en' ? 'Evacuation rules & fire extinguishers' : lang === 'ru' ? 'Правила эвакуации и огнетушители' : 'Эвакуация ережелері мен өрт сөндіру',
      icon: Flame,
      color: 'bg-red-500'
    },
    {
      id: 'civil' as CategoryId,
      name: lang === 'en' ? 'Civil Defense & Disaster' : lang === 'ru' ? 'Гражданская оборона и ЧС' : 'Азаматтық қорғаныс және ТЖ',
      desc: lang === 'en' ? 'Earthquake, storm, and suspicious items' : lang === 'ru' ? 'Землетрясения, бури и подозрительные вещи' : 'Жер сілкінісі, дауыл және күдікті заттар',
      icon: ShieldAlert,
      color: 'bg-amber-500'
    },
    {
      id: 'road' as CategoryId,
      name: lang === 'en' ? 'Road Safety' : lang === 'ru' ? 'Дорожная безопасность' : 'Жол қозғалысы қауіпсіздігі',
      desc: lang === 'en' ? 'Crosswalks, speed limits & driving' : lang === 'ru' ? 'Зебры, лимиты скорости и парковка' : 'Жаяу жүргіншілер мен көлік қозғалысы',
      icon: Footprints,
      color: 'bg-emerald-500'
    },
    {
      id: 'cyber' as CategoryId,
      name: lang === 'en' ? 'Cyber & Digital Safety' : lang === 'ru' ? 'Цифровая безопасность' : 'Цифрлық қауіпсіздік',
      desc: lang === 'en' ? 'Anti-phishing, cyberbullying & data' : lang === 'ru' ? 'Фишинг, кибербуллинг и пароли' : 'Кибербуллингке қарсы күрес және парольдер',
      icon: Shield,
      color: 'bg-indigo-500'
    }
  ];

  const maxPossibleScore = activeQuestions.length * 100;
  const isPerfect = score === maxPossibleScore;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-12"
    >
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider border border-blue-100">
          <Gamepad2 className="w-4 h-4" />
          <span>Smart Campus Testing Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
          {lang === 'en' ? 'Campus Safety Interactive Simulator' : lang === 'ru' ? 'Интерактивный симулятор безопасности' : 'Қауіпсіздік негіздері бойынша оқу ойыны'}
        </h1>
        <p className="text-slate-600 text-sm font-medium">
          {lang === 'en'
            ? 'Complete scenario-based safety assessments, collect proficiency points, and secure certification.'
            : lang === 'ru'
            ? 'Пройдите интерактивное тестирование по направлениям безопасности и зафиксируйте свой результат.'
            : 'Өрт қауіпсіздігі, азаматтық қорғаныс және жол ережелері бойынша тест тапсырып, ресми нәтижеңізді көріңіз.'}
        </p>
      </div>

      {/* Main Game Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-slate-950 p-6 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wide block">ҚАУІПСІЗДІК ТЕСТІЛЕУІ</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {categories.find(c => c.id === selectedCategory)?.name}
              </span>
            </div>
          </div>

          {gameState === 'playing' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-black text-sm text-white">{score} ұпай</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                <Timer className="w-4 h-4 text-red-400" />
                <span className="font-mono font-black text-sm text-white">00:{timeLeft.toString().padStart(2, '0')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 min-h-[420px] flex flex-col justify-center">
          {gameState === 'welcome' && (
            <div className="space-y-8 max-w-2xl mx-auto w-full">
              {/* Category Picker */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Тест бағытын таңдаңыз:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSel = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSel
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${cat.color} text-white flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">{cat.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student identification */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Білім алушының мәліметтері (Нәтиже журналы үшін):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Аты-жөніңіз (Мысалы: Ерлан Әлімов)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Notebook className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={studentGroup}
                      onChange={(e) => setStudentGroup(e.target.value)}
                      placeholder="Оқу тобы (Мысалы: ИС-22)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center">
                <button
                  onClick={startGame}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Тестті бастау (60 секунд)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-6 max-w-2xl mx-auto w-full">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 block mb-2">
                  Сұрақ {currentIdx + 1} / {activeQuestions.length}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {activeQuestions[currentIdx].scenario}
                </h3>
              </div>

              <div className="space-y-3">
                {activeQuestions[currentIdx].options.map((opt, idx) => {
                  let btnClass = "bg-white border-2 border-slate-200 hover:border-blue-500 text-slate-700 hover:bg-slate-50";
                  if (selectedAnswer === idx) {
                    btnClass = opt.correct 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900" 
                      : "bg-red-50 border-red-500 text-red-900";
                  } else if (selectedAnswer !== null && opt.correct) {
                    btnClass = "bg-emerald-50 border-emerald-500 text-emerald-900";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleSelectOption(idx, opt.correct)}
                      className={`w-full p-4 rounded-2xl text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer leading-relaxed ${btnClass}`}
                    >
                      <span className="pr-3">{opt.text}</span>
                      {selectedAnswer !== null && opt.correct && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                      {selectedAnswer === idx && !opt.correct && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center space-y-6 max-w-lg mx-auto py-4">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
                <Trophy className="w-10 h-10 text-amber-500 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Тест аяқталды!</h2>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-2">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Сіздің нәтижеңіз:</span>
                <div className="text-5xl font-black text-slate-900 font-mono">
                  {score} <span className="text-xl text-slate-500">/ {maxPossibleScore} ұпай</span>
                </div>
                <p className="text-xs text-slate-600 font-medium pt-2">
                  {studentName ? `${studentName} (${studentGroup || 'Колледж'})` : 'Білім алушы'} нәтижесі серверге сәтті тіркелді.
                </p>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isPerfect 
                  ? 'Өте тамаша! Сіз қауіпсіздік ережелерін жоғары деңгейде меңгергенсіз.' 
                  : 'Жақсы нәтиже! Қауіпсіздік нұсқаулықтарын жиі қайталап тұруға кеңес береміз.'}
              </p>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  onClick={() => setGameState('welcome')}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Басқа бағытты тапсыру</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Нәтижені басып шығару</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
