import React from 'react';
import {
  ShoppingBag,
  FileText,
  Package,
  Clock,
  Truck,
  Users,
  ShieldCheck,
  BarChart3,
  Sliders,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';

export const AdminSidebar = ({
  activeTab,
  setActiveTab,
  cmsActiveSubTab,
  setCmsActiveSubTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onBackToStore,
  pendingOrdersCount = 0,
  pendingRxCount = 0,
  activeDeliveriesCount = 0,
  readyDeliveriesCount = 0,
}) => {
  const { user, logout, isAdmin, isPharmacist, isCourier, isSupport } = useAuth();
  const { settings } = useCms();

  const handleNavClick = (tabId, subTabId = null) => {
    setActiveTab(tabId);
    if (tabId === 'cms' && subTabId && setCmsActiveSubTab) {
      setCmsActiveSubTab(subTabId);
    }
    if (setMobileOpen) setMobileOpen(false);
  };

  // Nav items configuration grouped cleanly and logically
  const navGroups = [
    {
      groupTitle: 'العمليات والطلبات',
      items: [
        {
          id: 'orders',
          label: 'صندوق الطلبات',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'bg-red-500 text-white',
          visible: isAdmin || isPharmacist || isSupport,
        },
        {
          id: 'prescriptions',
          label: 'تسعير وفحص الروشتات',
          icon: FileText,
          badge: pendingRxCount > 0 ? pendingRxCount : null,
          badgeColor: 'bg-amber-500 text-white',
          visible: isAdmin || isPharmacist,
        },
        {
          id: 'products',
          label: 'الأدوية والمخزون',
          icon: Package,
          visible: isAdmin || isPharmacist,
        },
        {
          id: 'courier',
          label: 'الشحن وبوابة التوصيل',
          icon: Truck,
          badge:
            activeDeliveriesCount > 0
              ? activeDeliveriesCount
              : readyDeliveriesCount > 0
                ? readyDeliveriesCount
                : null,
          badgeColor:
            activeDeliveriesCount > 0
              ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
              : 'bg-blue-600 text-white',
          visible: isAdmin || isCourier,
        },
        {
          id: 'refills',
          label: 'اشتراكات الدواء الشهري',
          icon: Clock,
          visible: isAdmin || isPharmacist || isSupport,
        },
      ],
    },
    {
      groupTitle: 'المتجر والتسويق',
      visible: isAdmin,
      items: [
        {
          id: 'cms',
          label: 'إدارة المتجر والمحتوى (CMS)',
          icon: Sliders,
          visible: isAdmin,
        },
      ],
    },
    {
      groupTitle: 'الإدارة والتحليلات',
      items: [
        {
          id: 'customers',
          label: 'دليل وسجلات العملاء',
          icon: ShieldCheck,
          visible: isAdmin || isSupport,
        },
        {
          id: 'staff',
          label: 'فريق العمل والصلاحيات',
          icon: Users,
          visible: isAdmin,
        },
        {
          id: 'analytics',
          label: 'التقارير والمؤشرات المالية',
          icon: BarChart3,
          visible: isAdmin,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out font-cairo ${collapsed ? 'w-20' : 'w-72'
          } ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
      >
        {/* 1. Sidebar Header with CMS Branding */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.websiteName || 'شعار الإدارة'}
                className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-emerald-600/20 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/20 shrink-0">
                {settings?.logoText || 'صـ'}
              </div>
            )}

            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-slate-900 dark:text-white font-tajawal tracking-tight">
                    {settings?.websiteName || 'الصيدلية الذكية'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  لوحة التحكم المركزية
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle (Desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => item.visible);
            if (visibleItems.length === 0 || group.visible === false) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 select-none">
                    {group.groupTitle}
                  </p>
                )}

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative cursor-pointer ${isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                            }`}
                        />

                        {!collapsed && (
                          <span className="flex-1 text-right truncate">
                            {item.label}
                          </span>
                        )}

                        {!collapsed && item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed Active Indicator Pill */}
                        {collapsed && isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 rounded-r-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* 3. Sidebar Footer with Real User Profile & Quick Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-2">
          {/* Quick link to Store */}
          <button
            onClick={() => {
              window.location.hash = 'store';
              onBackToStore();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold transition-colors cursor-pointer ${collapsed ? 'px-0' : ''
              }`}
            title="الذهاب لمتجر العملاء"
          >
            <Store className="w-4 h-4 shrink-0" />
            {!collapsed && <span>عرض متجر العملاء</span>}
          </button>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>

              {!collapsed && (
                <div className="truncate">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {user?.name || 'مستخدم النظام'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {user?.role === 'ADMIN'
                      ? 'مدير النظام'
                      : user?.role === 'PHARMACIST'
                        ? 'صيدلي مراجع'
                        : user?.role === 'DELIVERY'
                          ? 'مندوب توصيل'
                          : user?.role === 'SUPPORT'
                            ? 'خدمة العملاء'
                            : 'طاقم العمل'}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
