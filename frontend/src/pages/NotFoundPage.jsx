import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-cairo">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white font-mono">404</h1>
          <h2 className="text-lg font-bold text-slate-300">الصفحة غير موجودة</h2>
          <p className="text-xs text-slate-400">
            الرابط الذي تحاول الوصول إليه غير متاح أو قد تم نقله لمسار آخر.
          </p>
        </div>
        <a
          href="/"
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>العودة للمتجر الرئيسي</span>
        </a>
      </div>
    </div>
  );
};
