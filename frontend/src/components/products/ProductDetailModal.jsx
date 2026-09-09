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
  ShoppingCart,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

// Clean subtitle helper to prevent duplicated text
const cleanSubtitle = (en, ar) => {
  if (!en) return '';
  if (en.trim() === ar.trim()) return '';
  const hasEnglish = /[a-zA-Z]/.test(en);
  if (hasEnglish) {
    const match = en.match(/[a-zA-Z0-9\s.,|/&+-]+/g);
    if (match) {
      const cleaned = match.join(' ').trim().replace(/\s+/g, ' ');
      if (cleaned.length > 3) return cleaned;
    }
  }
  return '';
};

export const ProductDetailModal = ({
  product,
  onClose,
  onSelectAlternative,
  onBuyNow,
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState(product);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!product) {
      setDetailedProduct(null);
      return;
    }
    setDetailedProduct(product);
    setQuantity(1);
    setImageError(false);

    // Fetch full product details including alternative products
    let isMounted = true;
    setLoadingDetails(true);
    api
      .getProductById(product.id)
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

  // Lock background body scroll on mobile/desktop when product modal is open
  useEffect(() => {
    if (product || detailedProduct) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [product, detailedProduct]);

  if (!product && !detailedProduct) return null;

  const currentProduct = detailedProduct || product;

  const handleAddToCart = () => {
    addToCart(currentProduct, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(currentProduct, quantity);
    if (onBuyNow) {
      onBuyNow(currentProduct, quantity);
    }
    onClose();
  };

  const subtitle = cleanSubtitle(currentProduct.nameEn, currentProduct.nameAr);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain"
    >
      <div className="w-full max-w-2xl md:max-w-3xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92dvh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-slate-900">
        {/* Sticky Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {currentProduct.category}
            </span>
            <span>›</span>
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {currentProduct.subCategory || 'عام'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body with smooth mobile momentum */}
        <div
          className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-5 flex-1 min-h-0"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Image Container */}
            <div className="relative p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center min-h-[220px]">
              {currentProduct.isPrescriptionRequired && (
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                  <ShieldCheck className="w-3 h-3" />
                  <span>يتطلب وصفة طبية</span>
                </span>
              )}
              {currentProduct.discountPercentage > 0 && (
                <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10">
                  خصم {currentProduct.discountPercentage}%
                </span>
              )}

              {imageError ? (
                <div className="w-32 h-32 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex flex-col items-center justify-center gap-2">
                  <Pill className="w-12 h-12 stroke-1" />
                  <span className="text-[10px] font-bold text-slate-400">صورة الدواء</span>
                </div>
              ) : (
                <img
                  src={currentProduct.image}
                  alt={currentProduct.nameAr}
                  onError={() => setImageError(true)}
                  className="max-h-52 sm:max-h-60 object-contain hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>

            {/* Product Meta Info */}
            <div className="space-y-3.5">
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug font-tajawal">
                  {currentProduct.nameAr}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5 font-medium">
                    {subtitle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2.5 mt-2">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{currentProduct.rating || 4.8}</span>
                    <span className="text-slate-400 font-normal">
                      ({currentProduct.reviewCount || 24} تقييم)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>متوفر في المخزون ({currentProduct.stock || 100} علبة)</span>
                  </span>
                </div>
              </div>

              {/* Active Ingredient Box */}
              {currentProduct.activeIngredient && (
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      المادة الفعالة (Active Ingredient):
                    </span>
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-100">
                      {currentProduct.activeIngredient}
                    </span>
                  </div>
                  <Pill className="w-5 h-5 text-emerald-600/70" />
                </div>
              )}

              {/* Quality Guarantee Note */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دواء أصلي ومعتمد من وزارة الصحة المصرية ومخزن بدرجة حرارة قياسية</span>
              </div>
            </div>
          </div>

          {/* Drug Leaflet & Usage Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>دواعي الاستعمال والوصف:</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {currentProduct.descriptionAr ||
                  'علاج معتمد وفق المعايير الطبية لوزارة الصحة، يوفر فاعلية علاجية عالية.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>الجرعة الموصى بها وطريقة الاستخدام:</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {currentProduct.dosage || 'حسب إرشادات الطبيب المعالج أو الصيدلي المناوب.'}
              </p>
            </div>
          </div>

          {/* Generic Alternatives Section */}
          {currentProduct.alternativeProducts &&
            currentProduct.alternativeProducts.length > 0 && (
              <div className="p-4 rounded-3xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-xs">
                    <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                    <span>بدائل متطابقة بنفس المادة الفعالة (Generics):</span>
                  </div>
                  <span className="text-[10px] text-teal-600 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-700">
                    بدائل آمنة وأوفر سعراً
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentProduct.alternativeProducts.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => onSelectAlternative(alt)}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-teal-500 cursor-pointer group transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={alt.image}
                          alt=""
                          className="w-11 h-11 object-cover rounded-xl border border-slate-100 bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 truncate">
                            {alt.nameAr}
                          </h5>
                          <span className="text-[11px] text-emerald-600 font-mono font-bold">
                            {alt.price} ج.م
                          </span>
                        </div>
                      </div>

                      <button className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 group-hover:bg-teal-600 group-hover:text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0">
                        عرض البديل
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* STICKY BOTTOM ACTION BAR (Never cut off on mobile!) */}
        <div className="p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-lg">
          {/* Price & Quantity Selector */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">
                السعر الإجمالي:
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-mono">
                  {currentProduct.price * quantity}
                </span>
                <span className="text-xs font-bold text-slate-500">ج.م</span>
                {currentProduct.originalPrice &&
                  currentProduct.originalPrice > currentProduct.price && (
                    <span className="text-[10px] text-slate-400 line-through font-mono mr-1">
                      {currentProduct.originalPrice * quantity} ج.م
                    </span>
                  )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 text-slate-500 hover:text-red-500 cursor-pointer transition-colors active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1.5 text-slate-500 hover:text-emerald-600 cursor-pointer transition-colors active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Cart + Buy Now */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px] sm:max-w-xs">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border ${
                isAdded
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تمت الإضافة</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف للسلة</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>طلب فوري ⚡</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

