import React from 'react';
import { ChevronLeft, Home } from 'lucide-react';

const TAB_TITLES = {
  orders: 'صندوق الطلبات الواردة',
  prescriptions: 'فحص وتسعير الروشتات الطبية',
  insurance: 'التعاقدات والتأمين الطبي',
  products: 'المخزون والأدوية',
  refills: 'اشتراكات الدواء الشهري',
  courier: 'بوابة مهام التوصيل والمندوب',
  staff: 'إدارة حسابات الموظفين والصلاحيات',
  customers: 'دليل وسجلات العملاء',
  analytics: 'التقارير والمؤشرات المالية',
  cms: 'نظام إدارة المحتوى (CMS)',
};

const CMS_SUBTAB_TITLES = {
  identity: 'الهوية البصرية والشعار',
  banners: 'السلايدر والعروض الترويجية',
  categories: 'الأقسام والتصنيفات',
  coupons: 'أكواد الخصم والكوبونات',
  articles: 'المقالات والنصائح الطبية',
  media: 'مكتبة الوسائط والصور',
  business: 'بيانات التواصل والتوصيل',
  seo: 'محركات البحث (SEO)',
};

export const AdminBreadcrumbs = ({
  activeTab,
  cmsActiveSubTab,
  onTabClick,
}) => {
  const currentTabTitle = TAB_TITLES[activeTab] || activeTab;
  const currentSubTitle = activeTab === 'cms' ? CMS_SUBTAB_TITLES[cmsActiveSubTab] : null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium" aria-label="Breadcrumb">
      <button
        onClick={() => onTabClick('orders')}
        className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>لوحة التحكم</span>
      </button>

      <ChevronLeft className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />

      {currentSubTitle ? (
        <>
          <button
            onClick={() => onTabClick(activeTab)}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {currentTabTitle}
          </button>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-white">
            {currentSubTitle}
          </span>
        </>
      ) : (
        <span className="font-bold text-slate-900 dark:text-white">
          {currentTabTitle}
        </span>
      )}
    </nav>
  );
};
