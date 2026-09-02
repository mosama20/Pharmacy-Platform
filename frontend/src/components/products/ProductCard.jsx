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

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative rounded-3xl glass-card overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer bg-white dark:bg-slate-900"
    >
      {/* Badges Bar */}
      <div className="absolute top-3 right-3 left-3 z-10 flex items-center justify-between pointer-events-none">
        {product.discountPercentage ? (
          <span className="bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
            <Flame className="w-3 h-3 fill-white" />
            <span>خصم {product.discountPercentage}%</span>
          </span>
        ) : (
          <span />
        )}

        {product.isPrescriptionRequired && (
          <span className="bg-amber-500/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            يحتاج روشتة
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative pt-6 px-4 pb-2 text-center overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
        <img
          src={product.image}
          alt={product.nameAr}
          className="w-full h-40 object-contain mx-auto group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Quick View Floating button on hover */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>تفاصيل الدواء والبدائل</span>
          </span>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-medium truncate max-w-[120px]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold font-mono">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
            {product.nameAr}
          </h3>

          {/* Active Ingredient / Generic Note */}
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-1">
            {product.activeIngredient}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-lg font-mono">
                {product.price}
              </span>
              <span className="text-[10px] text-slate-500 font-bold">ج.م</span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through font-mono">
                {product.originalPrice} ج.م
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`p-2.5 rounded-2xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md ${
              isAdded
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-600 shadow-emerald-600/10'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-[11px]">تمت الإضافة</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="text-[11px]">أضف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
