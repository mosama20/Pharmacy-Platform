import React from 'react';
import {
  ShieldCheck,
  Truck,
  HeartHandshake,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

export const Footer = () => {
  const { settings } = useCms();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Value Propositions / Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                توصيل سريع خلال {settings.estimatedDeliveryMin || 35} دقيقة
              </h4>
              <p className="text-xs text-slate-400">تغطية شاملة لجميع محافظات ومناطق مصر</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">أدوية ومستلزمات أصلية 100%</h4>
              <p className="text-xs text-slate-400">من صيدليات وموردين معتمدين من وزارة الصحة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">استشارة صيدلي 24/7</h4>
              <p className="text-xs text-slate-400">فريق طبي متاح دائماً للإجابة وتدقيق الروشتات</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">طرق دفع مرنة وآمنة</h4>
              <p className="text-xs text-slate-400">كاش، فوري، فيزا، محافظ كاش، وتقسيط ValU</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.websiteName}
                  className="w-9 h-9 rounded-xl object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg">
                  {settings.logoText || 'شـ'}
                </div>
              )}
              <span className="text-2xl font-black text-white font-tajawal">
                {settings.websiteName || 'الصيدلية الذكية'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {settings.brandDescription ||
                'منصة الرعاية الصحية والصيدلية الإلكترونية الشاملة، تهدف لتمكين المرضى وعائلاتهم من طلب وتكرار أدويتهم واحتياجاتهم الصحية بسهولة وسرعة وأمان.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>مرخصة ومسجلة رسمياً</span>
            </div>
          </div>

          {/* Dynamic Footer Columns */}
          {settings.footerColumns && settings.footerColumns.length > 0 ? (
            settings.footerColumns.map((col, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-white text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  {col.links?.map((link, lIdx) => (
                    <li
                      key={lIdx}
                      className="hover:text-white cursor-pointer transition-colors"
                    >
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              <div>
                <h4 className="font-bold text-white text-sm mb-4">خدماتنا</h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="hover:text-white cursor-pointer transition-colors">ارفع الروشتة واطلب دواك</li>
                  <li className="hover:text-white cursor-pointer transition-colors">باقة الدواء الشهري للمزمن</li>
                  <li className="hover:text-white cursor-pointer transition-colors">اسأل صيدلي - استشارة فورية</li>
                  <li className="hover:text-white cursor-pointer transition-colors">محرك البحث عن بدائل الأدوية</li>
                  <li className="hover:text-white cursor-pointer transition-colors">عروض وخصومات Big Save</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-4">الأقسام الأكثر طلباً</h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="hover:text-white cursor-pointer transition-colors">مسكنات وخافض للحرارة</li>
                  <li className="hover:text-white cursor-pointer transition-colors">علاج السكر والضغط والقلب</li>
                  <li className="hover:text-white cursor-pointer transition-colors">منتجات العناية بالبشرة والشعر</li>
                  <li className="hover:text-white cursor-pointer transition-colors">الفيتامينات والمكملات الغذائية</li>
                  <li className="hover:text-white cursor-pointer transition-colors">أجهزة قياس السكر وضغط الدم</li>
                </ul>
              </div>
            </>
          )}

          {/* Contact Col */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4">تواصل مع الدعم الطبي</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>الخط الساخن: <strong className="text-white font-mono">{settings.hotline || '19876'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>{settings.supportEmail || 'admin@pharmacy.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-relaxed">{settings.address || 'شارع التسعين، القاهرة، مصر'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Social */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 {settings.websiteName || 'الصيدلية الذكية'}. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">الشروط والأحكام</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">سياسة الخصوصية</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">ميثاق الصيدلية والأدوية</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
