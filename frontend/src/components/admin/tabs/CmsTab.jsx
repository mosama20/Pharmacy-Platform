import React from 'react';
import {
  Globe,
  Phone,
  Share2,
  Image as ImageIcon,
  Layers,
  Tag,
  BookOpen,
  Sparkles,
  Search,
  Send,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { CmsIdentitySection } from '../cms/CmsIdentitySection';
import { CmsBusinessSection } from '../cms/CmsBusinessSection';
import { CmsSocialSection } from '../cms/CmsSocialSection';
import { CmsNotificationsSection } from '../cms/CmsNotificationsSection';
import { CmsBannersSection } from '../cms/CmsBannersSection';
import { CmsQuickCardsSection } from '../cms/CmsQuickCardsSection';
import { CmsCategoriesSection } from '../cms/CmsCategoriesSection';
import { CmsCouponsSection } from '../cms/CmsCouponsSection';
import { CmsArticlesSection } from '../cms/CmsArticlesSection';
import { CmsMediaSection } from '../cms/CmsMediaSection';
import { CmsSeoSection } from '../cms/CmsSeoSection';
import { CmsInsuranceSection } from '../cms/CmsInsuranceSection';

export const CmsTab = ({
  cmsActiveSubTab,
  setCmsActiveSubTab,
  settingsForm,
  setSettingsForm,
  onSaveSettings,
  cmsBanners,
  cmsCategories,
  cmsPromoCodes,
  cmsArticles,
  onOpenNewBannerModal,
  onEditBanner,
  onDeleteBanner,
  onOpenNewCategoryModal,
  onDeleteCategory,
  onOpenNewCouponModal,
  onDeleteCoupon,
  onOpenNewArticleModal,
  onDeleteArticle,
  onOpenNewMediaModal,
  onDeleteMedia,
}) => {
  const subTabs = [
    { id: 'identity', label: 'هوية المنصة واللوجو', icon: Globe },
    { id: 'business', label: 'بيانات التواصل والشحن', icon: Phone },
    { id: 'notifications', label: 'إشعارات تليجرام والإيميل (Alerts)', icon: Send },
    { id: 'social', label: 'السوشيال ميديا', icon: Share2 },
    { id: 'banners', label: `السلايدر والبانرات (${cmsBanners.length})`, icon: ImageIcon },
    { id: 'quickCards', label: `بطاقات الخدمات السريعة (${(settingsForm.quickCards || []).length || 4})`, icon: LayoutGrid },
    { id: 'categories', label: `الأقسام والتصنيفات (${cmsCategories.length})`, icon: Layers },
    { id: 'coupons', label: `أكواد الخصم (${cmsPromoCodes.length})`, icon: Tag },
    { id: 'articles', label: `المقالات والنصائح (${cmsArticles.length})`, icon: BookOpen },
    { id: 'media', label: `مكتبة الصور والوسائط (${(settingsForm.mediaLibrary || []).length})`, icon: Sparkles },
    { id: 'insurance', label: `جهات التعاقد والتأمين (${(settingsForm.insuranceCompanies || []).length || 6})`, icon: ShieldCheck },
    { id: 'seo', label: 'محركات البحث (SEO)', icon: Search },
  ];

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="نظام إدارة المحتوى والمتجر (CMS Control Hub)"
        description="التحكم الكامل في واجهة المتجر، الهوية البصرية، العروض الترويجية، ومكتبة الوسائط"
      />

      {/* Sub-Tabs Pill Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {subTabs.map((sub) => {
          const Icon = sub.icon;
          const isActive = cmsActiveSubTab === sub.id;

          return (
            <button
              key={sub.id}
              onClick={() => setCmsActiveSubTab(sub.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Sub-section */}
      <div>
        {cmsActiveSubTab === 'identity' && (
          <CmsIdentitySection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}

        {cmsActiveSubTab === 'business' && (
          <CmsBusinessSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}

        {cmsActiveSubTab === 'notifications' && (
          <CmsNotificationsSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}

        {cmsActiveSubTab === 'social' && (
          <CmsSocialSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}

        {cmsActiveSubTab === 'banners' && (
          <CmsBannersSection
            banners={cmsBanners}
            onOpenNewBannerModal={onOpenNewBannerModal}
            onEditBanner={onEditBanner}
            onDeleteBanner={onDeleteBanner}
          />
        )}

        {cmsActiveSubTab === 'quickCards' && (
          <CmsQuickCardsSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}

        {cmsActiveSubTab === 'categories' && (
          <CmsCategoriesSection
            categories={cmsCategories}
            onOpenNewCategoryModal={onOpenNewCategoryModal}
            onDeleteCategory={onDeleteCategory}
          />
        )}

        {cmsActiveSubTab === 'coupons' && (
          <CmsCouponsSection
            coupons={cmsPromoCodes}
            onOpenNewCouponModal={onOpenNewCouponModal}
            onDeleteCoupon={onDeleteCoupon}
          />
        )}

        {cmsActiveSubTab === 'articles' && (
          <CmsArticlesSection
            articles={cmsArticles}
            onOpenNewArticleModal={onOpenNewArticleModal}
            onDeleteArticle={onDeleteArticle}
          />
        )}

        {cmsActiveSubTab === 'media' && (
          <CmsMediaSection
            mediaList={settingsForm.mediaLibrary || []}
            onOpenNewMediaModal={onOpenNewMediaModal}
            onDeleteMedia={onDeleteMedia}
          />
        )}

        {cmsActiveSubTab === 'insurance' && (
          <CmsInsuranceSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}

        {cmsActiveSubTab === 'seo' && (
          <CmsSeoSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSave={onSaveSettings}
          />
        )}
      </div>
    </div>
  );
};
