import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Bot,
  Truck,
  Sparkles,
  Pill,
  Heart,
  ShieldCheck,
  Zap,
  Flame,
  Search,
  Stethoscope,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Save,
  Check,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP = {
  FileText: FileText,
  Clock: Clock,
  Bot: Bot,
  Truck: Truck,
  Sparkles: Sparkles,
  Pill: Pill,
  Heart: Heart,
  ShieldCheck: ShieldCheck,
  Zap: Zap,
  Flame: Flame,
  Search: Search,
  Stethoscope: Stethoscope,
};

const COLOR_PRESETS = [
  {
    id: 'emerald',
    label: 'أخضر زمردي (روشتة)',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconBg: 'bg-emerald-600',
    border: 'border-emerald-500/20',
  },
  {
    id: 'teal',
    label: 'تركواز بحري (دواء شهري)',
    gradient: 'from-teal-500/10 to-cyan-500/10',
    iconBg: 'bg-teal-600',
    border: 'border-teal-500/20',
  },
  {
    id: 'purple',
    label: 'بنفسجي ذكي (بدائل وذكاء)',
    gradient: 'from-purple-500/10 to-indigo-500/10',
    iconBg: 'bg-purple-600',
    border: 'border-purple-500/20',
  },
  {
    id: 'amber',
    label: 'عنبر وبرتقالي (توصيل وسرعة)',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconBg: 'bg-amber-500',
    border: 'border-amber-500/20',
  },
  {
    id: 'rose',
    label: 'وردي وأحمر (عروض ورعاية)',
    gradient: 'from-rose-500/10 to-red-500/10',
    iconBg: 'bg-rose-600',
    border: 'border-rose-500/20',
  },
  {
    id: 'blue',
    label: 'أزرق تقني موثوق',
    gradient: 'from-blue-500/10 to-sky-500/10',
    iconBg: 'bg-blue-600',
    border: 'border-blue-500/20',
  },
  {
    id: 'insurance',
    label: 'أخضر تأمين وتعاقدات',
    gradient: 'from-teal-500/10 to-emerald-500/10',
    iconBg: 'bg-teal-700',
    border: 'border-teal-500/20',
  },
];

const DEFAULT_CARDS = [
  {
    id: 'card_upload',
    title: 'رفع وتصوير الروشتة',
    subtitle: 'تسعير وفحص روشتتك وتوصيلها فوراً',
    icon: 'FileText',
    actionType: 'upload',
    actionValue: '',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconBg: 'bg-emerald-600',
    order: 1,
    isVisible: true,
  },
  {
    id: 'card_insurance',
    title: 'التعاقدات والتأمين الطبي',
    subtitle: 'سامسونج، توشيبا، يونيكير، أكسا...',
    icon: 'ShieldCheck',
    actionType: 'insurance',
    actionValue: '',
    gradient: 'from-teal-500/10 to-emerald-500/10',
    iconBg: 'bg-teal-700',
    order: 2,
    isVisible: true,
  },
  {
    id: 'card_refill',
    title: 'الدواء الشهري للمزمن',
    subtitle: 'توصيل تلقائي لأدوية السكر والضغط',
    icon: 'Clock',
    actionType: 'refill',
    actionValue: '',
    gradient: 'from-teal-500/10 to-cyan-500/10',
    iconBg: 'bg-teal-600',
    order: 2,
    isVisible: true,
  },
  {
    id: 'card_substitutes',
    title: 'البدائل الدوائية الذكية',
    subtitle: 'ابحث عن نفس المادة بخصم وأوفر',
    icon: 'Bot',
    actionType: 'search',
    actionValue: '',
    gradient: 'from-purple-500/10 to-indigo-500/10',
    iconBg: 'bg-purple-600',
    order: 3,
    isVisible: true,
  },
  {
    id: 'card_delivery',
    title: 'توصيل فوري 30-45 د',
    subtitle: 'من أقرب صيدلية في {selectedDistrict}',
    icon: 'Truck',
    actionType: 'location',
    actionValue: '',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconBg: 'bg-amber-500',
    order: 4,
    isVisible: true,
  },
];

