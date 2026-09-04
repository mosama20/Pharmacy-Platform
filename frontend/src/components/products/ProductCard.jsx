import React, { useState } from 'react';
import {
  Plus,
  Check,
  Star,
  ShieldAlert,
  Flame,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative rounded-2xl sm:rounded-3xl glass-card overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer bg-white dark:bg-slate-900"
    >
      {/* Badges Bar */}
      <div className="absolute top-2 right-2 left-2 sm:top-3 sm:right-3 sm:left-3 z-10 flex items-center justify-between pointer-events-none">
        {product.discountPercentage ? (
          <span className="bg-gradient-to-r from-red-600 to-rose-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
            <span>خصم {product.discountPercentage}%</span>
          </span>
        ) : (
          <span />
        )}

        {product.isPrescriptionRequired && (
          <span className="bg-amber-500/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
            روشتة
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative pt-5 px-2 sm:px-4 pb-1 text-center overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center min-h-[120px] sm:min-h-[160px]">
        {imgError ? (
          <div className="w-20 h-20 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 flex flex-col items-center justify-center gap-1">
            <Sparkles className="w-6 h-6 stroke-1 text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-400">صيدلية أونلاين</span>
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.nameAr}
            onError={() => setImgError(true)}
            className="w-full h-28 sm:h-40 object-contain mx-auto group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Quick View Floating button on hover (Desktop) */}
        <div className="hidden md:flex absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>تفاصيل الدواء والبدائل</span>
          </span>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mb-0.5 sm:mb-1">
            <span className="font-medium truncate max-w-[90px] sm:max-w-[120px]">
              {product.category}
            </span>
            <div className="flex items-center gap-0.5 text-amber-500 font-bold font-mono text-[10px] sm:text-xs">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug min-h-[2rem]">
            {product.nameAr}
          </h3>

          {/* Active Ingredient / Generic Note */}
          <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
            {product.activeIngredient}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
          <div className="truncate">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-lg font-mono">
                {product.price}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold">ج.م</span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[9px] sm:text-[11px] text-slate-400 line-through font-mono block">
                {product.originalPrice} ج.م
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-sm shrink-0 min-w-[32px] h-[32px] sm:h-auto sm:min-w-fit ${
              isAdded
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-600 shadow-emerald-600/10 active:scale-90'
            }`}
            title="إضافة للسلة"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px] hidden xs:inline">تمت</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[11px] hidden xs:inline">أضف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
