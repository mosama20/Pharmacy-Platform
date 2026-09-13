import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
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
  ArrowLeft,
  FileText,
  Coins,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useCms } from '../context/CmsContext';
import { pushCustomerNotification } from '../services/notificationStorage';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, subtotal, deliveryFee, discountAmount, total, appliedPromo, clearCart } =
    useCart();
  const { selectedGovernorate, selectedDistrict } = useLocation();
  const { settings } = useCms();
  const outletCtx = useOutletContext() || {};

  const loyalty = settings?.loyaltyPoints || { isEnabled: true, spendingUnit: 10, pointsPerUnit: 1 };
  const unit = Number(loyalty.spendingUnit) > 0 ? Number(loyalty.spendingUnit) : 10;
  const ptsPerUnit = Number(loyalty.pointsPerUnit) > 0 ? Number(loyalty.pointsPerUnit) : 1;
  const estimatedPoints = loyalty.isEnabled !== false ? Math.floor(total / unit) * ptsPerUnit : 0;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!street && user.address) setStreet(user.address);
    }
  }, [user]);

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
      setError('يرجى كتابة اسم الشارع والمنطقة بوضوح');
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

      // Trigger customer notification
      pushCustomerNotification({
        title: 'تم تأكيد طلبك بنجاح! 💊',
        body: `طلب رقم #${created.orderNumber || created.id} بقيمة ${created.total || total} ج.م قيد التحضير في صيدلية د. شيماء`,
        type: 'order',
        orderId: created.id || created.orderNumber,
      });

      setSuccessOrder(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'فشل إتمام الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
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
    `مرحباً ${settings?.websiteName || 'صيدلية د. شيماء'}، قمت بطلب أوردر من الموقع برقم (#${successOrder?.orderNumber || successOrder?.id}) وأود متابعة حالة التجهيز والتوصيل.`
  );

  // Success State Render
  if (successOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 font-cairo animate-in fade-in duration-300">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-xl space-y-6 text-center">
          {/* Animated Success Badge */}
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-11 h-11" />
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-xs font-black shadow-md">
              ✓
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-tajawal">
              تهانينا! تم تأكيد واستلام طلبك بنجاح
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              يقوم الصيدلي المناوب في <strong>{settings?.websiteName || 'صيدلية د. شيماء'}</strong> حالياً بمراجعة الأدوية وتغليفها للتسليم السريع.
            </p>
          </div>

          {/* Order Reference Box */}
          <div className="max-w-md mx-auto bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 text-center relative overflow-hidden">
            <span className="text-xs text-emerald-800 dark:text-emerald-200 font-bold block mb-1">
              رقم الطلب المرجعي:
            </span>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300 tracking-wider">
                #{successOrder.orderNumber || successOrder.id}
              </code>
              <button
                onClick={handleCopyOrderNumber}
                className="p-2 rounded-xl bg-emerald-200/60 dark:bg-emerald-800/60 hover:bg-emerald-300 text-emerald-800 dark:text-emerald-200 transition cursor-pointer"
                title="نسخ رقم الطلب"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <span className="text-[11px] text-emerald-600 font-bold block mt-1">تم نسخ الرقم بنجاح ✓</span>}
          </div>

          {/* Quick Status Timeline */}
          <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                <div className="text-base mb-1">✓</div>
                تم التأكيد
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
                <div className="text-base mb-1">⏳</div>
                قيد التجهيز
              </div>
              <div className="p-2.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-500 font-bold">
                <div className="text-base mb-1">🛵</div>
                التوصيل
              </div>
            </div>
          </div>

          {/* Notification Info Badges */}
          <div className="max-w-md mx-auto space-y-2 text-xs text-right">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
              <span className="text-lg shrink-0">🔔</span>
              <span className="leading-snug">
                تم إرسال إشعار فوري وتفاصيل الطلب إلى <strong>صيدلية د. شيماء وبوت التليجرام</strong> لتسريع التحضير.
              </span>
            </div>

            {successOrder.customerEmail && (
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-200 flex items-center gap-2.5">
                <span className="text-lg shrink-0">📧</span>
                <span className="leading-snug truncate">
                  تم إرسال الفاتورة والتفاصيل إلى: <strong>{successOrder.customerEmail}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="max-w-md mx-auto space-y-3 pt-2">
            <a
              href={`https://wa.me/${(settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '').startsWith('0') ? '2' + (settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '') : (settings?.whatsapp || '01012345678').replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>متابعة الطلب والتوصيل عبر واتساب الصيدلية</span>
            </a>

            {outletCtx.handleOpenTracking && (
              <button
                onClick={() => outletCtx.handleOpenTracking(successOrder.id || successOrder.orderNumber)}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                تتبع حالة الطلب لايف (Live Tracking)
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              العودة إلى متجر الأدوية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cart Empty State (if accessed /checkout directly with 0 items)
  if (cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5 font-cairo">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          سلة مشترياتك فارغة
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          لا توجد أدوية أو منتجات في السلة لإتمام الشراء. يرجى إضافة المنتجات المطلوبة أولاً.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          تصفح الأدوية والعروض
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 font-cairo">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-600 font-bold transition-colors">
          الرئيسية
        </Link>
        <span>/</span>
        <Link to="/cart" className="hover:text-emerald-600 font-bold transition-colors">
          سلة المشتريات
        </Link>
        <span>/</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
          إتمام وتأكيد الشراء
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-tajawal">
              إتمام وتأكيد الطلب
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              توصيل آمن وسريع من أقرب صيدلية في {selectedDistrict} - {selectedGovernorate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>دفع وتوصيل معتمد 100%</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Checkout Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer Info */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                بيانات المستلم والتواصل
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المستلم بالكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: د. محمد أحمد"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم الهاتف للتواصل وتأكيد التسليم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors text-right"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  البريد الإلكتروني (اختياري - لاستلام الفاتورة الإلكترونية)
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors text-right"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  عنوان التوصيل بالتفصيل
                </h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedDistrict}، {selectedGovernorate}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الشارع والمنطقة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="مثال: شارع مصطفى النحاس، متفرع من عباس العقاد"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم العمارة
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="مثال: 14"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الدور / الطابق
                  </label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="مثال: 3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الشقة
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="مثال: 6"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    علامة مميزة
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="بجوار سوبرماركت..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Speed & Method */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                سرعة وموعد التوصيل
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  deliveryType === 'EXPRESS_45M'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="EXPRESS_45M"
                  checked={deliveryType === 'EXPRESS_45M'}
                  onChange={() => setDeliveryType('EXPRESS_45M')}
                  className="sr-only"
                />
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      توصيل فوري سريع
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                      45 دقيقة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    يخرج المندوب فور تجهيز الدواء من أقرب فرع صيدلية إليك.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                  deliveryType === 'SCHEDULED'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value="SCHEDULED"
                  checked={deliveryType === 'SCHEDULED'}
                  onChange={() => setDeliveryType('SCHEDULED')}
                  className="sr-only"
                />
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    توصيل مجدول لاحقاً
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    حدد الوقت المناسب لك وسيتواصل معك الصيدلي لتنسيق الموعد.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Payment Method */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                طريقة الدفع
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === 'CASH_ON_DELIVERY'}
                  onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <Banknote className="w-6 h-6 text-emerald-600" />
                  {paymentMethod === 'CASH_ON_DELIVERY' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    الدفع عند الاستلام
                  </span>
                  <span className="text-[10px] text-slate-500">كاش عند باب البيت</span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  paymentMethod === 'WALLET_INSTAPAY'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="WALLET_INSTAPAY"
                  checked={paymentMethod === 'WALLET_INSTAPAY'}
                  onChange={() => setPaymentMethod('WALLET_INSTAPAY')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                  {paymentMethod === 'WALLET_INSTAPAY' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    محافظ إلكترونية / إنستاباي
                  </span>
                  <span className="text-[10px] text-slate-500">فودافون كاش / InstaPay</span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CREDIT_CARD"
                  checked={paymentMethod === 'CREDIT_CARD'}
                  onChange={() => setPaymentMethod('CREDIT_CARD')}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  {paymentMethod === 'CREDIT_CARD' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    بطاقة بنكية مع المندوب
                  </span>
                  <span className="text-[10px] text-slate-500">فيزا / ماستركارد POS</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 5: Pharmacist Notes */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              ملاحظات إضافية للصيدلي أو كابتن التوصيل (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يرجى إحضار فكة 200 جنيه، أو رن الجرس مرتين عند الوصول..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Order Summary & Confirm Column */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-sm sticky top-24">
            <h3 className="font-black text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              ملخص الطلبية ({cartItems.length} أدوية)
            </h3>

            {/* Quick Item List Preview */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.image}
                      alt={item.nameAr}
                      className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.nameAr}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.quantity || 1} × {item.price} ج.م
                      </p>
                    </div>
                  </div>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200 shrink-0">
                    {(item.price * (item.quantity || 1)).toFixed(0)} ج.م
                  </span>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>المجموع الفرعي للأدوية:</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">
                  {subtotal} ج.م
                </span>
              </div>
              <div className="flex justify-between">
                <span>خدمة التوصيل السريع:</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">
                  {deliveryFee === 0 ? <strong className="text-emerald-600">مجاناً</strong> : `${deliveryFee} ج.م`}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>خصم الكوبون ({appliedPromo}):</span>
                  <span className="font-mono">-{discountAmount} ج.م</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                <span>المبلغ الإجمالي للدفع:</span>
                <div className="flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="font-mono text-2xl font-black">{total}</span>
                  <span className="text-xs font-bold">ج.م</span>
                </div>
              </div>

              {estimatedPoints > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>ستربح من هذا الطلب:</span>
                  </span>
                  <span className="font-mono font-black">+{estimatedPoints} نقطة ولاء 🎁</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تأكيد وتوجيه الطلب للصيدلية...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تأكيد وإرسال الطلب الآن ({total} ج.م)</span>
                </>
              )}
            </button>

            {/* Edit Cart Link */}
            <div className="text-center pt-1">
              <Link
                to="/cart"
                className="text-xs text-slate-500 hover:text-emerald-600 font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>تعديل محتويات السلة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Privacy and Trust */}
            <div className="space-y-2 pt-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>بياناتك الطبية والشخصية مشفرة ومحمية بالكامل</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>إمكانية معاينة ومراجعة الأدوية قبل استلامها ودفع الحساب</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
