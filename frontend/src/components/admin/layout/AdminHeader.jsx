import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  Sun,
  Moon,
  Store,
  Shield,
  Stethoscope,
  Truck,
  Headphones,
  User,
  LogOut,
  ChevronDown,
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
  const { user, logout } = useAuth();
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

  const getRoleConfig = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          name: 'مدير المنظومة (Admin)',
          icon: Shield,
          color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
        };
      case 'PHARMACIST':
        return {
          name: 'صيدلي مراجع (Pharmacist)',
          icon: Stethoscope,
          color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
        };
      case 'DELIVERY':
        return {
          name: 'كابتن توصيل (Courier)',
          icon: Truck,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        };
      case 'SUPPORT':
        return {
          name: 'خدمة العملاء (Support)',
          icon: Headphones,
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        };
      default:
        return {
          name: 'كادر طبي / إداري',
          icon: Shield,
          color: 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);
  const RoleIcon = roleConfig.icon;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/staff/login';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 font-cairo">
      {/* Left side: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
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

      {/* Right side: Role badge, Live refresh, Theme toggle, Store button, User profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Active Role Indicator Badge */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${roleConfig.color}`}>
          <RoleIcon className="w-4 h-4 shrink-0" />
          <span>{roleConfig.name}</span>
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

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              {user?.name?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            <span className="hidden md:inline max-w-[110px] truncate">{user?.name || 'حسابي'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="space-y-1">
                <a
                  href="/staff/login"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>تبديل الحساب</span>
                </a>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج الآمن</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
