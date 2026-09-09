import React, { useState } from 'react';
import {
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Server,
  Key,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../../services/api';

export const CmsNotificationsSection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramResult, setTelegramResult] = useState(null);

  const [testingEmail, setTestingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramResult(null);
    try {
      const res = await api.testTelegramNotification(
        settingsForm.telegramBotToken,
        settingsForm.telegramChatId,
      );
      setTelegramResult({ success: true, message: res.message || 'تم إرسال رسالة التليجرام بنجاح!' });
    } catch (err) {
      setTelegramResult({
        success: false,
        message: err.message || 'فشل الإرسال. تأكد من فتح محادثة مع البوت والضغط على Start أولاً.',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestEmail = async () => {
    const emailToTest = testEmailAddress || settingsForm.adminNotificationEmail;
    if (!emailToTest) {
      setEmailResult({ success: false, message: 'يرجى كتابة البريد الإلكتروني المراد اختباره' });
      return;
    }

    setTestingEmail(true);
    setEmailResult(null);
    try {
      const res = await api.testEmailNotification(emailToTest);
      setEmailResult({ success: true, message: res.message || 'تم إرسال البريد بنجاح!' });
    } catch (err) {
      setEmailResult({ success: false, message: err.message || 'فشل إرسال البريد' });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* 1. TELEGRAM BOT NOTIFICATIONS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>إشعارات بوت التليجرام (Telegram Bot)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  تنبيه فوري ومجاني
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إرسال تفاصيل الأوردرات الجديدة وفواتيرها وصور الروشتات مباشرة إلى هاتفك المحمول أو جروب الصيدلية
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settingsForm.telegramNotificationsEnabled ?? true}
              onChange={(e) =>
                setSettingsForm((prev) => ({
                  ...prev,
                  telegramNotificationsEnabled: e.target.checked,
                }))
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              تفعيل إشعارات التليجرام
            </span>
          </label>
        </div>

        {/* Quick Instructions & Bot Link */}
        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 text-sky-950 dark:text-sky-200">
            <div className="font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
              <HelpCircle className="w-4 h-4" />
              <span>خطوة هامة لتفعيل وصول الرسائل لهاتفك:</span>
            </div>
            <p className="text-[11px] text-sky-800/90 dark:text-sky-300/90 leading-relaxed">
              تليجرام يشترط أن تفتح محادثة البوت مرة واحدة وتضغط <strong>Start</strong> حتى يسمح له بإرسال الرسائل لحسابك.
            </p>
          </div>
          <a
            href="https://t.me/dr_shimaa_pharmacy_orders_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            <span>فتح البوت والضغط على Start</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              توكن البوت (Telegram Bot Token)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                dir="ltr"
                value={settingsForm.telegramBotToken || ''}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, telegramBotToken: e.target.value }))
                }
                placeholder="مثال: 8816040899:AAHn5t7WDimz..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              الرمز السري المستخرج من @BotFather عند إنشاء البوت
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              معرف الحساب أو الجروب (Chat ID)
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                dir="ltr"
                value={settingsForm.telegramChatId || ''}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, telegramChatId: e.target.value }))
                }
                placeholder="مثال: 8800720269"
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              رقم حسابك أو رقم جروب الصيدلية المستخرج من @userinfobot
            </span>
          </div>
        </div>

        {/* Telegram Test Button & Feedback */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={testingTelegram || !settingsForm.telegramBotToken || !settingsForm.telegramChatId}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
          >
            {testingTelegram ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري اختبار الإرسال للتليجرام...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>إرسال رسالة تليجرام تجريبية الآن 🔔</span>
              </>
            )}
          </button>

          {telegramResult && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                telegramResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {telegramResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{telegramResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. EMAIL NOTIFICATIONS (SMTP) CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                إشعارات البريد الإلكتروني (Email & SMTP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إرسال فواتير الشراء الرسمية وتأكيدات الروشتات للعميل وتنبيه بريدي لإدارة الصيدلية
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settingsForm.emailNotificationsEnabled ?? true}
              onChange={(e) =>
                setSettingsForm((prev) => ({
                  ...prev,
                  emailNotificationsEnabled: e.target.checked,
                }))
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              تفعيل إشعارات البريد
            </span>
          </label>
        </div>

        {/* Form Inputs for SMTP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              خادم البريد (SMTP Host)
            </label>
            <input
              type="text"
              dir="ltr"
              value={settingsForm.smtpHost || ''}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, smtpHost: e.target.value }))}
              placeholder="smtp.gmail.com أو mail.drshimaa.com"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              المنفذ (Port)
            </label>
            <input
              type="number"
              dir="ltr"
              value={settingsForm.smtpPort || 587}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, smtpPort: Number(e.target.value) }))}
              placeholder="587 أو 465"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المستخدم (SMTP User)
            </label>
            <input
              type="text"
              dir="ltr"
              value={settingsForm.smtpUser || ''}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, smtpUser: e.target.value }))}
              placeholder="orders@drshimaa.com"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور (SMTP Password)
            </label>
            <input
              type="password"
              dir="ltr"
              value={settingsForm.smtpPass || ''}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, smtpPass: e.target.value }))}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم وعنوان المرسل (Sender Name)
            </label>
            <input
              type="text"
              value={settingsForm.smtpFrom || 'صيدلية د. شيماء <orders@drshimaa.com>'}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, smtpFrom: e.target.value }))}
              placeholder="صيدلية د. شيماء <orders@drshimaa.com>"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              بريد استلام تنبيهات الإدارة
            </label>
            <input
              type="email"
              dir="ltr"
              value={settingsForm.adminNotificationEmail || ''}
              onChange={(e) =>
                setSettingsForm((prev) => ({ ...prev, adminNotificationEmail: e.target.value }))
              }
              placeholder="admin@drshimaa.com"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Email Test Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="email"
              dir="ltr"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="اكتب إيميل تجريبي..."
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono w-52 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail || !settingsForm.smtpHost}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>إرسال بريد تجريبي</span>
            </button>
          </div>

          {emailResult && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                emailResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {emailResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{emailResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onSave}
          className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>حفظ إعدادات الإشعارات والتليجرام</span>
        </button>
      </div>
    </div>
  );
};
