import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { KainarLogo } from './KainarLogo';
import { AIAssistantModal } from './AIAssistantModal';
import { useLanguage } from '../context/LanguageContext';
import { Shield, PhoneCall, AlertTriangle, MapPin, Heart, ExternalLink, Lock } from 'lucide-react';

export function Layout() {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      <Header />
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <Outlet />
      </main>

      {/* Floating AI Assistant Widget */}
      <AIAssistantModal />

      {/* Modern High-Tech Smart Campus Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-850">
            {/* Column 1: Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-2xl p-2 shadow-lg border border-white/20">
                  <KainarLogo className="w-10 h-10 shrink-0" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base tracking-tight leading-none uppercase">
                    {t('header.title')}
                  </h3>
                  <p className="text-xs text-blue-400 font-bold tracking-wider mt-1 uppercase">
                    {t('header.subtitle')}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                «Қауіпсіз колледж — қауіпсіз болашақ». Семей «Қайнар» жоғары колледжінің білім алушылары мен қызметкерлерінің қауіпсіздігін цифрлық қамтамасыз ету платформасы.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Жүйе қорғалған • 24/7 Мониторинг</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>{lang === 'en' ? 'Core Directions' : lang === 'ru' ? 'Направления' : 'Негізгі бағыттар'}</span>
              </h4>
              <ul className="space-y-2 text-xs font-bold">
                <li>
                  <Link to="/evacuation" className="hover:text-white transition-colors block">
                    • {t('nav.evacuation')} (1, 3, 4, 5-қабаттар)
                  </Link>
                </li>
                <li>
                  <Link to="/emergency" className="hover:text-white transition-colors block">
                    • {t('nav.emergency')} (Өрт, жер сілкінісі, ТЖ)
                  </Link>
                </li>
                <li>
                  <Link to="/road-safety" className="hover:text-white transition-colors block">
                    • {t('nav.roadSafety')} (Қабанбай батыр қиылысы)
                  </Link>
                </li>
                <li>
                  <Link to="/memos" className="hover:text-white transition-colors block">
                    • {t('nav.memos')} (PDF жүктеу)
                  </Link>
                </li>
                <li>
                  <Link to="/game" className="hover:text-white transition-colors block">
                    • {t('nav.game')} (Онлайн тест)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Emergency Dispatch Numbers */}
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-red-500" />
                <span>{lang === 'en' ? 'Emergency Numbers' : lang === 'ru' ? 'Шұғыл қызметтер' : 'Шұғыл нөмірлер'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-red-500 font-black text-sm">101</span>
                  <span className="text-[10px] text-slate-400">{lang === 'en' ? 'Fire Service' : lang === 'ru' ? 'Пожарная' : 'Өрт сөндіру'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-blue-400 font-black text-sm">102</span>
                  <span className="text-[10px] text-slate-400">{lang === 'en' ? 'Police' : lang === 'ru' ? 'Полиция' : 'Полиция'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-emerald-400 font-black text-sm">103</span>
                  <span className="text-[10px] text-slate-400">{lang === 'en' ? 'Ambulance' : lang === 'ru' ? 'Скорая' : 'Жедел жәрдем'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-amber-400 font-black text-sm">112</span>
                  <span className="text-[10px] text-slate-400">{lang === 'en' ? 'Unified Rescue' : lang === 'ru' ? 'ЧС Единая' : 'Құтқару қызметі'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                * Күзет бөлімі 1-қабатта тәулік бойы (24/7) жұмыс істейді.
              </p>
            </div>

            {/* Column 4: Location & Admin Portal */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'en' ? 'College Location' : lang === 'ru' ? 'Мекенжай' : 'Орналасуы'}</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Қазақстан Республикасы, Абай облысы, Семей қаласы, Қабанбай батыр көшесі мен Қаным Мұхамедханов даңғылы қиылысы.
              </p>
              
              <div className="pt-2">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-850 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      {lang === 'en' ? 'Direct Hotline' : lang === 'ru' ? 'Прямая линия' : 'Тікелей желі'}
                    </span>
                    <a href="tel:112" className="text-xs font-black text-white hover:text-blue-400 transition-colors">
                      +7 (7222) 52-25-33
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p className="text-center sm:text-left">
              {t('footer.rights')}
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-slate-600">Қауіпсіз колледж — қауіпсіз болашақ</span>
              <span>•</span>
              <span className="text-slate-400">Семей «Қайнар» жоғары колледжі</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
