import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const { settings } = useCms();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: 'القاهرة',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setLoading(false);
    }
  };

  const setQuickStaff = (email, pass) => {
    setIsRegister(false);
    setFormData((prev) => ({ ...prev, email, password: pass }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              {settings?.logoText || 'صـ'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isRegister ? `إنشاء حساب جديد في ${settings?.websiteName || 'الصيدلية'}` : 'تسجيل الدخول'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRegister ? 'واحصل على 100 نقطة مكافأة فورية' : 'مرحباً بك مجدداً في صيدليتك'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الاسم بالكامل:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              البريد الإلكتروني أو الهاتف:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="user@gmail.com أو 01012345678"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم الهاتف (للتوصيل):
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              كلمة المرور:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'جاري التحقق...'
              : isRegister
              ? 'إنشاء الحساب وبدء التسوق'
              : 'تسجيل الدخول'}
          </button>

          {/* Switch Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs text-emerald-600 hover:underline font-bold"
            >
              {isRegister
                ? 'لديك حساب بالفعل؟ سجل دخولك الآن'
                : 'ليس لديك حساب؟ اشترك مجاناً الآن'}
            </button>
          </div>

          {/* Quick Staff Login Presets (For testing demo roles) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>دخول سريع لحسابات الموظفين والإدارة (تجريبي):</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setQuickStaff('admin@pharmacy.com', 'admin123')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 hover:text-purple-700 text-slate-700 dark:text-slate-300 font-bold text-right"
              >
                مدير النظام (Admin)
              </button>
              <button
                type="button"
                onClick={() => setQuickStaff('pharmacist@pharmacy.com', 'admin123')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 hover:text-teal-700 text-slate-700 dark:text-slate-300 font-bold text-right"
              >
                صيدلاني مراجع
              </button>
              <button
                type="button"
                onClick={() => setQuickStaff('courier@pharmacy.com', 'admin123')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-700 text-slate-700 dark:text-slate-300 font-bold text-right"
              >
                كابتن توصيل
              </button>
              <button
                type="button"
                onClick={() => setQuickStaff('user@gmail.com', '123456')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 dark:text-slate-300 font-bold text-right"
              >
                عميل (محمد إبراهيم)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
