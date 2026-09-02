import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  FileText,
  ShoppingCart,
  User as UserIcon,
  Moon,
  Sun,
  ShieldCheck,
  Phone,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Sparkles,
  Heart,
  Clock,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { useCms } from '../../context/CmsContext';

export const Navbar = ({
  onOpenUpload,
  onOpenSearch,
  onOpenAuth,
  onOpenRefill,
  currentView,
  setCurrentView,
  darkMode,
  setDarkMode,
}) => {
  const { user, logout, isAdminOrStaff, isCourier } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();
  const { selectedGovernorate, selectedDistrict, setIsLocationModalOpen } =
    useLocation();
  const { settings: platformSettings } = useCms();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all">
      {/* Top Banner Notice (Dynamic Announcement from CMS) */}
      {platformSettings.isAnnouncementActive && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 text-white text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center font-medium">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>إعلان حصري</span>
              </span>
              <span>{platformSettings.announcementText || `أسرع توصيل صيدلية خلال 30-45 دقيقة في ${selectedDistrict}`}</span>
            </div>
            <div className="flex items-center gap-4 hidden md:flex">
              <button
                onClick={onOpenRefill}
                className="hover:underline flex items-center gap-1 text-emerald-100 hover:text-white cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>باقة الدواء الشهري للمزمن</span>
              </button>
              <span className="text-white/40">|</span>
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>الخط الساخن: <strong className="font-mono">{platformSettings.hotline || '19876'}</strong> (24/7)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 md:gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('store')}
            className="flex items-center gap-2.5 group text-right cursor-pointer"
          >
            {platformSettings.logoUrl ? (
              <img
                src={platformSettings.logoUrl}
                alt={platformSettings.websiteName || 'شعار الموقع'}
                className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl font-black">{platformSettings.logoText || 'صـ'}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight font-tajawal">
                  {platformSettings.websiteName || 'الصيدلية الذكية'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                {platformSettings.brandTagline || 'صيدليتك أونلاين 24/7'}
              </span>
            </div>
          </button>

          {/* Location Selector Pill */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center relative">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                موقع التوصيل:
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="font-bold max-w-[140px] truncate block">
                {selectedGovernorate}، {selectedDistrict}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Input Button */}
        <div className="flex-1 max-w-xl hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700 text-slate-400 text-xs transition-all cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ابحث باسم الدواء، المادة الفعالة، أو المنتج التجميلي...</span>
            </div>
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Prescription Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">ارفع الروشتة</span>
          </button>

          {/* Quick Search on Mobile */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 md:hidden"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="تبديل الوضع الليلي / النهاري"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-scale">
                {totalCount}
              </span>
            )}
          </button>

          {/* Admin Dashboard Quick Access Button */}
          <button
            onClick={() => {
              window.location.hash = 'admin';
              setCurrentView('admin');
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer text-xs font-bold shadow-xs"
            title="لوحة التحكم المركزية"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>لوحة التحكم</span>
          </button>

          {/* User Account / Login */}
          <div className="relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:shadow-sm cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs">
                    {user.name?.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-60 rounded-2xl glass-card shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{user.phone}</p>
                      <span
                        className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : user.role === 'PHARMACIST'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : user.role === 'DELIVERY'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {user.role === 'ADMIN'
                          ? 'مدير النظام (Admin)'
                          : user.role === 'PHARMACIST'
                          ? 'صيدلي مراجع'
                          : user.role === 'DELIVERY'
                          ? 'مندوب توصيل سريع'
                          : 'عميل مميز'}
                      </span>
                    </div>

                    <div className="py-1">
                      {isAdminOrStaff && (
                        <button
                          onClick={() => {
                            window.location.hash = 'admin';
                            setCurrentView('admin');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>
                            {isCourier
                              ? 'بوابة الكابتن والتوصيل'
                              : 'لوحة التحكم المركزية'}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold transition-all cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
