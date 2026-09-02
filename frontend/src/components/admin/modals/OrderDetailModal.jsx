import React from 'react';
import {
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Phone,
  Banknote,
  User,
  Shield,
  FileText,
} from 'lucide-react';

export const OrderDetailModal = ({
  order,
  onClose,
  onUpdateStatus,
  couriers = [],
}) => {
  if (!order) return null;

  const fullAddress = `${order.deliveryAddress?.governorate || ''} - ${order.deliveryAddress?.city || ''} - ${order.deliveryAddress?.street || ''} ${order.deliveryAddress?.building ? `(عمارة ${order.deliveryAddress.building})` : ''} ${order.deliveryAddress?.apartment ? `(شقة ${order.deliveryAddress.apartment})` : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  تفاصيل الطلب:
                </h3>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {order.orderNumber}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                تاريخ الطلب: {new Date(order.createdAt).toLocaleString('ar-EG')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status & Quick Status Update */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                حالة الطلب الحالية:
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-xl font-bold ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : order.status === 'OUT_FOR_DELIVERY'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {order.status === 'PENDING'
                  ? 'بانتظار المراجعة'
                  : order.status === 'CONFIRMED'
                  ? 'تم التأكيد'
                  : order.status === 'PREPARING'
                  ? 'قيد التجهيز بالصيدلية'
                  : order.status === 'OUT_FOR_DELIVERY'
                  ? 'في الطريق للعميل'
                  : order.status === 'DELIVERED'
                  ? 'تم التسليم بنجاح'
                  : order.status === 'CANCELLED'
                  ? 'ملغي'
                  : order.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                تأكيد الطلب
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                تجهيز في الصيدلية
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                تسليم للمندوب
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                تم التسليم للعميل
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer mr-auto"
              >
                إلغاء الطلب
              </button>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 block">بيانات العميل:</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {order.customerName}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                    {order.customerPhone}
                  </span>
                </div>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  اتصال
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 block">عنوان التوصيل:</span>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {fullAddress}
                </p>
              </div>
              {order.deliveryAddress?.landmark && (
                <span className="text-[11px] text-slate-400 block">
                  علامة مميزة: {order.deliveryAddress.landmark}
                </span>
              )}
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              الأصناف المطلوبة ({order.items?.length || 0}):
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">المنتج / الدواء</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-left">السعر</th>
                    <th className="p-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.product?.nameAr || item.productName || 'دواء'}
                        </span>
                        {item.dosageNote && (
                          <span className="text-[10px] text-emerald-600 block">
                            {item.dosageNote}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-left font-mono">
                        {item.price} ج.م
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                        {item.price * item.quantity} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Financial Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>المجموع الفرعي:</span>
              <span className="font-mono">{order.subtotal || order.total - (order.deliveryFee || 25)} ج.م</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>رسوم التوصيل:</span>
              <span className="font-mono">{order.deliveryFee || 25} ج.م</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>خصم الكوبون ({order.promoCode || ''}):</span>
                <span className="font-mono">-{order.discountAmount} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>الإجمالي النهائي:</span>
              <span className="font-mono text-emerald-600 text-base">{order.total} ج.م</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
