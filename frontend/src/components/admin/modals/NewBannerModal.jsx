import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles, CheckCircle, Palette } from 'lucide-react';
import { ImageUploadInput } from '../../common/ImageUploadInput';

const GRADIENT_THEMES = [
  { id: 'from-emerald-900 via-teal-900 to-slate-900', label: 'أخضر زمردي داكن (Emerald Teal)' },
  { id: 'from-teal-950 via-cyan-950 to-slate-900', label: 'تركواز بحري داكن (Deep Cyan)' },
  { id: 'from-slate-900 via-indigo-950 to-purple-950', label: 'بنفسجي داكن ملكي (Royal Indigo)' },
  { id: 'from-rose-950 via-red-950 to-slate-900', label: 'أحمر نبيذي عروض (Hot Deals Red)' },
  { id: 'from-amber-950 via-orange-950 to-slate-900', label: 'عنبر وبرتقالي دافئ (Warm Amber)' },
  { id: 'from-blue-950 via-slate-900 to-cyan-950', label: 'أزرق تقني عصري (Modern Blue)' },
];

export const NewBannerModal = ({
  isOpen,
  onClose,
  onSubmit,
  bannerToEdit = null,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tag: 'عرض جديد وحصري',
    bg: 'from-emerald-900 via-teal-900 to-slate-900',
    accent: 'emerald',
    ctaText: 'اطلب الآن',
    actionType: 'upload',
    actionValue: '',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    isActive: true,
    order: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bannerToEdit) {
      setFormData({
        title: bannerToEdit.title || '',
        subtitle: bannerToEdit.subtitle || '',
        tag: bannerToEdit.tag || 'عرض جديد وحصري',
        bg: bannerToEdit.bg || 'from-emerald-900 via-teal-900 to-slate-900',
        accent: bannerToEdit.accent || 'emerald',
        ctaText: bannerToEdit.ctaText || 'اطلب الآن',
        actionType: bannerToEdit.actionType || 'upload',
        actionValue: bannerToEdit.actionValue || '',
        img: bannerToEdit.img || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
        isActive: bannerToEdit.isActive !== false,
        order: bannerToEdit.order || 1,
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        tag: 'عرض جديد وحصري',
        bg: 'from-emerald-900 via-teal-900 to-slate-900',
        accent: 'emerald',
        ctaText: 'اطلب الآن',
        actionType: 'upload',
        actionValue: '',
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        order: 1,
      });
    }
  }, [bannerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData, bannerToEdit?.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(bannerToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isEditing ? 'تعديل البانر والسلايدر' : 'إضافة بانر وسلايدر جديد'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'تحديث بيانات وعروض البانر في السلايدر الرئيسي' : 'إضافة بانر رئيسي للواجهة وتوجيه العملاء'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان البانر الرئيسي:
            </label>
            <input
              type="text"
              required
              placeholder="صيدليتك أونلاين الأسرع في مصر"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              العنوان الفرعي / الوصف:
            </label>
            <input
              type="text"
              required
              placeholder="ارفع الروشتة أو اطلب دواك وهيصلك خلال 30 دقيقة"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                التاج / الشارة الإعلانية:
              </label>
              <input
                type="text"
                placeholder="عرض حصري"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نص الزر (CTA Text):
              </label>
              <input
                type="text"
                required
                placeholder="اطلب الآن"
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع الإجراء عند الضغط:
              </label>
              <select
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="upload">فتح رفع الروشتة</option>
                <option value="refill">فتح الدواء الشهري</option>
                <option value="category">التوجيه لقسم معين</option>
                <option value="link">رابط مخصص أو خارجي</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                قيمة التوجيه (اسم القسم أو الرابط):
              </label>
              <input
                type="text"
                placeholder={formData.actionType === 'category' ? 'اسم القسم (مثال: فيتامينات)' : 'رابط / صفحة'}
                value={formData.actionValue}
                onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Background Gradient Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              <span>لون وتدرج خلفية البانر:</span>
            </label>
            <select
              value={formData.bg}
              onChange={(e) => setFormData({ ...formData, bg: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            >
              {GRADIENT_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                تفعيل ظهور البانر في السلايدر
              </span>
              <span className="text-[11px] text-slate-400">
                عند إلغاء التفعيل يتم إخفاء البانر دون حذفه
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div>
            <ImageUploadInput
              label="صورة البانر الترويجي:"
              placeholder="ارفع صورة البانر من جهازك أو اسحبها هنا"
              value={formData.img}
              onChange={(url) => setFormData({ ...formData, img: url })}
              folder="banners"
              previewHeight="h-28"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة البانر للواجهة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
