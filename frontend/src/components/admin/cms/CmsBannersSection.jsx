import React from 'react';
import { Plus, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const CmsBannersSection = ({
  banners = [],
  onOpenNewBannerModal,
  onDeleteBanner,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            بانرات الواجهة والسلايدر الرئيسي ({banners.length})
          </h3>
          <p className="text-xs text-slate-400">
            العروض الترويجية والإعلانات التي تظهر أعلى الصفحة الرئيسية
          </p>
        </div>

        <button
          onClick={onOpenNewBannerModal}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة بانر جديد</span>
        </button>
      </div>

      {banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="لا توجد بانرات مضافة"
          description="أضف أول بانر ترويجي للواجهة لجذب انتباه العملاء للعروض الحصرية."
          actionLabel="إضافة بانر جديد"
          onAction={onOpenNewBannerModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((ban) => (
            <div
              key={ban.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-40 rounded-2xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={ban.img}
                    alt={ban.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  {ban.tag && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-md">
                      {ban.tag}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {ban.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {ban.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    زر: {ban.ctaText || 'اطلب الآن'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    إجراء: {ban.actionType}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteBanner(ban.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                  title="حذف البانر"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
