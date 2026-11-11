import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, FileText, AlertTriangle, MapPin, Clock, 
  Download, User, Notebook, Calendar, CheckCircle2, 
  Search, Trash2, RefreshCw, Radio, BarChart3, BellRing, Eye,
  Video, LogOut, Plus, Filter, Edit3, MessageSquare, Printer, Check, X,
  ShieldAlert, Shield, Activity, Sparkles, ChevronRight, Siren, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { adminFetch, getAdminPassword, setAdminPassword, clearAdminPassword } from '../utils/adminApi';
import { CCTV } from './CCTV';

interface SafetyDownload {
  id: number;
  name: string;
  group_name: string;
  ticket_number: string;
  language: string;
  sign_date: string;
  created_at: string;
}

interface SosAlert {
  id: number;
  location: string;
  status: string;
  created_at: string;
}

interface Incident {
  id: number;
  name: string;
  group_name: string;
  type: string;
  location: string;
  description: string;
  media_url: string;
  datetime: string;
  status?: string;
  priority?: string;
  notes?: string;
  created_at: string;
}

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
  is_active: number;
  created_at: string;
}

interface AdminLog {
  id: number;
  admin_name: string;
  action: string;
  details: string;
  created_at: string;
}

interface Stats {
  totalIncidents: number;
  totalSos: number;
  totalSafetyDownloads: number;
  totalNotifications: number;
  totalTests: number;
  types: { type: string; count: number }[];
  statuses: { status: string; count: number }[];
}

