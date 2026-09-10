import React from 'react';
import { Save, Phone, MapPin, Truck, Clock, Bell } from 'lucide-react';

export const CmsBusinessSection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              بيانات التواصل والتوصيل والشحن
            </h3>
            <p className="text-xs text-slate-400">
              الخط الساخن، واتساب الصيدلية، رسوم التوصيل، وشريط الإعلانات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              الخط الساخن الموحد (Hotline):
            </label>
            <input
              type="text"
              required
              value={settingsForm.hotline}
              onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              رقم خدمة العملاء / واتساب:
            </label>
            <input
              type="text"
              required
              value={settingsForm.whatsapp}
              onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              بريد الدعم الفني والمراسلات:
            </label>
            <input
              type="email"
              required
              value={settingsForm.supportEmail}
              onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان الصيدلية المركزية / المقر الرئيسي:
            </label>
            <input
              type="text"
              value={settingsForm.address}
              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              مواعيد العمل الرسمية:
            </label>
            <input
              type="text"
              value={settingsForm.workingHours}
              onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Delivery & Shipping Settings */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              إعدادات رسوم وسرعة التوصيل:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                رسوم التوصيل الأساسية (ج.م):
              </label>
              <input
                type="number"
                min="0"
                value={settingsForm.deliveryFee}
                onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                الحد الأدنى للشحن المجاني (ج.م):
              </label>
              <input
                type="number"
                min="0"
                value={settingsForm.freeDeliveryThreshold}
                onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-emerald-600 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                الوقت المتوقع للتوصيل (بالدقائق):
              </label>
              <input
                type="number"
                min="5"
                value={settingsForm.estimatedDeliveryMin}
                onChange={(e) => setSettingsForm({ ...settingsForm, estimatedDeliveryMin: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Chronic Refills Settings */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/80 to-emerald-50/80 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200/80 dark:border-teal-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                إعدادات خدمة الدواء الشهري للأمراض المزمنة (Chronic Refill):
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
              الخصم الحالي: {settingsForm.refillDiscountPercent ?? 15}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                نسبة الخصم الحصرية لاشتراك الدواء الشهري (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settingsForm.refillDiscountPercent ?? 15}
                  onChange={(e) => setSettingsForm({ ...settingsForm, refillDiscountPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-black text-teal-700 dark:text-teal-300 focus:outline-none focus:border-teal-500 shadow-xs"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                تطبق هذه النسبة تلقائياً على كافة طلبات واشتراكات تكرار الدواء الشهري للمرضى.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-teal-200/50 dark:border-teal-800/50">
                <input
                  type="checkbox"
                  checked={settingsForm.refillFreeDelivery ?? true}
                  onChange={(e) => setSettingsForm({ ...settingsForm, refillFreeDelivery: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    توصيل مجاني لطلبات الدواء الشهري
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    ميزة تحفيزية لمرضى الأمراض المزمنة دون احتساب رسوم شحن دورية
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.isAnnouncementActive}
                onChange={(e) => setSettingsForm({ ...settingsForm, isAnnouncementActive: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                تفعيل شريط الإعلانات والعروض أعلى المتجر (Top Announcement Bar)
              </span>
            </label>
          </div>

          <input
            type="text"
            placeholder="نص الإعلان الذي يظهر لجميع زوار المتجر أعلى الموقع..."
            value={settingsForm.announcementText}
            onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ بيانات التواصل والشحن</span>
          </button>
        </div>
      </div>
    </form>
  );
};
