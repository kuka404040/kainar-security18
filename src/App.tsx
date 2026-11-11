import { Routes, Route, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import { RoadSafety } from './pages/RoadSafety';
import { Evacuation } from './pages/Evacuation';
import { Emergency } from './pages/Emergency';
import { Memos } from './pages/Memos';
import { Game } from './pages/Game';
import { CCTV } from './pages/CCTV';
import { Contacts } from './pages/Contacts';
import { Admin } from './pages/Admin';
import { Notifications } from './pages/Notifications';
import { getAdminPassword } from './utils/adminApi';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

// Guard for CCTV route — video feeds are restricted strictly to authorized internal operations.
function ProtectedCCTVRoute() {
  const { lang } = useLanguage();
  const authed = !!getAdminPassword();

  if (!authed) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-red-100 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-red-600 bg-red-100/60 px-3 py-1 rounded-full">
            {lang === 'en' ? 'Internal Service' : lang === 'ru' ? 'Служебный раздел' : 'Қызметтік бөлім'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
            {lang === 'en'
              ? 'Access Restricted'
              : lang === 'ru'
              ? 'Доступ ограничен'
              : 'Қатынас шектелген'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {lang === 'en'
              ? 'This section is reserved exclusively for authorized college security monitoring.'
              : lang === 'ru'
              ? 'Данный раздел предназначен исключительно для уполномоченных сотрудников службы безопасности колледжа.'
              : 'Бұл бөлім тек колледждің арнайы уәкілетті күзет және қауіпсіздік қызметіне арналған.'}
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'en' ? 'Back to Portal Home' : lang === 'ru' ? 'Вернуться на главную' : 'Басты бетке оралу'}</span>
          </Link>
        </div>
      </div>
    );
  }

  return <CCTV />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="report" element={<Report />} />
          <Route path="road-safety" element={<RoadSafety />} />
          <Route path="evacuation" element={<Evacuation />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="memos" element={<Memos />} />
          <Route path="game" element={<Game />} />
          <Route path="cctv" element={<ProtectedCCTVRoute />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="admin" element={<Admin />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </>
  );
}
