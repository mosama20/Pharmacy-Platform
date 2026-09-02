import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { cartItems, subtotal, deliveryFee, discountAmount, total, appliedPromo, clearCart } =
    useCart();
  const { selectedGovernorate, selectedDistrict } = useLocation();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [street, setStreet] = useState(user?.address || 'شارع النصر، عمارة 14');
  const [building, setBuilding] = useState('عمارة 14');
  const [floor, setFloor] = useState('الدور 3');
  const [apartment, setApartment] = useState('شقة 301');
  const [landmark, setLandmark] = useState('بجوار صيدلية العزبي وميدان فيكتوريا');
  const [deliveryType, setDeliveryType] = useState('EXPRESS_45M');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !street) {
      setError('يرجى استكمال بيانات الاسم ورقم الهاتف والعنوان');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        customerId: user?.id || 'guest_user',
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress: {
          governorate: selectedGovernorate,
          city: selectedDistrict,
          street,
          building,
          floor,
          apartment,
          landmark,
        },
        deliveryType,
        paymentMethod,
        items: cartItems,
        promoCode: appliedPromo || undefined,
        notes,
      };

      const res = await api.createOrder(orderPayload);
      clearCart();
      setSuccessOrder(res.order || res);
    } catch (err) {
      setError(err.message || 'فشل إتمام الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">إتمام وتأكيد الطلب</h3>
              <p className="text-xs text-emerald-100">
                توصيل آمن وسريع من أقرب صيدلية في {selectedDistrict}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successOrder ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                تم استلام طلبك وتأكيده بنجاح!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                رقم الطلب:{' '}
                <strong className="font-mono text-emerald-600 text-sm">
                  {successOrder.orderNumber || successOrder.id}
                </strong>
                <br />
                الإجمالي المطلوب: <strong className="font-mono text-slate-900 dark:text-white">{successOrder.total || total} ج.م</strong>
                <br />
                يقوم الصيدلي بتجهيز الطلب الآن وسيتم التواصل معك هاتفياً على ({customerPhone}) للتسليم.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                العودة للتسوق
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Customer Personal Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>1. بيانات المستلم والتواصل</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الاسم بالكامل *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="محمد أحمد"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رقم الهاتف للتواصل *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01012345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Detailed Delivery Address */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>2. عنوان التوصيل بالتفصيل</span>
                  </h4>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-md">
                    {selectedGovernorate} - {selectedDistrict}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم الشارع والمنطقة *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شارع النصر، متفرع من شارع اللاسلكي"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم العمارة
                      </label>
                      <input
                        type="text"
                        placeholder="عمارة 14"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم الدور
                      </label>
                      <input
                        type="text"
                        placeholder="الدور 3"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم الشقة
                      </label>
                      <input
                        type="text"
                        placeholder="شقة 301"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      علامة مميزة (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: بجوار مسجد النور، أو أمام بنك مصر"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Delivery Speed Choice */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>3. سرعة وموعد التوصيل</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setDeliveryType('EXPRESS_45M')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      deliveryType === 'EXPRESS_45M'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        توصيل فوري (30 - 45 دقيقة)
                      </h5>
                      <p className="text-[10px] text-slate-500">من أقرب صيدلية متوفرة</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setDeliveryType('SCHEDULED')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      deliveryType === 'SCHEDULED'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        توصيل مجدول في نفس اليوم
                      </h5>
                      <p className="text-[10px] text-slate-500">حدد موعد استلامك لاحقاً</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Payment Method */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>4. طريقة الدفع</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs">دفع عند الاستلام (كاش)</span>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      paymentMethod === 'WALLET'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="text-xs">محفظة إلكترونية / إنستاباي</span>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      paymentMethod === 'CARD'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-xs">فيزا / ماستركارد</span>
                  </div>
                </div>
              </div>

              {/* Order Summary & Submit */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>إجمالي المنتجات ({cartItems.length} عناصر):</span>
                  <span className="font-mono">{subtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>رسوم التوصيل:</span>
                  <span className="font-mono">
                    {deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ج.م`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>الخصم المطبق ({appliedPromo}):</span>
                    <span className="font-mono">-{discountAmount} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>المبلغ الإجمالي للدفع:</span>
                  <span className="font-mono text-emerald-600 text-base">{total} ج.م</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-xl shadow-emerald-600/30 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'جاري تأكيد الطلب...' : `تأكيد الطلب الآن (${total} ج.م)`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
