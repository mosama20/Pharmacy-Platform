import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleDefaultPath } from '../../context/AuthContext';
import { ShieldAlert, ArrowRight, LogOut, Loader2, ShieldCheck, LayoutDashboard } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4 font-cairo">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm text-slate-300 font-bold">جاري التحقق من الصلاحيات الأمنية...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to staff login preserving redirect target
  if (!token || !user) {
    return <Navigate to={`/staff/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Account suspended
  if (user.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-cairo">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-red-500/30 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-red-400">الحساب معطل أو موقوف</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            تم تعليق هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع المسؤول المباشر أو قسم الدعم الفني لإعادة تفعيل الصلاحيات.
          </p>
          <button
            onClick={() => {
              logout();
              window.location.href = '/staff/login';
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج والعودة</span>
          </button>
        </div>
      </div>
    );
  }

  // Role check: if user role is not among allowedRoles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    const myPortalPath = getRoleDefaultPath(user.role);
    const myPortalName =
      user.role === 'PHARMACIST'
        ? 'بوابة الصيدلي والمراجعة الطبية'
        : user.role === 'DELIVERY'
        ? 'بوابة كابتن التوصيل والرحلات'
        : 'متجر الأدوية الرئيسي';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-cairo">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-amber-500/30 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-amber-400">تنبيه الصلاحيات الأمنية</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            أنت مسجل حالياً بحساب <strong className="text-amber-300">({user.name || user.email})</strong> بصلاحية <strong>({user.role})</strong>، وهذه المنطقة غير مصرح بها لحسابك الحالي.
          </p>
          <div className="space-y-2 pt-2">
            {myPortalPath !== '/' && (
              <a
                href={myPortalPath}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>الانتقال إلى {myPortalName}</span>
              </a>
            )}

            <button
              onClick={() => {
                logout();
                window.location.href = `/staff/login?redirect=${encodeURIComponent(location.pathname)}`;
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل الدخول بحساب مسؤول (Admin)</span>
            </button>

            <a
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لمتجر الأدوية</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
