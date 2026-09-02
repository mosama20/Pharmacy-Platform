import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Pill,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCms } from '../../context/CmsContext';
import { api } from '../../services/api';

export const PharmacistBot = () => {
  const { cartItems, addToCart, setIsCartOpen } = useCart();
  const { settings } = useCms();
  const storeName = settings?.websiteName || 'الصيدلية الذكية';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'bot',
      text: `أهلاً بك! أنا الصيدلي الذكي (AI Pharmacist)، كيف يمكنني مساعدتك اليوم؟\n\nيمكنك سؤالي عن: بدائل الأدوية المتطابقة، مواعيد وجرعات العلاج، التداخلات الدوائية، أو نصائح الاستخدام.`,
      time: 'الآن',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickQuestions = [
    'ما هو بديل أوجمنتين 1 جم؟',
    'فحص التداخلات الدوائية لأدويتي',
    'جرعة البانادول إكسترا الآمنة',
    'أفضل غسول للبشرة الدهنية المعرضة للحبوب',
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await api.consultPharmacistAi({
        message: text,
        cartProductIds: cartItems.map((item) => item.productId),
      });

      const botMsg = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: response.reply,
        interactionAlert: response.interactionAlert,
        recommendedProducts: response.recommendedProducts || [],
        time: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: 'bot_err_' + Date.now(),
        sender: 'bot',
        text: `أهلاً بك! الصيدلي الذكي في ${storeName} متاح دائماً لخدمتك. يمكنك طلب الدواء مباشرة وسيقوم الصيدلي بمراجعة الروشتة والتواصل معك.`,
        time: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 p-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-white/20 group"
          title={`تحدث مع الصيدلي الذكي - ${storeName}`}
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <span className="font-bold text-sm hidden sm:inline-block">
            الصيدلي الذكي
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
            AI 24/7
          </span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-full max-w-sm sm:max-w-md h-[550px] max-h-[85vh] rounded-3xl glass-card shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  الصيدلي الذكي
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <p className="text-[11px] text-emerald-100">
                  استشارات دوائية وتفاعلات وبدائل موفرة
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-xs border border-slate-200/60 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Interaction Safety Alert */}
                  {msg.interactionAlert && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">تنبيه أمان دوائي:</strong>
                        <span>{msg.interactionAlert}</span>
                      </div>
                    </div>
                  )}

                  {/* Recommended Products Pills */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        الأدوية والبدائل المقترحة:
                      </span>
                      <div className="space-y-1.5">
                        {msg.recommendedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img
                                src={prod.image}
                                alt={prod.nameAr}
                                className="w-8 h-8 rounded-lg object-cover bg-white shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                  {prod.nameAr}
                                </p>
                                <p className="text-[10px] text-emerald-600 font-mono font-bold">
                                  {prod.price} ج.م
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                addToCart(prod, 1);
                                setIsCartOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 shrink-0 flex items-center gap-1 shadow-xs"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>إضافة</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1.5 font-mono ${
                      msg.sender === 'user'
                        ? 'text-emerald-200 text-left'
                        : 'text-slate-400 text-right'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Bot className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="animate-pulse">الصيدلي الذكي يكتب الآن...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب استفسارك الصيدلي أو اسم الدواء..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
