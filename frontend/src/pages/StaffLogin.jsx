import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCms } from '../context/CmsContext';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Stethoscope,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export const StaffLogin = ({ defaultPortalTitle = 'الكادر الطبي والإداري', targetRole = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, logout } = useAuth();
  const { settings } = useCms();

  const [emailOrPhone, setEmailOrPhone] = useState(() => {
    if (targetRole === 'PHARMACIST') return 'pharmacist@pharmacy.com';
    if (targetRole === 'DELIVERY') return 'courier@pharmacy.com';
    return 'admin@pharmacy.com';
  });
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract redirect query parameter if any
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect');

  // If a customer was logged in, log out so we can log in as staff cleanly
  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      logout();
    }
  }, []);

  const handleQuickFill = (email, pass) => {
    setEmailOrPhone(email);
    setPassword(pass);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setErrorMessage('يرجى ملء كافة الحقول المطلوبة');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const data = await login(emailOrPhone.trim(), password);
      const role = data.user?.role;

      // Check if target portal requires a specific role
      if (targetRole && role !== targetRole && role !== 'ADMIN') {
        setErrorMessage(`هذا الحساب مخصص لرتبة (${role}) ولا يمتلك صلاحية دخول بوابة (${defaultPortalTitle}).`);
        setLoading(false);
        return;
      }

      // If redirect param exists, go there
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // Role-based auto navigation
      if (role === 'ADMIN') {
        window.location.href = '/admin';
      } else if (role === 'PHARMACIST') {
        window.location.href = '/pharmacy';
      } else if (role === 'DELIVERY') {
        window.location.href = '/delivery';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Staff Login Error:', err);
      setErrorMessage(err.message || 'فشل تسجيل الدخول. تأكد من صحة البيانات وحالة الحساب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 text-white flex items-center justify-center p-4 font-cairo selection:bg-emerald-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand & Portal Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl shadow-emerald-500/20 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black font-tajawal tracking-tight">
            {settings.websiteName || 'الصيدلية الذكية'}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            بوابة تسجيل دخول {defaultPortalTitle} المعتمدة
          </p>
        </div>

        {/* Login Box */}
        <div className="p-8 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-sm font-bold text-slate-200">
              تسجيل الدخول الآمن (JWT Protected)
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              أدخل بيانات حسابك المعتمد للدخول إلى لوحة العمليات الخاصة بك.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                البريد الإلكتروني أو اسم المستخدم أو الهاتف
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  required
                  placeholder="admin@pharmacy.com أو admin"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  dir="ltr"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق والمصادقة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>دخول آمن للمنظومة</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Helper Credentials for Testing */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">
              💡 الحسابات الافتراضية المعتمدة (انقر للتعبئة السريعة):
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@pharmacy.com', 'admin123')}
                className="p-1.5 rounded-lg bg-purple-950/50 border border-purple-800/60 text-purple-300 hover:bg-purple-900/60 font-bold transition-all text-center"
              >
                مدير (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('pharmacist@pharmacy.com', 'admin123')}
                className="p-1.5 rounded-lg bg-teal-950/50 border border-teal-800/60 text-teal-300 hover:bg-teal-900/60 font-bold transition-all text-center"
              >
                صيدلي (Pharm)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('courier@pharmacy.com', 'admin123')}
                className="p-1.5 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 font-bold transition-all text-center"
              >
                مندوب (Courier)
              </button>
            </div>
          </div>
        </div>

        {/* Back to Public Store link */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة لمتجر الأدوية العام للعملاء</span>
          </a>
        </div>
      </div>
    </div>
  );
};
