import React from 'react';
import { Plus, Trash2, Edit3, Image as ImageIcon, Sparkles, CheckCircle2, EyeOff } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const CmsBannersSection = ({
  banners = [],
  onOpenNewBannerModal,
  onEditBanner,
  onDeleteBanner,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>بانرات الواجهة والسلايدر الرئيسي ({banners.length})</span>
          </h3>
          <p className="text-xs text-slate-400">
            العروض الترويجية والإعلانات التي تظهر أعلى الصفحة الرئيسية مع إمكانية الإضافة والتعديل والحذف
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
          {banners.map((ban) => {
            const isActive = ban.isActive !== false;
            return (
              <div
                key={ban.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs space-y-4 flex flex-col justify-between ${
                  isActive
                    ? 'border-slate-200/80 dark:border-slate-800'
                    : 'border-amber-300/60 dark:border-amber-700/60 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="h-44 rounded-2xl overflow-hidden bg-slate-900 relative group">
                    <img
                      src={ban.img}
                      alt={ban.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {ban.tag && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-md">
                          {ban.tag}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${
                          isActive
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط بالواجهة</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>معطل / مخفي</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Preview on image */}
                    <div className="absolute bottom-3 right-3 left-3 text-right">
                      <h5 className="text-white text-xs font-bold line-clamp-1">{ban.title}</h5>
                      <span className="text-[10px] text-white/80 line-clamp-1">{ban.subtitle}</span>
                    </div>
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      زر: {ban.ctaText || 'اطلب الآن'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                      إجراء: {ban.actionType === 'upload' ? 'رفع روشتة' : ban.actionType === 'refill' ? 'دواء شهري' : ban.actionType === 'category' ? `قسم: ${ban.actionValue || ''}` : 'رابط'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onEditBanner && onEditBanner(ban)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="تعديل البانر"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => onDeleteBanner(ban.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                      title="حذف البانر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
