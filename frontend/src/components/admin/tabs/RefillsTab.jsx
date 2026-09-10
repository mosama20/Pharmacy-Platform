import React, { useState } from 'react';
import {
  Clock,
  Phone,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pill,
  MessageCircle,
  Sparkles,
  Percent,
  Save,
  Truck,
  MapPin,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { api } from '../../../services/api';

export const RefillsTab = ({
  refills = [],
  refillDiscountPercent = 15,
  onUpdateDiscount,
  onRefreshRefills,
}) => {
  const [discountInput, setDiscountInput] = useState(refillDiscountPercent);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (typeof onUpdateDiscount !== 'function') return;
    setSavingDiscount(true);
    setDiscountMessage('');
    try {
      await onUpdateDiscount(Number(discountInput));
      setDiscountMessage('تم تحديث نسبة الخصم بنجاح!');
      setTimeout(() => setDiscountMessage(''), 3000);
    } catch (err) {
      alert('فشل تحديث الخصم: ' + err.message);
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setTogglingId(id);
    try {
      await api.toggleRefillStatus(id);
      if (typeof onRefreshRefills === 'function') {
        onRefreshRefills();
      }
    } catch (err) {
      alert('فشل تعديل حالة الاشتراك: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="اشتراكات الدواء الشهري (Chronic Refills)"
        description="متابعة تكرار الأدوية المزمنة للمرضى، مواعيد التجديد الشهري، والتحكم بنسبة الخصم"
        badge={`${refills.length} اشتراك`}
      />

      {/* Quick Dashboard Discount Control Bar */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white shadow-lg shadow-teal-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-200 border border-white/10 shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                نسبة خصم خدمة الدواء الشهري للمرضى
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-900 shadow-xs">
                {refillDiscountPercent}% حالياً
              </span>
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              تطبق هذه النسبة ديناميكياً على كافة المشتركين وتظهر في نافذة الطلب وتجهيز الأدوية.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSaveDiscount}
          className="flex items-center gap-2 w-full md:w-auto bg-black/20 p-1.5 rounded-2xl border border-white/10"
        >
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl bg-white text-slate-900 font-mono font-black text-center text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
            />
            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>

          <button
            type="submit"
            disabled={savingDiscount || Number(discountInput) === Number(refillDiscountPercent)}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs cursor-pointer shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingDiscount ? 'جاري الحفظ...' : 'تعديل النسبة'}</span>
          </button>
        </form>
      </div>

      {discountMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{discountMessage}</span>
        </div>
      )}

      {/* Subscriptions List */}
      {refills.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="لا توجد اشتراكات دواء شهري حالياً"
          description="عند قيام المرضى بتسجيل أدويتهم المزمنة للتكرار الشهري ستظهر سجلاتهم وقوائم أصنافهم هنا للمتابعة."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {refills.map((ref) => {
            const isActive = ref.status === 'ACTIVE' || !ref.status;
            const patientName = ref.customerName || ref.user?.name || ref.patientName || 'مريض الدواء الشهري';
            const patientPhone = ref.customerPhone || ref.user?.phone || ref.phone || '';
            const rawPhone = patientPhone.replace(/[^0-9]/g, '');
            const whatsappNumber = rawPhone.startsWith('0') ? '2' + rawPhone : rawPhone;
            const appliedDiscount = ref.discountPercent ?? refillDiscountPercent ?? 15;
            const renewalDay = ref.renewalDay || 1;

            return (
              <div
                key={ref.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'border-slate-200/80 dark:border-slate-800 hover:border-teal-400'
                    : 'border-amber-200/80 dark:border-amber-900/40 opacity-80'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                        #{ref.id.slice(-6)}
                      </span>
                      <span className="font-mono font-bold text-[11px] bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-lg border border-teal-200/60 dark:border-teal-800/60">
                        خصم {appliedDiscount}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(ref.id)}
                      disabled={togglingId === ref.id}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                      title="انقر لتغيير حالة الاشتراك"
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>اشتراك نشط</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3 h-3" />
                          <span>متوقف مؤقتاً</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Patient Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600 shrink-0" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {patientName}
                      </h4>
                    </div>
                    {patientPhone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1 mr-6">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{patientPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Medication Items List */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-teal-600" />
                        الأصناف العلاجية المكررة:
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ref.items?.length || ref.monthlyQuantity || 1} أصناف
                      </span>
                    </div>

                    {ref.items && Array.isArray(ref.items) && ref.items.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {ref.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {item.name}
                              </span>
                              {item.dosage && (
                                <span className="text-[10px] text-slate-400 block">
                                  {item.dosage}
                                </span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono font-bold text-[11px] shrink-0">
                              {item.quantity} علبة
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {ref.medicationName || ref.medicineName || 'أدوية علاجية مخصصة'}
                      </div>
                    )}

                    {ref.dosageSchedule && !ref.items && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        الجرعة: {ref.dosageSchedule}
                      </div>
                    )}

                    {ref.notes && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/50">
                        ملاحظات: {ref.notes}
                      </div>
                    )}
                  </div>

                  {/* Delivery Schedule & Address */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        موعد التوصيل:
                      </span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">
                        يوم {renewalDay} من كل شهر
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        العنوان:
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={ref.deliveryAddress}>
                        {ref.deliveryAddress || ref.governorate || 'القاهرة'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {patientPhone && (
                    <>
                      <a
                        href={`tel:${patientPhone}`}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>اتصال</span>
                      </a>

                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                          `مرحباً أ/ ${patientName}، نتواصل معك من إدارة الصيدلية بخصوص تكرار خدمة الدواء الشهري المجدولة في يوم (${renewalDay}) ومراجعة الأصناف وتجهيزها بخصم ${appliedDiscount}%.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
