import React, { useState } from 'react';
import { Save, Award, Coins, Sparkles, HelpCircle, CheckCircle2, AlertCircle, ArrowLeftRight, Calculator } from 'lucide-react';

export const CmsLoyaltyPointsSection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  // Ensure default loyaltyPoints object
  const loyalty = settingsForm.loyaltyPoints || {
    isEnabled: true,
    spendingUnit: 10,
    pointsPerUnit: 1,
    pointRedemptionValue: 0.1,
    minRedeemPoints: 50,
  };

  const [simulatedAmount, setSimulatedAmount] = useState(500);

  const updateLoyalty = (field, value) => {
    setSettingsForm({
      ...settingsForm,
      loyaltyPoints: {
        ...loyalty,
        [field]: value,
      },
    });
  };

  // Simulator calculations
  const unit = Number(loyalty.spendingUnit) > 0 ? Number(loyalty.spendingUnit) : 10;
  const ptsPerUnit = Number(loyalty.pointsPerUnit) > 0 ? Number(loyalty.pointsPerUnit) : 1;
  const redeemVal = Number(loyalty.pointRedemptionValue) > 0 ? Number(loyalty.pointRedemptionValue) : 0.1;

  const simPointsEarned = Math.floor(simulatedAmount / unit) * ptsPerUnit;
  const simMonetaryValue = (simPointsEarned * redeemVal).toFixed(1);
  const simCashbackPercent = simulatedAmount > 0 ? ((simPointsEarned * redeemVal / simulatedAmount) * 100).toFixed(1) : 0;

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>نظام وإعدادات نقاط الولاء والمكافآت</span>
                <span className="text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
                  Loyalty Points Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                التحكم الديناميكي في عدد النقاط المحتسبة للعميل مقابل كل مبلغ مشتريات وقيمة الاستبدال
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              حالة البرنامج:
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={loyalty.isEnabled !== false}
                onChange={(e) => updateLoyalty('isEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className={`text-xs font-bold ${loyalty.isEnabled !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {loyalty.isEnabled !== false ? 'مفعل ويعمل' : 'معطل'}
            </span>
          </div>
        </div>

        {/* Dynamic Calculation Ratio Box */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-amber-500/5 border border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              معادلة احتساب النقاط عند الشراء:
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            حدد النسبة بحرية؛ سيقوم النظام تلقائياً بتطبيق هذه المعادلة عند إتمام أي عميل لطلبه وتحديث رصيد نقاطه فوراً.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مبلغ الشراء المؤهل (جنيه مصري):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={loyalty.spendingUnit || 10}
                  onChange={(e) => updateLoyalty('spendingUnit', Math.max(1, Number(e.target.value)))}
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
              </div>
              <p className="text-[11px] text-slate-400">
                مثال: اكتب 10 ليتم احتساب النقاط لكل 10 جنيهات
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                عدد النقاط المكتسبة مقابل هذا المبلغ:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={loyalty.pointsPerUnit || 1}
                  onChange={(e) => updateLoyalty('pointsPerUnit', Math.max(1, Number(e.target.value)))}
                  className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold font-mono text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">نقطة</span>
              </div>
              <p className="text-[11px] text-slate-400">
                مثال: اكتب 1 ليكسب العميل نقطة واحدة لكل {loyalty.spendingUnit || 10} ج.م
              </p>
            </div>
          </div>
        </div>

        {/* Redemption & Value Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                قيمة النقطة عند الاستبدال (بالجنيه):
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                100 نقطة = {(Number(loyalty.pointRedemptionValue || 0.1) * 100).toFixed(0)} ج.م
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={loyalty.pointRedemptionValue || 0.1}
                onChange={(e) => updateLoyalty('pointRedemptionValue', Number(e.target.value))}
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م / نقطة</span>
            </div>
            <p className="text-[11px] text-slate-400">
              القيمة النقدية التي تخصم من فاتورة العميل عند استخدام نقاطه
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الحد الأدنى لرصيد النقاط المسموح باستبداله:
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={loyalty.minRedeemPoints || 50}
                onChange={(e) => updateLoyalty('minRedeemPoints', Number(e.target.value))}
                className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">نقطة</span>
            </div>
            <p className="text-[11px] text-slate-400">
              لن يتمكن العميل من تحويل نقاطه إلى خصم مالي إلا عند بلوغ هذا الرصيد
            </p>
          </div>
        </div>

        {/* Live Simulator Preview */}
        <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-white">
                  محاكي الحساب التفاعلي المباشر (Live Calculator)
                </h5>
                <p className="text-[10px] text-slate-400">
                  جرّب أي مبلغ للتأكد من حسابات النقاط قبل الاعتماد
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
              حساب فوري مباشر
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-1">مبلغ الطلب التجريبي:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={simulatedAmount}
                  onChange={(e) => setSimulatedAmount(Number(e.target.value))}
                  className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none border-b border-emerald-500/50 pb-0.5"
                />
                <span className="text-xs text-slate-400">ج.م</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-1">النقاط المكتسبة:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-black text-lg text-amber-400">
                  {simPointsEarned}
                </span>
                <span className="text-xs text-amber-400/80 font-bold">نقطة</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-1">القيمة المالية عند الخصم:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-black text-lg text-emerald-400">
                  {simMonetaryValue}
                </span>
                <span className="text-xs text-emerald-400/80 font-bold">ج.م</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-1">نسبة الاسترداد للعميل:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-black text-lg text-purple-400">
                  {simCashbackPercent}%
                </span>
                <span className="text-xs text-purple-400/80 font-bold">Cashback</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all transform active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات برنامج النقاط</span>
          </button>
        </div>

      </div>
    </form>
  );
};
