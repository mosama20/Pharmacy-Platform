import React, { useState, useEffect } from 'react';
import { X, Edit3, Tag, DollarSign, Layers, Save, Package } from 'lucide-react';
import { ImageUploadInput } from '../../common/ImageUploadInput';

export const EditProductModal = ({
  isOpen,
  onClose,
  product,
  categories = [],
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    activeIngredient: '',
    category: '',
    subCategory: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    isPrescriptionRequired: false,
    isHotDeal: false,
    descriptionAr: '',
    dosage: '',
    image: '',
  });
  const [customCategory, setCustomCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        nameAr: product.nameAr || '',
        nameEn: product.nameEn || '',
        activeIngredient: product.activeIngredient || '',
        category: product.category || 'الأدوية (Medications)',
        subCategory: product.subCategory || 'عام',
        price: Number(product.price) || 0,
        originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        isPrescriptionRequired: Boolean(product.isPrescriptionRequired),
        isHotDeal: Boolean(product.isHotDeal),
        descriptionAr: product.descriptionAr || '',
        dosage: product.dosage || '',
        image: product.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      });
      setCustomCategory(false);
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(product.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تعديل بيانات المنتج');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = Array.isArray(categories) && categories.length > 0
    ? categories.map((c) => (typeof c === 'string' ? c : c.name)).filter((n) => n && n !== 'الكل' && !n.includes('Big Save'))
    : ['الأدوية (Medications)', 'العناية بالبشرة (Skin Care)', 'الفيتامينات والمكملات (Vitamins)', 'الأم والطفل (Mom & Baby)', 'المستلزمات الطبية (Health Care Devices)'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-cairo">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50 via-emerald-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base font-tajawal">
                تعديل بيانات المنتج
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {product.id}
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

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المنتج (بالعربية):
              </label>
              <input
                type="text"
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الاسم بالإنجليزية:
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              المادة الفعالة (Active Ingredient):
            </label>
            <input
              type="text"
              placeholder="مثال: Paracetamol 500mg"
              value={formData.activeIngredient}
              onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  القسم الرئيسي:
                </label>
                <button
                  type="button"
                  onClick={() => setCustomCategory(!customCategory)}
                  className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                >
                  {customCategory ? 'اختيار من القائمة' : '+ كتابة قسم جديد'}
                </button>
              </div>

              {customCategory ? (
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم القسم الرئيسي الجديد..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-teal-500 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {categoryOptions.map((catName) => (
                    <option key={catName} value={catName}>
                      {catName}
                    </option>
                  ))}
                  {formData.category && !categoryOptions.includes(formData.category) && (
                    <option value={formData.category}>{formData.category}</option>
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                التصنيف الفرعي:
              </label>
              <input
                type="text"
                placeholder="مثال: مسكنات، ترطيب، إلخ"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                سعر البيع (ج.م):
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-emerald-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                السعر قبل الخصم:
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الكمية بالمخزن:
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.isPrescriptionRequired}
                onChange={(e) => setFormData({ ...formData, isPrescriptionRequired: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                يتطلب روشتة طبية (Rx)
              </span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.isHotDeal}
                onChange={(e) => setFormData({ ...formData, isHotDeal: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                إدراجه في عروض التوفير
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وصف مختصر للمنتج:
            </label>
            <textarea
              rows={2}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <ImageUploadInput
              label="رابط صورة المنتج (أو رفع صورة من الجهاز)"
              value={formData.image}
              onChange={(val) => setFormData({ ...formData, image: val })}
              placeholder="https://..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
