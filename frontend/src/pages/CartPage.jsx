import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Tag,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  Pill,
  Coins,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCms } from '../context/CmsContext';

export const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    appliedPromo,
    discountAmount,
    subtotal,
    deliveryFee,
    total,
  } = useCart();
  const { settings } = useCms();

  const loyalty = settings?.loyaltyPoints || { isEnabled: true, spendingUnit: 10, pointsPerUnit: 1 };
  const unit = Number(loyalty.spendingUnit) > 0 ? Number(loyalty.spendingUnit) : 10;
  const ptsPerUnit = Number(loyalty.pointsPerUnit) > 0 ? Number(loyalty.pointsPerUnit) : 1;
  const estimatedPoints = loyalty.isEnabled !== false ? Math.floor(total / unit) * ptsPerUnit : 0;

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const freeShippingThreshold = 300;
  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    try {
      const res = await applyPromoCode(promoInput);
      setPromoMessage(res);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 font-cairo">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-600 font-bold transition-colors">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
          سلة المشتريات
        </span>
      </div>

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-tajawal">
              سلة المشتريات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {cartItems.length > 0
                ? `لديك ${cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)} عناصر في سلة طلباتك`
                : 'سلتك فارغة حالياً'}
            </p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>تفريغ السلة</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {cartItems.length === 0 ? (
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-inner">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              سلة المشتريات فارغة
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              لم تقم بإضافة أي أدوية أو مستلزمات طبية بعد. استكشف أقسام الصيدلية واستمتع بتوصيل سريع حتى باب المنزل.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
          >
            تصفح أدوية ومنتجات الصيدلية
          </button>
        </div>
      ) : (
        /* Has Items Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Items List Column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Free Shipping Progress Meter */}
            <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <Truck className="w-4 h-4" />
                  <span>
                    {remainingForFree > 0
                      ? `أضف أدوية بقيمة ${remainingForFree} ج.م إضافية للحصول على شحن مجاني!`
                      : 'تهانينا! طلبيتك مؤهلة للتوصيل المجاني بالكامل 🎉'}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Products Table/Cards */}
            <div className="space-y-3">
              {cartItems.map((item) => {
                const itemTotal = (item.price * (item.quantity || 1)).toFixed(0);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs hover:border-emerald-500/50 transition-colors group"
                  >
                    {/* Image & Product Info */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-2 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 cursor-pointer overflow-hidden"
                      >
                        <img
                          src={item.image}
                          alt={item.nameAr}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="space-y-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-emerald-600 transition-colors line-clamp-1 block"
                        >
                          {item.nameAr}
                        </Link>
                        {item.activeIngredient && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            المادة الفعالة: {item.activeIngredient}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>سعر الوحدة:</span>
                          <strong className="font-mono text-slate-700 dark:text-slate-300">
                            {item.price} ج.م
                          </strong>
                          {item.isPrescriptionRequired && (
                            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              روشتة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Counter */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                          title="إنقاص"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-bold font-mono text-sm text-slate-900 dark:text-white">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                          title="زيادة"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total For Item */}
                      <div className="text-left sm:min-w-[90px]">
                        <span className="text-[10px] text-slate-400 block sm:hidden">الإجمالي:</span>
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white font-mono">
                            {itemTotal}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">ج.م</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="حذف المنتج من السلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back to store navigation */}
            <div className="pt-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>إضافة المزيد من الأدوية والمستلزمات</span>
              </Link>
            </div>
          </div>

          {/* Sidebar / Order Summary Column */}
          <div className="lg:col-span-4 space-y-5">
            {/* Promo Code Box */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>كوبون الخصم أو كود التخفيض:</span>
              </div>
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="مثال: WELCOME15"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-mono tracking-wider text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo || !promoInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  تطبيق
                </button>
              </form>

              {promoMessage && (
                <p
                  className={`text-[11px] font-bold ${
                    promoMessage.success ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {promoMessage.message}
                </p>
              )}
            </div>

            {/* Total Breakdown Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="font-black text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                ملخص الحساب
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center justify-between">
                  <span>المجموع الفرعي للأدوية:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {subtotal} ج.م
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>خدمة التوصيل السريع:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">مجاناً</span>
                    ) : (
                      `${deliveryFee} ج.م`
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span>خصم الكوبون ({appliedPromo}):</span>
                    <span className="font-mono">-{discountAmount} ج.م</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-base font-black text-slate-900 dark:text-white">
                  <span>المجموع الكلي:</span>
                  <div className="flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="font-mono text-2xl font-black">{total}</span>
                    <span className="text-xs font-bold">ج.م</span>
                  </div>
                </div>

                {estimatedPoints > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>نقاط الولاء المكتسبة:</span>
                    </span>
                    <span className="font-mono font-black">+{estimatedPoints} نقطة 🎁</span>
                  </div>
                )}
              </div>

              {/* Proceed to Checkout CTA */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <span>متابعة إتمام الشراء الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Safety Guarantees */}
              <div className="space-y-2 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تأكيد ومراجعة من صيدلي مرخص قبل خروج الأوردر</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>توصيل دواء آمن ومحفوظ في درجة حرارة ملائمة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
