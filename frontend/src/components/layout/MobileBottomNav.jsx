import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Home,
  Grid,
  ShoppingCart,
  User,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const MobileBottomNav = ({
  onOpenUpload,
  onOpenAuth,
  onOpenCart,
  onOpenCategories,
  onScrollToTop,
}) => {
  const location = useLocation();
  const { user, isAdminOrStaff } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();

  const isHome = location.pathname === '/';
  const isCategories = location.pathname === '/categories';
  const isCart = location.pathname === '/cart';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-safe font-tajawal">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {/* 1. Home */}
        <button
          onClick={onScrollToTop}
          className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-all py-1 cursor-pointer ${
            isHome
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-bold'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${isHome ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">{isHome ? '• الرئيسية' : 'الرئيسية'}</span>
        </button>

        {/* 2. Categories */}
        <button
          onClick={onOpenCategories}
          className={`flex flex-col items-center justify-center gap-1 active:scale-95 transition-all py-1 cursor-pointer ${
            isCategories
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-bold'
          }`}
        >
          <Grid className={`w-5 h-5 transition-transform ${isCategories ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">{isCategories ? '• الأقسام' : 'الأقسام'}</span>
        </button>

        {/* 3. Upload Prescription (Featured Center Action) */}
        <div className="flex justify-center -mt-5">
          <button
            onClick={onOpenUpload}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40 active:scale-90 transition-transform border-4 border-slate-50 dark:border-slate-950 cursor-pointer"
            title="ارفع الروشتة"
          >
            <Camera className="w-6 h-6 animate-pulse" />
          </button>
        </div>

        {/* 4. Cart */}
        <button
          onClick={() => {
            if (onOpenCart) onOpenCart();
            else setIsCartOpen(true);
          }}
          className={`relative flex flex-col items-center justify-center gap-1 active:scale-95 transition-all py-1 cursor-pointer ${
            isCart
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-bold'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 transition-transform ${isCart ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-scale">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">{isCart ? '• السلة' : 'السلة'}</span>
        </button>

        {/* 5. Account / Login */}
        <button
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-bold active:scale-95 transition-all py-1 cursor-pointer"
        >
          {user ? (
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
              {user.name?.charAt(0)}
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] truncate max-w-[50px]">
            {user ? (isAdminOrStaff ? 'الإدارة' : 'حسابي') : 'دخول'}
          </span>
        </button>
      </div>
    </nav>
  );
};
