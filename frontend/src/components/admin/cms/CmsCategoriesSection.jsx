import React from 'react';
import { Plus, Trash2, Layers, Pill, Sparkles, HeartPulse, Baby, Smile, Flame } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

const iconMap = {
  Pill: Pill,
  Sparkles: Sparkles,
  HeartPulse: HeartPulse,
  Baby: Baby,
  Smile: Smile,
  Flame: Flame,
  Layers: Layers,
};

export const CmsCategoriesSection = ({
  categories = [],
  onOpenNewCategoryModal,
  onDeleteCategory,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            أقسام وتصنيفات المتجر ({categories.length})
          </h3>
          <p className="text-xs text-slate-400">
            التصنيفات الدوائية ومستحضرات التجميل والأقسام المعروضة
          </p>
        </div>

        <button
          onClick={onOpenNewCategoryModal}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="لا توجد أقسام مسجلة"
          description="أضف تصنيفات المنتجات والأدوية لتنظيم واجهة المتجر."
          actionLabel="إضافة قسم جديد"
          onAction={onOpenNewCategoryModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const IconComponent = iconMap[cat.iconName] || Layers;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                    title="حذف القسم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {cat.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    /{cat.slug}
                  </span>
                </div>

                {cat.isSpecial && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md w-fit">
                    قسم مميز بالواجهة
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
