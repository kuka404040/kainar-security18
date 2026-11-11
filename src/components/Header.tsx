import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Globe, PhoneCall, ChevronDown, 
  Home, Flame, MapPin, Footprints, FileText, 
  Gamepad2, Bell, AlertTriangle, ShieldCheck,
  Send, Compass
} from 'lucide-react';
import { clsx } from 'clsx';
import { KainarLogo } from './KainarLogo';
import { useLanguage, Language } from '../context/LanguageContext';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [safetyDropdownOpen, setSafetyDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  
  const safetyRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  // Close dropdowns on route change
  useEffect(() => {
    setIsOpen(false);
    setSafetyDropdownOpen(false);
    setServicesDropdownOpen(false);
  }, [location.pathname]);

  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (safetyRef.current && !safetyRef.current.contains(event.target as Node)) {
        setSafetyDropdownOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
  };

  const getLangLabel = (l: Language) => {
    if (l === 'kk') return 'KZ';
    if (l === 'ru') return 'RU';
    return 'EN';
  };

  // Grouped Navigation Items for Dropdowns
  const safetyItems = [
    {
      path: '/emergency',
      title: lang === 'en' ? 'Emergency Protocols' : lang === 'ru' ? 'Чрезвычайные ситуации' : 'Төтенше жағдайлар',
      desc: lang === 'en' ? 'Procedures for fire, earthquake & hazards' : lang === 'ru' ? 'Действия при пожаре, ЧС и угрозах' : 'Өрт, зілзала және қауіп кезіндегі әрекеттер',
      icon: Flame,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      path: '/evacuation',
      title: lang === 'en' ? 'Evacuation Plans' : lang === 'ru' ? 'Планы эвакуации' : 'Эвакуация жоспары',
      desc: lang === 'en' ? 'Interactive floor layouts (Floors 1, 3, 4, 5)' : lang === 'ru' ? 'Схемы этажей 1, 3, 4, 5 с выходами' : '1, 3, 4, 5-қабаттардың интерактивті карталары',
      icon: Compass,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      path: '/road-safety',
      title: lang === 'en' ? 'Road & Campus Safety' : lang === 'ru' ? 'Дорожная безопасность' : 'Жол қауіпсіздігі',
      desc: lang === 'en' ? 'Safe pedestrian routes around campus' : lang === 'ru' ? 'Схема безопасного движения у колледжа' : 'Колледж маңындағы қауіпсіз жаяу жүргінші сызбасы',
      icon: Footprints,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      path: '/memos',
      title: lang === 'en' ? 'Safety Guidelines' : lang === 'ru' ? 'Памятки и инструкции' : 'Пайдалы жаднамалар',
      desc: lang === 'en' ? 'Official rules, regulations & PDF documents' : lang === 'ru' ? 'Нормативные документы и памятки для скачивания' : 'Ресми ережелер, құжаттар және жүктеулер',
      icon: FileText,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ];

  const servicesItems = [
    {
      path: '/report',
      title: lang === 'en' ? 'Report Incident' : lang === 'ru' ? 'Сообщить об инциденте' : 'Оқиғаны хабарлау',
      desc: lang === 'en' ? 'Prompt reporting of hazards or issues' : lang === 'ru' ? 'Оперативная подача информации о происшествии' : 'Қауіп немесе оқиға туралы шұғыл хабарлама',
      icon: Send,
      color: 'text-red-400 bg-red-500/10 border-red-500/20'
    },
    {
      path: '/game',
      title: lang === 'en' ? 'Interactive Quiz' : lang === 'ru' ? 'Тестирование знаний' : 'Қауіпсіздік тесті',
      desc: lang === 'en' ? '4 safety modules & certificate' : lang === 'ru' ? '4 направления проверки знаний и сертификат' : '4 бағыт бойынша білім тексеру және сертификат',
      icon: Gamepad2,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      path: '/notifications',
      title: lang === 'en' ? 'Safety Alerts' : lang === 'ru' ? 'Оповещения и новости' : 'Хабарландырулар',
      desc: lang === 'en' ? 'Drill schedules & severe weather alerts' : lang === 'ru' ? 'Экстренные предупреждения и учебные тревоги' : 'Шұғыл дабылдар, оқу-жаттығулар мен жаңалықтар',
      icon: Bell,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  const isSafetyActive = safetyItems.some(i => i.path === location.pathname);
  const isServicesActive = servicesItems.some(i => i.path === location.pathname);

  return (
    <header className="bg-slate-950/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-slate-800/80 shadow-2xl transition-all">
      {/* Top security status bar */}
      <div className="bg-slate-900/90 text-slate-300 text-[11px] py-1.5 px-4 sm:px-6 border-b border-slate-800/60 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Smart Campus Security 24/7
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-medium">
              Семей «Қайнар» жоғары колледжі • Шұғыл көмек: <strong className="text-white font-bold tracking-wider">112 / 101</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <Link to="/notifications" className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-xs font-semibold">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.notifications')}</span>
            </Link>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>+7 (7222) 52-25-33</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & College Identity */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-xs group-hover:bg-blue-500/50 transition-all" />
              <div className="relative bg-white rounded-2xl p-1.5 shadow-md border border-white/20">
                <KainarLogo className="w-10 h-10 md:w-11 md:h-11 shrink-0" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight leading-none text-white group-hover:text-blue-400 transition-colors uppercase">
                  {t('header.title')}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hidden sm:inline-block">
                  Қорғалған
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                {t('header.subtitle')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation with Professional Spacing & Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            
            {/* 1. Басты бет */}
            <Link
              to="/"
              className={clsx(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold tracking-wide transition-all h-11',
                location.pathname === '/'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
              )}
            >
              <Home className="w-4 h-4 shrink-0 text-blue-400" />
              <span>{t('nav.home')}</span>
            </Link>

            {/* 2. Қауіпсіздік & Нұсқаулықтар (Dropdown) */}
            <div className="relative" ref={safetyRef}>
              <button
                type="button"
                onClick={() => {
                  setSafetyDropdownOpen(!safetyDropdownOpen);
                  setServicesDropdownOpen(false);
                }}
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold tracking-wide transition-all cursor-pointer h-11 border',
                  isSafetyActive
                    ? 'bg-slate-900 text-blue-400 border-blue-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
                )}
              >
                <ShieldCheck className={clsx("w-4 h-4 shrink-0", isSafetyActive ? "text-blue-400" : "text-emerald-400")} />
                <span>
                  {lang === 'en' ? 'Safety Guidelines' : lang === 'ru' ? 'Безопасность и планы' : 'Қауіпсіздік'}
                </span>
                <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform duration-200 text-slate-400", safetyDropdownOpen ? "rotate-180 text-white" : "")} />
              </button>

              {/* Flyout Menu */}
              {safetyDropdownOpen && (
                <div className="absolute left-0 mt-2 w-96 rounded-3xl bg-slate-900/98 backdrop-blur-2xl border border-slate-750 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {lang === 'en' ? 'Safety Regulations & Emergency Plans' : lang === 'ru' ? 'Регламенты и планы эвакуации' : 'Қауіпсіздік ережелері мен жоспарлары'}
                    </span>
                  </div>
                  {safetyItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSafetyDropdownOpen(false)}
                        className={clsx(
                          'flex items-start gap-3 p-3 rounded-2xl transition-all group',
                          isActive
                            ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                        )}
                      >
                        <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5", item.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold leading-tight group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Қызметтер & Интерактив (Dropdown) */}
            <div className="relative" ref={servicesRef}>
              <button
                type="button"
                onClick={() => {
                  setServicesDropdownOpen(!servicesDropdownOpen);
                  setSafetyDropdownOpen(false);
                }}
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold tracking-wide transition-all cursor-pointer h-11 border',
                  isServicesActive
                    ? 'bg-slate-900 text-blue-400 border-blue-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
                )}
              >
                <Gamepad2 className={clsx("w-4 h-4 shrink-0", isServicesActive ? "text-blue-400" : "text-cyan-400")} />
                <span>
                  {lang === 'en' ? 'Services & Quiz' : lang === 'ru' ? 'Сервисы и тесты' : 'Қызметтер'}
                </span>
                <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform duration-200 text-slate-400", servicesDropdownOpen ? "rotate-180 text-white" : "")} />
              </button>

              {/* Flyout Menu */}
              {servicesDropdownOpen && (
                <div className="absolute left-0 mt-2 w-96 rounded-3xl bg-slate-900/98 backdrop-blur-2xl border border-slate-750 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {lang === 'en' ? 'Interactive Campus Services' : lang === 'ru' ? 'Интерактивные сервисы кампуса' : 'Интерактивті колледж қызметтері'}
                    </span>
                  </div>
                  {servicesItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setServicesDropdownOpen(false)}
                        className={clsx(
                          'flex items-start gap-3 p-3 rounded-2xl transition-all group',
                          isActive
                            ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                        )}
                      >
                        <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5", item.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold leading-tight group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Байланыс */}
            <Link
              to="/contacts"
              className={clsx(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold tracking-wide transition-all h-11',
                location.pathname === '/contacts'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
              )}
            >
              <PhoneCall className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{t('nav.contacts')}</span>
            </Link>
          </nav>

          {/* Right Action Cluster (Quick Report SOS Button & Language Switcher) */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Quick Report Action Button */}
            <Link
              to="/report"
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer h-11",
                location.pathname === '/report'
                  ? "bg-red-600 text-white shadow-red-600/30 ring-2 ring-red-400"
                  : "bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40"
              )}
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{lang === 'en' ? 'Report' : lang === 'ru' ? 'Сообщить' : 'Хабарлау'}</span>
            </Link>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner h-11">
              <Globe className="w-3.5 h-3.5 text-slate-400 mx-2" />
              {(['kk', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={clsx(
                    'px-2.5 py-1 text-[11px] font-black tracking-wide rounded-xl uppercase transition-all cursor-pointer h-8',
                    lang === l
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                  title={l === 'kk' ? 'Қазақша' : l === 'ru' ? 'Русский' : 'English'}
                >
                  {getLangLabel(l)}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="lg:hidden flex items-center gap-2">
            
            {/* Mobile Language Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              {(['kk', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={clsx(
                    'px-2 py-1 text-[10px] font-black rounded-lg uppercase transition-all cursor-pointer',
                    lang === l ? 'bg-blue-600 text-white' : 'text-slate-400'
                  )}
                >
                  {getLangLabel(l)}
                </button>
              ))}
            </div>

            {/* Quick Report Mobile Shortcut */}
            <Link
              to="/report"
              className="p-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl border border-red-500/30 transition-colors"
              title="Хабарлау / Report"
            >
              <AlertTriangle className="w-4 h-4" />
            </Link>

            {/* Hamburger Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white focus:outline-none p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation with Spacious Categorized Layout */}
      {isOpen && (
        <div className="lg:hidden bg-slate-950/98 backdrop-blur-2xl border-t border-slate-850 px-4 pt-4 pb-8 space-y-5 animate-in fade-in duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
          
          {/* Main Direct Links */}
          <div className="space-y-1.5">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                location.pathname === '/'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-200 bg-slate-900/70 border border-slate-800'
              )}
            >
              <Home className="w-4 h-4 text-blue-400" />
              <span>{t('nav.home')}</span>
            </Link>

            <Link
              to="/report"
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all',
                location.pathname === '/report'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-600/10 text-red-300 border border-red-500/30'
              )}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{lang === 'en' ? 'Report Incident' : lang === 'ru' ? 'Сообщить об инциденте' : 'Оқиғаны хабарлау'}</span>
            </Link>
          </div>

          {/* Category: Safety */}
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'Safety & Evacuation' : lang === 'ru' ? 'Безопасность и эвакуация' : 'Қауіпсіздік және эвакуация'}</span>
            </div>
            <div className="space-y-1.5">
              {safetyItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850'
                    )}
                  >
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold leading-tight">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category: Services & Quiz */}
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'en' ? 'Interactive Services' : lang === 'ru' ? 'Сервисы и проверка знаний' : 'Қызметтер мен тестілеу'}</span>
            </div>
            <div className="space-y-1.5">
              {servicesItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850'
                    )}
                  >
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold leading-tight">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}

              <Link
                to="/contacts"
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all',
                  location.pathname === '/contacts'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850'
                )}
              >
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold leading-tight">{t('nav.contacts')}</div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 truncate">
                    {lang === 'en' ? 'Hotlines, security desk & coordinates' : lang === 'ru' ? 'Горячие линии, охрана и адреса' : 'Жедел желілер, күзет бекеті және мекенжай'}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Hotline emergency strip */}
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Шұғыл қызметтер:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 font-black">101</span>
              <span className="px-2 py-0.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30 font-black">102</span>
              <span className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 font-black">103</span>
              <span className="px-2 py-0.5 bg-amber-600/30 text-amber-400 rounded-lg border border-amber-500/30 font-black">112</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
