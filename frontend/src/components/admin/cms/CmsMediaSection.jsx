import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Copy, Check, Sparkles } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const CmsMediaSection = ({
  mediaList = [],
  onOpenNewMediaModal,
  onDeleteMedia,
}) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            مكتبة الصور والوسائط الرقمية ({mediaList.length})
          </h3>
          <p className="text-xs text-slate-400">
            تخزين واستخدام صور المنتجات والبانرات عبر روابط مباشرة
          </p>
        </div>

        <button
          onClick={onOpenNewMediaModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة صورة للمكتبة</span>
        </button>
      </div>

      {mediaList.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="مكتبة الوسائط فارغة"
          description="أضف صور الأدوية والمنتجات لتسهيل إعادة استخدامها في المنصة."
          actionLabel="إضافة صورة للمكتبة"
          onAction={onOpenNewMediaModal}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {mediaList.map((med) => (
            <div
              key={med.id}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img
                    src={med.url}
                    alt={med.alt || med.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {med.category && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                      {med.category}
                    </span>
                  )}
                </div>

                <span className="font-bold text-xs text-slate-900 dark:text-white block truncate" title={med.name}>
                  {med.name}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                <button
                  onClick={() => handleCopyUrl(med.id, med.url)}
                  className="flex-1 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="نسخ الرابط"
                >
                  {copiedId === med.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onDeleteMedia(med.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
