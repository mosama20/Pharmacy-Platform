import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Bot,
  Truck,
  Sparkles,
  Flame,
  ArrowLeft,
  ShieldCheck,
  Heart,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  Star,
  BookOpen,
  Calendar,
  UserCheck,
  Pill,
  Stethoscope,
} from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useCms } from '../context/CmsContext';

export const Home = ({
  onOpenUpload,
  onOpenRefill,
  onOpenSearch,
  onQuickView,
  selectedCategory,
  onSelectCategory,
}) => {
  const { selectedDistrict } = useLocation();
  const { banners: cmsBanners, articles: cmsArticles, settings } = useCms();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);

  const fallbackBanners = [
    {
      id: 'def_1',
      title: 'صيدليتك أونلاين الأسرع في التوصيل',
      subtitle: 'ارفع الروشتة أو اطلب دواك وهيصلك لحد باب البيت خلال 30-45 دقيقة',
      tag: 'توصيل فوري بجميع المحافظات',
      bg: 'from-emerald-900 via-teal-900 to-slate-900',
      ctaText: 'ارفع الروشتة الآن',
      actionType: 'upload',
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'def_2',
      title: 'باقة الدواء الشهري للمزمن',
      subtitle: 'تكرار وتوصيل تلقائي لأدوية السكر والضغط والقلب كل 30 يوماً مع توصيل مجاني',
      tag: 'رعاية صحية مستمرة',
      bg: 'from-teal-950 via-cyan-950 to-slate-900',
      ctaText: 'اشترك في باقة الدواء الشهري',
      actionType: 'refill',
      img: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const banners = cmsBanners && cmsBanners.length > 0 ? cmsBanners : fallbackBanners;
  const articles = cmsArticles || [];

  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');

  useEffect(() => {
    setSelectedSubCategory('ALL');
  }, [selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const isDeals = selectedCategory === 'عروض التوفير (Big Save)';
        const data = await api.getProducts({
          category: isDeals ? undefined : selectedCategory,
          subCategory: selectedSubCategory === 'ALL' ? undefined : selectedSubCategory,
          isHotDeal: isDeals ? true : undefined,
        });
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, selectedSubCategory]);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleBannerAction = (banner) => {
    if (banner.actionType === 'upload') onOpenUpload();
    else if (banner.actionType === 'refill') onOpenRefill();
    else if (banner.actionType === 'category' && banner.actionValue) {
      onSelectCategory(banner.actionValue);
    } else {
      onOpenUpload();
    }
  };

  const hotDeals = products.filter((p) => p.isHotDeal || p.discountPercentage);

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Hero Dynamic Carousel (Powered by CMS) */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r transition-all duration-700 min-h-[340px] md:min-h-[380px] flex items-center">
          {banners.map((b, idx) => (
            <div
              key={b.id || idx}
              className={`absolute inset-0 bg-gradient-to-r ${b.bg || 'from-emerald-900 via-teal-900 to-slate-900'
                } p-6 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 transition-opacity duration-1000 ${heroSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
            >
              <div className="space-y-4 max-w-xl text-right z-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{b.tag}</span>
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight font-tajawal">
                  {b.title}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-lg">
                  {b.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleBannerAction(b)}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs md:text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{b.ctaText}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onOpenSearch}
                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm border border-white/20 backdrop-blur-md cursor-pointer transition-all"
                  >
                    بحث عن بديل دوائي
                  </button>
                </div>
              </div>

              {/* Banner Visual */}
              <div className="relative hidden md:block w-72 h-72 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shrink-0 rotate-2 hover:rotate-0 transition-transform">
                <img
                  src={b.img}
                  alt={b.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-center">
                  <span className="bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                    معتمد من وزارة الصحة
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${heroSlide === i ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Fast Actions Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div
            onClick={onOpenUpload}
            className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              رفع الروشتة الطبية
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              صيادلة متخصصون لتسعير وفحص روشتتك في دقائق
            </p>
          </div>

          <div
            onClick={onOpenRefill}
            className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-teal-600/30 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              الدواء الشهري للمزمن
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              توصيل تلقائي لأدوية السكر والضغط والقلب كل شهر
            </p>
          </div>

          <div
            onClick={onOpenSearch}
            className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              البدائل الدوائية الذكية
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ابحث عن نفس المادة الفعالة بسعر أوفر فوراً
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              توصيل فوري 30-45 دقيقة
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تغطية شاملة للمحافظات مع خدمة التوصيل السريع لباب المنزل
            </p>
          </div>
        </div>
      </section>

      {/* 3. Hot Deals & Big Save Section */}
      {hotDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-tajawal">
                  عروض التوفير الكبرى (Big Save)
                </h2>
                <p className="text-xs text-slate-500">
                  خصومات فورية وعروض حصرية على المنتجات الأكثر طلباً
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectCategory('عروض التوفير (Big Save)')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <span>عرض كل العروض</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hotDeals.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Products Catalog & Active Category Grid */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-tajawal">
              {selectedCategory === 'الكل'
                ? 'أحدث الأدوية والمنتجات المتاحة للتوصيل الفوري'
                : `قسم: ${selectedCategory}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متوفرة في المخزون ومعتمدة طبياً بأعلى معايير الجودة
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500 font-mono">
            {products.length} دواء ومنتج
          </div>
        </div>

        {/* Subcategories Filter Chips */}
        {selectedCategory && selectedCategory !== 'الكل' && selectedCategory !== 'عروض التوفير (Big Save)' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['ALL', ...Array.from(new Set(products.map((p) => p.subCategory).filter(Boolean)))].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubCategory === sub
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sub === 'ALL' ? 'جميع الأصناف الفرعية' : sub}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="font-bold text-base">لا توجد منتجات مطابقة في هذا القسم</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Medical Advice & Health Articles (Powered by CMS) */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-tajawal">
                  نصائح واستشارات صيدلانية معتمدة
                </h2>
                <p className="text-xs text-slate-500">
                  إرشادات طبية موثوقة من نخبة من الصيادلة لصحة أفضل
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-900/90 text-white backdrop-blur-md">
                      {art.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>{art.author} ({art.authorRole})</span>
                  </span>
                  <span>{art.readTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Chronic Care Prescription Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-xl text-right z-10">
            <span className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>رعاية خاصة لمرضى السكر والضغط والقلب</span>
            </span>
            <h3 className="text-2xl md:text-3xl font-black font-tajawal">
              دواك هيوصلك كل شهر في ميعاده دون انقطاع!
            </h3>
            <p className="text-xs md:text-sm text-teal-100 leading-relaxed">
              اشترك في باقة التكرار الشهري وسنقوم بمتابعة مواعيد جرعاتك وتوصيل علاجك إلى باب منزلك مع كبسولة فيتامين إضافية مجاناً مع كل اشتراك.
            </p>
            <button
              onClick={onOpenRefill}
              className="px-6 py-3 rounded-2xl bg-white text-teal-900 font-black text-xs hover:bg-teal-50 shadow-lg cursor-pointer transition-all"
            >
              تفعيل باقة الدواء الشهري الآن
            </button>
          </div>

          <div className="w-48 h-48 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-200 shadow-inner shrink-0 animate-float">
            <Pill className="w-20 h-20" />
          </div>
        </div>
      </section>
    </div>
  );
};
