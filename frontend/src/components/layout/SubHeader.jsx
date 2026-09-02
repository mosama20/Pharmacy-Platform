import React from 'react';
import {
  Pill,
  Sparkles,
  HeartPulse,
  Baby,
  Smile,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

const iconMap = {
  Layers: Layers,
  Pill: Pill,
  Sparkles: Sparkles,
  HeartPulse: HeartPulse,
  Baby: Baby,
  Smile: Smile,
  Flame: Flame,
};

const defaultCategories = [
  { id: 'all', name: 'الكل', icon: Layers },
  { id: 'meds', name: 'أدوية وعلاج', icon: Pill },
  { id: 'skin', name: 'العناية بالبشرة', icon: Sparkles },
  { id: 'supplements', name: 'الفيتامينات والمكملات', icon: HeartPulse },
  { id: 'baby', name: 'الأم والطفل', icon: Baby },
  { id: 'devices', name: 'الأجهزة والمستلزمات الطبية', icon: Smile },
  { id: 'deals', name: 'عروض التوفير (Big Save)', icon: Flame, isSpecial: true },
];

export const SubHeader = ({ selectedCategory, onSelectCategory, onOpenRefill }) => {
  const { categories } = useCms();

  const categoriesList = categories && categories.length > 0
    ? categories.map((c) => ({
        id: c.id || c.slug,
        name: c.name,
        icon: iconMap[c.iconName] || (c.isSpecial ? Flame : Pill),
        isSpecial: c.isSpecial,
      }))
    : defaultCategories;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-nowrap">
          {categoriesList.map((cat) => {
            const Icon = cat.icon || Pill;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  cat.isSpecial
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${cat.isSpecial ? 'animate-pulse text-amber-500' : ''}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chronic Refill Banner shortcut */}
        <button
          onClick={onOpenRefill}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer whitespace-nowrap"
        >
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>اشتراك الروشتة الشهرية للأمراض المزمنة</span>
        </button>
      </div>
    </div>
  );
};
