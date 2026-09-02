import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'لا توجد بيانات متاحة',
  description = 'لم نتمكن من العثور على أي عناصر مطابقة لبحثك أو التصنيف الحالي.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-md mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto shadow-inner">
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
