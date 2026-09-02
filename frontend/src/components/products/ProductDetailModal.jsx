import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  AlertTriangle,
  Pill,
  Clock,
  Sparkles,
  ArrowRightLeft,
  Truck,
  Loader2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

export const ProductDetailModal = ({ product, onClose, onSelectAlternative }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(product);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!product) {
      setDetailedProduct(null);
      return;
    }
    setDetailedProduct(product);
    setQuantity(1);

    // Fetch full product details including alternative products
    let isMounted = true;
    setLoadingDetails(true);
    api.getProductById(product.id)
      .then((data) => {
        if (isMounted && data) {
          setDetailedProduct(data);
        }
      })
      .catch((err) => console.warn('Could not fetch detailed product info:', err))
      .finally(() => {
        if (isMounted) setLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product]);

  if (!product && !detailedProduct) return null;

  const currentProduct = detailedProduct || product;

  const handleAddToCart = () => {
    addToCart(currentProduct, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>{currentProduct.category}</span>
            <span>›</span>
            <span>{currentProduct.subCategory || 'عام'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Box */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center relative">
              {currentProduct.isPrescriptionRequired && (
                <span className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  يتطلب وصفة طبية
                </span>
              )}
              <img
                src={currentProduct.image}
                alt={currentProduct.nameAr}
                className="max-h-60 object-contain hover:scale-105 transition-transform"
              />
            </div>

            {/* Product Meta */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {currentProduct.nameAr}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {currentProduct.nameEn}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{currentProduct.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({currentProduct.reviewCount || 45} تقييم)
                    </span>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    متوفر في المخزون ({currentProduct.stock} علبة)
                  </span>
                </div>
              </div>

              {/* Active Ingredient Box */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  المادة الفعالة (Active Ingredient):
                </span>
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-100">
                  {currentProduct.activeIngredient}
                </span>
              </div>

              {/* Price & Quantity & Add */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-bold">السعر:</span>
                  <div className="text-left">
                    <span className="font-black text-2xl text-emerald-600 font-mono">
                      {currentProduct.price}
                    </span>
                    <span className="text-xs font-bold text-slate-500 mr-1">ج.م</span>
                    {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                      <span className="block text-xs text-slate-400 line-through font-mono">
                        {currentProduct.originalPrice} ج.م
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-slate-500 hover:text-red-500 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-bold font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-700 text-white shadow-emerald-700/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تمت الإضافة للسلة</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>أضف إلى سلة المشتريات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Drug Leaflet & Usage Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>دواعي الاستعمال والوصف:</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentProduct.descriptionAr || 'علاج معتمد وفق المعايير الطبية لوزارة الصحة المصرية.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>الجرعة الموصى بها وطريقة الاستخدام:</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentProduct.dosage || 'حسب إرشادات الطبيب المعالج أو الصيدلي.'}
              </p>
            </div>
          </div>

          {/* Generic Alternatives Section */}
          {currentProduct.alternativeProducts && currentProduct.alternativeProducts.length > 0 && (
            <div className="p-4 rounded-3xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-xs">
                  <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                  <span>بدائل متطابقة بنفس المادة الفعالة (Generics):</span>
                </div>
                <span className="text-[10px] text-teal-600 font-bold">
                  بدائل آمنة وبأسعار اقتصادية
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentProduct.alternativeProducts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => onSelectAlternative(alt)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-teal-500 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={alt.image}
                        alt=""
                        className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-white"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600">
                          {alt.nameAr}
                        </h5>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold">
                          {alt.price} ج.م
                        </span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-teal-50 group-hover:bg-teal-600 group-hover:text-white text-teal-700 text-xs font-bold transition-colors cursor-pointer">
                      عرض البديل
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
