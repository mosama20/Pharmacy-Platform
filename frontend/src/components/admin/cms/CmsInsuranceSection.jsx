import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Save,
  Check,
  ExternalLink,
  MoveUp,
  MoveDown,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

const SAMPLE_PRESETS = [
  {
    name: 'سامسونج مصر (Samsung)',
    code: 'SAMSUNG',
    logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'تغطية طبية شاملة حتى 85%',
    notes: 'يرجى إرفاق صورة الكارت ورقم العضوية',
  },
  {
    name: 'مجموعة العربي - توشيبا (Toshiba)',
    code: 'TOSHIBA',
    logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'تغطية تأمينية للعاملين وأسرهم',
    notes: 'صرف الأدوية المزمنة والحادة مع الرقم التأميني',
  },
  {
    name: 'يونيكير للرعاية الطبية (UniCare)',
    code: 'UNICARE',
    logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'شبكة بطاقات يونيكير المعتمدة',
    notes: 'تغطية حسب نسبة التحمل المدونة على الكارت',
  },
  {
    name: 'أكسا للرعاية الصحية (AXA OneHealth)',
    code: 'AXA',
    logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'موافقة فورية لبطاقات أكسا',
    notes: 'خصم وصرف أدوية التعاقد مباشرة',
  },
  {
    name: 'ميدنت مصر (MedNet)',
    code: 'MEDNET',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'تأمين طبي مباشر لشبكة ميدنت',
    notes: 'يتطلب رقم البطاقة وتاريخ الانتهاء',
  },
  {
    name: 'كير بلس للرعاية الصحية (Care Plus)',
    code: 'CAREPLUS',
    logo: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'كروت النقابات والرعاية الصحية',
    notes: 'صرف الأدوية بخصومات التعاقد المعتمدة',
  },
];

