import React from 'react';
import { Plus, Trash2, BookOpen, User, Clock, Tag } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const CmsArticlesSection = ({
  articles = [],
  onOpenNewArticleModal,
  onDeleteArticle,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            المقالات والنصائح الطبية ({articles.length})
          </h3>
          <p className="text-xs text-slate-400">
            المحتوى التثقيفي المنشور في مدونة المتجر
          </p>
        </div>

        <button
          onClick={onOpenNewArticleModal}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>نشر مقال جديد</span>
        </button>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="لا توجد مقالات منشورة"
          description="انشر أول مقال طبي لتقديم استشارات موثوقة لمرضى المنصة."
          actionLabel="نشر مقال جديد"
          onAction={onOpenNewArticleModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((art) => (
            <div
              key={art.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-40 rounded-2xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-900/90 text-white backdrop-blur-md">
                    {art.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {art.summary}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {art.author} ({art.authorRole})
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    وقت القراءة: {art.readTime}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteArticle(art.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                  title="حذف المقال"
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
