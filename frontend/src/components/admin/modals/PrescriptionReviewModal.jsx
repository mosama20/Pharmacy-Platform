import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ZoomIn,
  Search,
  Package,
  Ban,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { ImageViewerModal } from '../../common/ImageViewerModal';

export const PrescriptionReviewModal = ({
  rx,
  products = [],
  onClose,
  onSubmitQuote,
  onUpdateStatus,
}) => {
  if (!rx) return null;

  const isCancelled = rx.status === 'CANCELLED';
  const isRejected = rx.status === 'REJECTED';
  const isPending = rx.status === 'PENDING' || rx.status === 'UNDER_REVIEW';

  const allImages = [
    ...(Array.isArray(rx.images) ? rx.images : []),
    ...(rx.imageUrl && (!Array.isArray(rx.images) || !rx.images.includes(rx.imageUrl)) ? [rx.imageUrl] : []),
    ...(rx.insuranceCardPhoto && (!Array.isArray(rx.images) || !rx.images.includes(rx.insuranceCardPhoto)) ? [rx.insuranceCardPhoto] : []),
  ].filter(Boolean);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const displayImage = allImages[selectedImageIndex] || rx.imageUrl || '';

  const rawItems = (rx.quotedItems && rx.quotedItems.length > 0)
    ? rx.quotedItems
    : (rx.requestedItems && rx.requestedItems.length > 0)
      ? rx.requestedItems
      : null;

  const initialItems = rawItems
    ? rawItems.map((it) => {
        const prodMatch = products.find((p) => p.id === it.productId || p.nameAr === it.productName);
        return {
          productId: it.productId || prodMatch?.id || '',
          productName: it.productName || prodMatch?.nameAr || '',
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || prodMatch?.price || 0,
          dosageNote: it.dosageNote || 'قرص يومياً بعد الأكل',
          stock: prodMatch?.stock ?? 50,
        };
      })
    : [
        { productId: '', productName: 'بانادول إكسترا 500 مجم', quantity: 1, price: 52, dosageNote: 'قرص كل 8 ساعات', stock: 100 },
      ];

  const [quoteItems, setQuoteItems] = useState(initialItems);
  const [quoteNotes, setQuoteNotes] = useState(rx.pharmacistNotes || 'تمت مراجعة الروشتة وتحديد الجرعات الموصى بها.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cancellation state
  const [isCancelBoxOpen, setIsCancelBoxOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Autocomplete state
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);

  const handleAddItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      { productId: '', productName: '', quantity: 1, price: 50, dosageNote: 'قرص يومياً بعد الأكل', stock: null },
    ]);
  };

  const handleRemoveItem = (index) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
    if (activeSearchIndex === index) setActiveSearchIndex(null);
  };

  const handleItemChange = (index, field, value) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSelectProduct = (index, product) => {
    setQuoteItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.id,
              productName: product.nameAr,
              price: Number(product.price) || 0,
              stock: Number(product.stock) || 0,
            }
          : item
      )
    );
    setActiveSearchIndex(null);
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
        quotedItems: quoteItems.map((item) => ({
          productId: item.productId || undefined,
          productName: item.productName,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          dosageNote: item.dosageNote || '',
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPrescription = async () => {
    if (!onUpdateStatus) return;
    setIsCancelling(true);
    try {
      await onUpdateStatus(rx.id, 'CANCELLED', cancelReason || 'تم الإلغاء بواسطة الصيدلي');
      setIsCancelBoxOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReopenPrescription = async () => {
    if (!onUpdateStatus) return;
    setIsCancelling(true);
    try {
      await onUpdateStatus(rx.id, 'UNDER_REVIEW');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 font-cairo">
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
                {isCancelled && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    ملغاة ❌
                  </span>
                )}
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

        {/* Cancellation Notice Banner if cancelled */}
        {isCancelled && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>هذه الروشتة مسجلة كـ "ملغاة":</strong> {rx.cancellationReason || 'تم إلغاء الروشتة بناء على طلب العميل أو عدم توفر الصنف'}
              </span>
            </div>
            {onUpdateStatus && (
              <button
                type="button"
                onClick={handleReopenPrescription}
                disabled={isCancelling}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة فتح الروشتة للمراجعة</span>
              </button>
            )}
          </div>
        )}

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
                  <button
                    type="button"
                    onClick={() => setIsViewerOpen(true)}
                    className="block relative cursor-zoom-in max-h-[360px] w-full text-center group/img rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-teal-500"
                    title="اضغط لتكبير صورة الروشتة وتدويرها بدقة عالية"
                  >
                    <img
                      src={displayImage}
                      alt="Prescription"
                      className="max-h-[350px] w-auto mx-auto object-contain rounded-xl shadow-xs transition-transform duration-200 group-hover/img:scale-102"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[11px] px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-md group-hover/img:bg-teal-600 transition-colors">
                      <ZoomIn className="w-4 h-4 text-teal-300 group-hover/img:text-white" />
                      <span className="font-bold">تكبير وفحص الروشتة</span>
                    </div>
                  </button>
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

            {/* Insurance Information Block if applicable */}
            {rx.hasInsurance && (
              <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>بيانات التعاقد والتأمين الطبي:</span>
                  </span>
                  <span className="text-[10px] font-bold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-2.5 py-0.5 rounded-full">
                    طلب تأمين معتمد
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">شركة / جهة التأمين:</span>
                    <strong className="text-slate-900 dark:text-white text-xs">{rx.insuranceCompany || 'غير محدد'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">رقم الكارت / العضوية:</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-xs">{rx.insuranceCardNumber || 'غير محدد'}</strong>
                  </div>
                  {rx.nationalId && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block">الرقم القومي:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono text-xs">{rx.nationalId}</span>
                    </div>
                  )}
                </div>

                {rx.insuranceCardPhoto && (
                  <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/60 flex items-center gap-2.5">
                    <img
                      src={rx.insuranceCardPhoto}
                      alt="Insurance Card"
                      className="w-12 h-12 rounded-xl object-cover border border-teal-300 dark:border-teal-700 cursor-pointer hover:scale-105 transition-transform shrink-0"
                      onClick={() => {
                        const idx = allImages.indexOf(rx.insuranceCardPhoto);
                        if (idx !== -1) setSelectedImageIndex(idx);
                        setIsViewerOpen(true);
                      }}
                      title="اضغط لتكبير صورة كارت التأمين"
                    />
                    <div className="text-[11px] text-teal-800 dark:text-teal-200">
                      <span className="font-bold block">مرفق صورة كارت التأمين</span>
                      <span className="text-[10px] text-slate-400">اضغط للمعاينة والتكبير بدقة عالية</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    الأصناف والجرعات المعتمدة (بحث وربط بالمخزن):
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    اكتب اسم الدواء للاختيار من المخزن ووضع السعر آلياً
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف</span>
                </button>
              </div>

              {/* Items List with Autocomplete */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {quoteItems.map((item, idx) => {
                  const q = (item.productName || '').toLowerCase().trim();
                  const matches = activeSearchIndex === idx && q.length > 0
                    ? products
                        .filter(
                          (p) =>
                            p.nameAr?.toLowerCase().includes(q) ||
                            p.nameEn?.toLowerCase().includes(q) ||
                            p.activeIngredient?.toLowerCase().includes(q)
                        )
                        .slice(0, 6)
                    : [];

                  const isOutOfStock = item.stock !== null && item.stock !== undefined && item.stock < item.quantity;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2 relative"
                    >
                      <div className="flex items-center gap-2 relative">
                        {/* Medicine Name with Live Autocomplete Search */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            required
                            placeholder="ابحث باسم الدواء أو المادة الفعالة..."
                            value={item.productName}
                            onFocus={() => setActiveSearchIndex(idx)}
                            onChange={(e) => {
                              handleItemChange(idx, 'productName', e.target.value);
                              setActiveSearchIndex(idx);
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />

                          {/* Autocomplete Dropdown */}
                          {matches.length > 0 && (
                            <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {matches.map((prod) => (
                                <button
                                  key={prod.id}
                                  type="button"
                                  onClick={() => handleSelectProduct(idx, prod)}
                                  className="w-full text-right p-2.5 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                                      {prod.image ? (
                                        <img src={prod.image} alt={prod.nameAr} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="w-4 h-4 m-2 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="truncate">
                                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                                        {prod.nameAr}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {prod.nameEn || prod.activeIngredient}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-left shrink-0">
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                      {prod.price} ج.م
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                        prod.stock > 10
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : prod.stock > 0
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      }`}
                                    >
                                      {prod.stock > 0 ? `مخزون: ${prod.stock}` : 'نافد'}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="w-16">
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="الكمية"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono focus:outline-none focus:border-teal-500"
                            title="الكمية المطلوبة"
                          />
                        </div>

                        {/* Price */}
                        <div className="w-20">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            required
                            placeholder="السعر"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center font-mono font-bold text-emerald-600 focus:outline-none focus:border-teal-500"
                            title="سعر الوحدة بالجنيه"
                          />
                        </div>

                        {quoteItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Stock Connection Badge & Out of Stock Warning */}
                      <div className="flex items-center justify-between text-[10px]">
                        {item.stock !== null && item.stock !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${
                              item.stock >= item.quantity
                                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            <Package className="w-3 h-3" />
                            <span>
                              {item.stock >= item.quantity
                                ? `مرتبط بالمخزن: متاح ${item.stock} عبوة`
                                : `تنبيه: المطلوب (${item.quantity}) يتجاوز المتاح بالمخزن (${item.stock})`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">صنف حر غير مربوط بكود بالمخزن</span>
                        )}

                        <span className="font-mono text-slate-500">
                          الإجمالي: {(Number(item.price) || 0) * (Number(item.quantity) || 1)} ج.م
                        </span>
                      </div>

                      {/* Dosage Note */}
                      <input
                        type="text"
                        placeholder="إرشادات الجرعة للمريض (مثال: قرص كل 8 ساعات بعد الأكل)"
                        value={item.dosageNote}
                        onChange={(e) => handleItemChange(idx, 'dosageNote', e.target.value)}
                        className="w-full px-3 py-1 text-[11px] rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                      />
                    </div>
                  );
                })}
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

            {/* Cancel prescription box if open */}
            {isCancelBoxOpen && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 space-y-2">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                  سبب إلغاء الروشتة (سيظهر في سجلات الإدارة):
                </label>
                <input
                  type="text"
                  placeholder="مثال: الصورة غير واضحة / الصنف غير متوفر / طلب العميل الإلغاء"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-200 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelBoxOpen(false)}
                    className="px-3 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                  >
                    تراجع
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPrescription}
                    disabled={isCancelling}
                    className="px-3 py-1 rounded-lg text-xs bg-rose-600 text-white font-bold hover:bg-rose-700"
                  >
                    {isCancelling ? 'جاري الإلغاء...' : 'تأكيد تسجيل الروشتة كـ ملغاة'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إغلاق
                </button>

                {onUpdateStatus && !isCancelled && (
                  <button
                    type="button"
                    onClick={() => setIsCancelBoxOpen(!isCancelBoxOpen)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>إلغاء الروشتة</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCancelled}
                className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الإرسال...' : 'اعتماد وإرسال التسعيرة للمريض'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* High-Resolution Prescription Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        imageUrl={displayImage}
        title={`معاينة وتكبير روشتة ${rx.customerName || rx.user?.name || ''} (#${rx.id?.slice(-6) || ''})`}
      />
    </div>
  );
};
