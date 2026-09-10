import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  CreditCard,
  User,
  Phone,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { CmsInsuranceSection } from '../cms/CmsInsuranceSection';

export const InsuranceTab = ({
  prescriptions = [],
  settingsForm,
  setSettingsForm,
  onSaveSettings,
  onSelectRxForReview,
  onUpdateRxStatus,
}) => {
  const [activeSubView, setActiveSubView] = useState('orders'); // 'orders' | 'companies'
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Filter only prescriptions that are insurance-related
  const insuranceRxList = useMemo(() => {
    return prescriptions.filter(
      (rx) => Boolean(rx.hasInsurance) || Boolean(rx.insuranceCompany)
    );
  }, [prescriptions]);

  // Companies list from settings
  const insuranceCompanies = useMemo(() => {
    return settingsForm?.insuranceCompanies || [];
  }, [settingsForm?.insuranceCompanies]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = insuranceRxList.length;
    const pending = insuranceRxList.filter((r) => r.status === 'PENDING').length;
    const quoted = insuranceRxList.filter((r) => r.status === 'QUOTED').length;
    const completed = insuranceRxList.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'ORDER_CREATED'
    ).length;
    const activeCompanies = insuranceCompanies.filter((c) => c.isActive !== false).length;

    return { total, pending, quoted, completed, activeCompanies };
  }, [insuranceRxList, insuranceCompanies]);

  // Filtered List
  const filteredList = useMemo(() => {
    return insuranceRxList.filter((rx) => {
      // Company filter
      if (selectedCompanyFilter !== 'ALL') {
        if (!rx.insuranceCompany?.toLowerCase().includes(selectedCompanyFilter.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        if (rx.status !== selectedStatusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = rx.customerName?.toLowerCase().includes(q);
        const matchesPhone = rx.customerPhone?.includes(q);
        const matchesCard = rx.insuranceCardNumber?.toLowerCase().includes(q);
        const matchesNatId = rx.nationalId?.includes(q);
        const matchesCompany = rx.insuranceCompany?.toLowerCase().includes(q);
        const matchesMedicine = rx.requestedItems?.some((it) =>
          it.productName?.toLowerCase().includes(q)
        );

        if (
          !matchesName &&
          !matchesPhone &&
          !matchesCard &&
          !matchesNatId &&
          !matchesCompany &&
          !matchesMedicine
        ) {
          return false;
        }
      }

      return true;
    });
  }, [insuranceRxList, selectedCompanyFilter, selectedStatusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 animate-spin" />
            بانتظار الفحص والتسعير
          </span>
        );
      case 'QUOTED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            تم التسعير (بانتظار العميل)
          </span>
        );
      case 'ACCEPTED':
      case 'ORDER_CREATED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            معتمدة وجاري التوصيل
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            ملغاة / مرفوضة
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Metric Cards */}
      <div className="bg-gradient-to-l from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>إدارة التعاقدات وبطاقات التأمين الطبي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-tajawal">
              قسم الروشتات والتعاقدات التأمينية
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              متابعة وفحص روشتات عملاء الشركات المتعاقدة (سامسونج، توشيبا، يونيكير، أكسا، وغيرها)،
              والتحقق من بطاقات التأمين، وتسعير الأصناف المطلوبة بضغطة زر.
            </p>
          </div>

          {/* Sub-view Switcher */}
          <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveSubView('orders')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubView === 'orders'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>طلبات التأمين والروشتات ({metrics.total})</span>
            </button>
            <button
              onClick={() => setActiveSubView('companies')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubView === 'companies'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>جهات وشركات التعاقد ({metrics.activeCompanies})</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5">
            <p className="text-[11px] text-emerald-200/80 font-medium">إجمالي طلبات التأمين</p>
            <p className="text-xl sm:text-2xl font-black mt-1">{metrics.total}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5">
            <p className="text-[11px] text-amber-200/90 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              بانتظار التسعير والفحص
            </p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-amber-300">{metrics.pending}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5">
            <p className="text-[11px] text-blue-200/90 font-medium">تم تسعيرها وتنتظر المريض</p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-blue-300">{metrics.quoted}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5">
            <p className="text-[11px] text-emerald-200/80 font-medium">شركات التعاقد المعتمدة</p>
            <p className="text-xl sm:text-2xl font-black mt-1">{metrics.activeCompanies}</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: ORDERS & PRESCRIPTIONS TAB */}
      {/* ============================================================ */}
      {activeSubView === 'orders' && (
        <div className="space-y-5">
          {/* Filters and Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المريض، رقم الكارت، الدواء..."
                className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {/* Company Filter Dropdown */}
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">جميع الشركات والجهات</option>
                {insuranceCompanies.map((comp) => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name}
                  </option>
                ))}
              </select>

              {/* Status Filter Dropdown */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="PENDING">بانتظار الفحص والتسعير</option>
                <option value="QUOTED">تم تسعيرها</option>
                <option value="ACCEPTED">معتمدة للتوصيل</option>
                <option value="REJECTED">ملغاة ومرفوضة</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          {filteredList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  لا توجد طلبات تأمين مطابقة
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  لم يتم العثور على أي روشتات تأمين تطابق الفلاتر المحددة حالياً.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredList.map((rx) => {
                const hasCardPhoto = Boolean(rx.insuranceCardPhoto);
                const hasRxPhoto = Boolean(
                  (rx.images && rx.images.length > 0) || rx.imageUrl
                );
                const rxDisplayImg = rx.imageUrl || rx.images?.[0];

                return (
                  <div
                    key={rx.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row: Company & Status */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {rx.insuranceCompany || 'تعاقد خاص'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                #{rx.id}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                              {rx.customerName}
                            </h3>
                          </div>
                        </div>

                        <div>{getStatusBadge(rx.status)}</div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-emerald-500" />
                            <span>رقم الكارت / العضوية</span>
                          </p>
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate">
                            {rx.insuranceCardNumber || 'غير محدد'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-500" />
                            <span>الرقم القومي للمشترك</span>
                          </p>
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate">
                            {rx.nationalId || 'غير مسجل'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-teal-500" />
                            <span>رقم هاتف التواصل</span>
                          </p>
                          <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            <a
                              href={`tel:${rx.customerPhone}`}
                              className="hover:text-emerald-600 transition-colors"
                            >
                              {rx.customerPhone}
                            </a>
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-0.5">
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            <span>تاريخ ووقت الطلب</span>
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 text-[11px] truncate">
                            {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('ar-EG') : 'الآن'}
                          </p>
                        </div>
                      </div>

                      {/* Requested Items Box */}
                      {rx.requestedItems && rx.requestedItems.length > 0 && (
                        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            <span>الأدوية المطلوبة ({rx.requestedItems.length} صنف):</span>
                            {rx.totalQuote && (
                              <span>إجمالي التسعيرة: {rx.totalQuote} ج.م</span>
                            )}
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-xs">
                            {rx.requestedItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-slate-700 dark:text-slate-300"
                              >
                                <span className="truncate max-w-[220px]">
                                  • {item.productName}{' '}
                                  {item.dosageNote ? `(${item.dosageNote})` : ''}
                                </span>
                                <span className="font-mono font-bold text-emerald-600 shrink-0">
                                  ×{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attached Photos (Rx & Insurance Card) */}
                      <div className="flex items-center gap-3 pt-1">
                        {hasCardPhoto && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(rx.insuranceCardPhoto)}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>معاينة كارت التأمين</span>
                          </button>
                        )}

                        {hasRxPhoto && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(rxDisplayImg)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>صورة الروشتة / الموافقة</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectRxForReview?.(rx)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>تسعير وفحص الروشتة</span>
                      </button>

                      {/* Quick Status Toggle */}
                      {rx.status === 'PENDING' && (
                        <button
                          onClick={() => onUpdateRxStatus?.(rx.id, 'ACCEPTED')}
                          className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold transition-colors cursor-pointer"
                          title="اعتماد مباشر"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: INSURANCE COMPANIES MANAGEMENT (CMS) */}
      {/* ============================================================ */}
      {activeSubView === 'companies' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  لوحة إدارة جهات وشركات التعاقد
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300">
                  يمكنك إضافة جهات جديدة (مثل سامسونج، توشيبا، يونيكير) وتعديل نسب التغطية أو إيقاف أي جهة في أي وقت.
                </p>
              </div>
            </div>
          </div>

          <CmsInsuranceSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            onSaveSettings={onSaveSettings}
          />
        </div>
      )}

      {/* Lightbox / Zoom Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="معاينة المرفق"
              className="max-h-[82vh] w-auto mx-auto object-contain rounded-2xl"
            />
            <div className="absolute top-4 left-4">
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
