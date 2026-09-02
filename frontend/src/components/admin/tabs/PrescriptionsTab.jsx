import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const PrescriptionsTab = ({
  prescriptions = [],
  onSelectRxForReview,
}) => {
  const pendingCount = prescriptions.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="فحص وتدقيق وتسعير الروشتات"
        description="مراجعة الروشتات الطبية المرفوعة من المرضى، واقتراح الأدوية المعتمدة والبدائل الدوائية"
        badge={pendingCount > 0 ? `${pendingCount} بانتظار الفحص` : `${prescriptions.length} روشتة`}
      />

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد روشتات بانتظار الفحص"
          description="جميع الروشتات المرفوعة تمت مراجعتها وإرسال التسعيرات للمرضى بنجاح."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map((rx) => {
            const isPending = rx.status === 'PENDING';
            const isQuoted = rx.status === 'QUOTED';
            const isApproved = rx.status === 'APPROVED';

            return (
              <div
                key={rx.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-xl border border-teal-200/60 dark:border-teal-800/60">
                      #{rx.id.slice(-6)}
                    </span>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isQuoted
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      <span>
                        {isPending
                          ? 'بانتظار التسعير'
                          : isQuoted
                          ? 'تم إرسال التسعيرة'
                          : isApproved
                          ? 'معتمدة من المريض'
                          : rx.status}
                      </span>
                    </span>
                  </div>

                  {/* Thumbnail & Patient info */}
                  <div className="flex gap-3">
                    <div className="w-20 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {rx.imageUrl ? (
                        <img
                          src={rx.imageUrl}
                          alt="Rx"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1 truncate flex-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                        {rx.user?.name || rx.customerName || 'مريض مسجل'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{rx.user?.phone || rx.customerPhone || '010XXXXXXXX'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {rx.patientNotes || rx.notes || 'لا توجد ملاحظات من المريض'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(rx.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>

                  <button
                    onClick={() => onSelectRxForReview(rx)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isPending ? 'فحص وتسعير الروشتة' : 'عرض التسعيرة'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
