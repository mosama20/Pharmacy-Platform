import React from 'react';
import { Save, Globe, Palette, Sparkles } from 'lucide-react';
import { ImageUploadInput } from '../../common/ImageUploadInput';

export const CmsIdentitySection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              هوية المنصة والاسم والشعار
            </h3>
            <p className="text-xs text-slate-400">
              التحكم في اسم الموقع، الشعار الرسمي، ووصف المنصة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم المنصة / الصيدلية (بالعربية):
            </label>
            <input
              type="text"
              required
              value={settingsForm.websiteName}
              onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              الشعار اللفظي (Slogan / Tagline):
            </label>
            <input
              type="text"
              value={settingsForm.brandTagline}
              onChange={(e) => setSettingsForm({ ...settingsForm, brandTagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            وصف المنصة والرسالة التعريفية:
          </label>
          <textarea
            rows="3"
            value={settingsForm.brandDescription}
            onChange={(e) => setSettingsForm({ ...settingsForm, brandDescription: e.target.value })}
            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <ImageUploadInput
              label="شعار المنصة الرسمي (Website Logo):"
              placeholder="ارفع شعار الصيدلية من جهازك بصيغة PNG أو WEBP"
              value={settingsForm.logoUrl}
              onChange={(url) => setSettingsForm({ ...settingsForm, logoUrl: url })}
              folder="logo"
              previewHeight="h-20"
            />
          </div>

          <div>
            <ImageUploadInput
              label="أيقونة المتصفح المصغرة (Favicon):"
              placeholder="ارفع أيقونة الموقع المصغرة (.ico أو .png أو .svg)"
              value={settingsForm.faviconUrl}
              onChange={(url) => setSettingsForm({ ...settingsForm, faviconUrl: url })}
              folder="favicon"
              previewHeight="h-14"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            الحرف الرمزي للشعار النصي (Text Logo - يظهر إذا تعذر تحميل الصورة):
          </label>
          <input
            type="text"
            value={settingsForm.logoText}
            onChange={(e) => setSettingsForm({ ...settingsForm, logoText: e.target.value })}
            className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق هوية المنصة</span>
          </button>
        </div>
      </div>
    </form>
  );
};
