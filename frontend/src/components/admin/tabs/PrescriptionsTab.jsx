import React, { useState, useMemo } from 'react';
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
  Search,
  Ban,
  RotateCcw,
  Check,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const PrescriptionsTab = ({
  prescriptions = [],
  onSelectRxForReview,
  onUpdateRxStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    return {
      all: prescriptions.length,
      pending: prescriptions.filter((p) => p.status === 'PENDING' || p.status === 'UNDER_REVIEW').length,
      quoted: prescriptions.filter((p) => p.status === 'QUOTED').length,
      accepted: prescriptions.filter((p) => p.status === 'ACCEPTED' || p.status === 'APPROVED' || p.status === 'ORDER_CREATED').length,
      cancelled: prescriptions.filter((p) => p.status === 'CANCELLED' || p.status === 'REJECTED').length,
      insurance: prescriptions.filter((p) => p.hasInsurance).length,
    };
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      // Status matching
      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = rx.status === 'PENDING' || rx.status === 'UNDER_REVIEW';
      } else if (statusFilter === 'QUOTED') {
        matchesStatus = rx.status === 'QUOTED';
      } else if (statusFilter === 'ACCEPTED') {
        matchesStatus = rx.status === 'ACCEPTED' || rx.status === 'APPROVED' || rx.status === 'ORDER_CREATED';
      } else if (statusFilter === 'CANCELLED') {
        matchesStatus = rx.status === 'CANCELLED' || rx.status === 'REJECTED';
      } else if (statusFilter === 'INSURANCE') {
        matchesStatus = Boolean(rx.hasInsurance);
      }

      // Search matching
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rx.id?.toLowerCase().includes(q) ||
        rx.customerName?.toLowerCase().includes(q) ||
        rx.user?.name?.toLowerCase().includes(q) ||
        rx.insuranceCompany?.toLowerCase().includes(q) ||
        rx.insuranceCardNumber?.toLowerCase().includes(q) ||
        rx.customerPhone?.includes(q) ||
        rx.user?.phone?.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [prescriptions, statusFilter, search]);

  const filterTabs = [
    { id: 'ALL', label: 'جميع الروشتات', count: counts.all },
    { id: 'PENDING', label: 'بانتظار الفحص', count: counts.pending, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    { id: 'INSURANCE', label: 'تعاقدات وتأمين 🏥', count: counts.insurance, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
    { id: 'QUOTED', label: 'تم التسعير', count: counts.quoted, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { id: 'ACCEPTED', label: 'معتمدة من المريض', count: counts.accepted, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { id: 'CANCELLED', label: 'ملغاة ومرفوضة', count: counts.cancelled, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="فحص وتدقيق وتسعير الروشتات"
        description="مراجعة الروشتات الطبية المرفوعة، التسعير الآلي المرتبط بالمخزن، وإدارة الروشتات الملغاة"
        badge={counts.pending > 0 ? `${counts.pending} بانتظار الفحص` : `${prescriptions.length} روشتة`}
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو كود الروشتة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>
        </div>
      </div>

      {filteredPrescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد روشتات مطابقة"
          description="لم يتم العثور على روشتات في هذا القسم أو باستخدام عبارة البحث المحددة."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrescriptions.map((rx) => {
            const isPending = rx.status === 'PENDING' || rx.status === 'UNDER_REVIEW';
            const isQuoted = rx.status === 'QUOTED';
            const isApproved = rx.status === 'ACCEPTED' || rx.status === 'APPROVED' || rx.status === 'ORDER_CREATED';
            const isCancelled = rx.status === 'CANCELLED' || rx.status === 'REJECTED';

            const displayThumb = rx.imageUrl || (Array.isArray(rx.images) && rx.images[0]) || (typeof rx.images === 'string' && rx.images) || '';

            return (
              <div
                key={rx.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all ${
                  isCancelled
                    ? 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
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
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      {isCancelled && <Ban className="w-3 h-3" />}
                      <span>
                        {isPending
                          ? 'بانتظار التسعير'
                          : isQuoted
                          ? 'تم إرسال التسعيرة'
                          : isApproved
                          ? 'معتمدة من المريض'
                          : isCancelled
                          ? 'روشتة ملغاة'
                          : rx.status}
                      </span>
                    </span>
                  </div>

                  {/* Thumbnail & Patient info */}
                  <div className="flex gap-3">
                    <div
                      onClick={() => onSelectRxForReview(rx)}
                      className="w-20 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 transition-all group/thumb"
                      title="اضغط لمعاينة وتكبير الروشتة"
                    >
                      {displayThumb ? (
                        <img
                          src={displayThumb}
                          alt="Rx"
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
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

                      {rx.hasInsurance && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-[10px] font-bold text-teal-700 dark:text-teal-300 max-w-full">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span className="truncate">{rx.insuranceCompany || 'تأمين'} {rx.insuranceCardNumber ? `(كارت #${rx.insuranceCardNumber})` : ''}</span>
                        </div>
                      )}

                      {rx.requestedItems && rx.requestedItems.length > 0 && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          💊 {rx.requestedItems.length} أدوية محددة بالاسم
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {rx.patientNotes || rx.notes || 'لا توجد ملاحظات من المريض'}
                      </p>

                      {/* Quoted Total or Cancellation Reason */}
                      {rx.totalQuote > 0 && (
                        <div className="text-[11px] font-bold text-emerald-600 font-mono">
                          قيمة التسعيرة: {rx.totalQuote} ج.م
                        </div>
                      )}
                      {rx.cancellationReason && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium line-clamp-1">
                          سبب الإلغاء: {rx.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(rx.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Reopen button if cancelled */}
                    {isCancelled && onUpdateRxStatus && (
                      <button
                        onClick={() => onUpdateRxStatus(rx.id, 'UNDER_REVIEW')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="إعادة فتح الروشتة للمراجعة والتسعير"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>إعادة تفعيل</span>
                      </button>
                    )}

                    {/* Review & Quote button */}
                    <button
                      onClick={() => onSelectRxForReview(rx)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                        isCancelled
                          ? 'bg-slate-700 text-white hover:bg-slate-800'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isPending ? 'فحص وتسعير' : 'عرض التفاصيل'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
