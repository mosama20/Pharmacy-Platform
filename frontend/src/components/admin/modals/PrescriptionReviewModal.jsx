import React, { useState } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  User,
  Phone,
  Calendar,
  Send,
} from 'lucide-react';

export const PrescriptionReviewModal = ({
  rx,
  onClose,
  onSubmitQuote,
}) => {
  if (!rx) return null;

  const allImages = [
    ...(Array.isArray(rx.images) ? rx.images : []),
    ...(rx.imageUrl && (!Array.isArray(rx.images) || !rx.images.includes(rx.imageUrl)) ? [rx.imageUrl] : []),
  ].filter(Boolean);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const displayImage = allImages[selectedImageIndex] || rx.imageUrl || '';

  const [quoteItems, setQuoteItems] = useState([
    { productName: 'بانادول إكسترا 500 مجم', quantity: 1, price: 52, dosageNote: 'قرص كل 8 ساعات' },
  ]);
  const [quoteNotes, setQuoteNotes] = useState('تمت مراجعة الروشتة وتحديد الجرعات الموصى بها.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      { productName: '', quantity: 1, price: 50, dosageNote: 'قرص يومياً بعد الأكل' },
    ]);
  };

  const handleRemoveItem = (index) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const totalCalculated = quoteItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quoteItems.length === 0) {
      alert('يرجى إضافة صنف دوائي واحد على الأقل للتسعيرة.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitQuote(rx.id, {
        pharmacistNotes: quoteNotes,
        quotedItems: quoteItems,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  مراجعة وتسعير الروشتة الطبية
                </h3>
                <span className="font-mono font-bold text-xs bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md">
                  #{rx.id.slice(-6)}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                المريض: {rx.user?.name || rx.customerName || 'مريض مسجل'} • الهاتف: {rx.user?.phone || rx.customerPhone || 'غير متوفر'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - 2 Columns (Image Preview + Pricing Builder) */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Column 1: Prescription Image & Patient Notes */}
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 relative group min-h-[300px] flex flex-col items-center justify-center">
              {displayImage ? (
                displayImage.startsWith('data:application/pdf') || displayImage.endsWith('.pdf') ? (
                  <div className="w-full text-center p-6 space-y-3">
                    <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">ملف الروشتة بصيغة PDF</p>
                    <a
                      href={displayImage}
                      download={`prescription_${rx.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>عرض أو تحميل ملف الروشتة</span>
                    </a>
                  </div>
                ) : (
                  <a
                    href={displayImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative cursor-zoom-in max-h-[360px] w-full text-center"
                    title="اضغط لتكبير صورة الروشتة في نافذة جديدة"
                  >
                    <img
                      src={displayImage}
                      alt="Prescription"
                      className="max-h-[350px] w-auto mx-auto object-contain rounded-xl shadow-xs transition-transform group-hover:scale-102"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3.5 h-3.5" />
                      <span>تكبير الروشتة</span>
                    </div>
                  </a>
                )
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">لا توجد صورة مرفقة</p>
                </div>
              )}

              {/* Multiple Images Selector if available */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-2 bg-black/10 dark:bg-black/30 rounded-xl mt-2 overflow-x-auto w-full justify-center">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedImageIndex === idx
                          ? 'border-teal-500 scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`rx-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Patient Notes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-400 block">ملاحظات المريض / التاريخ الطبي:</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {rx.patientNotes || rx.notes || 'لا توجد ملاحظات إضافية من المريض.'}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>السماح بالبدائل المماثلة:</span>
                <span className={`font-bold ${rx.allowAlternatives ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {rx.allowAlternatives ? 'نعم، مسموح بالبدائل' : 'الالتزام بالاسم التجاري'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Pharmacist Quotation Form */}
          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  الأصناف والجرعات المعتمدة:
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {quoteItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="اسم الدواء والتركيز"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="السعر"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-emerald-600 focus:outline-none focus:border-teal-500"
                      />
                      {quoteItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="إرشادات الجرعة للمريض (مثال: قرص كل 8 ساعات بعد الأكل)"
                      value={item.dosageNote}
                      onChange={(e) => handleItemChange(idx, 'dosageNote', e.target.value)}
                      className="w-full px-3 py-1 text-[11px] rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                    />
                  </div>
                ))}
              </div>

              {/* Pharmacist Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توجيهات الصيدلي واستشارة الاستخدام:
                </label>
                <textarea
                  rows="2"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-between text-xs">
                <span className="font-bold text-teal-900 dark:text-teal-200">
                  إجمالي تسعيرة الأدوية المقترحة:
                </span>
                <span className="text-base font-black font-mono text-teal-700 dark:text-teal-400">
                  {totalCalculated} ج.م
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الإرسال...' : 'اعتماد وإرسال التسعيرة للمريض'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
