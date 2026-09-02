import React from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  AlertCircle,
  Phone,
  User,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const OrdersTab = ({
  orders = [],
  orderFilter,
  setOrderFilter,
  searchQuery,
  setSearchQuery,
  onSelectOrder,
  onUpdateStatus,
  couriers = [],
}) => {
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === 'ALL' || o.status === orderFilter;
    const matchesSearch =
      !searchQuery ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const filterButtons = [
    { id: 'ALL', label: `جميع الطلبات (${orders.length})` },
    { id: 'PENDING', label: `جديد (${orders.filter((o) => o.status === 'PENDING').length})` },
    { id: 'CONFIRMED', label: 'مؤكد' },
    { id: 'PREPARING', label: 'قيد التجهيز' },
    { id: 'OUT_FOR_DELIVERY', label: 'مع المندوب' },
    { id: 'DELIVERED', label: 'تم التسليم' },
    { id: 'CANCELLED', label: 'ملغي' },
  ];

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="صندوق استقبال وإدارة الطلبات"
        description="متابعة طلبات الأدوية الواردة، تحديث الحالات التشغيلية وإسناد المناديب"
        badge={`${orders.length} طلب`}
      />

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setOrderFilter(btn.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                orderFilter === btn.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="لا توجد طلبات مطابقة"
          description="لم نتمكن من العثور على أي طلبات تطابق معايير البحث أو الفلتر المحدد."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4">رقم الطلب</th>
                  <th className="p-4">العميل والموقع</th>
                  <th className="p-4">الأصناف والتاريخ</th>
                  <th className="p-4">القيمة والدفع</th>
                  <th className="p-4">المندوب المسند</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((ord) => {
                  const isDelivered = ord.status === 'DELIVERED';
                  const isOut = ord.status === 'OUT_FOR_DELIVERY';
                  const isPending = ord.status === 'PENDING';

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Order Number & Type */}
                      <td className="p-4">
                        <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {ord.deliveryType === 'EXPRESS_45M'
                            ? 'توصيل فوري (30-45 د)'
                            : ord.deliveryType === 'SCHEDULED'
                            ? `موعد: ${ord.scheduledTime || ''}`
                            : 'دواء شهري مزمن'}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {ord.customerName}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{ord.customerPhone}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {ord.deliveryAddress?.governorate} - {ord.deliveryAddress?.city}
                        </span>
                      </td>

                      {/* Items Count & Date */}
                      <td className="p-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {ord.items?.length || 0} صنف
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </td>

                      {/* Total & Payment */}
                      <td className="p-4">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                          {ord.total} ج.م
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {ord.paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'كاش عند الاستلام'
                            : ord.paymentMethod === 'WALLET'
                            ? 'محفظة إلكترونية'
                            : 'بطاقة بنكية'}
                        </span>
                      </td>

                      {/* Courier Assignment */}
                      <td className="p-4">
                        <select
                          value={ord.assignedCourierId || ''}
                          onChange={(e) => onUpdateStatus(ord.id, ord.status, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                        >
                          <option value="">-- اختر المندوب --</option>
                          {couriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.city || 'عام'})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-xl font-bold inline-flex items-center gap-1 ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isOut
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : isPending
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isDelivered && <CheckCircle2 className="w-3 h-3" />}
                          {isOut && <Truck className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          <span>
                            {ord.status === 'PENDING'
                              ? 'بانتظار المراجعة'
                              : ord.status === 'CONFIRMED'
                              ? 'تم التأكيد'
                              : ord.status === 'PREPARING'
                              ? 'قيد التجهيز'
                              : ord.status === 'OUT_FOR_DELIVERY'
                              ? 'في الطريق'
                              : ord.status === 'DELIVERED'
                              ? 'تم التسليم'
                              : ord.status === 'CANCELLED'
                              ? 'ملغي'
                              : ord.status}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-left">
                        <button
                          onClick={() => onSelectOrder(ord)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>تفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
