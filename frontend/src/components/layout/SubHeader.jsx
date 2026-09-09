import React from 'react';
import {
  Pill,
  Sparkles,
  HeartPulse,
  Baby,
  Smile,
  Flame,
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
  { id: 'supplements', name: 'الفيتامينات والمكملات (Vitamins)', label: 'فيتامينات ومكملات', icon: HeartPulse },
  { id: 'skin', name: 'العناية بالبشرة (Skin Care)', label: 'عناية بالبشرة', icon: Sparkles },
  { id: 'baby', name: 'الأم والطفل (Mom & Baby)', label: 'الأم والطفل', icon: Baby },
  { id: 'devices', name: 'الأجهزة والمستلزمات الطبية (Health Care Devices)', label: 'أجهزة ومستلزمات', icon: Smile },
];

export const SubHeader = ({ selectedCategory, onSelectCategory }) => {
  const { categories } = useCms();

  const categoriesList = categories && categories.length > 0
    ? categories.map((c) => ({
        id: c.id || c.slug,
        name: c.name,
        label: c.label || c.name.replace(/\s*\([^)]*\)/g, '').trim(),
        icon: iconMap[c.iconName] || (c.isSpecial ? Flame : Pill),
        isSpecial: c.isSpecial,
      }))
    : defaultCategories;

  return (
    <div
      id="categories-bar"
      className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar scrollbar-none"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-start gap-1 sm:gap-2 min-w-max">
        {categoriesList.map((cat) => {
          const Icon = cat.icon || Pill;
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id || cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs'
                  : cat.isSpecial
                  ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 font-medium'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : cat.isSpecial
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span>{cat.label || cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
