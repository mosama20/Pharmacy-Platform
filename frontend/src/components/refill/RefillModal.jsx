import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Heart,
  Pill,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

const REFILL_PRESETS = [
  {
    id: 'diab_htn',
    title: 'باقة السكر والضغط المتكاملة',
    meds: 'جلوكوفاج 1000 مجم + كونكور 5 مجم',
    dosage: 'قرص بعد الإفطار وقرص بعد العشاء',
    basePrice: 175,
  },
  {
    id: 'cardiac',
    title: 'باقة رعاية القلب والسيولة',
    meds: 'أسبوسيد أطفال 75 مجم + بلافيكس 75 مجم',
    dosage: 'قرص واحد يومياً بعد الغداء',
    basePrice: 190,
  },
  {
    id: 'cholesterol',
    title: 'باقة الدهون الثلاثية والكوليسترول',
    meds: 'أتور 20 مجم + أوميجا 3 بلس كبسول',
    dosage: 'كبسولة مساءً قبل النوم',
    basePrice: 160,
  },
  {
    id: 'custom',
    title: 'روشتة أو أدوية مخصصة لحالتي',
    meds: '',
    dosage: '',
    basePrice: 150,
  },
];

export const RefillModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedGovernorate, selectedDistrict } = useLocation();

  const [selectedPreset, setSelectedPreset] = useState('diab_htn');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [medicationName, setMedicationName] = useState('جلوكوفاج 1000 مجم + كونكور 5 مجم (باقة السكر والضغط)');
  const [dosageSchedule, setDosageSchedule] = useState('قرص صباحاً بعد الفطار وقرص مساءً');
  const [monthlyQuantity, setMonthlyQuantity] = useState(2);
  const [renewalDay, setRenewalDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentPreset = REFILL_PRESETS.find((p) => p.id === selectedPreset);
  const unitPrice = currentPreset?.basePrice || 150;
  const calculatedTotal = Math.round(unitPrice * Number(monthlyQuantity) * 0.85); // 15% discount for subscribers

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.id !== 'custom') {
      setMedicationName(preset.meds);
      setDosageSchedule(preset.dosage);
    } else {
      setMedicationName('');
      setDosageSchedule('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !medicationName) {
      setError('يرجى استكمال بيانات اسم المريض ورقم الهاتف والدواء');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createRefill({
        customerId: user?.id || 'guest_user',
        customerName,
        customerPhone,
        medicationName,
        dosageSchedule,
        monthlyQuantity: Number(monthlyQuantity),
        price: calculatedTotal,
        deliveryAddress: `${selectedGovernorate} - ${selectedDistrict}`,
        governorate: selectedGovernorate,
        renewalDay: Number(renewalDay),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'فشل تفعيل الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-700 to-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">باقة الدواء الشهري للأمراض المزمنة</h3>
              <p className="text-xs text-teal-100">
                تكرار وتوصيل تلقائي كل 30 يوم بخصم 15% وتوصيل مجاني
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                تم تفعيل باقة الدواء الشهري بنجاح!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                سنقوم بتجهيز أدويتك وتذكيرك كل شهر في يوم ({renewalDay}) وتوصيلها إلى باب منزلك تلقائياً دون انقطاع.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md hover:bg-emerald-700"
              >
                حسناً، تم
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اختر الباقة العلاجية أو نوع الدواء:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REFILL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer text-xs ${
                        selectedPreset === preset.id
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                      }`}
                    >
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الدواء أو الباقة العلاجية:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كونكور 5 مجم + جلوكوفاج 1000"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الجرعة اليومية وتعليمات الاستخدام:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قرص بعد الإفطار وقرص بعد العشاء"
                  value={dosageSchedule}
                  onChange={(e) => setDosageSchedule(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية الشهرية (علب):
                  </label>
                  <select
                    value={monthlyQuantity}
                    onChange={(e) => setMonthlyQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value={1}>علبة واحدة (تكفي 30 يوم)</option>
                    <option value={2}>علبتين (تكفي 60 يوم)</option>
                    <option value={3}>3 علب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    يوم التوصيل كل شهر:
                  </label>
                  <select
                    value={renewalDay}
                    onChange={(e) => setRenewalDay(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value={1}>يوم 1 من كل شهر</option>
                    <option value={5}>يوم 5 من كل شهر</option>
                    <option value={10}>يوم 10 من كل شهر</option>
                    <option value={15}>يوم 15 من كل شهر</option>
                    <option value={20}>يوم 20 من كل شهر</option>
                    <option value={25}>يوم 25 من كل شهر</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم بالكامل:
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف:
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-bold">
                    قيمة الاشتراك الشهري (شامل الخصم 15% والتوصيل المجاني):
                  </span>
                  <span className="text-xs text-slate-500 line-through">
                    {unitPrice * Number(monthlyQuantity)} ج.م
                  </span>
                </div>
                <strong className="text-lg font-black text-emerald-600 font-mono">
                  {calculatedTotal} ج.م / شهر
                </strong>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {loading ? 'جاري تفعيل الاشتراك...' : 'تفعيل باقة التكرار الشهري الآن'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