export const CmsInsuranceSection = ({
  settingsForm = {},
  setSettingsForm,
  onSave,
}) => {
  const companies = settingsForm.insuranceCompanies || [];

  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state inside modal
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formRequiresCardPhoto, setFormRequiresCardPhoto] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);

  const openNewModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode('');
    setFormLogo('');
    setFormDiscount('تغطية تأمينية حتى 85%');
    setFormNotes('يرجى إرفاق صورة الكارت ورقم العضوية');
    setFormRequiresCardPhoto(true);
    setFormIsActive(true);
    setIsEditingModalOpen(true);
  };

  const openEditModal = (comp) => {
    setEditingItem(comp);
    setFormName(comp.name || '');
    setFormCode(comp.code || '');
    setFormLogo(comp.logo || '');
    setFormDiscount(comp.discountOrCoverage || '');
    setFormNotes(comp.notes || '');
    setFormRequiresCardPhoto(comp.requiresCardPhoto !== false);
    setFormIsActive(comp.isActive !== false);
    setIsEditingModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!formName.trim()) return;

    let updatedList;
    if (editingItem) {
      updatedList = companies.map((c) =>
        c.id === editingItem.id
          ? {
              ...c,
              name: formName.trim(),
              code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
              logo: formLogo.trim() || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
              discountOrCoverage: formDiscount.trim(),
              notes: formNotes.trim(),
              requiresCardPhoto: formRequiresCardPhoto,
              isActive: formIsActive,
            }
          : c
      );
    } else {
      const newItem = {
        id: `ins_${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || formName.trim().slice(0, 4).toUpperCase(),
        logo: formLogo.trim() || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
        discountOrCoverage: formDiscount.trim(),
        notes: formNotes.trim(),
        requiresCardPhoto: formRequiresCardPhoto,
        isActive: formIsActive,
        order: companies.length + 1,
      };
      updatedList = [...companies, newItem];
    }

    setSettingsForm((prev) => ({
      ...prev,
      insuranceCompanies: updatedList,
    }));

    setIsEditingModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف جهة التعاقد هذه؟')) return;
    const updatedList = companies.filter((c) => c.id !== id);
    setSettingsForm((prev) => ({
      ...prev,
      insuranceCompanies: updatedList,
    }));
  };

  const handleToggleActive = (id) => {
    const updatedList = companies.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setSettingsForm((prev) => ({
      ...prev,
      insuranceCompanies: updatedList,
    }));
  };

  const handleMove = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= companies.length) return;
    const copy = [...companies];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);
    setSettingsForm((prev) => ({
      ...prev,
      insuranceCompanies: copy.map((it, i) => ({ ...it, order: i + 1 })),
    }));
  };

  const handleAddPreset = (preset) => {
    const newItem = {
      id: `ins_${Date.now()}`,
      name: preset.name,
      code: preset.code,
      logo: preset.logo,
      discountOrCoverage: preset.discountOrCoverage,
      notes: preset.notes,
      requiresCardPhoto: true,
      isActive: true,
      order: companies.length + 1,
    };
    setSettingsForm((prev) => ({
      ...prev,
      insuranceCompanies: [...companies, newItem],
    }));
  };

  const handlePersist = async () => {
    setIsSaving(true);
    try {
      await onSave(settingsForm);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-tajawal">
                جهات التعاقد وبطاقات التأمين الطبي ({companies.length})
              </h3>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                متجر العملاء
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة الشركات وكروت الرعاية المعتمدة التي تظهر للعميل في نافذة طلبات التأمين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شركة / كارت جديد</span>
          </button>

          <button
            onClick={handlePersist}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              isSavedRecently
                ? 'bg-emerald-500 text-white'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم الحفظ بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="لا توجد شركات أو كروت تأمين مسجلة"
          description="أضف كروت التأمين لتمكين العملاء من طلب أدويتهم ببطاقات شركاتهم (سامسونج، توشيبا، يونيكير، ... إلخ)."
          actionLabel="إضافة جهة تعاقد الآن"
          onAction={openNewModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp, idx) => {
            const isActive = comp.isActive !== false;

            return (
              <div
                key={comp.id || idx}
                className={`p-4 rounded-3xl border shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-500">
                      #{idx + 1} {comp.code}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(comp.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        title={isActive ? 'تعطيل في المتجر' : 'تفعيل في المتجر'}
                      >
                        {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isActive ? 'مفعل بالمتجر' : 'معطل'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      {comp.logo ? (
                        <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>

                    <div className="truncate flex-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {comp.name}
                      </h4>
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {comp.discountOrCoverage || 'تغطية معتمدة'}
                      </span>
                    </div>
                  </div>

                  {comp.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      {comp.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="تحريك لأعلى"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === companies.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="تحريك لأسفل"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(comp)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Suggestions / Popular Contracts Presets */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            جهات تعاقد مقترحة للإضافة السريعة:
          </h4>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset, pIdx) => {
            const alreadyExists = companies.some((c) => c.name.includes(preset.name.split(' ')[0]));

            return (
              <button
                key={pIdx}
                onClick={() => handleAddPreset(preset)}
                disabled={alreadyExists}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  alreadyExists
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500 shadow-xs'
                }`}
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base font-tajawal">
                  {editingItem ? 'تعديل جهة التعاقد' : 'إضافة جهة تعاقد جديدة'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1 rounded-xl text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الشركة / كارت التأمين: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: شركة سامسونج مصر، توشيبا العربي، يونيكير..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    كود التعريف (Code):
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="SAMSUNG, TOSHIBA..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نسبة التغطية / الخصم:
                  </label>
                  <input
                    type="text"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    placeholder="مثال: تغطية حتى 85%، خصم 15%"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رابط شعار أو صورة الكارت (Logo URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formLogo}
                    onChange={(e) => setFormLogo(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  {formLogo && (
                    <img
                      src={formLogo}
                      alt="preview"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظات أو شروط الصرف الخاصة بالجهة:
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="مثال: يلزم إرفاق صورة الكارت والرقم القومي..."
                  className="w-full px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    تفعيل وظهور الجهة في متجر العملاء
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="px-4 py-2 rounded-2xl text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                {editingItem ? 'حفظ التعديلات' : 'إضافة للجهات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
