import React from 'react';
import {
  Home,
  Grid,
  FileText,
  ShoppingCart,
  User,
  LayoutDashboard,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const MobileBottomNav = ({
  onOpenUpload,
  onOpenAuth,
  onOpenCategories,
  onScrollToTop,
  currentCategory,
}) => {
  const { user, isAdminOrStaff } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {/* 1. Home */}
        <button
          onClick={onScrollToTop}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all py-1"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>

        {/* 2. Categories */}
        <button
          onClick={onOpenCategories}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all py-1"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold">الأقسام</span>
        </button>

        {/* 3. Upload Prescription (Featured Center Action) */}
        <div className="flex justify-center -mt-5">
          <button
            onClick={onOpenUpload}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40 active:scale-90 transition-transform border-4 border-slate-50 dark:border-slate-950"
            title="ارفع الروشتة"
          >
            <Camera className="w-6 h-6 animate-pulse" />
          </button>
        </div>

        {/* 4. Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all py-1"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-scale">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">السلة</span>
        </button>

        {/* 5. Account / Login */}
        <button
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all py-1"
        >
          {user ? (
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
              {user.name?.charAt(0)}
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] font-bold truncate max-w-[50px]">
            {user ? (isAdminOrStaff ? 'الإدارة' : 'حسابي') : 'دخول'}
          </span>
        </button>
      </div>
    </nav>
  );
};
