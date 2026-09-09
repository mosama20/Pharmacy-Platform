import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Pill,
  Sparkles,
  HeartPulse,
  Baby,
  Smile,
  Flame,
  ChevronLeft,
  ArrowRight,
  Search,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';

const categoryDetails = [
  {
    id: 'deals',
    name: 'عروض التوفير (Big Save)',
    label: 'عروض التوفير الكبرى',
    desc: 'أقوى الخصومات والعروض الحصرية على الأدوية ومستحضرات العناية والتجميل',
    icon: Flame,
    gradient: 'from-amber-500 to-rose-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
    subCategories: ['خصومات الأسبوع', 'عروض العناية', 'باقات التوفير', 'اشتري 1 واحصل على 1'],
    badge: 'توفير حتى 50%',
  },
  {
    id: 'meds',
    name: 'الأدوية (Medications)',
    label: 'الأدوية والعلاجات',
    desc: 'مسكنات الألم، أدوية البرد والإنفلونزا، المضادات، وأدوية السكر والضغط والقلب',
    icon: Pill,
    gradient: 'from-emerald-600 to-teal-700',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
    subCategories: ['مسكنات وخافض حرارة', 'برد وحساسية', 'جهاز هضمي ومعدة', 'أدوية مزمنة', 'مضادات حيوية'],
    badge: 'توصيل فوري 30د',
  },
  {
    id: 'supplements',
    name: 'الفيتامينات والمكملات (Vitamins)',
    label: 'الفيتامينات والمكملات الغذائية',
    desc: 'فيتامينات C و D، زنك، أوميجا 3، مكملات كبار السن والرياضيين، وتقوية المناعة',
    icon: HeartPulse,
    gradient: 'from-teal-600 to-cyan-700',
    bgLight: 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40',
    subCategories: ['فيتامين C و زنك', 'أوميجا وزيوت سمك', 'كالسيوم ومفاصل', 'فيتامين د', 'مكملات الطاقة'],
    badge: 'أصلي 100%',
  },
  {
    id: 'skin',
    name: 'العناية بالبشرة (Skin Care)',
    label: 'العناية بالبشرة والجمال',
    desc: 'غسول، واقي شمس، سيروم، مرطبات، ومنتجات العناية بالشعر والجسم من أفضل الماركات',
    icon: Sparkles,
    gradient: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/40',
    subCategories: ['واقي الشمس', 'سيروم وترطيب', 'غسول ومقشر', 'عناية بالشعر', 'مستحضرات تجميل'],
    badge: 'ماركات عالمية',
  },
  {
    id: 'baby',
    name: 'الأم والطفل (Mom & Baby)',
    label: 'صحة الأم والطفل',
    desc: 'حليب أطفال، حفاضات، منتجات استحمام الأطفال، مستلزمات الرضاعة وتغذية الرضع',
    icon: Baby,
    gradient: 'from-purple-500 to-indigo-600',
    bgLight: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40',
    subCategories: ['حليب ورضاعة', 'حفاضات ومناديل', 'شامبو واستحمام', 'عناية بالأم المرضعة'],
    badge: 'رعاية فائقة',
  },
  {
    id: 'devices',
    name: 'الأجهزة والمستلزمات الطبية (Health Care Devices)',
    label: 'الأجهزة والمستلزمات الطبية',
    desc: 'أجهزة قياس الضغط والسكر، موازين حرارة، كمامات، قطن وشاش، ومستلزمات الإسعافات',
    icon: Smile,
    gradient: 'from-blue-600 to-indigo-700',
    bgLight: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40',
    subCategories: ['أجهزة قياس الضغط', 'أجهزة السكر والشرائط', 'ترمومتر حرارة', 'مستلزمات إسعافات'],
    badge: 'ضمان معتمد',
  },
];

export const CategoriesPage = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const { setSelectedCategory, onOpenUpload, onOpenSearch } = outletCtx;

  const handleSelectCategory = (categoryName) => {
    if (setSelectedCategory) {
      setSelectedCategory(categoryName);
    }
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 pb-28 md:pb-16 font-tajawal">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
            أقسام وتصنيفات الصيدلية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            اختر القسم الطبي أو العلاجي لتصفح الأدوية والمنتجات المعتمدة بسهولة
          </p>
        </div>

        {/* Prescription quick action */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>ارفع روشتتك فوراً</span>
          </button>
        )}
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {categoryDetails.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`rounded-3xl border ${cat.bgLight} p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between group`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${cat.gradient} text-white flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                    {cat.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {cat.label}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                  {cat.desc}
                </p>

                {/* Subcategories Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {cat.subCategories.map((sub, i) => (
                    <span
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCategory(cat.name);
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer transition-colors"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectCategory(cat.name)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-all group-hover:border-transparent group-hover:shadow-md cursor-pointer"
              >
                <span>تصفح أصناف القسم</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Info Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 text-right">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base">
              لم تجد الدواء أو القسم الذي تبحث عنه؟
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              يمكنك تصوير الروشتة أو التحدث مع صيدلي معتمد فوراً عبر الخط الساخن 19876
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>بحث عن بديل</span>
            </button>
          )}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white border border-white/20 font-bold text-xs hover:bg-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ارفع الروشتة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
