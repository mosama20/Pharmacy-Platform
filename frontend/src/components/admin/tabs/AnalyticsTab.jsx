import React from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  FileText,
  Users,
  CreditCard,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';

export const AnalyticsTab = ({ stats, orders = [], prescriptions = [] }) => {
  const totalRevenue = stats?.totalRevenue || orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = stats?.totalOrders || orders.length;
  const pendingOrders = stats?.pendingOrders || orders.filter((o) => o.status === 'PENDING').length;
  const activeDeliveries = stats?.activeOrders || orders.filter((o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'PREPARING').length;

  return (
    <div className="space-y-6 font-cairo">
      <PageHeader
        title="التقارير والمؤشرات المالية"
        description="تحليل الإيرادات، حجم الطلبات، معدلات إنجاز الروشتات، وتوزيع المبيعات"
      />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الإيرادات المحققة"
          value={`${totalRevenue.toLocaleString('ar-EG')} ج.م`}
          subtitle="مبيعات الأدوية والمنتجات"
          icon={DollarSign}
          trend="+14.2%"
          trendDirection="up"
          colorScheme="emerald"
        />

        <StatCard
          title="إجمالي عدد الطلبات"
          value={totalOrders}
          subtitle="جميع الطلبات المسجلة"
          icon={ShoppingBag}
          trend="+8.5%"
          trendDirection="up"
          colorScheme="blue"
        />

        <StatCard
          title="الطلبات النشطة وقيد التوصيل"
          value={activeDeliveries}
          subtitle="في الطريق أو قيد التجهيز"
          icon={Truck}
          colorScheme="amber"
        />

        <StatCard
          title="الروشتات الطبية المفحوصة"
          value={prescriptions.length}
          subtitle="تم التدقيق والتسعير"
          icon={FileText}
          trend="+22.0%"
          trendDirection="up"
          colorScheme="teal"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>توزيع المبيعات حسب الأقسام</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">آخر 30 يوماً</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'أدوية وعلاج (Prescription & OTC)', percent: 58, amount: '58,400 ج.م', color: 'bg-emerald-500' },
              { label: 'اشتراكات الدواء الشهري (Chronic Refill)', percent: 22, amount: '22,100 ج.م', color: 'bg-teal-500' },
              { label: 'عناية بالبشرة ومستحضرات تجميل', percent: 12, amount: '12,050 ج.م', color: 'bg-indigo-500' },
              { label: 'فيتامينات ومكملات غذائية', percent: 8, amount: '8,050 ج.م', color: 'bg-amber-500' },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{cat.label}</span>
                  <span className="font-mono text-slate-900 dark:text-white">{cat.amount} ({cat.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods & Operational Performance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>طرق الدفع ومؤشرات التشغيل</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">مباشر</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">الدفع عند الاستلام (كاش):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">64% من الطلبات</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">المحافظ الإلكترونية وإنستاباي:</span>
              <span className="font-mono font-bold text-emerald-600">26% من الطلبات</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">متوسط زمن التوصيل الفعلي:</span>
              <span className="font-mono font-bold text-purple-600">32 دقيقة</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">نسبة نجاح التسليم من المحاولة الأولى:</span>
              <span className="font-mono font-bold text-emerald-600">98.4%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
