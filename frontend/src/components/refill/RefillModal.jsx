import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pill,
  Plus,
  Trash2,
  ShieldCheck,
  Tag,
  Truck,
  FileText,
  User,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useCms } from '../../context/CmsContext';

export const RefillModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedGovernorate, selectedDistrict } = useLocation();
  const { settings } = useCms();

  const discountPercent = settings?.refillDiscountPercent ?? 15;
  const hasFreeDelivery = settings?.refillFreeDelivery ?? true;

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(
    selectedDistrict ? `${selectedGovernorate} - ${selectedDistrict}` : 'القاهرة - التجمع الخامس'
  );
  const [renewalDay, setRenewalDay] = useState(1);
  const [notes, setNotes] = useState('');

  // Dynamic medication items list (Custom chronic medication)
  const [items, setItems] = useState([
    { id: 1, name: '', quantity: 1, dosage: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), name: '', quantity: 1, dosage: '' },
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id, field, val) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('يرجى إدخال اسم المريض ورقم الهاتف للتواصل');
      return;
    }

    const validItems = items.filter((it) => it.name.trim().length > 0);
    if (validItems.length === 0) {
      setError('يرجى كتابة اسم صنف دواء واحد على الأقل ترغب في تكراره شهرياً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const summaryMeds = validItems
        .map((it) => `${it.name.trim()} (${it.quantity} علبة)`)
        .join(' + ');

      const totalQty = validItems.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

      await api.createRefill({
        customerId: user?.id || 'guest_user',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: validItems.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity) || 1,
          dosage: it.dosage?.trim() || '',
        })),
        medicationName: summaryMeds,
        dosageSchedule: validItems
          .filter((it) => it.dosage)
          .map((it) => `${it.name}: ${it.dosage}`)
          .join(' | ') || 'حسب إرشادات الطبيب',
        monthlyQuantity: totalQty,
        discountPercent,
        deliveryAddress,
        governorate: selectedGovernorate || 'القاهرة',
        renewalDay: Number(renewalDay),
        notes: notes.trim(),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'فشل تفعيل خدمة الدواء الشهري');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] bg-white dark:bg-slate-900 font-cairo">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-teal-200 border border-white/10 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">خدمة الدواء الشهري للأمراض المزمنة</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 shadow-xs">
                  خصم {discountPercent}%
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                سجل أدويتك التي تكررها دورياً لتصلك تلقائياً كل شهر دون انقطاع
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Discount Banner */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="font-bold">
              خصم دوري حصري بنسبة {discountPercent}% على مشتريات الدواء الشهري
            </span>
          </div>
          {hasFreeDelivery && (
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-teal-700 dark:text-teal-300">
              <Truck className="w-3.5 h-3.5" />
              <span>+ توصيل مجاني دوري</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {success ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  تم تسجيل اشتراك الدواء الشهري بنجاح!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  سيقوم الصيدلي المختص بمراجعة الأصناف وتجهيزها بخصم <strong>{discountPercent}%</strong> وتأكيد الموعد الدوري معك هاتفياً أو عبر الواتساب كل شهر في يوم (<strong>{renewalDay}</strong>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-right text-xs space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>المريض:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{customerName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>يوم التوصيل المجدول:</span>
                  <span className="font-bold text-teal-600 font-mono">يوم {renewalDay} من كل شهر</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>الأصناف المسجلة:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{items.length} أصناف</span>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-lg shadow-teal-600/25 transition-all"
              >
                حسناً، تم
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-2 border border-red-200/60 dark:border-red-900/60">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section: Custom Medication Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      قائمة الأدوية والأصناف المكررة شهرياً:
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    أضف كل صنف وكميته المطلوبة
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition-all focus-within:border-teal-400"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        <input
                          type="text"
                          required
                          placeholder="اسم الدواء والتركيز (مثال: كونكور 5 مجم أو جلوكوفاج 1000)"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 font-semibold"
                        />

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                            title="حذف هذا الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            الكمية الشهرية:
                          </span>
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-2 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(item.id, 'quantity', Math.max(1, (Number(item.quantity) || 1) - 1))
                              }
                              className="w-5 h-5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(item.id, 'quantity', (Number(item.quantity) || 1) + 1)
                              }
                              className="w-5 h-5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-slate-400 mr-1">علبة</span>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="الجرعة (اختياري: مثال: قرص صباحاً بعد الإفطار)"
                            value={item.dosage}
                            onChange={(e) => handleUpdateItem(item.id, 'dosage', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-800/80 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-50 hover:border-teal-400 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة صنف دواء آخر للاشتراك</span>
                </button>
              </div>

              {/* Delivery Day Schedule */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    يوم التوصيل والتجديد المفضل كل شهر:
                  </label>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 5, 10, 15, 20, 25].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setRenewalDay(day)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        renewalDay === day
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                      }`}
                    >
                      يوم {day}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  سيتم تذكيرك وتجهيز الأدوية تلقائياً كل 30 يوماً في هذا التاريخ.
                </p>
              </div>

              {/* Patient Contact & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المريض بالكامل:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="اسم المريض الثلاثي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / الواتساب:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان التوصيل الشهري:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="المحافظة - المنطقة - اسم الشارع ورقم العمارة والشقة"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو توصيات خاصة للصيدلي (اختياري):
                </label>
                <textarea
                  rows="2"
                  placeholder="مثال: يفضل شركة محددة، أو الاتصال قبل الحضور بساعة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              {/* Reassurance Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  يقوم الصيدلي بمراجعة أصنافك والتأكد من مطابقتها وتطبيق خصم الـ <strong>{discountPercent}%</strong> الثابت وتأكيد التكلفة النهائية معك هاتفياً قبل موعد التوصيل.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-lg shadow-teal-600/25 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>جاري تسجيل اشتراك الدواء الشهري...</span>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>تأكيد وتسجيل اشتراك الدواء الشهري (خصم {discountPercent}%)</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
