import React from 'react';
import { Plus, Trash2, Tag, Percent, Calendar, CheckCircle2, Layers, Truck } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const CmsCouponsSection = ({
  coupons = [],
  onOpenNewCouponModal,
  onDeleteCoupon,
}) => {
  return (
    <div className="space-y-6 font-cairo">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            أكواد الخصم والكوبونات الترويجية ({coupons.length})
          </h3>
          <p className="text-xs text-slate-400">
            إنشاء وإدارة قسائم الخصم، تخصيص الأقسام، وتفعيل الشحن المجاني
          </p>
        </div>

        <button
          onClick={onOpenNewCouponModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء كود خصم</span>
        </button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="لا توجد أكواد خصم مفعلة"
          description="أنشئ كود خصم لعملائك لزيادة المبيعات والتشجيع على الشراء."
          actionLabel="إنشاء كود خصم"
          onAction={onOpenNewCouponModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                    {c.code}
                  </span>

                  <button
                    onClick={() => onDeleteCoupon(c.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                    title="حذف الكوبون"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Feature Badges: Free Shipping & Category */}
                <div className="flex flex-wrap gap-1.5">
                  {c.isFreeShipping && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200/60 dark:border-teal-800/60">
                      <Truck className="w-3 h-3" />
                      <span>شحن مجاني</span>
                    </span>
                  )}
                  {c.applicableCategory && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200/60 dark:border-purple-800/60">
                      <Layers className="w-3 h-3" />
                      <span>قسم: {c.applicableCategory}</span>
                    </span>
                  )}
                  {!c.applicableCategory && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      كل الأقسام
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">نسبة الخصم:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {c.discountPercentage > 0 ? `${c.discountPercentage}%` : (c.isFreeShipping ? 'شحن مجاني' : '0%')}
                    </span>
                  </div>
                  {c.discountPercentage > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">أقصى قيمة للخصم:</span>
                      <span className="font-mono">{c.maxDiscount} ج.م</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الحد الأدنى للطلب:</span>
                    <span className="font-mono">{c.minOrderValue} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">مرات الاستخدام:</span>
                    <span className="font-mono">{c.timesUsed || c.usedCount || 0} / {c.usageLimit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ينتهي: {c.expiresAt?.slice(0, 10) || 'مستمر'}</span>
                </div>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>نشط ومفعل</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
