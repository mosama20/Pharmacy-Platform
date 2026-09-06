import React, { useState } from 'react';
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
    <header className="sticky top-0 z-40 w-full max-w-full glass border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all overflow-hidden">
      {/* Top Banner Notice (Dynamic Announcement from CMS) */}
      {platformSettings.isAnnouncementActive && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 text-white text-[11px] sm:text-xs py-1 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center font-medium overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                <span>إعلان</span>
              </span>
              <span className="truncate">
                {platformSettings.announcementText || `أسرع توصيل صيدلية خلال 30-45 دقيقة في ${selectedDistrict}`}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4 shrink-0">
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

      {/* Main Navbar Top Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentView('store')}
            className="flex items-center gap-2 group text-right cursor-pointer"
          >
            {platformSettings.logoUrl ? (
              <img
                src={platformSettings.logoUrl}
                alt={platformSettings.websiteName || 'شعار الموقع'}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl object-cover shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-base sm:text-xl font-black">{platformSettings.logoText || 'صـ'}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-2xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight font-tajawal">
                  {platformSettings.websiteName || 'الصيدلية الذكية'}
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {platformSettings.brandTagline || 'صيدليتك أونلاين 24/7'}
              </span>
            </div>
          </button>

          {/* Location Selector Pill */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs transition-all cursor-pointer max-w-[120px] sm:max-w-[170px]"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-3 h-3" />
            </div>
            <div className="text-right truncate">
              <span className="font-bold truncate block">
                {selectedDistrict || selectedGovernorate}
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Input Button (Desktop only) */}
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Prescription Upload Button (Desktop only) */}
          <button
            onClick={onOpenUpload}
            className="hidden md:flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs md:text-sm font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>ارفع الروشتة</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="تبديل الوضع الليلي / النهاري"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 dark:text-emerald-400" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow-md animate-scale">
                {totalCount}
              </span>
            )}
          </button>

          {/* User Account / Login */}
          <div className="relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:shadow-sm cursor-pointer"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs">
                    {user.name?.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
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
                        <a
                          href={
                            user?.role === 'ADMIN'
                              ? '/admin'
                              : user?.role === 'PHARMACIST'
                              ? '/pharmacy'
                              : user?.role === 'DELIVERY'
                              ? '/delivery'
                              : '/admin'
                          }
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>
                            {user?.role === 'DELIVERY'
                              ? 'بوابة الكابتن والتوصيل'
                              : user?.role === 'PHARMACIST'
                              ? 'بوابة الصيدلي والمراجعة'
                              : 'لوحة الإدارة المركزية'}
                          </span>
                        </a>
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
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold transition-all cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Mobile Search Bar (Full Width, App-like) */}
      <div className="md:hidden px-3 pb-2.5 pt-0.5">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/95 dark:bg-slate-800/95 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs transition-all active:scale-[0.99] shadow-inner"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">ابحث عن دواء، مادة فعالة، أو منتج...</span>
          </div>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
            بحث
          </span>
        </button>
      </div>
    </header>
  );
};