export const CmsQuickCardsSection = ({
  settingsForm,
  setSettingsForm,
  onSave,
}) => {
  const cards = settingsForm.quickCards && settingsForm.quickCards.length > 0
    ? settingsForm.quickCards
    : DEFAULT_CARDS;

  const [editingCardId, setEditingCardId] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateCardField = (cardId, field, value) => {
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setSettingsForm({ ...settingsForm, quickCards: updated });
  };

  const updateCardColor = (cardId, preset) => {
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          gradient: preset.gradient,
          iconBg: preset.iconBg,
        };
      }
      return c;
    });
    setSettingsForm({ ...settingsForm, quickCards: updated });
  };

  const handleToggleVisible = (cardId) => {
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return { ...c, isVisible: c.isVisible === false ? true : false };
      }
      return c;
    });
    setSettingsForm({ ...settingsForm, quickCards: updated });
  };

  const handleMove = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;
    const newCards = [...cards];
    const [moved] = newCards.splice(index, 1);
    newCards.splice(targetIndex, 0, moved);
    // re-index order
    const ordered = newCards.map((c, i) => ({ ...c, order: i + 1 }));
    setSettingsForm({ ...settingsForm, quickCards: ordered });
  };

  const handleDeleteCard = (cardId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;
    const filtered = cards.filter((c) => c.id !== cardId);
    setSettingsForm({ ...settingsForm, quickCards: filtered });
    if (editingCardId === cardId) setEditingCardId(null);
  };

  const handleAddCard = () => {
    const newId = `card_${Date.now()}`;
    const newCard = {
      id: newId,
      title: 'بطاقة خدمة جديدة',
      subtitle: 'وصف توضيحي للخدمة وسرعة الوصول',
      icon: 'Sparkles',
      actionType: 'upload',
      actionValue: '',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconBg: 'bg-emerald-600',
      order: cards.length + 1,
      isVisible: true,
    };
    setSettingsForm({ ...settingsForm, quickCards: [...cards, newCard] });
    setEditingCardId(newId);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('هل تريد استعادة البطاقات الأربعة الافتراضية (رفع الروشتة، الدواء الشهري، البدائل الذكية، التوصيل الفوري)؟')) return;
    setSettingsForm({ ...settingsForm, quickCards: DEFAULT_CARDS });
    setEditingCardId(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...settingsForm, quickCards: cards });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('خطأ أثناء حفظ التعديلات: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>بطاقات الخدمات السريعة أسفل السلايدر ({cards.length})</span>
          </h3>
          <p className="text-xs text-slate-400">
            التحكم الكامل في بطاقات الإجراءات الأربعة (رفع الروشتة، الدواء الشهري، البدائل الدوائية، التوصيل الفوري)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="استعادة البطاقات الأصلية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الاستعادة للافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleAddCard}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-600 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة بطاقة جديدة</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>تم الحفظ بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ بطاقات الخدمات'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helper notice */}
      <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/50 flex items-start gap-2.5 text-xs text-teal-900 dark:text-teal-200">
        <HelpCircle className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
        <div>
          <span>
            <strong>تلميح ديناميكي:</strong> يمكنك كتابة <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md font-mono text-[11px] text-teal-700 dark:text-teal-300">{"{selectedDistrict}"}</code> في وصف بطاقة التوصيل، وسيتم استبدالها تلقائياً باسم المنطقة أو الحي المختار من العميل (مثل المعادي، التجمع، إلخ).
          </span>
        </div>
      </div>

      {/* Live Preview / Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            معاينة البطاقات الحية (كما تظهر في الصفحة الرئيسية):
          </span>
          <span className="text-[11px] text-slate-400">
            اضغط على زر «تعديل» على أي بطاقة لتعديل نصوصها وأيقونتها وإجرائها
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {cards.map((card, index) => {
            const IconComponent = ICON_MAP[card.icon] || Sparkles;
            const isEditing = editingCardId === card.id;
            const isVisible = card.isVisible !== false;

            return (
              <div
                key={card.id}
                className={`relative rounded-3xl p-4 transition-all flex flex-col justify-between border ${
                  card.gradient || 'bg-slate-50'
                } ${
                  isVisible ? 'opacity-100' : 'opacity-50 grayscale'
                } ${
                  isEditing
                    ? 'ring-2 ring-teal-500 shadow-lg scale-[1.01]'
                    : 'border-slate-200/80 dark:border-slate-800/80 hover:shadow-md'
                }`}
              >
                {/* Top Action Buttons (Reorder, Visibility, Edit, Delete) */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-20 cursor-pointer"
                      title="تحريك لليمين"
                    >
                      <MoveUp className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={index === cards.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-20 cursor-pointer"
                      title="تحريك لليسار"
                    >
                      <MoveDown className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(card.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isVisible
                          ? 'text-emerald-600 hover:bg-emerald-500/10'
                          : 'text-slate-400 hover:bg-slate-500/10'
                      }`}
                      title={isVisible ? 'البطاقة مفعلة بالمتجر (إخفاء)' : 'البطاقة مخفية (إظهار)'}
                    >
                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingCardId(isEditing ? null : card.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isEditing
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      title={isEditing ? 'إغلاق التعديل' : 'تعديل بيانات البطاقة'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="حذف البطاقة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Display */}
                <div>
                  <div
                    className={`w-10 h-10 rounded-2xl ${
                      card.iconBg || 'bg-teal-600'
                    } text-white flex items-center justify-center mb-2.5 shadow-md shadow-black/10`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-tajawal">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {card.subtitle?.replace('{selectedDistrict}', 'المعادي')}
                  </p>
                </div>

                {/* Action Tag footer */}
                <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>الإجراء:</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400 bg-white/70 dark:bg-black/30 px-2 py-0.5 rounded-full">
                    {card.actionType === 'upload'
                      ? 'رفع روشتة'
                      : card.actionType === 'insurance'
                      ? 'التعاقدات والتأمين'
                      : card.actionType === 'refill'
                      ? 'دواء شهري'
                      : card.actionType === 'search'
                      ? 'البحث والبدائل'
                      : card.actionType === 'location'
                      ? 'تحديد الموقع'
                      : card.actionType === 'category'
                      ? `قسم: ${card.actionValue || ''}`
                      : card.actionType === 'link'
                      ? 'رابط مخصص'
                      : 'عرض فقط'}
                  </span>
                </div>

                {/* Inline Editing Drawer if this card is being edited */}
                {isEditing && (
                  <div className="mt-4 pt-3 border-t border-teal-500/30 space-y-3 bg-white/90 dark:bg-slate-900/95 p-3 rounded-2xl shadow-inner animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-600">
                        تعديل تفاصيل البطاقة:
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                      >
                        إغلاق
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان البطاقة:
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateCardField(card.id, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        النص والوصف الفرعي:
                      </label>
                      <input
                        type="text"
                        value={card.subtitle}
                        onChange={(e) => updateCardField(card.id, 'subtitle', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رمز الأيقونة:
                        </label>
                        <select
                          value={card.icon || 'Sparkles'}
                          onChange={(e) => updateCardField(card.id, 'icon', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="FileText">روشتة (FileText)</option>
                          <option value="Clock">ساعة وتكرار (Clock)</option>
                          <option value="Bot">روبوت ذكاء (Bot)</option>
                          <option value="Truck">شاحنة وتوصيل (Truck)</option>
                          <option value="Pill">دواء وكبسولة (Pill)</option>
                          <option value="Heart">قلب وصحة (Heart)</option>
                          <option value="ShieldCheck">درع أمان (ShieldCheck)</option>
                          <option value="Search">بحث وتصفح (Search)</option>
                          <option value="Sparkles">بريق وعروض (Sparkles)</option>
                          <option value="Zap">فوري وبرق (Zap)</option>
                          <option value="Flame">خصم نار (Flame)</option>
                          <option value="Stethoscope">سماعة طبيب (Stethoscope)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          نوع الإجراء عند النقر:
                        </label>
                        <select
                          value={card.actionType || 'upload'}
                          onChange={(e) => updateCardField(card.id, 'actionType', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="upload">فتح رفع الروشتة</option>
                          <option value="insurance">فتح التعاقدات والتأمين الطبي (/insurance)</option>
                          <option value="refill">فتح الدواء الشهري</option>
                          <option value="search">البحث والبدائل الذكية</option>
                          <option value="location">تحديد واختيار المنطقة</option>
                          <option value="category">تصفية قسم معين</option>
                          <option value="link">رابط مخصص أو صفحة</option>
                          <option value="none">معلوماتي فقط (بدون إجراء)</option>
                        </select>
                      </div>
                    </div>

                    {(card.actionType === 'category' || card.actionType === 'link') && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {card.actionType === 'category' ? 'اسم القسم المختار:' : 'الرابط المخصص:'}
                        </label>
                        <input
                          type="text"
                          value={card.actionValue || ''}
                          onChange={(e) => updateCardField(card.id, 'actionValue', e.target.value)}
                          placeholder={card.actionType === 'category' ? 'مثال: مسكنات الألم' : 'https://... أو /products'}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}

                    {/* Color Theme Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-teal-600" />
                        <span>ثيم ولون البطاقة:</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => updateCardColor(card.id, preset)}
                            className={`px-1.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                              card.iconBg === preset.iconBg
                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 shadow-2xs'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${preset.iconBg}`} />
                            <span className="truncate">{preset.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
