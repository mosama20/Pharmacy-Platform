import React, { useState, useEffect } from 'react';
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
  Loader2,
  ChevronLeft,
  Info,
  Copy,
  Check,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { useCms } from '../../context/CmsContext';
import { pushCustomerNotification } from '../../services/notificationStorage';

export const CheckoutModal = ({ isOpen, onClose, onOpenTracking }) => {
  const { user } = useAuth();
  const { cartItems, subtotal, deliveryFee, discountAmount, total, appliedPromo, clearCart } =
    useCart();
  const { selectedGovernorate, selectedDistrict } = useLocation();
  const { settings } = useCms();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [street, setStreet] = useState(user?.address || '');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryType, setDeliveryType] = useState('EXPRESS_45M');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!street && user.address) setStreet(user.address);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('يرجى إدخال اسم المستلم بالكامل');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد التسليم');
      return;
    }
    if (!street.trim()) {
      setError('يرجى كتابة اسم الشارع والمنطقة');
      return;
    }

    if (cartItems.length === 0) {
      setError('سلة المشتريات فارغة، يرجى إضافة منتجات أولاً');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customerId: user?.id || 'guest_user',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryAddress: {
          governorate: selectedGovernorate,
          city: selectedDistrict,
          street: street.trim(),
          building: building.trim(),
          floor: floor.trim(),
          apartment: apartment.trim(),
          landmark: landmark.trim(),
        },
        deliveryType,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId || item.id,
          nameAr: item.nameAr || '',
          nameEn: item.nameEn || '',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || '',
        })),
        promoCode: appliedPromo || undefined,
        notes: notes.trim(),
      };


      const res = await api.createOrder(orderPayload);
      const created = res.order || res;
      clearCart();

      // Trigger local and browser push notification for customer
      pushCustomerNotification({
        title: 'تم تأكيد طلبك بنجاح! 💊',
        body: `طلب رقم #${created.orderNumber || created.id} بقيمة ${created.total || total} ج.م قيد التحضير في صيدلية د. شيماء`,
        type: 'order',
        orderId: created.id || created.orderNumber,
      });

      setSuccessOrder(created);
    } catch (err) {
      setError(err.message || 'فشل إتمام الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(null);
    setError('');
    onClose();
  };

  const handleCopyOrderNumber = () => {
    const num = successOrder?.orderNumber || successOrder?.id;
    if (num) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً ${settings?.websiteName || 'الصيدلية الذكية'}، قمت بطلب أوردر من الموقع برقم (#${successOrder?.orderNumber || successOrder?.id}) وأود متابعة حالة التجهيز والتوصيل.`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 font-cairo">
      <div className="w-full max-w-2xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[94vh] flex flex-col bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                {successOrder ? 'تم تأكيد الطلب بنجاح' : 'إتمام وتأكيد الطلب'}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {successOrder
                  ? 'صيدلية د. شيماء - أسرع خدمة توصيل دوائي'
                  : `توصيل آمن وسريع من أقرب صيدلية في ${selectedDistrict}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successOrder ? (
          <div className="p-5 sm:p-7 overflow-y-auto space-y-4 animate-in fade-in duration-300 flex-1 flex flex-col items-center">
            {/* Success Icon */}
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm">
                ✓
              </span>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                تهانينا! تم استلام وتأكيد طلبك بنجاح
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يقوم الصيدلي المناوب حالياً بمراجعة الأدوية وتغليفها للتسليم السريع
              </p>
            </div>

            {/* Order Reference Box */}
            <div className="w-full max-w-md bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 text-center relative overflow-hidden">
              <span className="text-xs text-emerald-800 dark:text-emerald-200 font-bold block mb-1">
                رقم الطلب المرجعي:
              </span>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg sm:text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 tracking-wider">
                  #{successOrder.orderNumber || successOrder.id}
                </code>
                <button
                  onClick={handleCopyOrderNumber}
                  className="p-1.5 rounded-lg bg-emerald-200/60 dark:bg-emerald-800/60 hover:bg-emerald-300 text-emerald-800 dark:text-emerald-200 transition"
                  title="نسخ رقم الطلب"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <span className="text-[10px] text-emerald-600 font-bold block mt-1">تم نسخ الرقم بنجاح ✓</span>}
            </div>

            {/* Quick Status Timeline */}
            <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                  <div className="text-base mb-0.5">✓</div>
                  تم التأكيد
                </div>
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
                  <div className="text-base mb-0.5">⏳</div>
                  قيد التحضير
                </div>
                <div className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-500 font-bold">
                  <div className="text-base mb-0.5">🛵</div>
                  التوصيل السريع
                </div>
              </div>
            </div>

            {/* Notifications Sent Badges */}
            <div className="w-full max-w-md space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <span className="text-base">🔔</span>
                <span className="leading-tight">
                  تم إرسال إشعار فوري وتفاصيل الطلب إلى <strong>صيدلية د. شيماء وبوت التليجرام</strong>.
                </span>
              </div>
              {successOrder.customerEmail && (
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-200 flex items-center gap-2">
                  <span className="text-base">📧</span>
                  <span className="leading-tight truncate">
                    تم إرسال فاتورة تفصيلية إلى: <strong>{successOrder.customerEmail}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-md space-y-2 pt-2">
              {/* WhatsApp Chat Button */}
              <a
                href={`https://wa.me/${(settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '').startsWith('0') ? '2' + (settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '') : (settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-green-600/20 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>متابعة الطلب عبر واتساب الصيدلية مباشرة</span>
              </a>

              {/* Live Tracking Button */}
              {onOpenTracking && (
                <button
                  onClick={() => {
                    handleClose();
                    onOpenTracking(successOrder.orderNumber || successOrder.id);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>تتبع خط سير المندوب لحظياً (Live GPS)</span>
                </button>
              )}

              <button
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                العودة للمتجر ومواصلة التسوق
              </button>
            </div>
          </div>
        ) : (
          <form id="checkout-form" onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-800 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Customer Personal Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>1. بيانات المستلم والتواصل</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الاسم بالكامل *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اسم المستلم ثلاثي أو ثنائي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رقم الهاتف للتواصل وتأكيد التسليم *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 01012345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Detailed Delivery Address */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>2. عنوان التوصيل بالتفصيل</span>
                  </h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                    {selectedGovernorate} - {selectedDistrict}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اسم الشارع والحي *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شارع النصر، متفرع من شارع اللاسلكي"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم العمارة
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 14"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-center focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم الدور
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 3"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-center focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        رقم الشقة
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 301"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-center focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      علامة مميزة (اختياري)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: بجوار مسجد النور، أمام بنك مصر"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Delivery Speed Choice */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>3. سرعة وموعد التوصيل</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setDeliveryType('EXPRESS_45M')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 active:scale-98 ${
                      deliveryType === 'EXPRESS_45M'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 fill-amber-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        توصيل فوري (30 - 45 دقيقة)
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        خارج من أقرب صيدلية مرخصة بجوارك
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setDeliveryType('SCHEDULED')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 active:scale-98 ${
                      deliveryType === 'SCHEDULED'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
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
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>4. طريقة الدفع</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 active:scale-98 ${
                      paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs">دفع عند الاستلام (كاش)</span>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 active:scale-98 ${
                      paymentMethod === 'WALLET'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs">إنستاباي / محفظة ذكية</span>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 active:scale-98 ${
                      paymentMethod === 'CARD'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs">بطاقة بنكية / فيزا</span>
                  </div>
                </div>
              </div>

              {/* 5. Order Items Summary Checklist */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>عناصر الطلب ({cartItems.length}):</span>
                  <span className="font-mono text-emerald-600">{subtotal} ج.م</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-[11px] text-slate-500 py-0.5"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[300px]">
                        {item.nameAr} × {item.quantity}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.price * item.quantity} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM BAR (Always visible!) */}
            <div className="p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">إجمالي المطلوب:</span>
                  <span className="font-black text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-mono">
                    {total}
                  </span>
                  <span className="text-xs font-bold text-slate-500">ج.م</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>التوصيل: {deliveryFee === 0 ? 'مجاني ✓' : `${deliveryFee} ج.م`}</span>
                  {discountAmount > 0 && (
                    <span className="text-emerald-600 font-bold font-mono">
                      (وفرت {discountAmount} ج.م)
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تأكيد الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الطلب الآن ({total} ج.م)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