export function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'sos' | 'downloads' | 'notifications' | 'cctv' | 'logs'>('dashboard');
  
  // Data states
  const [downloads, setDownloads] = useState<SafetyDownload[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');


  // Search & Filter states
  const [searchDownloads, setSearchDownloads] = useState('');
  const [searchIncidents, setSearchIncidents] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Selected Incident for detail/edit modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentEditStatus, setIncidentEditStatus] = useState('');
  const [incidentEditPriority, setIncidentEditPriority] = useState('');
  const [incidentEditNotes, setIncidentEditNotes] = useState('');
  const [incidentSaving, setIncidentSaving] = useState(false);

  // New announcement modal state
  const [showNewNoticeModal, setShowNewNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title_kk: '',
    title_ru: '',
    title_en: '',
    content_kk: '',
    content_ru: '',
    content_en: '',
    type: 'info',
    priority: 'normal'
  });
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [downRes, sosRes, incRes, notifRes, statRes, logRes] = await Promise.all([
        adminFetch('/api/safety-rules-downloads'),
        adminFetch('/api/sos'),
        adminFetch('/api/incidents'),
        adminFetch('/api/notifications/all'),
        adminFetch('/api/stats'),
        adminFetch('/api/admin/logs')
      ]);

      if (downRes.ok) setDownloads(await downRes.json());
      if (sosRes.ok) setSosAlerts(await sosRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (statRes.ok) setStats(await statRes.json());
      if (logRes.ok) setAdminLogs(await logRes.json());
    } catch (e) {
      console.error('Error fetching admin data:', e);
      setLoadError('Серверге қосылу мүмкін болмады. Байланысты тексеріңіз.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSos = async (id: number) => {
    try {
      await adminFetch(`/api/sos/${id}/resolve`, { method: 'POST' });
      setSosAlerts(prev => prev.map(item => item.id === id ? { ...item, status: 'Қаралды / Орындалды' } : item));
    } catch (e) {
      console.error('Failed to resolve SOS:', e);
    }
  };

  const handleDeleteSos = async (id: number) => {
    if (!confirm('Дабыл жазбасын өшіруді растайсыз ба?')) return;
    try {
      await adminFetch(`/api/sos/${id}`, { method: 'DELETE' });
      setSosAlerts(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('Failed to delete SOS:', e);
    }
  };

  const handleDeleteDownload = async (id: number) => {
    if (!confirm('Осы жазбаны тізімнен өшіруді растайсыз ба?')) return;
    try {
      await adminFetch(`/api/safety-rules-downloads/${id}`, { method: 'DELETE' });
      setDownloads(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('Failed to delete download:', e);
    }
  };

  const handleOpenIncidentModal = (inc: Incident) => {
    setSelectedIncident(inc);
    setIncidentEditStatus(inc.status || 'Жаңа');
    setIncidentEditPriority(inc.priority || 'Орташа');
    setIncidentEditNotes(inc.notes || '');
  };

  const handleSaveIncident = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setIncidentSaving(true);
    try {
      const res = await adminFetch(`/api/incidents/${selectedIncident.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: incidentEditStatus,
          priority: incidentEditPriority,
          notes: incidentEditNotes
        })
      });
      if (res.ok) {
        setIncidents(prev => prev.map(item => item.id === selectedIncident.id ? {
          ...item,
          status: incidentEditStatus,
          priority: incidentEditPriority,
          notes: incidentEditNotes
        } : item));
        setSelectedIncident(null);
      }
    } catch (e) {
      console.error('Failed to update incident:', e);
    } finally {
      setIncidentSaving(false);
    }
  };

  const handleDeleteIncident = async (id: number) => {
    if (!confirm('Оқиғаны жүйеден біржола өшіруді растайсыз ба?')) return;
    try {
      await adminFetch(`/api/incidents/${id}`, { method: 'DELETE' });
      setIncidents(prev => prev.filter(item => item.id !== id));
      if (selectedIncident?.id === id) setSelectedIncident(null);
    } catch (e) {
      console.error('Failed to delete incident:', e);
    }
  };

  const handleCreateNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title_kk.trim() || !noticeForm.content_kk.trim()) {
      alert('Қазақ тіліндегі тақырып пен мазмұн міндетті!');
      return;
    }
    setNoticeSubmitting(true);
    try {
      const res = await adminFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm)
      });
      if (res.ok) {
        setShowNewNoticeModal(false);
        setNoticeForm({
          title_kk: '',
          title_ru: '',
          title_en: '',
          content_kk: '',
          content_ru: '',
          content_en: '',
          type: 'info',
          priority: 'normal'
        });
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to create notice:', e);
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleToggleNotice = async (id: number) => {
    try {
      await adminFetch(`/api/notifications/${id}/toggle`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_active: n.is_active === 1 ? 0 : 1 } : n));
    } catch (e) {
      console.error('Failed to toggle notice:', e);
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('Хабарламаны өшіруді растайсыз ба?')) return;
    try {
      await adminFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notice:', e);
    }
  };

  // Filtered lists
  const filteredDownloads = downloads.filter(item => {
    if (!searchDownloads.trim()) return true;
    const q = searchDownloads.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.group_name?.toLowerCase().includes(q) || item.ticket_number?.toLowerCase().includes(q);
  });

  const filteredIncidents = incidents.filter(item => {
    if (searchIncidents.trim()) {
      const q = searchIncidents.toLowerCase();
      const match = item.name?.toLowerCase().includes(q) || 
                    item.group_name?.toLowerCase().includes(q) || 
                    item.location?.toLowerCase().includes(q) || 
                    item.description?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterStatus !== 'all' && (item.status || 'Жаңа') !== filterStatus) return false;
    if (filterPriority !== 'all' && (item.priority || 'Орташа') !== filterPriority) return false;
    return true;
  });

  // KPI calculations
  const newIncidentsCount = incidents.filter(i => !i.status || i.status === 'Жаңа').length;
  const inProgressIncidentsCount = incidents.filter(i => i.status === 'Қаралуда' || i.status === 'В обработке').length;
  const resolvedIncidentsCount = incidents.filter(i => i.status === 'Орындалды' || i.status === 'Завершено').length;
  const activeSosCount = sosAlerts.filter(s => s.status === 'Белсенді').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 animate-fade-in"
    >
      {/* Top Header & Role Control */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Smart Campus Security Operations Center (SOC)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Қауіпсіздік Басқару Орталығы
          </h1>
          <p className="text-slate-400 mt-1.5 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
            Колледж бойынша оқиғалар, дабылдар, бейнебақылау, хабарламалар және студенттік қауіпсіздік мониторингі
          </p>
        </div>

        {/* Admin Badge & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-wider">ADMIN</span>
          </div>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            title="Деректерді жаңарту"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Жаңарту</span>
          </button>

          <button
            onClick={onLogout}
            className="p-3 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Шығу"
          >
            <LogOut className="w-4 h-4" />
            <span>Шығу</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Modern Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-slate-950 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard & Аналитика</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'incidents'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Оқиғалар орталығы</span>
          {newIncidentsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white animate-pulse">
              {newIncidentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'sos'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Siren className="w-4 h-4" />
          <span>Дабылдар (SOS)</span>
          {activeSosCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-red-600 animate-ping">
              {activeSosCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'downloads'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Ереже жүктеушілер ({downloads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Хабарламалар ({notifications.length})</span>
        </button>

        {/* PROTECTED CCTV TAB ONLY IN ADMIN */}
        <button
          onClick={() => setActiveTab('cctv')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'cctv'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Video className="w-4 h-4 text-emerald-600" />
          <span>Бейнебақылау (CCTV Live)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Аудит журналы</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD & ANALYTICS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Real KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div 
              onClick={() => setActiveTab('incidents')}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Барлық оқиғалар</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BellRing className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono">{incidents.length}</div>
              <div className="mt-3 flex gap-2 text-[11px] font-bold">
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Жаңа: {newIncidentsCount}</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Орындалды: {resolvedIncidentsCount}</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('sos')}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">SOS Дабылдары</span>
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Siren className="w-5 h-5 animate-bounce" />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono">{sosAlerts.length}</div>
              <div className="mt-3 flex gap-2 text-[11px] font-bold">
                <span className={`px-2 py-0.5 rounded-md ${activeSosCount > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                  Белсенді: {activeSosCount}
                </span>
                <span className="text-slate-500">Барлық жазбалар</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('downloads')}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Қол қойылған ережелер</span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono">{downloads.length}</div>
              <div className="mt-3 text-[11px] font-bold text-indigo-600">
                Студенттердің жеке PDF құжаттары
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('notifications')}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Хабарламалар</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Radio className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono">{notifications.length}</div>
              <div className="mt-3 text-[11px] font-bold text-amber-600">
                Белсенді хабарлар: {notifications.filter(n => n.is_active === 1).length}
              </div>
            </div>
          </div>

          {/* Incident Category & Status breakdown charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-black text-slate-950">Оқиға түрлерінің үлесі</h3>
                <span className="text-xs font-bold text-slate-400">Нақты деректер</span>
              </div>
              
              <div className="space-y-3">
                {stats?.types && stats.types.length > 0 ? (
                  stats.types.map((t, idx) => {
                    const total = incidents.length || 1;
                    const pct = Math.round((t.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{t.type}</span>
                          <span>{t.count} оқиға ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Әзірге оқиғалар бойынша деректер жоқ</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-black text-slate-950">Оқиғаларды өңдеу мәртебесі</h3>
                <span className="text-xs font-bold text-slate-400">SOC статусы</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-2xl font-black text-amber-700 font-mono">{newIncidentsCount}</span>
                  <span className="block text-[11px] font-bold text-amber-800 mt-1">Жаңа</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-2xl font-black text-blue-700 font-mono">{inProgressIncidentsCount}</span>
                  <span className="block text-[11px] font-bold text-blue-800 mt-1">Қаралуда</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-2xl font-black text-emerald-700 font-mono">{resolvedIncidentsCount}</span>
                  <span className="block text-[11px] font-bold text-emerald-800 mt-1">Орындалды</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Қауіпсіздік қызметі: Шұғыл 101, 102, 112 байланыста</span>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Есепті басып шығару</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT MANAGEMENT CENTER */}
      {activeTab === 'incidents' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchIncidents}
                onChange={(e) => setSearchIncidents(e.target.value)}
                placeholder="Хабарлаушы, оқу тобы немесе локация бойынша іздеу..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">Барлық мәртебе</option>
                <option value="Жаңа">Жаңа</option>
                <option value="Қаралуда">Қаралуда</option>
                <option value="Орындалды">Орындалды</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">Барлық басымдық</option>
                <option value="Жоғары">Жоғары басымдық</option>
                <option value="Орташа">Орташа басымдық</option>
                <option value="Төмен">Төмен басымдық</option>
              </select>

              <span className="text-xs font-bold text-slate-500 px-2">
                Табылды: {filteredIncidents.length}
              </span>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                    <th className="p-4">№</th>
                    <th className="p-4">Хабарлаушы</th>
                    <th className="p-4">Топ</th>
                    <th className="p-4">Оқиға түрі</th>
                    <th className="p-4">Локация</th>
                    <th className="p-4">Мәртебесі</th>
                    <th className="p-4">Басымдық</th>
                    <th className="p-4">Уақыты</th>
                    <th className="p-4 text-right">Әрекет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-xs text-slate-700">
                  {filteredIncidents.map((inc) => {
                    const status = inc.status || 'Жаңа';
                    const priority = inc.priority || 'Орташа';
                    const isHigh = priority === 'Жоғары';
                    return (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-400">#{inc.id}</td>
                        <td className="p-4 font-bold text-slate-900">{inc.name}</td>
                        <td className="p-4 font-semibold text-slate-600">{inc.group_name}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-extrabold">
                            {inc.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{inc.location}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            status === 'Жаңа' 
                              ? 'bg-amber-100 text-amber-800' 
                              : status === 'Қаралуда' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isHigh ? 'bg-red-100 text-red-700 font-extrabold' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {priority}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {new Date(inc.datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleOpenIncidentModal(inc)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                              title="Өңдеу және қарау"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIncident(inc.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Өшіру"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredIncidents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500 font-bold">
                        Іздеу критерийлері бойынша оқиғалар табылмады.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT EDIT & DETAIL MODAL */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Инцидент #{selectedIncident.id} — {selectedIncident.type}
                    </h3>
                    <p className="text-xs text-slate-400">Хабарлаған: {selectedIncident.name} ({selectedIncident.group_name})</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <span className="font-extrabold text-slate-700 block uppercase tracking-wider">Оқиға сипаттамасы:</span>
                <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedIncident.description}
                </p>
                <div className="pt-2 text-slate-500 font-mono flex items-center gap-3">
                  <span>📍 {selectedIncident.location}</span>
                  <span>⏰ {new Date(selectedIncident.datetime).toLocaleString()}</span>
                </div>
                {selectedIncident.media_url && (
                  <div className="pt-2">
                    <a
                      href={selectedIncident.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                    >
                      <span>📎 Тіркелген медиа сілтемесін ашу</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Form to update Status, Priority, and Internal Admin Notes */}
              <form onSubmit={handleSaveIncident} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Өңдеу мәртебесі:
                    </label>
                    <select
                      value={incidentEditStatus}
                      onChange={(e) => setIncidentEditStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="Жаңа">Жаңа (Новое)</option>
                      <option value="Қаралуда">Қаралуда (В обработке)</option>
                      <option value="Орындалды">Орындалды (Завершено)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Басымдық деңгейі:
                    </label>
                    <select
                      value={incidentEditPriority}
                      onChange={(e) => setIncidentEditPriority(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="Жоғары">Жоғары (Высокий)</option>
                      <option value="Орташа">Орташа (Средний)</option>
                      <option value="Төмен">Төмен (Низкий)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Әкімшінің ішкі түсіндірме жазбасы / Қабылданған шаралар:
                  </label>
                  <textarea
                    rows={3}
                    value={incidentEditNotes}
                    onChange={(e) => setIncidentEditNotes(e.target.value)}
                    placeholder="Қауіпсіздік қызметінің әрекеттері, қабылданған шаралар немесе шешімдер..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs font-medium text-slate-900 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteIncident(selectedIncident.id)}
                    className="px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold cursor-pointer"
                  >
                    Өшіру
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIncident(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Жабу
                    </button>
                    <button
                      type="submit"
                      disabled={incidentSaving}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
                    >
                      {incidentSaving ? 'Сақталуда...' : 'Мәртебені сақтау'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TAB 3: EMERGENCY ALARMS (SOS) */}
      {activeTab === 'sos' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sosAlerts.map((alert) => {
              const isActive = alert.status === 'Белсенді';
              return (
                <div 
                  key={alert.id} 
                  className={`bg-white rounded-3xl p-6 shadow-sm border relative overflow-hidden transition-all ${
                    isActive ? 'border-red-300 ring-2 ring-red-400/20' : 'border-slate-200'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-2.5 h-full ${isActive ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <Siren className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-950 text-base">Шұғыл Дабыл (SOS)</h3>
                        <p className="text-slate-400 text-xs font-mono">ID: #{alert.id}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteSos(alert.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Өшіру"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs font-semibold text-slate-700 bg-slate-50 p-3.5 rounded-2xl mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{alert.location || 'Басты ғимарат'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-600">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-400">Мәртебесі:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        isActive ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alert.status || (isActive ? 'Белсенді Дабыл!' : 'Қаралды / Орындалды')}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <button
                      onClick={() => handleResolveSos(alert.id)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Қаралды деп белгілеу
                    </button>
                  ) : (
                    <div className="text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl">
                      ✓ Орындалды / Қаралған
                    </div>
                  )}
                </div>
              );
            })}
            {sosAlerts.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center text-slate-500 font-bold border border-slate-100">
                Тіркелген дабыл сигналдары жоқ.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SAFETY RULES DOWNLOADS REGISTRY */}
      {activeTab === 'downloads' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchDownloads}
                onChange={(e) => setSearchDownloads(e.target.value)}
                placeholder="Студент аты немесе тобы бойынша іздеу..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 px-2 shrink-0">
              Табылды: {filteredDownloads.length} жазба
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                    <th className="p-4">№</th>
                    <th className="p-4">Студенттің аты-жөні</th>
                    <th className="p-4">Оқу тобы / Мамандығы</th>
                    <th className="p-4">Билет №</th>
                    <th className="p-4">Тілі</th>
                    <th className="p-4">Қол қойылған күні</th>
                    <th className="p-4">Тіркелген уақыты</th>
                    <th className="p-4">Мәртебесі</th>
                    <th className="p-4 text-right">Әрекет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-xs text-slate-700">
                  {filteredDownloads.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-400 font-mono font-bold">#{item.id}</td>
                      <td className="p-4 font-bold text-slate-900">{item.name}</td>
                      <td className="p-4 text-slate-800 font-semibold">{item.group_name}</td>
                      <td className="p-4 text-slate-500 font-mono">{item.ticket_number || '-'}</td>
                      <td className="p-4 uppercase font-bold text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {item.language}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{item.sign_date || '-'}</td>
                      <td className="p-4 text-slate-500 text-[11px]">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ресми танысты (Сандық қол)
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteDownload(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Жазбаны өшіру"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDownloads.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500 font-bold">
                        Қауіпсіздік ережелерін жүктеген студенттер тіркелмеген.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS & CONTENT MANAGEMENT */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Колледждің ресми хабарламалары</h3>
              <p className="text-xs text-slate-500">Студенттер мен оқытушыларға арналған жаңалықтар мен ескертулер</p>
            </div>
            <button
              onClick={() => setShowNewNoticeModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Жаңа хабарлама қосу</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((n) => {
              const isActive = n.is_active === 1;
              return (
                <div key={n.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        n.type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {n.type} • {n.priority}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-2">{n.title_kk}</h4>
                      {n.title_ru && <p className="text-xs text-slate-500 font-medium">RU: {n.title_ru}</p>}
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleNotice(n.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isActive ? 'Жарияланған' : 'Жасырын'}
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(n.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl">
                    {n.content_kk}
                  </p>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Күні: {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW NOTICE MODAL */}
      <AnimatePresence>
        {showNewNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-950">Жаңа ресми хабарлама жариялау</h3>
                <button
                  onClick={() => setShowNewNoticeModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Тақырыбы (Қазақша) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={noticeForm.title_kk}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title_kk: e.target.value })}
                    placeholder="Мысалы: Жоспарлы өрт оқу-жаттығуы"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Тақырыбы (Русский):
                  </label>
                  <input
                    type="text"
                    value={noticeForm.title_ru}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title_ru: e.target.value })}
                    placeholder="Например: Плановая учебная эвакуация"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Мазмұны (Қазақша) <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={noticeForm.content_kk}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content_kk: e.target.value })}
                    placeholder="Хабарламаның толық мәтіні..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Содержание (Русский):
                  </label>
                  <textarea
                    rows={3}
                    value={noticeForm.content_ru}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content_ru: e.target.value })}
                    placeholder="Текст оповещения..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Хабарлама түрі:
                    </label>
                    <select
                      value={noticeForm.type}
                      onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    >
                      <option value="info">Ақпараттық (Info)</option>
                      <option value="warning">Ескерту (Warning)</option>
                      <option value="success">Аяқталды (Success)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Басымдық:
                    </label>
                    <select
                      value={noticeForm.priority}
                      onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    >
                      <option value="normal">Қалыпты (Normal)</option>
                      <option value="high">Жоғары (High)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewNoticeModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Бас тарту
                  </button>
                  <button
                    type="submit"
                    disabled={noticeSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md"
                  >
                    {noticeSubmitting ? 'Жариялануда...' : 'Жариялау'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TAB 6: CCTV SURVEILLANCE EMBEDDED IN ADMIN */}
      {activeTab === 'cctv' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-bold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Қорғалған аймақ: Бейнебақылау модулі тек авторизацияланған әкімшілерге қолжетімді.</span>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] uppercase font-black">
              Authorized SOC
            </span>
          </div>

          <CCTV />
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-black text-slate-950">Әкімшілер әрекеттерінің журналы</h3>
            <span className="text-xs font-mono text-slate-400">Соңғы {adminLogs.length} жазба</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {adminLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="font-extrabold text-slate-900 mr-2">{log.action}:</span>
                  <span className="text-slate-600">{log.details}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {adminLogs.length === 0 && (
              <p className="py-8 text-center text-slate-400 font-medium">Әзірге журналда жазбалар жоқ</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function Admin() {
  const [authed, setAuthed] = useState(() => !!getAdminPassword());
  const [username, setUsername] = useState('admin');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const onUnauthorized = () => { 
      setAuthed(false); 
      setError('Сессия аяқталды немесе кіру деректері қате.'); 
    };
    window.addEventListener('admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('admin-unauthorized', onUnauthorized);
  }, []);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPw = pw.trim();

    if (!cleanUser) {
      setError('Логинді енгізіңіз (әдепкі: admin)');
      setChecking(false);
      return;
    }

    if (!cleanPw) {
      setError('Құпия сөзді енгізіңіз');
      setChecking(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/check', { 
        headers: { 
          'x-admin-password': cleanPw 
        } 
      });

      if (res.ok) {
        setAdminPassword(cleanPw);
        setAuthed(true);
        setPw('');
        setError('');
      } else if (res.status === 503) {
        setError('Серверде ADMIN_PASSWORD бапталмаған.');
      } else {
        setError('Логин немесе құпия сөз қате. Қайталап көріңіз.');
      }
    } catch {
      setError('Серверге қосылу мүмкін болмады. Байланысты тексеріңіз.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    clearAdminPassword();
    setAuthed(false);
    setPw('');
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Қауіпсіздік Басқару Орталығы</h2>
          <p className="text-xs text-slate-500 font-medium">Семей «Қайнар» жоғары колледжінің қызметтік басқару панелі</p>
        </div>

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Әкімші логині / Логин:</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-slate-800 transition-all bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Құпия сөз / Пароль:</span>
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Құпия сөзді енгізіңіз..."
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={checking || !pw}
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition-all"
          >
            {checking ? 'Тексерілуде...' : 'Жүйеге кіру'}
          </button>
        </form>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 text-center font-medium leading-relaxed space-y-1">
          <div>💡 Логин: <strong className="text-slate-900 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">admin</strong></div>
          <div>Құпия сөз / Пароль: <strong className="text-slate-900 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">admin123</strong></div>
        </div>
      </div>
    );
  }

  return <AdminPanel onLogout={handleLogout} />;
}
