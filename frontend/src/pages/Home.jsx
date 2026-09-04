import React, { useState, useEffect, useRef } from 'react';
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
  HeartPulse,
  Baby,
  Smile,
  Zap,
  Filter,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Search,
} from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { api } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useCms } from '../context/CmsContext';

// Horizontal Carousel Component for Category Sections
const CategorySection = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  gradientColor = 'from-emerald-600 to-teal-700',
  products = [],
  onViewAll,
  onQuickView,
}) => {
  const scrollRef = useRef(null);

  if (!products || products.length === 0) return null;

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3 sm:space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr ${gradientColor} text-white flex items-center justify-center shadow-md shrink-0`}
          >
            <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-tajawal">
                {title}
              </h2>
              {badgeText && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action & Carousel Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Desktop Arrow Buttons */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('left')}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onViewAll}
            className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          >
            <span>عرض كل القسم</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Track */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x touch-pan-x"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[160px] sm:w-[210px] md:w-[230px] shrink-0 snap-start"
          >
            <ProductCard product={product} onQuickView={onQuickView} />
          </div>
        ))}
      </div>
    </section>
  );
};

export const Home = ({
  onOpenUpload,
  onOpenRefill,
  onOpenSearch,
  onQuickView,
  selectedCategory,
  onSelectCategory,
}) => {
  const { selectedDistrict } = useLocation();
  const { banners: cmsBanners, articles: cmsArticles } = useCms();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);

  // Filter & Pagination state for category-focused explorer
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('popular');
  const [visibleCount, setVisibleCount] = useState(16);

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

  useEffect(() => {
    setSelectedSubCategory('ALL');
    setVisibleCount(16);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const isDeals = selectedCategory === 'عروض التوفير (Big Save)';
        const data = await api.getProducts({
          category: isDeals || selectedCategory === 'الكل' ? undefined : selectedCategory,
          subCategory: selectedSubCategory === 'ALL' ? undefined : selectedSubCategory,
          isHotDeal: isDeals ? true : undefined,
          sortBy: sortBy !== 'popular' ? sortBy : undefined,
          limit: 300,
        });
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, selectedSubCategory, sortBy]);

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

  // Grouped products for homepage sections
  const hotDeals = products.filter((p) => p.isHotDeal || (p.discountPercentage && p.discountPercentage > 0));

  // Pain & Fever relief
  const painReliefMeds = products.filter(
    (p) =>
      p.subCategory?.includes('مسكن') ||
      p.tags?.some((t) => t.includes('مسكن')) ||
      p.nameAr?.includes('بانادول') ||
      p.nameAr?.includes('دوليبران') ||
      p.nameAr?.includes('كتافلام') ||
      p.nameAr?.includes('بروفين') ||
      p.nameAr?.includes('نوفالدول') ||
      p.nameAr?.includes('باراسيتامول')
  );

  // Cold, Flu & Allergy
  const coldFluMeds = products.filter(
    (p) =>
      p.subCategory?.includes('برد') ||
      p.subCategory?.includes('حساسية') ||
      p.tags?.some((t) => t.includes('برد') || t.includes('حساسية')) ||
      p.nameAr?.includes('كولد') ||
      p.nameAr?.includes('فلودريكس') ||
      p.nameAr?.includes('كونجستال') ||
      p.nameAr?.includes('تلفاست') ||
      p.nameAr?.includes('123') ||
      p.nameAr?.includes('فلو')
  );

  // Vitamins & Supplements
  const vitamins = products.filter(
    (p) =>
      p.category?.includes('Vitamins') ||
      p.category?.includes('فيتامين') ||
      p.subCategory?.includes('فيتامين') ||
      p.tags?.some((t) => t.includes('فيتامين')) ||
      p.nameAr?.includes('فيتامين') ||
      p.nameAr?.includes('أوميجا') ||
      p.nameAr?.includes('زنك') ||
      p.nameAr?.includes('سنتروم') ||
      p.nameAr?.includes('كالسيوم')
  );

  // Skin Care
  const skinCare = products.filter(
    (p) =>
      p.category?.includes('Skin Care') ||
      p.category?.includes('بشرة') ||
      p.subCategory?.includes('بشرة') ||
      p.subCategory?.includes('ترطيب') ||
      p.tags?.some((t) => t.includes('بشرة') || t.includes('Skin'))
  );

  // Digestive Health
  const digestiveCare = products.filter(
    (p) =>
      p.subCategory?.includes('معدة') ||
      p.subCategory?.includes('هضم') ||
      p.subCategory?.includes('قولون') ||
      p.nameAr?.includes('حموضة') ||
      p.nameAr?.includes('جاست') ||
      p.nameAr?.includes('موتيليوم') ||
      p.nameAr?.includes('سبازمو') ||
      p.nameAr?.includes('انتينال')
  );

  // Mom & Baby
  const momBaby = products.filter(
    (p) =>
      p.category?.includes('Mom & Baby') ||
      p.category?.includes('الأم والطفل') ||
      p.subCategory?.includes('أطفال') ||
      p.subCategory?.includes('حفاضات') ||
      p.nameAr?.includes('بامبرز') ||
      p.nameAr?.includes('بيبي')
  );

  const isOverviewMode = selectedCategory === 'الكل';

  return (
    <div className="space-y-6 sm:space-y-10 pb-28 md:pb-16 overflow-hidden">
      {/* 1. Hero Dynamic Carousel (Powered by CMS) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 pt-2 sm:pt-4">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r transition-all duration-700 min-h-[220px] sm:min-h-[300px] md:min-h-[380px] flex items-center">
          {banners.map((b, idx) => (
            <div
              key={b.id || idx}
              className={`absolute inset-0 bg-gradient-to-r ${
                b.bg || 'from-emerald-900 via-teal-900 to-slate-900'
              } p-4 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 transition-opacity duration-1000 ${
                heroSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="space-y-2 sm:space-y-4 max-w-xl text-right z-10 w-full">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-[10px] sm:text-xs font-bold border border-white/10">
                  <Sparkles className="w-3 h-3" />
                  <span>{b.tag}</span>
                </span>
                <h1 className="text-lg sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight font-tajawal">
                  {b.title}
                </h1>
                <p className="text-[11px] sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-lg line-clamp-2 sm:line-clamp-none">
                  {b.subtitle}
                </p>

                <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => handleBannerAction(b)}
                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                  >
                    <span>{b.ctaText}</span>
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={onOpenSearch}
                    className="px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md cursor-pointer transition-all"
                  >
                    بحث عن بديل دوائي
                  </button>
                </div>
              </div>

              {/* Banner Visual (Desktop) */}
              <div className="relative hidden md:block w-72 h-72 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shrink-0 rotate-2 hover:rotate-0 transition-transform">
                <img src={b.img} alt={b.title} className="w-full h-full object-cover" />
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
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                  heroSlide === i ? 'w-6 sm:w-8 bg-emerald-400' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Fast Actions Grid (2x2 on Mobile, 4x1 on Desktop) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div
            onClick={onOpenUpload}
            className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 active:scale-98 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-2 sm:mb-3 shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-xs sm:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              رفع وتصوير الروشتة
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
              تسعير وفحص روشتتك وتوصيلها فوراً
            </p>
          </div>

          <div
            onClick={onOpenRefill}
            className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 active:scale-98 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-2 sm:mb-3 shadow-md shadow-teal-600/30 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-xs sm:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              الدواء الشهري للمزمن
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
              توصيل تلقائي لأدوية السكر والضغط
            </p>
          </div>

          <div
            onClick={onOpenSearch}
            className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 hover:border-purple-500/40 active:scale-98 transition-all cursor-pointer group shadow-xs"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-2 sm:mb-3 shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-xs sm:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              البدائل الدوائية الذكية
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
              ابحث عن نفس المادة بخصم وأوفر
            </p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-xs">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-2 sm:mb-3 shadow-md shadow-amber-500/30">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-bold text-xs sm:text-base text-slate-800 dark:text-slate-100 font-tajawal">
              توصيل فوري 30-45 د
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
              من أقرب صيدلية في {selectedDistrict}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Category Quick-Navigation Pills Hub */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>تصفح الأقسام الطبية والصيدلانية:</span>
            </div>
            {selectedCategory !== 'الكل' && (
              <button
                onClick={() => onSelectCategory('الكل')}
                className="text-emerald-600 hover:text-emerald-700 text-[11px] font-bold cursor-pointer"
              >
                عرض كافة الأقسام (الكل)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth touch-pan-x">
            {[
              { label: 'الكل', value: 'الكل', icon: Layers },
              { label: 'عروض التوفير', value: 'عروض التوفير (Big Save)', icon: Flame, isSpecial: true },
              { label: 'أدوية وعلاج', value: 'الأدوية (Medications)', icon: Pill },
              { label: 'فيتامينات ومناعة', value: 'الفيتامينات والمكملات (Vitamins)', icon: HeartPulse },
              { label: 'العناية بالبشرة', value: 'العناية بالبشرة (Skin Care)', icon: Sparkles },
              { label: 'الأم والطفل', value: 'الأم والطفل (Mom & Baby)', icon: Baby },
              { label: 'أجهزة طبية', value: 'الأجهزة والمستلزمات الطبية (Health Care Devices)', icon: Smile },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => onSelectCategory(cat.value)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0 ${
                    cat.isSpecial
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                      : isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${cat.isSpecial ? 'animate-pulse' : ''}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MODE A: OVERVIEW MODE (Clean Categorized Sections & Carousels) */}
      {/* ============================================================ */}
      {isOverviewMode ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-8 sm:space-y-12">
          {/* Section 1: Hot Deals & Big Save */}
          {hotDeals.length > 0 && (
            <CategorySection
              title="عروض التوفير الكبرى (Big Save)"
              subtitle="خصومات حصرية وأسعار مخفضة على الأصناف الأكثر طلباً"
              icon={Flame}
              badgeText="خصومات فورية"
              gradientColor="from-rose-600 to-red-600"
              products={hotDeals.slice(0, 10)}
              onViewAll={() => onSelectCategory('عروض التوفير (Big Save)')}
              onQuickView={onQuickView}
            />
          )}

          {/* Section 2: Pain & Fever Relief */}
          {painReliefMeds.length > 0 && (
            <CategorySection
              title="مسكنات الألم وخافض الحرارة"
              subtitle="بانادول، دوليبران، كتافلام، بروفين، وأقوى مسكنات الصداع والأسنان"
              icon={Pill}
              badgeText="الأكثر مبيعاً"
              gradientColor="from-emerald-600 to-teal-700"
              products={painReliefMeds.slice(0, 10)}
              onViewAll={() => onSelectCategory('الأدوية (Medications)')}
              onQuickView={onQuickView}
            />
          )}

          {/* Section 3: Cold, Flu & Allergy */}
          {coldFluMeds.length > 0 && (
            <CategorySection
              title="أدوية البرد والإنفلونزا والحساسية"
              subtitle="علاجات الرشح، الاحتقان، الحساسية وموسعات الشعب الهوائية"
              icon={Sparkles}
              badgeText="علاجات سريعة"
              gradientColor="from-sky-600 to-blue-700"
              products={coldFluMeds.slice(0, 10)}
              onViewAll={() => onSelectCategory('الأدوية (Medications)')}
              onQuickView={onQuickView}
            />
          )}

          {/* Section 4: Vitamins & Supplements */}
          {vitamins.length > 0 && (
            <CategorySection
              title="الفيتامينات والمكملات الغذائية"
              subtitle="أوميجا 3، فيتامين د، زنك، سنتروم، ومقويات المناعة اليومية"
              icon={HeartPulse}
              badgeText="صحة ومناعة"
              gradientColor="from-amber-500 to-orange-600"
              products={vitamins.slice(0, 10)}
              onViewAll={() => onSelectCategory('الفيتامينات والمكملات (Vitamins)')}
              onQuickView={onQuickView}
            />
          )}

          {/* Section 5: Digestive Care */}
          {digestiveCare.length > 0 && (
            <CategorySection
              title="صحة الجهاز الهضمي والقولون"
              subtitle="علاجات الحموضة، عسر الهضم، الغازات، ومشاكل المعدة"
              icon={Stethoscope}
              gradientColor="from-indigo-600 to-purple-700"
              products={digestiveCare.slice(0, 10)}
              onViewAll={() => onSelectCategory('الأدوية (Medications)')}
              onQuickView={onQuickView}
            />
          )}

          {/* Section 6: Skin Care & Beauty */}
          {skinCare.length > 0 && (
            <CategorySection
              title="العناية بالبشرة والجمال"
              subtitle="مرطبات طبية، واقي شمس، غسول للوجه، وسيروم العناية"
              icon={Sparkles}
              badgeText="عناية طبية"
              gradientColor="from-pink-500 to-rose-600"
              products={skinCare.slice(0, 10)}
              onViewAll={() => onSelectCategory('العناية بالبشرة (Skin Care)')}
              onQuickView={onQuickView}
            />
          )}

          {/* Section 7: Mom & Baby */}
          {momBaby.length > 0 && (
            <CategorySection
              title="الأم والطفل"
              subtitle="حفاضات، حليب أطفال، مستلزمات العناية بالبشرة للرضيع"
              icon={Baby}
              gradientColor="from-violet-600 to-fuchsia-600"
              products={momBaby.slice(0, 10)}
              onViewAll={() => onSelectCategory('الأم والطفل (Mom & Baby)')}
              onQuickView={onQuickView}
            />
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* MODE B: FOCUSED CATEGORY EXPLORER (With Subcategories & Pages) */
        /* ============================================================ */
        <section className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4 sm:space-y-6">
          {/* Category Header Bar */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-slate-900/5 dark:bg-slate-900/60 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectCategory('الكل')}
                  className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                >
                  <span>الرئيسية</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-emerald-600">
                  {selectedCategory}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-tajawal mt-1">
                قسم: {selectedCategory}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                متوفرة في المخزون ومعتمدة طبياً للتوصيل الفوري في {selectedDistrict}
              </p>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>الترتيب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="popular" className="dark:bg-slate-900">الأكثر طلباً</option>
                  <option value="rating" className="dark:bg-slate-900">الأعلى تقييماً</option>
                  <option value="price_asc" className="dark:bg-slate-900">السعر: من الأقل</option>
                  <option value="price_desc" className="dark:bg-slate-900">السعر: من الأعلى</option>
                </select>
              </div>

              <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                {products.length} منتج
              </div>
            </div>
          </div>

          {/* Subcategories Filter Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth touch-pan-x">
            {[
              'ALL',
              ...Array.from(new Set(products.map((p) => p.subCategory).filter(Boolean))),
            ].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  selectedSubCategory === sub
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sub === 'ALL' ? 'جميع الأصناف الفرعية' : sub}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-56 sm:h-80 rounded-2xl sm:rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Pill className="w-12 h-12 stroke-1 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm sm:text-base">
                لا توجد منتجات مطابقة في هذا التصنيف الفرعي حالياً
              </p>
              <button
                onClick={() => setSelectedSubCategory('ALL')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                عرض كل أصناف القسم
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {products.slice(0, visibleCount).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {visibleCount < products.length && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 16)}
                    className="px-8 py-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-sm inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span>
                      تحميل المزيد من الأدوية (متبقي {products.length - visibleCount} صنف)
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 4. Medical Advice & Health Articles (Powered by CMS) */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
                <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-tajawal">
                  نصائح واستشارات صيدلانية موثوقة
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  إرشادات طبية من نخبة من الصيادلة لسلامتك وصحتك
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="h-32 sm:h-40 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900/90 text-white backdrop-blur-md">
                      {art.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {art.summary}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                  <span className="font-medium">{art.author}</span>
                  <span>{art.readTime}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
