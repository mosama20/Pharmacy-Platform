import React from 'react';
import { Save, Search, Globe, Eye } from 'lucide-react';

export const CmsSeoSection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              محركات البحث وتهيئة الـ SEO
            </h3>
            <p className="text-xs text-slate-400">
              إعدادات العناوين والكلمات الدلالية وميتا تاجز لمحركات البحث (Google)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            عنوان الصفحة الرئيسية (SEO Meta Title):
          </label>
          <input
            type="text"
            value={settingsForm.seoTitle}
            onChange={(e) => setSettingsForm({ ...settingsForm, seoTitle: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            وصف محركات البحث (Meta Description):
          </label>
          <textarea
            rows="3"
            value={settingsForm.seoDescription}
            onChange={(e) => setSettingsForm({ ...settingsForm, seoDescription: e.target.value })}
            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            الكلمات المفتاحية (Meta Keywords):
          </label>
          <input
            type="text"
            value={settingsForm.seoKeywords}
            onChange={(e) => setSettingsForm({ ...settingsForm, seoKeywords: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Live Google Search Preview */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة الظهور في نتائج بحث Google:</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-mono block">https://pharmacy-store.com</span>
            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              {settingsForm.seoTitle || settingsForm.websiteName || 'الصيدلية الذكية | صيدليتك أونلاين'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
              {settingsForm.seoDescription || settingsForm.brandDescription || 'اطلب كل احتياجاتك من الصيدلية أونلاين مع أسرع خدمة توصيل.'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات الـ SEO</span>
          </button>
        </div>
      </div>
    </form>
  );
};
