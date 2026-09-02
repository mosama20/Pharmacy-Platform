import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  Sun,
  Moon,
  Store,
  Bell,
  Search,
  Shield,
  Stethoscope,
  Truck,
  Headphones,
  Check,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';

export const AdminHeader = ({
  activeTab,
  setActiveTab,
  cmsActiveSubTab,
  setMobileOpen,
  onRefresh,
  loading,
  onBackToStore,
}) => {
  const { user, login, logout } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_dark', 'false');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_dark', 'true');
      setIsDark(true);
    }
  };

  const roles = [
    {
      role: 'ADMIN',
      name: 'مدير النظام (Admin)',
      email: 'admin@pharmacy.com',
      icon: Shield,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
      defaultTab: 'orders',
    },
    {
      role: 'PHARMACIST',
      name: 'صيدلي مراجع (Pharmacist)',
      email: 'pharmacist@pharmacy.com',
      icon: Stethoscope,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40',
      defaultTab: 'prescriptions',
    },
    {
      role: 'DELIVERY',
      name: 'مندوب توصيل (Courier)',
      email: 'courier@pharmacy.com',
      icon: Truck,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
      defaultTab: 'courier',
    },
    {
      role: 'SUPPORT',
      name: 'خدمة العملاء (Support)',
      email: 'support@pharmacy.com',
      icon: Headphones,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
      defaultTab: 'orders',
    },
  ];

  const currentRoleObj = roles.find((r) => r.role === user?.role) || roles[0];
  const CurrentRoleIcon = currentRoleObj.icon;

  const handleSwitchRole = async (r) => {
    setIsRoleDropdownOpen(false);
    await login(r.email, 'admin123');
    setActiveTab(r.defaultTab);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 font-cairo">
      {/* Left side: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <AdminBreadcrumbs
            activeTab={activeTab}
            cmsActiveSubTab={cmsActiveSubTab}
            onTabClick={(tab) => setActiveTab(tab)}
          />
        </div>
      </div>

      {/* Right side: Quick Actions, Role Switcher, Refresh, Theme, User */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Instant Role Switcher Dropdown (for testing and demos) */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            title="تبديل الدور والصلاحيات للاختبار"
          >
            <CurrentRoleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{currentRoleObj.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  تجربة صلاحيات الأدوار:
                </span>
              </div>
              <div className="space-y-1">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = r.role === user?.role;
                  return (
                    <button
                      key={r.role}
                      onClick={() => handleSwitchRole(r)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${r.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span>{r.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Live Refresh Data Button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="تحديث البيانات لحظياً"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="تبديل الوضع الليلي / النهاري"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Quick Back to Store */}
        <button
          onClick={() => {
            window.location.hash = 'store';
            onBackToStore();
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Store className="w-3.5 h-3.5" />
          <span>المتجر</span>
        </button>
      </div>
    </header>
  );
};
