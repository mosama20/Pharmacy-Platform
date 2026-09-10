import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const { settings } = useCms();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        await login(formData.email.trim(), formData.password.trim());
      }
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تنفيذ العملية، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-cairo">
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
                {isRegister ? 'سجل واحصل على 100 نقطة ترحيبية فورية' : 'أهلاً بك مجدداً في صيدليتك'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              البريد الإلكتروني أو رقم الهاتف:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="name@example.com أو 01xxxxxxxxx"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم الهاتف (للتوصيل):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              كلمة المرور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
        </form>
      </div>
    </div>
  );
};
