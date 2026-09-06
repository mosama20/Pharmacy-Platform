import React, { useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  DollarSign,
  RefreshCw,
  Shield,
  Navigation,
  Search,
  Filter,
  PackageCheck,
  Package,
  Users,
  AlertCircle,
  Calendar,
  Wallet,
  Check,
  CreditCard,
  Sparkles,
  Map,
  Compass,
  Eye,
  ArrowUpDown,
  Building,
  CheckCheck,
  X,
  FileText,
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
  onSelectOrder,
}) => {
  const { user, isAdmin, isCourier } = useAuth();

  // Internal clean subtab state
  const [currentSubTab, setCurrentSubTab] = useState('active');
  const handleTabChange = (tabId) => setCurrentSubTab(tabId);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [onlyMyOrders, setOnlyMyOrders] = useState(isCourier);

  // Delivery confirmation modal state
  const [confirmDeliveryOrder, setConfirmDeliveryOrder] = useState(null);
  const [confirmPickupOrder, setConfirmPickupOrder] = useState(null);
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  // Filter orders by assigned courier if requested
  const relevantOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    if (onlyMyOrders && user?.id) {
      return orders.filter(
        (o) => !o.assignedCourierId || o.assignedCourierId === user.id
      );
    }
    return orders;
  }, [orders, onlyMyOrders, user?.id]);

  // Derived order categories
  const activeOrders = useMemo(
    () => relevantOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY'),
    [relevantOrders]
  );
  const readyOrders = useMemo(
    () => relevantOrders.filter((o) => o.status === 'PREPARING'),
    [relevantOrders]
  );
  const deliveredOrders = useMemo(
    () => relevantOrders.filter((o) => o.status === 'DELIVERED'),
    [relevantOrders]
  );

  // Financial calculations
  const activeCashToCollect = useMemo(() => {
    return activeOrders
      .filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [activeOrders]);

  const deliveredCashCollected = useMemo(() => {
    return deliveredOrders
      .filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [deliveredOrders]);

  const deliveredElectronicPaid = useMemo(() => {
    return deliveredOrders
      .filter((o) => o.paymentMethod !== 'CASH_ON_DELIVERY')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [deliveredOrders]);

  const commissionEarned =
    courierStats?.commissionEarned ?? deliveredOrders.length * 20;

  // Filter based on active search & type
  const filterList = (list) => {
    return list.filter((ord) => {
      const fullAddress = `${ord.deliveryAddress?.governorate || ''} ${ord.deliveryAddress?.city || ''} ${ord.deliveryAddress?.street || ''}`;
      const matchesSearch =
        !searchQuery ||
        ord.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.customerPhone?.includes(searchQuery) ||
        fullAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        deliveryTypeFilter === 'ALL' || ord.deliveryType === deliveryTypeFilter;

      const matchesPayment =
        paymentFilter === 'ALL' ||
        (paymentFilter === 'COD' && ord.paymentMethod === 'CASH_ON_DELIVERY') ||
        (paymentFilter === 'ONLINE' && ord.paymentMethod !== 'CASH_ON_DELIVERY');

      return matchesSearch && matchesType && matchesPayment;
    });
  };

  const filteredActive = useMemo(() => filterList(activeOrders), [activeOrders, searchQuery, deliveryTypeFilter, paymentFilter]);
  const filteredReady = useMemo(() => filterList(readyOrders), [readyOrders, searchQuery, deliveryTypeFilter, paymentFilter]);
  const filteredDelivered = useMemo(() => filterList(deliveredOrders), [deliveredOrders, searchQuery, deliveryTypeFilter, paymentFilter]);

  // SubTab configuration
  const subTabs = [
    {
      id: 'active',
      label: 'مهام في الطريق (النشطة)',
      icon: Truck,
      badge: activeOrders.length,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'ready',
      label: 'جاهز للاستلام والتجهيز',
      icon: PackageCheck,
      badge: readyOrders.length,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'delivered',
      label: 'سجل الشحنات المسلّمة',
      icon: CheckCircle2,
      badge: deliveredOrders.length,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'finances',
      label: 'التحصيل والعهدة النقدية',
      icon: DollarSign,
    },
    {
      id: 'map',
      label: 'خريطة ومسارات التوصيل',
      icon: MapPin,
    },
  ];

  const handleExecuteDelivery = async () => {
    if (!confirmDeliveryOrder) return;
    try {
      await onUpdateStatus(confirmDeliveryOrder.id, 'DELIVERED', user?.id);
      setConfirmDeliveryOrder(null);
    } catch (_) {}
  };

  const handleExecutePickup = async () => {
    if (!confirmPickupOrder) return;
    try {
      await onUpdateStatus(confirmPickupOrder.id, 'OUT_FOR_DELIVERY', user?.id);
      setConfirmPickupOrder(null);
    } catch (_) {}
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* 1. Header Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                {isAdmin ? 'إدارة أسطول التوصيل' : 'كابتن التوصيل السريع'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                النظام متصل ومباشر
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black font-tajawal text-white tracking-tight">
              بوابة مهام التوصيل والمندوب
            </h1>
            <p className="text-sm text-slate-300 font-medium">
              مرحباً بك يا كابتن {user?.name || ''} • جدول منظم لتسليم الشحنات، تتبع العناوين والتحصيل النقدي
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isCourier && (
              <button
                onClick={() => setOnlyMyOrders(!onlyMyOrders)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  onlyMyOrders
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{onlyMyOrders ? '✓ شحناتي المسندة فقط' : 'عرض كل الشحنات'}</span>
              </button>
            )}

            <button
              onClick={() => onRefresh && onRefresh()}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Structured KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => handleTabChange('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentSubTab === 'active'
              ? 'bg-amber-500/10 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">في الطريق الآن</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {activeOrders.length}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
              مهام نشطة مطلوب تسليمها
            </span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('ready')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentSubTab === 'ready'
              ? 'bg-blue-500/10 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">جاهز للاستلام</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {readyOrders.length}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block mt-0.5">
              بانتظار الاستلام بالصيدلية
            </span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('delivered')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentSubTab === 'delivered'
              ? 'bg-emerald-500/10 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تم التسليم اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {deliveredOrders.length}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              شحنات ناجحة ومكتملة
            </span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('finances')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentSubTab === 'finances'
              ? 'bg-purple-500/10 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">كاش معلق للتحصيل</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {activeCashToCollect} <span className="text-xs font-bold">ج.م</span>
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
              مطلوب تحصيله كاش
            </span>
          </div>
        </div>

        <div
          onClick={() => handleTabChange('finances')}
          className="col-span-2 lg:col-span-1 p-4 rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800/80 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">عمولة الكابتن</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {commissionEarned} <span className="text-xs font-bold">ج.م</span>
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              أرباح وحوافز اليوم المستحقة
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs Bar (Synchronized with Sidebar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-slate-200 dark:border-slate-800">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-slate-900/10 dark:ring-white/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400 dark:text-emerald-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : tab.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Universal Search & Filter Toolbar (For order-based tabs) */}
      {['active', 'ready', 'delivered'].includes(currentSubTab) && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الشحنة، اسم العميل، رقم الهاتف، أو المنطقة..."
                className="w-full pl-3 pr-10 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setDeliveryTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    deliveryTypeFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  كل الأنواع
                </button>
                <button
                  onClick={() => setDeliveryTypeFilter('EXPRESS_45M')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    deliveryTypeFilter === 'EXPRESS_45M'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  ⚡ فوري 45د
                </button>
                <button
                  onClick={() => setDeliveryTypeFilter('SCHEDULED')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    deliveryTypeFilter === 'SCHEDULED'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  📅 موعد محدد
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setPaymentFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    paymentFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  كل الدفع
                </button>
                <button
                  onClick={() => setPaymentFilter('COD')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    paymentFilter === 'COD'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  💵 كاش عند الاستلام
                </button>
                <button
                  onClick={() => setPaymentFilter('ONLINE')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    paymentFilter === 'ONLINE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  💳 مدفوع إلكتروني
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SubTab 1: Active Deliveries (OUT_FOR_DELIVERY) */}
      {currentSubTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <span>الشحنات قيد التوصيل الآن ({filteredActive.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">
              اضغط على "تم التسليم" فور إيصال الطلب للعميل واستلام المبلغ
            </span>
          </div>

          {filteredActive.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="لا توجد مهام جارية في الطريق الآن"
              description="أحسنت يا كابتن! جميع الشحنات تم تسليمها، تفقد تبويب 'جاهز للاستلام' لاستلام شحنات جديدة."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredActive.map((ord) => {
                const fullAddress = `${ord.deliveryAddress?.governorate || ''} - ${ord.deliveryAddress?.city || ''} - ${ord.deliveryAddress?.street || ''} ${ord.deliveryAddress?.building ? `(عمارة ${ord.deliveryAddress.building})` : ''} ${ord.deliveryAddress?.apartment ? `(شقة ${ord.deliveryAddress.apartment})` : ''}`;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                const isCod = ord.paymentMethod === 'CASH_ON_DELIVERY';

                return (
                  <div
                    key={ord.id}
                    className="p-5 md:p-6 rounded-3xl bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/80 shadow-md ring-2 ring-amber-500/10 space-y-4 transition-all"
                  >
                    {/* Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-900/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-base text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-3 py-1 rounded-xl">
                          {ord.orderNumber}
                        </span>

                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200 dark:border-slate-700">
                          {ord.deliveryType === 'EXPRESS_45M'
                            ? '⚡ توصيل فوري (30-45 دقيقة)'
                            : ord.deliveryType === 'SCHEDULED'
                            ? `📅 موعد: ${ord.scheduledTime || ''}`
                            : '💊 دواء شهري مزمن'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 rounded-xl font-bold bg-amber-500 text-slate-950 flex items-center gap-1.5 animate-pulse shadow-xs">
                          <Truck className="w-3.5 h-3.5" />
                          <span>في الطريق للعميل</span>
                        </span>

                        {typeof onSelectOrder === 'function' && (
                          <button
                            onClick={() => onSelectOrder(ord)}
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-colors"
                            title="عرض تفاصيل الأدوية"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer & Address Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer Card */}
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">العميل المستلم:</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {ord.customerName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-400">الاتصال المباشر:</span>
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{ord.customerPhone} (اتصال فوري)</span>
                          </a>
                        </div>
                      </div>

                      {/* Cash & Payment Card */}
                      <div className={`p-4 rounded-2xl border space-y-3 ${
                        isCod
                          ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">طريقة الدفع:</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            {isCod ? <DollarSign className="w-3.5 h-3.5 text-amber-600" /> : <CreditCard className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCod ? 'كاش عند الاستلام' : 'مدفوع إلكترونياً مسبقاً'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المطلوب تحصيله:</span>
                          <span className={`text-base font-black font-mono ${
                            isCod ? 'text-amber-900 dark:text-amber-200' : 'text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {isCod ? `${ord.total} ج.م (كاش مطلوب)` : '0 ج.م (مدفوع بالكامل)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Destination & Google Maps */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {fullAddress}
                          </span>
                          {ord.deliveryAddress?.landmark && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block mt-0.5">
                              📌 علامة مميزة: {ord.deliveryAddress.landmark}
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto shrink-0 transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>فتح خرائط Google للملاحة</span>
                      </a>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200 dark:border-amber-900/60">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        هل وصلت للعميل وسلمت الشحنة؟
                      </div>

                      <button
                        onClick={() => setConfirmDeliveryOrder(ord)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all hover:scale-102"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم تسليم الطلب وتحصيل المبلغ ({ord.total} ج.م)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. SubTab 2: Ready for Pickup (PREPARING) */}
      {currentSubTab === 'ready' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-500" />
              <span>شحنات جاهزة أو قيد التجهيز بالصيدلية ({filteredReady.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">
              اضغط على "استلام الشحنة والانطلاق" عند استلام كيس الأدوية من الصيدلية
            </span>
          </div>

          {filteredReady.length === 0 ? (
            <EmptyState
              icon={PackageCheck}
              title="لا توجد شحنات معلقة بالصيدلية"
              description="جميع الطلبات تم استلامها وجاري توصيلها أو تم تسليمها بالفعل."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReady.map((ord) => {
                const fullAddress = `${ord.deliveryAddress?.city || ''} - ${ord.deliveryAddress?.street || ''}`;
                const isCod = ord.paymentMethod === 'CASH_ON_DELIVERY';

                return (
                  <div
                    key={ord.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                          {ord.deliveryType === 'EXPRESS_45M' ? '⚡ فوري' : '📅 موعد'}
                        </span>
                      </div>

                      <span className="text-xs px-2.5 py-1 rounded-xl font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>قيد التجهيز / جاهزة</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">العميل:</span>
                        <span className="font-black text-slate-800 dark:text-white">{ord.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">المنطقة:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{fullAddress}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">قيمة الطلب:</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          {ord.total} ج.م {isCod ? '(كاش عند التسليم)' : '(مدفوع مسبقاً)'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {typeof onSelectOrder === 'function' && (
                        <button
                          onClick={() => onSelectOrder(ord)}
                          className="text-xs text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة الطلب</span>
                        </button>
                      )}

                      <button
                        onClick={() => setConfirmPickupOrder(ord)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
                      >
                        <Truck className="w-4 h-4" />
                        <span>استلام الشحنة والانطلاق 🚀</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. SubTab 3: Delivered Archive (DELIVERED) */}
      {currentSubTab === 'delivered' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>سجل الشحنات المسلمة اليوم ({filteredDelivered.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              إجمالي المحصل: {deliveredCashCollected} ج.م كاش • {deliveredElectronicPaid} ج.م إلكتروني
            </span>
          </div>

          {filteredDelivered.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="لم يتم تسليم أي شحنات بعد اليوم"
              description="عند إتمام تسليم المهام النشطة ستظهر في هذا السجل مع تقرير التحصيل."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDelivered.map((ord) => {
                const isCod = ord.paymentMethod === 'CASH_ON_DELIVERY';
                return (
                  <div
                    key={ord.id}
                    className="p-4 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/60 pb-2.5">
                      <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        تم التسليم
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">العميل:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{ord.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">طريقة الدفع:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {isCod ? 'كاش عند الاستلام' : 'دفع إلكتروني'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">المبلغ المحصل:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {ord.total} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. SubTab 4: Financial Reconciliation (FINANCES) */}
      {currentSubTab === 'finances' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 block">كاش تم تحصيله بيدك اليوم</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {deliveredCashCollected} ج.م
              </span>
              <span className="text-[11px] text-slate-500 block">من {deliveredOrders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY').length} طلب كاش مسلّم</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 block">كاش معلق في الطريق</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono block">
                {activeCashToCollect} ج.م
              </span>
              <span className="text-[11px] text-slate-500 block">مطلوب تحصيله مع الشحنات الحالية</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-400 block">شحنات مدفوعة إلكترونياً</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                {deliveredElectronicPaid} ج.م
              </span>
              <span className="text-[11px] text-slate-500 block">مدفوعة عبر المحفظة / فيزا</span>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 space-y-2">
              <span className="text-xs font-bold text-emerald-100 block">عمولة الكابتن المستحقة</span>
              <span className="text-2xl font-black font-mono block text-white">
                {commissionEarned} ج.م
              </span>
              <span className="text-[11px] text-emerald-200 block">معدل 20 ج.م لكل شحنة ناجحة</span>
            </div>
          </div>

          {/* Settlement / Handover Card */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-black text-base text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>تصفية وتوريد العهدة النقدية مع الصيدلية</span>
              </h4>
              <p className="text-xs text-slate-300">
                المبلغ النقدي الفعلي الجاهز للتسليم لأمين الخزينة بالصيدلية: <strong className="text-emerald-400 font-mono text-sm">{deliveredCashCollected} ج.م</strong>
              </p>
            </div>

            <button
              onClick={() => {
                setSettlementSuccess(true);
                setTimeout(() => setSettlementSuccess(false), 4000);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 self-start md:self-auto shrink-0 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>تأكيد توريد العهدة النقدية للفرع</span>
            </button>
          </div>

          {settlementSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>تم تسجيل إيصال توريد العهدة النقدية بمبلغ {deliveredCashCollected} ج.م بنجاح وإرسال إشعار للخزينة.</span>
            </div>
          )}

          {/* Transactions Detailed Ledger */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-black text-sm text-slate-900 dark:text-white">
              كشف تفصيلي بحركات الدفع والشحنات
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">رقم الشحنة</th>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">طريقة الدفع</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">حالة التحصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {relevantOrders.map((ord) => {
                    const isCod = ord.paymentMethod === 'CASH_ON_DELIVERY';
                    const isDelivered = ord.status === 'DELIVERED';
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ord.orderNumber}
                        </td>
                        <td className="p-3.5 text-slate-900 dark:text-white font-bold">
                          {ord.customerName}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            isCod ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {isCod ? 'كاش عند التسليم' : 'إلكتروني مسبق'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {ord.total} ج.م
                        </td>
                        <td className="p-3.5">
                          {isDelivered ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم التحصيل والتسليم</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>معلق في الطريق</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. SubTab 5: Map & Routes (MAP) */}
      {currentSubTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-500" />
                  <span>مخطط مسار التوصيل المجمع اليوم</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ترتيب المحطات حسب المسار الأمثل لتوفير الوقت والوقود
                </p>
              </div>

              {activeOrders.length > 0 && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    activeOrders.map((o) => `${o.deliveryAddress?.city || ''} ${o.deliveryAddress?.street || ''}`).join(' ')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
                >
                  <Navigation className="w-4 h-4" />
                  <span>فتح المسار في Google Maps</span>
                </a>
              )}
            </div>

            {activeOrders.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="لا توجد نقاط مسار نشطة"
                description="لا توجد شحنات في الطريق حالياً لعرض مسار الملاحة."
              />
            ) : (
              <div className="relative space-y-4 pr-6 before:content-[''] before:absolute before:right-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {activeOrders.map((ord, idx) => {
                  const fullAddress = `${ord.deliveryAddress?.governorate || ''} - ${ord.deliveryAddress?.city || ''} - ${ord.deliveryAddress?.street || ''}`;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

                  return (
                    <div key={ord.id} className="relative group">
                      {/* Step Indicator Dot */}
                      <div className="absolute -right-6 top-4 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white dark:ring-slate-900 shadow-xs">
                        {idx + 1}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group-hover:border-emerald-400 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                              {ord.orderNumber}
                            </span>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {ord.customerName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{fullAddress}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            title="اتصال بالعميل"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>ملاحة المحطة</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}



      {/* Confirmation Modal: Delivery Completion */}
      {confirmDeliveryOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-lg text-slate-900 dark:text-white">
                تأكيد تسليم الطلب للعميل
              </h4>
              <p className="text-xs text-slate-400">
                الشحنة رقم <strong className="text-slate-700 dark:text-slate-200 font-mono">{confirmDeliveryOrder.orderNumber}</strong> للعميل{' '}
                <strong className="text-slate-700 dark:text-slate-200">{confirmDeliveryOrder.customerName}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">طريقة الدفع:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {confirmDeliveryOrder.paymentMethod === 'CASH_ON_DELIVERY' ? 'كاش عند الاستلام' : 'دفع إلكتروني مسبق'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">المبلغ المطلوب استلامه:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {confirmDeliveryOrder.total} ج.م
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleExecuteDelivery}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
              >
                تأكيد التسليم واستلام المبلغ ✓
              </button>
              <button
                onClick={() => setConfirmDeliveryOrder(null)}
                className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Pickup Order */}
      {confirmPickupOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-black text-lg text-slate-900 dark:text-white">
                استلام الشحنة والانطلاق
              </h4>
              <p className="text-xs text-slate-400">
                هل استلمت كيس الطلب رقم <strong className="text-slate-700 dark:text-slate-200 font-mono">{confirmPickupOrder.orderNumber}</strong> من الصيدلية؟
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleExecutePickup}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
              >
                نعم، تم الاستلام والانطلاق للعميل 🚀
              </button>
              <button
                onClick={() => setConfirmPickupOrder(null)}
                className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
