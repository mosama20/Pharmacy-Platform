import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  MapPin,
  ShieldCheck,
  Search,
  Navigation,
  Compass,
  Zap,
  Building2,
  Home,
  RotateCw,
  Layers,
  AlertCircle,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const OrderTrackingModal = ({ isOpen, onClose, initialOrderId }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [liveTracking, setLiveTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchNumber, setSearchNumber] = useState(initialOrderId || '');
  const [searchError, setSearchError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Order and Live Tracking Data
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrders = async () => {
      setLoading(true);
      setSearchError('');
      try {
        if (initialOrderId) {
          const ord = await api.getOrderById(initialOrderId);
          setSelectedOrder(ord);
          fetchLiveGps(ord.id);
        } else if (user && ['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT'].includes(user.role)) {
          const all = await api.getAllOrders().catch(() => []);
          setOrders(Array.isArray(all) ? all : []);
          if (Array.isArray(all) && all.length > 0) {
            setSelectedOrder(all[0]);
            fetchLiveGps(all[0].id);
          }
        } else if (user) {
          const userOrders = await api.getMyOrders().catch(() => []);
          setOrders(Array.isArray(userOrders) ? userOrders : []);
          if (Array.isArray(userOrders) && userOrders.length > 0) {
            setSelectedOrder(userOrders[0]);
            fetchLiveGps(userOrders[0].id);
          }
        }
      } catch (e) {
        console.warn('Initial order loading notice:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isOpen, initialOrderId, user]);

  const fetchLiveGps = async (orderId) => {
    try {
      const data = await api.getOrderLiveTracking(orderId);
      setLiveTracking(data);
    } catch (e) {
      console.warn('Live tracking endpoint notice:', e);
    }
  };

  // Real-time polling for live coordinates updates
  useEffect(() => {
    if (!isOpen || !selectedOrder) return;
    const interval = setInterval(() => {
      fetchLiveGps(selectedOrder.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, selectedOrder]);

  const handleSearchOrder = async (e) => {
    e.preventDefault();
    if (!searchNumber.trim()) return;
    setLoading(true);
    setSearchError('');
    try {
      const ord = await api.getOrderById(searchNumber.trim());
      setSelectedOrder(ord);
      fetchLiveGps(ord.id);
    } catch (err) {
      setSearchError('لم يتم العثور على هذا الطلب. يرجى التأكد من كتابة رقم الطلب بالشكل الصحيح.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusSteps = [
    { key: 'PENDING', label: 'تم استلام الطلب', icon: Clock },
    { key: 'REVIEWED', label: 'مراجعة الصيدلي', icon: ShieldCheck },
    { key: 'PREPARING', label: 'تجهيز وتغليف الدواء', icon: Package },
    { key: 'OUT_FOR_DELIVERY', label: 'في الطريق مع الكابتن', icon: Truck },
    { key: 'DELIVERED', label: 'تم الاستلام بنجاح', icon: CheckCircle2 },
  ];

  const getStatusIndex = (st) => {
    const idx = statusSteps.findIndex((s) => s.key === st);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStatusIndex(selectedOrder?.status || 'PENDING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                تتبع مسار التوصيل المباشر
                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-normal">
                  Live GPS
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                متابعة لحظية لحالة الأدوية ومسار المندوب بالدقيقة والثانية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Order Search Bar */}
          <form onSubmit={handleSearchOrder} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="أدخل رقم الطلب (مثال: CHF-2026-9812)..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              بحث عن الطلب
            </button>
          </form>

          {searchError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <span>جاري تحميل إحداثيات التتبع المباشر للطلب...</span>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Order Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">رقم الطلب:</span>
                    <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {selectedOrder.orderNumber}
                    </strong>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      {selectedOrder.deliveryType === 'EXPRESS_45M'
                        ? 'توصيل إكسبريس (45 دقيقة)'
                        : 'توصيل مجدول'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    العنوان: {selectedOrder.deliveryAddress?.street}، {selectedOrder.deliveryAddress?.city} ({selectedOrder.deliveryAddress?.governorate})
                  </p>
                </div>

                <div className="text-left">
                  <span className="text-xs text-slate-500 block">إجمالي الحساب:</span>
                  <strong className="font-mono text-base text-slate-900 dark:text-white">
                    {selectedOrder.total} ج.م
                  </strong>
                </div>
              </div>

              {/* Dynamic Interactive Live GPS Map Visualizer */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 text-white min-h-[300px] flex flex-col justify-between p-5 shadow-2xl">
                {/* SVG Route Canvas */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 60,200 Q 180,120 300,160 T 580,130"
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth="4"
                    strokeDasharray="6,6"
                    className="animate-pulse"
                  />
                </svg>

                {/* Top Status Banner inside Map */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-500/30 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-emerald-300">
                      {liveTracking?.liveStatusText || 'الكابتن يتحرك الآن باتجاه موقعك'}
                    </span>
                  </div>

                  {liveTracking && (
                    <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 text-[11px] font-mono flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>الوقت المتوقع: <strong>{liveTracking.etaMinutes} دقيقة</strong></span>
                      <span className="text-slate-500">|</span>
                      <span className="text-emerald-400">{liveTracking.distanceRemainingKm} كم</span>
                    </div>
                  )}
                </div>

                {/* Map Interactive Nodes */}
                <div className="relative z-10 flex items-center justify-between px-2 pt-8 pb-4">
                  {/* Point 1: Governorate Pharmacy Branch */}
                  <div className="flex flex-col items-center gap-1.5 max-w-[120px] text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/90 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/50">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 leading-tight">
                      {liveTracking?.pharmacyLocation?.nameAr || 'الفرع المركزي للصيدلية'}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-mono">
                      {liveTracking?.pharmacyLocation?.lat.toFixed(3)}, {liveTracking?.pharmacyLocation?.lng.toFixed(3)}
                    </span>
                  </div>

                  {/* Point 2: Courier Live Motion */}
                  <div
                    className="flex flex-col items-center gap-1.5 transition-all duration-1000"
                    style={{
                      transform:
                        selectedOrder.status === 'DELIVERED'
                          ? 'translateX(40px)'
                          : selectedOrder.status === 'OUT_FOR_DELIVERY'
                          ? 'translateX(0px)'
                          : 'translateX(-40px)',
                    }}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500 border-2 border-white flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce">
                        <Truck className="w-7 h-7 text-slate-950" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-black text-amber-300 block">
                        {liveTracking?.courierInfo?.name || 'كابتن التوصيل السريع'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        {selectedOrder.status === 'OUT_FOR_DELIVERY'
                          ? `السرعة: ${liveTracking?.courierLocation?.speedKmH || 34} كم/س`
                          : 'جاري التجهيز'}
                      </span>
                    </div>
                  </div>

                  {/* Point 3: Customer Destination */}
                  <div className="flex flex-col items-center gap-1.5 max-w-[120px] text-center">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-600/90 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-900/50">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 leading-tight">
                      {liveTracking?.customerLocation?.address || 'موقع الاستلام'}
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono">
                      {liveTracking?.customerLocation?.lat.toFixed(3)}, {liveTracking?.customerLocation?.lng.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Bottom Courier Details bar inside map */}
                {liveTracking?.courierInfo && (
                  <div className="relative z-10 mt-2 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={liveTracking.courierInfo.avatar}
                        alt="Courier"
                        className="w-10 h-10 rounded-full object-cover border border-emerald-400"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">
                            {liveTracking.courierInfo.name}
                          </span>
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{liveTracking.courierInfo.rating}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {liveTracking.courierInfo.vehicleType} • {liveTracking.courierInfo.tripsCount} رحلة ناجحة
                        </span>
                      </div>
                    </div>

                    <a
                      href={`tel:${liveTracking.courierInfo.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      اتصال بالكابتن
                    </a>
                  </div>
                )}
              </div>

              {/* Status Stepper */}
              <div className="space-y-4">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  مراحل تجهيز وتوصيل الطلب:
                </h5>
                <div className="grid grid-cols-5 gap-2">
                  {statusSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div
                        key={step.key}
                        className={`flex flex-col items-center text-center gap-2 p-2.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                            : isDone
                            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            : 'opacity-40 border-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  محتويات الطلب ({selectedOrder.items?.length || 0} أدوية ومستلزمات):
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedOrder.items?.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={it.image}
                          alt={it.nameAr}
                          className="w-7 h-7 rounded-lg object-cover bg-white"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {it.nameAr}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          × {it.quantity}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {it.price * it.quantity} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Truck className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-600 dark:text-slate-300">
                لم يتم تحديد طلب للمتابعة
              </p>
              <p>أدخل رقم الطلب في خانة البحث أعلاه لمتابعة خط سير التوصيل المباشر.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
