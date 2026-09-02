import React from 'react';
import { Shield, Stethoscope, Truck, Headphones, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthRoleGateway = ({ setActiveTab, onBackToStore }) => {
  const { login } = useAuth();

  const roleProfiles = [
    {
      role: 'ADMIN',
      title: 'مدير النظام (Admin Panel)',
      description: 'كامل الصلاحيات المركزية، إدارة الـ CMS، الإيرادات والموظفين',
      email: 'admin@pharmacy.com',
      icon: Shield,
      gradient: 'from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800',
      shadow: 'shadow-purple-600/20',
      tab: 'orders',
    },
    {
      role: 'PHARMACIST',
      title: 'دكتور صيدلي مراجع (Pharmacist)',
      description: 'فحص وتدقيق الروشتات، تسعير الأدوية والبدائل الدوائية',
      email: 'pharmacist@pharmacy.com',
      icon: Stethoscope,
      gradient: 'from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800',
      shadow: 'shadow-teal-600/20',
      tab: 'prescriptions',
    },
    {
      role: 'DELIVERY',
      title: 'كابتن توصيل سريع (Courier Driver)',
      description: 'مهام التوصيل المسندة، خرائط الملاحة الحية، وتحصيل الكاش',
      email: 'courier@pharmacy.com',
      icon: Truck,
      gradient: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
      shadow: 'shadow-amber-500/20',
      tab: 'courier',
    },
    {
      role: 'SUPPORT',
      title: 'خدمة العملاء والدعم (Customer Care)',
      description: 'متابعة شحنات العملاء، الاشتراكات الشهرية واستفسارات المرضى',
      email: 'support@pharmacy.com',
      icon: Headphones,
      gradient: 'from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800',
      shadow: 'shadow-blue-600/20',
      tab: 'orders',
    },
  ];

  const [loggingInRole, setLoggingInRole] = React.useState(null);

  const handleLogin = async (prof) => {
    try {
      setLoggingInRole(prof.role);
      await login(prof.email, 'admin123');
      setActiveTab(prof.tab);
    } catch (err) {
      console.error('Login error:', err);
      alert('خطأ في تسجيل الدخول: ' + (err.message || 'تعذر الاتصال بالخادم'));
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-cairo">
      <div className="w-full max-w-md rounded-3xl glass-card border border-slate-700 bg-slate-800/90 p-6 shadow-2xl space-y-6 text-right">
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-700 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 font-black text-xl shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white font-tajawal">
              بوابة تسجيل دخول الكادر الطبي والتشغيلي
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              اختر الحساب المطلوب لتجربة الصلاحيات المخصصة لكل دور
            </p>
          </div>
        </div>

        {/* Roles List */}
        <div className="space-y-3">
          {roleProfiles.map((prof) => {
            const Icon = prof.icon;
            return (
              <button
                key={prof.role}
                onClick={() => handleLogin(prof)}
                className={`w-full p-4 rounded-2xl bg-gradient-to-r ${prof.gradient} text-white font-bold text-xs flex items-center justify-between shadow-lg ${prof.shadow} cursor-pointer transition-all transform hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-3 text-right">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-black text-sm">{prof.title}</span>
                    <span className="text-[11px] text-white/80 font-normal leading-tight">
                      {prof.description}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] bg-black/20 px-2.5 py-1 rounded-lg shrink-0 mr-2">
                  {loggingInRole === prof.role ? 'جاري الدخول...' : 'دخول'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer link to store */}
        <div className="pt-2 text-center border-t border-slate-700/60">
          <button
            onClick={() => {
              window.location.hash = 'store';
              onBackToStore();
            }}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة لمتجر العملاء</span>
          </button>
        </div>
      </div>
    </div>
  );
};
