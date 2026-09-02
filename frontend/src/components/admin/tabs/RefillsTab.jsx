import React from 'react';
import { Clock, Phone, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const RefillsTab = ({ refills = [] }) => {
  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="اشتراكات باقة الدواء الشهري (Chronic Refills)"
        description="متابعة تكرار الأدوية المزمنة للمرضى ومواعيد الجرعات الدورية"
        badge={`${refills.length} مشترك`}
      />

      {refills.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="لا توجد اشتراكات دواء شهري حالياً"
          description="عند قيام المرضى بالاشتراك في باقة التكرار الشهري ستظهر سجلاتهم هنا للمتابعة."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {refills.map((ref) => {
            const isActive = ref.status === 'ACTIVE' || !ref.status;

            return (
              <div
                key={ref.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                      #{ref.id.slice(-6)}
                    </span>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isActive ? 'اشتراك نشط' : ref.status}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      {ref.user?.name || ref.patientName || 'المريض المشترك'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{ref.user?.phone || ref.phone || '010XXXXXXXX'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">الدواء المطلوب:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {ref.medicineName || ref.productName || 'أدوية الضغط والسكر'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">دورة التكرار:</span>
                      <span className="font-bold text-emerald-600">
                        كل {ref.intervalDays || 30} يوماً
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المدينة / العنوان:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {ref.city || 'القاهرة'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاريخ التجديد: {ref.nextRefillDate?.slice(0, 10) || 'بعد 15 يوماً'}</span>
                  </div>

                  <a
                    href={`tel:${ref.user?.phone || ref.phone}`}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    اتصال بالمريض
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
