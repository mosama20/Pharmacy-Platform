import React from 'react';
import { Save, Share2, Globe } from 'lucide-react';

export const CmsSocialSection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  const handleSocialChange = (network, val) => {
    setSettingsForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: val,
      },
    }));
  };

  const platforms = [
    { key: 'facebook', label: 'فيسبوك (Facebook URL)', placeholder: 'https://facebook.com/your-page' },
    { key: 'instagram', label: 'إنستجرام (Instagram URL)', placeholder: 'https://instagram.com/your-account' },
    { key: 'twitter', label: 'إكس / تويتر (X Twitter URL)', placeholder: 'https://twitter.com/your-handle' },
    { key: 'linkedin', label: 'لينكد إن (LinkedIn URL)', placeholder: 'https://linkedin.com/company/your-company' },
    { key: 'youtube', label: 'يوتيوب (YouTube URL)', placeholder: 'https://youtube.com/@your-channel' },
    { key: 'tiktok', label: 'تيك توك (TikTok URL)', placeholder: 'https://tiktok.com/@your-account' },
  ];

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              حسابات التواصل الاجتماعي (Social Media)
            </h3>
            <p className="text-xs text-slate-400">
              تظهر هذه الروابط في أسفل الموقع وشريط التواصل
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((p) => (
            <div key={p.key}>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {p.label}:
              </label>
              <input
                type="url"
                placeholder={p.placeholder}
                value={settingsForm.socialLinks?.[p.key] || ''}
                onChange={(e) => handleSocialChange(p.key, e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ روابط السوشيال ميديا</span>
          </button>
        </div>
      </div>
    </form>
  );
};
