import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  colorScheme = 'emerald', // emerald, purple, blue, amber, red, teal
}) => {
  const schemeStyles = {
    emerald: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/20',
      border: 'border-emerald-200/60 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-600/20',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
    },
    purple: {
      bg: 'bg-purple-50/80 dark:bg-purple-950/20',
      border: 'border-purple-200/60 dark:border-purple-800/40',
      iconBg: 'bg-purple-600 text-white shadow-purple-600/20',
      valueColor: 'text-purple-700 dark:text-purple-400',
    },
    blue: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/20',
      border: 'border-blue-200/60 dark:border-blue-800/40',
      iconBg: 'bg-blue-600 text-white shadow-blue-600/20',
      valueColor: 'text-blue-700 dark:text-blue-400',
    },
    amber: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/20',
      border: 'border-amber-200/60 dark:border-amber-800/40',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
      valueColor: 'text-amber-700 dark:text-amber-400',
    },
    red: {
      bg: 'bg-red-50/80 dark:bg-red-950/20',
      border: 'border-red-200/60 dark:border-red-800/40',
      iconBg: 'bg-red-600 text-white shadow-red-600/20',
      valueColor: 'text-red-700 dark:text-red-400',
    },
    teal: {
      bg: 'bg-teal-50/80 dark:bg-teal-950/20',
      border: 'border-teal-200/60 dark:border-teal-800/40',
      iconBg: 'bg-teal-600 text-white shadow-teal-600/20',
      valueColor: 'text-teal-700 dark:text-teal-400',
    },
  };

  const currentScheme = schemeStyles[colorScheme] || schemeStyles.emerald;

  return (
    <div
      className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border ${currentScheme.border} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
            {title}
          </span>
          <span className={`text-2xl font-black font-mono tracking-tight block ${currentScheme.valueColor}`}>
            {value}
          </span>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${currentScheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          {subtitle && (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {subtitle}
            </span>
          )}

          {trend && (
            <div
              className={`flex items-center gap-0.5 font-bold font-mono px-2 py-0.5 rounded-full ${
                trendDirection === 'up'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
              }`}
            >
              {trendDirection === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{trend}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
