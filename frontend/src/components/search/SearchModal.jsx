import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Pill,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';

export const SearchModal = ({ isOpen, onClose, onSelectProduct }) => {
  const { addToCart } = useCart();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState([]);

  const trendingQueries = [
    'بانادول إكسترا',
    'أوجمنتين مضاد حيوي',
    'سيتال مسكن',
    'سيرافي لوشن',
    'أوميجا 3 بلس',
    'جهاز ضغط أومرون',
    'جلوكوفاج 1000',
    'كونكور 5 مجم',
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.getProducts({ search: query.trim() });
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== product.id));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="ابحث بالاسم التجاري، المادة الفعالة، أو نوع العلاج..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            إلغاء (ESC)
          </button>
        </div>

        {/* Results / Suggestions area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {!query && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>الأدوية والمنتجات الأكثر بحثاً اليوم:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingQueries.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>جاري البحث في قاعدة بيانات الأدوية والمنتجات...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Pill className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-sm">لم يتم العثور على أدوية مطابقة</p>
              <p className="text-xs text-slate-400">
                يمكنك رفع صورة الروشتة مباشرة وسيقوم الصيدلي بالبحث عنها وتوفيرها لك.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 mb-2">
                تم العثور على {results.length} نتيجة:
              </div>

              {results.map((product) => {
                const isAdded = addedIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.nameAr}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {product.nameAr}
                          </h4>
                          {product.isPrescriptionRequired && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                              يحتاج روشتة
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          المادة الفعالة: {product.activeIngredient}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {product.nameEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm md:text-base font-mono">
                          {product.price} ج.م
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="block text-[10px] text-slate-400 line-through font-mono">
                            {product.originalPrice} ج.م
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className={`p-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
