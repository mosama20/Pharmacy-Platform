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
  { id: 'all', name: 'الكل', label: 'الكل', icon: Layers },
  { id: 'deals', name: 'عروض التوفير (Big Save)', label: 'عروض التوفير', icon: Flame, isSpecial: true },
  { id: 'meds', name: 'الأدوية (Medications)', label: 'أدوية وعلاج', icon: Pill },
  { id: 'supplements', name: 'الفيتامينات والمكملات (Vitamins)', label: 'الفيتامينات والمكملات', icon: HeartPulse },
  { id: 'skin', name: 'العناية بالبشرة (Skin Care)', label: 'العناية بالبشرة', icon: Sparkles },
  { id: 'baby', name: 'الأم والطفل (Mom & Baby)', label: 'الأم والطفل', icon: Baby },
  { id: 'devices', name: 'الأجهزة والمستلزمات الطبية (Health Care Devices)', label: 'الأجهزة الطبية', icon: Smile },
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
    <div
      id="categories-bar"
      className="w-full max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-x-auto no-scrollbar scrollbar-none touch-pan-x"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 min-w-max">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
          {categoriesList.map((cat) => {
            const Icon = cat.icon || Pill;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                  cat.isSpecial
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${cat.isSpecial ? 'animate-pulse text-amber-500' : ''}`} />
                <span>{cat.label || cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chronic Refill Banner shortcut (Desktop) */}
        <button
          onClick={onOpenRefill}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>اشتراك الروشتة الشهرية للأمراض المزمنة</span>
        </button>
      </div>
    </div>
  );
};
