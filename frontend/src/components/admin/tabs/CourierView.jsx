import React from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  DollarSign,
  RefreshCw,
  LogOut,
  Shield,
  Navigation,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../../context/AuthContext';

export const CourierView = ({
  orders = [],
  courierStats,
  onUpdateStatus,
  onRefresh,
  loading,
}) => {
  const { user, logout } = useAuth();

  const activeDeliveries = orders.filter(
    (o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'PREPARING'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cashToCollect = courierStats?.cashToCollect ?? 584;
  const commissionEarned = courierStats?.commissionEarned ?? 40;

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="بوابة الكابتن ومهام التوصيل السريع"
        description={`مرحباً بك يا كابتن ${user?.name || ''} • جدول مهام التوصيل وتحديث الشحنات المباشر`}
        badge="مندوب توصيل"
      />

      {/* Courier KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="الطلبات النشطة للتوصيل"
          value={courierStats?.activeDeliveriesCount ?? activeDeliveries}
          icon={Truck}
          colorScheme="amber"
        />

        <StatCard
          title="تم التسليم بنجاح اليوم"
          value={courierStats?.deliveredCount ?? deliveredCount}
          icon={CheckCircle2}
          colorScheme="emerald"
        />

        <StatCard
          title="كاش مطلوب تحصيله"
          value={`${cashToCollect} ج.م`}
          icon={DollarSign}
          colorScheme="blue"
        />

        <StatCard
          title="حافز / عمولة التوصيل"
          value={`${commissionEarned} ج.م`}
          icon={Shield}
          colorScheme="purple"
        />
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <span>الشحنات المسندة إليك ({orders.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">
            اضغط على أزرار الحالة لتحديث موقع وشحنة العميل فورياً
          </span>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="رائع يا كابتن! لا توجد طلبات معلقة"
            description="جميع طلبات التوصيل تم تسليمها أو لا توجد شحنات مسندة إليك حالياً."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const fullAddress = `${ord.deliveryAddress?.governorate || ''} - ${ord.deliveryAddress?.city || ''} - ${ord.deliveryAddress?.street || ''} ${ord.deliveryAddress?.building ? `(عمارة ${ord.deliveryAddress.building})` : ''} ${ord.deliveryAddress?.apartment ? `(شقة ${ord.deliveryAddress.apartment})` : ''}`;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
              const isOut = ord.status === 'OUT_FOR_DELIVERY';
              const isDelivered = ord.status === 'DELIVERED';
              const isPreparing = ord.status === 'PREPARING';

              return (
                <div
                  key={ord.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 ${
                    isDelivered
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-80'
                      : isOut
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {ord.deliveryType === 'EXPRESS_45M'
                          ? 'توصيل فوري (30-45 دقيقة)'
                          : ord.deliveryType === 'SCHEDULED'
                          ? `موعد محدد: ${ord.scheduledTime || ''}`
                          : 'دواء شهري مزمن'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isOut
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {isDelivered && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isOut && <Truck className="w-3.5 h-3.5" />}
                        {isPreparing && <Clock className="w-3.5 h-3.5" />}
                        <span>
                          {isDelivered
                            ? 'تم التسليم بنجاح'
                            : isOut
                            ? 'في الطريق للعميل'
                            : isPreparing
                            ? 'جاري التجهيز بالصيدلية'
                            : ord.status}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer */}
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold">اسم العميل:</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          {ord.customerName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400 font-bold">الهاتف:</span>
                        <a
                          href={`tel:${ord.customerPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{ord.customerPhone} (اتصال فوري)</span>
                        </a>
                      </div>
                    </div>

                    {/* Payment & Cash */}
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold">طريقة الدفع:</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {ord.paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'كاش عند الاستلام'
                            : ord.paymentMethod === 'WALLET'
                            ? 'مدفوع إلكترونياً (محفظة)'
                            : 'مدفوع إلكترونياً (بطاقة)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400 font-bold">المبلغ المطلوب تحصيله:</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          {ord.paymentMethod === 'CASH_ON_DELIVERY' ? `${ord.total} ج.م` : '0 ج.م (مدفوع مسبقاً)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address & Navigation Route */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {fullAddress}
                        </span>
                        {ord.deliveryAddress?.landmark && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            علامة مميزة: {ord.deliveryAddress.landmark}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>فتح خرائط Google</span>
                    </a>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-bold">
                      تحديث حالة التوصيل:
                    </span>

                    <div className="flex items-center gap-2">
                      {isPreparing && (
                        <button
                          onClick={() => onUpdateStatus(ord.id, 'OUT_FOR_DELIVERY', user?.id)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                        >
                          <Truck className="w-4 h-4" />
                          <span>استلام الشحنة والانطلاق للعميل</span>
                        </button>
                      )}

                      {isOut && (
                        <button
                          onClick={() => onUpdateStatus(ord.id, 'DELIVERED', user?.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تم تسليم الطلب وتحصيل المبلغ</span>
                        </button>
                      )}

                      {isDelivered && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>مكتمل ومسلم بنجاح</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
