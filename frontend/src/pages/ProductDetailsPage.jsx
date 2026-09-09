import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
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
  ArrowRight,
  MessageCircle,
  Share2,
  Heart,
  Package,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCms } from '../context/CmsContext';
import { api } from '../services/api';
import { ProductCard } from '../components/products/ProductCard';

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

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { settings } = useCms();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setError('');
    setQuantity(1);
    setImgError(false);

    let isMounted = true;

    api
      .getProductById(id)
      .then(async (data) => {
        if (!isMounted) return;
        if (!data) {
          setError('لم يتم العثور على المنتج المطلوب');
          return;
        }
        setProduct(data);

        // Fetch related or alternative products if not included
        if (data.alternativeProducts && data.alternativeProducts.length > 0) {
          setRelatedProducts(data.alternativeProducts);
        } else {
          try {
            const sameCat = await api.getProducts({
              category: data.category,
              limit: 6,
            });
            if (isMounted) {
              const list = Array.isArray(sameCat) ? sameCat : sameCat.data || [];
              setRelatedProducts(list.filter((p) => p.id !== data.id).slice(0, 4));
            }
          } catch (e) {
            console.warn('Could not fetch related products', e);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err.message || 'حدث خطأ أثناء تحميل بيانات المنتج');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center animate-pulse border border-emerald-200/60 dark:border-emerald-800">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          جاري تجهيز بيانات المنتج والمخزون الطبي...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {error || 'عذراً، هذا المنتج غير متوفر'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          قد يكون الرابط خاطئاً أو تم نقل المنتج إلى قسم آخر. يمكنك البحث عنه أو تصفح الأقسام الرئيسية.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const subtitle = cleanSubtitle(product.nameEn, product.nameAr);
  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? (product.originalPrice - product.price).toFixed(0)
      : null;

  const whatsappInquiryUrl = `https://wa.me/${(settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '').startsWith('0') ? '2' + (settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '') : (settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `مرحباً، أود الاستفسار عن توفر وجرعة الدواء: ${product.nameAr} (كود: ${product.id})`
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-cairo">
      {/* Breadcrumb Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Link
            to="/"
            className="hover:text-emerald-600 font-bold transition-colors"
          >
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300 font-bold">
            {product.category || 'الأدوية'}
          </span>
          {product.subCategory && (
            <>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {product.subCategory}
              </span>
            </>
          )}
          <span>/</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[200px] sm:max-w-[320px]">
            {product.nameAr}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            title="مشاركة رابط المنتج"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'تم نسخ الرابط ✓' : 'مشاركة'}</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>رجوع</span>
          </button>
        </div>
      </div>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Right Column (Media / Image) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 flex items-center justify-center min-h-[300px] sm:min-h-[420px] shadow-sm overflow-hidden group">
            {/* Badges */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
              {product.isPrescriptionRequired && (
                <span className="bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>يتطلب روشتة طبية</span>
                </span>
              )}
              {product.discountPercentage > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <span>خصم {product.discountPercentage}%</span>
                </span>
              )}
            </div>

            {/* In Stock Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>متوفر بالصيدلية</span>
              </span>
            </div>

            {/* Product Image */}
            {imgError ? (
              <div className="w-40 h-40 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex flex-col items-center justify-center gap-2">
                <Pill className="w-16 h-16 stroke-1 text-emerald-500" />
                <span className="text-xs font-bold text-slate-400">صورة الدواء</span>
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.nameAr}
                onError={() => setImgError(true)}
                className="w-full max-h-72 sm:max-h-96 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </div>

          {/* Pharmacy Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px]">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">أصلي 100%</p>
              <p className="text-[10px] text-slate-400">معتمد وموثوق</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px]">
              <Truck className="w-5 h-5 text-teal-600 mx-auto mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">توصيل مبرد</p>
              <p className="text-[10px] text-slate-400">خلال 45 دقيقة</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px]">
              <RotateCcw className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">استرجاع سهل</p>
              <p className="text-[10px] text-slate-400">وفق اللائحة الطبية</p>
            </div>
          </div>
        </div>

        {/* Left Column (Details & Purchase Action) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800">
                {product.category}
              </span>
              {product.subCategory && (
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                  {product.subCategory}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug font-tajawal">
              {product.nameAr}
            </h1>

            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 font-mono font-medium">
                {subtitle}
              </p>
            )}

            {/* Rating & Brand */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{product.rating || 4.9}</span>
                <span className="text-slate-400 text-xs font-normal">
                  ({product.reviewCount || 38} تقييم صيدلاني معتمد)
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 font-medium">
                كود المنتج: <strong className="font-mono">{product.id}</strong>
              </span>
            </div>
          </div>

          {/* Active Ingredient Highlight Card */}
          {product.activeIngredient && (
            <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    المادة الفعالة الرئيسية (Active Ingredient):
                  </span>
                  <span className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                    {product.activeIngredient}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Price Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {product.price}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-500">جنيه مصري</span>

              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center gap-2 mr-3">
                  <span className="text-sm sm:text-base text-slate-400 line-through font-mono">
                    {product.originalPrice} ج.م
                  </span>
                  {savings && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold font-mono">
                      وفرت {savings} ج.م
                    </span>
                  )}
                </div>
              )}
            </div>

            {product.isPrescriptionRequired && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>تنبيه طبي:</strong> هذا الدواء يستلزم تقديم روشتة طبية سارية. يمكنك إرفاق صورة الروشتة عند إتمام الطلب ليراجعها الصيدلي.
                </span>
              </div>
            )}

            {/* Quantity & CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {/* Quantity Counter */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                <span className="text-xs font-bold text-slate-500 px-2 sm:hidden">الكمية:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold transition-all cursor-pointer"
                    title="تقليل الكمية"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black font-mono text-sm text-slate-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold transition-all cursor-pointer"
                    title="زيادة الكمية"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add To Cart */}
              <button
                onClick={handleAddToCart}
                className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isAdded
                    ? 'bg-emerald-700 text-white shadow-emerald-700/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>تمت الإضافة للسلة ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>إضافة إلى السلة ({quantity * product.price} ج.م)</span>
                  </>
                )}
              </button>

              {/* Buy Now Direct Button */}
              <button
                onClick={handleBuyNow}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/25 active:scale-95 cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4" />
                <span>شراء الآن فوراً</span>
              </button>
            </div>
          </div>

          {/* Quick Pharmacist WhatsApp Consult */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  لديك استفسار طبي عن هذا الدواء؟
                </span>
                <span className="text-[11px] text-slate-400">
                  فريق صيدلية د. شيماء متاح على مدار الساعة للإجابة
                </span>
              </div>
            </div>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>استشر الصيدلي</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Section: Detailed Clinical Leaflet */}
      <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>نظرة عامة ودواعي الاستعمال</span>
          </button>

          <button
            onClick={() => setActiveTab('dosage')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dosage'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>طريقة الاستخدام والجرعة</span>
          </button>

          <button
            onClick={() => setActiveTab('warnings')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'warnings'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>التحذيرات والآثار الجانبية</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'delivery'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>الشحن وسياسة الصيدلية</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="py-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                دواعي الاستعمال والوصف الطبي:
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-loose">
                {product.descriptionAr ||
                  `يستخدم ${product.nameAr} لتوفير رعاية علاجية فعالة وموجهة وفق الإرشادات الصيدلانية المعتمدة من وزارة الصحة المصرية. تم تصنيعه وتخزينه وفق أعلى معايير الجودة العالمية.`}
              </p>
              {product.tags && product.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">الكلمات الدلالية:</span>
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dosage' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                الجرعة الموصى بها وإرشادات التناول:
              </h3>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {product.dosage ||
                    'حسب تعليمات الطبيب المعالج أو النشرة الداخلية المرفقة مع العبوة.'}
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li>يُنصح بتناول الجرعة في نفس التوقيت يومياً للحفاظ على مستوى تركيز الدواء في الدم.</li>
                  <li>لا تقم بمضاعفة الجرعة لتعويض الجرعة المنسية.</li>
                  <li>يُحفظ بعيداً عن متناول أيدي الأطفال في درجة حرارة لا تتعدى 25 درجة مئوية.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                الموانع والتحذيرات الطبية:
              </h3>
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <p className="text-amber-900 dark:text-amber-200 font-medium">
                  {product.sideEffects ||
                    'يُمنع الاستخدام في حال وجود حساسية لأي من مكونات الدواء أو مواده الفعالة.'}
                </p>
                <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-300/80 space-y-1">
                  <li>يجب استشارة الطبيب أو الصيدلي في فترات الحمل والرضاعة قبل الاستخدام.</li>
                  <li>أخبر الصيدلي بأي أدوية أخرى تتناولها تجنباً لحدوث أي تداخلات دوائية غير مرغوبة.</li>
                  <li>في حال ظهور أي أعراض تحسسية مفاجئة، توقف فوراً واستشر الطبيب المختص.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                شروط الشحن وحفظ الأدوية:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>التوصيل السريع (45 دقيقة):</span>
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    يتم تحضير الطلب وتغليفه في حاويات عازلة للحرارة للحفاظ على فاعلية الدواء، ويوصل لباب منزلك في أسرع وقت.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>سياسة الاسترجاع الدوائي:</span>
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    وفقاً لقوانين وزارة الصحة، لا يجوز استرجاع الأدوية بعد استلامها إلا في حال وجود عيب مصنعي أو خطأ في الصرف لضمان سلامة المرضى.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternative & Similar Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-14 pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-xl text-slate-900 dark:text-white">
                  البدائل والأدوية المشابهة
                </h3>
                <p className="text-xs text-slate-500">
                  منتجات بنفس المادة الفعالة أو من نفس القسم الطبي
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {relatedProducts.map((altProd) => (
              <ProductCard
                key={altProd.id}
                product={altProd}
                onQuickView={() => navigate(`/product/${altProd.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
