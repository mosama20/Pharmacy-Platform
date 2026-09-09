import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, Package, FileText, Sparkles, X } from 'lucide-react';
import {
  getStoredNotifications,
  markAllNotificationsAsRead,
  requestBrowserNotificationPermission,
} from '../../services/notificationStorage';

export const NotificationBell = ({ onOpenTracking }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionState, setPermissionState] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );
  const dropdownRef = useRef(null);

  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  useEffect(() => {
    loadNotifications();

    const handleNew = () => loadNotifications();
    const handleRead = () => loadNotifications();

    window.addEventListener('chefaa_new_notification', handleNew);
    window.addEventListener('chefaa_notifications_read', handleRead);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('chefaa_new_notification', handleNew);
      window.removeEventListener('chefaa_notifications_read', handleRead);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setIsOpen((prev) => !prev);
  };

  const handleEnablePush = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermissionState(res);
  };

  return (
    <div className="relative font-cairo z-50" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        title="الإشعارات وتنبيهات الطلب"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-white">الإشعارات المباشرة</span>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  markAllNotificationsAsRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                تعيين كمقروء
              </button>
            )}
          </div>

          {/* Browser Permission Banner */}
          {permissionState !== 'granted' && permissionState !== 'unsupported' && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
              <div className="text-xs text-emerald-800 dark:text-emerald-200">
                فعّل إشعارات المتصفح لتنبيهك فور خروج الدواء
              </div>
              <button
                onClick={handleEnablePush}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition"
              >
                تفعيل
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">لا توجد إشعارات جديدة حالياً</p>
                <p className="text-[11px] text-slate-400 mt-1">ستظهر هنا تحديثات طلباتك والروشتات أولاً بأول</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.orderId && onOpenTracking) {
                      onOpenTracking(n.orderId);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                    !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {n.type === 'order' ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
