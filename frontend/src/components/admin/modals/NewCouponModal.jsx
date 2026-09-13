import React, { useState } from 'react';
import { X, Tag, Percent, Calendar, DollarSign, Layers, Truck, Sparkles, CheckCircle2 } from 'lucide-react';

export const NewCouponModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 15,
    minOrderValue: 200,
    maxDiscount: 100,
    expiresAt: '2026-12-31',
    usageLimit: 500,
    applicableCategory: '',
    isFreeShipping: false,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Fallback category list if none passed
  const availableCategories = categories && categories.length > 0
    ? categories.map((c) => (typeof c === 'string' ? c : c.name || c.slug))
    : [
        'مستحضرات تجميل',
        'العناية بالبشرة',
        'العناية بالشعر',
        'فيتامينات ومكملات غذائية',
        'أدوية وعلاجات',
        'صحة الأم والطفل',
        'أجهزة ومستلزمات طبية',
        'العناية الشخصية',
      ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountPercentage: Number(formData.discountPercentage) || 0,
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscount: Number(formData.maxDiscount) || 0,
        usageLimit: Number(formData.usageLimit) || 100,
        applicableCategory: formData.applicableCategory || undefined,
        isFreeShipping: Boolean(formData.isFreeShipping),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-cairo">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                إنشاء كود خصم جديد (Advanced Promo)
              </h3>
              <p className="text-xs text-slate-400">
                تحديد نسبة الخصم، القسم المخصص، وإلغاء رسوم الشحن
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-right">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              كود الكوبون (رمز الخصم):
            </label>
            <input
              type="text"
              required
              placeholder="مثال: BEAUTY20 أو FREESHIP"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-black text-emerald-600 focus:outline-none focus:border-emerald-500 uppercase tracking-widest text-center"
            />
          </div>

          {/* Category Restriction Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>تخصيص الكوبون لقسم معين (اختياري):</span>
              </label>
              {formData.applicableCategory && (
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg font-bold">
                  كوبون مخصص
                </span>
              )}
            </div>
            <select
              value={formData.applicableCategory}
              onChange={(e) => setFormData({ ...formData, applicableCategory: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">جميع الأقسام والمنتجات (بدون حصر)</option>
              {availableCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  قسم: {cat}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              إذا اخترت قسماً محدداً (مثل مستحضرات التجميل)، فلن يعمل الكوبون إلا على منتجات هذا القسم فقط داخل السلة.
            </p>
          </div>

          {/* Free Shipping Checkbox Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors">
            <input
              type="checkbox"
              id="isFreeShipping"
              checked={formData.isFreeShipping}
              onChange={(e) => setFormData({ ...formData, isFreeShipping: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isFreeShipping" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>كوبون شحن مجاني (إلغاء رسوم التوصيل تماماً)</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                عند تفعيل هذا الخيار، سيتم خصم رسوم الشحن (0 ج.م) تلقائياً عند إدخال العميل لهذا الكوبون.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نسبة الخصم (%):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {formData.isFreeShipping ? 'يمكنك تركه 0 للاكتفاء بالشحن المجاني' : 'نسبة الخصم المئوية'}
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                أقصى قيمة للخصم (ج.م):
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الحد الأدنى للطلب (ج.م):
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الحد الأقصى للاستخدام:
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              تاريخ انتهاء الصلاحية:
            </label>
            <input
              type="date"
              required
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري التفعيل...' : 'تفعيل الكوبون للعملاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
