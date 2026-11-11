import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, X, Send, Sparkles, AlertTriangle, ShieldCheck, 
  RotateCcw, ChevronRight, MessageSquare, Flame, Map, PhoneCall, FileText 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

const quickPromptsDict = {
  kk: [
    { label: 'Өрт кезінде не істеу керек?', icon: Flame },
    { label: 'Эвакуация жоспары және қабаттар', icon: Map },
    { label: 'Колледж маңындағы жол ережелері', icon: ShieldCheck },
    { label: 'Шұғыл байланыс нөмірлері', icon: PhoneCall },
    { label: 'Қауіпсіздік ережелері сертификатын жүктеу', icon: FileText },
  ],
  ru: [
    { label: 'Действия при пожаре в колледже', icon: Flame },
    { label: 'Планы эвакуации по этажам', icon: Map },
    { label: 'Дорожная безопасность и парковка', icon: ShieldCheck },
    { label: 'Экстренные телефоны колледжа', icon: PhoneCall },
    { label: 'Как получить сертификат правил', icon: FileText },
  ],
  en: [
    { label: 'Action protocol during fire emergency', icon: Flame },
    { label: 'Building evacuation floor maps', icon: Map },
    { label: 'Campus road safety guidelines', icon: ShieldCheck },
    { label: 'Emergency telephone hotlines', icon: PhoneCall },
    { label: 'Download signed safety certificate', icon: FileText },
  ]
};

export function AIAssistantModal() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting = lang === 'en'
    ? 'Hello! I am the official AI Security Assistant of Kainar Higher College. How can I help you regarding fire prevention, floor evacuation plans, road safety, or emergency contacts?'
    : lang === 'ru'
    ? 'Здравствуйте! Я интеллектуальный цифровой помощник по безопасности колледжа «Кайнар». Готов ответить на любые вопросы о правилах пожарной безопасности, эвакуации, дорожном движении и экстренных службах.'
    : 'Сәлеметсіз бе! Мен «Қайнар» жоғары колледжінің цифрлық қауіпсіздік көмекшісімін. Өрт қауіпсіздігі, қабаттардан эвакуациялану, жол ережелері немесе шұғыл нөмірлер туралы сұрағыңызға қуана жауап беремін.';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Update greeting on language switch if only initial message is present
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].sender === 'ai') {
        return [{
          id: 'init-1',
          sender: 'ai',
          text: initialGreeting,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: data.response || 'Кешіріңіз, жауап дайындау кезінде кідіріс болды.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error('AI chat error:', e);
      const errMsg: Message = {
        id: 'err-' + Date.now(),
        sender: 'ai',
        text: lang === 'en'
          ? 'Emergency reminder: During imminent danger, please call 112 or 101 immediately! The AI assistant operates as an advisory tool.'
          : lang === 'ru'
          ? 'Напоминание: При прямой угрозе безопасности немедленно звоните 112 или 101! AI-помощник работает как справочная система.'
          : 'Қауіпсіздік ескертпесі: Шұғыл қауіп орын алса, дереу 112 немесе 101 нөміріне қоңырау шалыңыз! AI жүйесі кеңес беру мақсатында қызмет етеді.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'init-new',
        sender: 'ai',
        text: initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const prompts = quickPromptsDict[lang] || quickPromptsDict['kk'];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative group bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-2xl shadow-blue-600/40 border border-blue-400/30 flex items-center gap-3 cursor-pointer"
          aria-label="Open AI Security Assistant"
        >
          <span className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-blue-400 animate-ping opacity-75" />
            <Bot className="w-6 h-6 text-white relative z-10" />
          </span>
          <div className="hidden sm:block text-left pr-1">
            <span className="block text-[10px] font-black uppercase tracking-wider text-blue-200">Smart Campus AI</span>
            <span className="block text-xs font-black tracking-tight">Қауіпсіздік көмекшісі</span>
          </div>
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[95vw] sm:w-[460px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md border border-white/20">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-white tracking-tight">Қайнар AI Көмекшісі</h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-blue-300 font-medium">Зияткерлік қауіпсіздік кеңесшісі • 24/7</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  title="Журналды тазалау"
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
              {messages.map((m) => {
                const isAi = m.sender === 'ai';
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                        isAi
                          ? 'bg-white text-slate-800 border border-slate-200/80 font-medium'
                          : 'bg-blue-600 text-white font-semibold'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      <div
                        className={`text-[9px] mt-1.5 font-mono text-right ${
                          isAi ? 'text-slate-400' : 'text-blue-100'
                        }`}
                      >
                        {m.time}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {loading && (
                <div className="flex gap-2.5 items-center text-slate-500 text-xs font-semibold p-2 bg-white rounded-2xl border border-slate-200/80 w-fit">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span>AI жауабы дайындалуда...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            <div className="bg-white border-t border-slate-200/70 p-2.5 px-3 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
              {prompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.label)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-colors border border-slate-200/60 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Icon className="w-3 h-3 text-blue-600" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Ask about safety, evacuation or rules...'
                    : lang === 'ru'
                    ? 'Задайте вопрос о правилах или эвакуации...'
                    : 'Қауіпсіздік немесе ережелер туралы сұраңыз...'
                }
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
