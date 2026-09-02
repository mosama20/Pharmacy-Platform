import React from 'react';

export const PageHeader = ({
  title,
  description,
  badge,
  actions,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-tajawal tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};
