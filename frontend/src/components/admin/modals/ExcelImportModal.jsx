import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { api } from '../../../services/api';

export const ExcelImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [mode, setMode] = useState('replace'); // 'replace' | 'append'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith('.xlsx') &&
      !selectedFile.name.endsWith('.xls')
    ) {
      setError('يرجى اختيار ملف إكسيل صالح بصيغة .xlsx أو .xls');
      return;
    }

    setError(null);
    setFileName(selectedFile.name);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFileBase64(uploadEvent.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleImportUploadedFile = async () => {
    if (!fileBase64) {
      setError('يرجى اختيار ملف إكسيل أولاً.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.importProductsExcel({
        base64: fileBase64,
        mode,
      });
      setResult(res);
      if (onImportSuccess) onImportSuccess(res);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء استيراد البيانات من الشيت.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportDefaultSheet = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.importDefaultExcel(mode);
      setResult(res);
      if (onImportSuccess) onImportSuccess(res);
    } catch (err) {
      setError(
        err.message ||
          'تعذر العثور على الشيت الافتراضي (D:\\chefaa_products_final_cdn.xlsx) أو معالجته.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(api.downloadExcelTemplateUrl(), '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileBase64('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in font-cairo">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-tajawal">
                استيراد وتحديث المنتجات من شيت الإكسيل
              </h2>
              <p className="text-xs text-slate-500">
                تقسيم وتصنيف كتالوج الصيدلية الذكية بدقة عبر شيت Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Success State View */}
          {result ? (
            <div className="space-y-6 animate-fade-in text-right">
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-600/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-tajawal">
                  تم الاستيراد والتقسيم بنجاح تام!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {result.message}
                </p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      إجمالي المنتجات
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {result.totalCatalogCount?.toLocaleString() || result.importedCount}
                    </span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      الأقسام الرئيسية
                    </span>
                    <span className="text-lg font-black text-teal-600 dark:text-teal-400 font-mono">
                      {result.categoriesCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories Tree Breakdown */}
              {result.categoriesTree && result.categoriesTree.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>الأقسام والتصنيفات المفهرسة ({result.categoriesTree.length}):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.categoriesTree.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                            {cat.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                            {cat.count} صنف
                          </span>
                        </div>
                        {cat.subCategories && cat.subCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            {cat.subCategories.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                              >
                                {sub.name} ({sub.count})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  استيراد شيت آخر
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  تم، عرض المنتجات
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Action / Fast Sync from Platform File */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مزامنة سريعة بضغطة واحدة</span>
                  </span>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                    استيراد مباشر من شيت المنصة النهائي:
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
                    D:\chefaa_products_final_cdn.xlsx
                  </p>
                </div>

                <button
                  onClick={handleImportDefaultSheet}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer transition-all shrink-0 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الاستيراد والمعالجة...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>استيراد الشيت الافتراضي فوراً</span>
                    </>
                  )}
                </button>
              </div>

              {/* Or Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 font-bold uppercase shrink-0">
                  أو رفع شيت إكسيل مخصص
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اختر أو اسحب ملف الإكسيل (.xlsx / .xls):
                </label>

                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />

                  {fileName ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block font-mono">
                        {fileName}
                      </span>
                      <span className="text-[11px] text-emerald-600 block">
                        تم اختيار الملف بنجاح! اضغط لبدء الاستيراد
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                        اسحب ملف الإكسيل هنا أو اضغط للاختيار من جهازك
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        يدعم ملفات Excel بجميع الأعمدة (القسم الرئيسي، الفرعي، الاسم، السعر، الصورة، إلخ)
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  طريقة معالجة الكتالوج:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setMode('replace')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      mode === 'replace'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={mode === 'replace'}
                        onChange={() => setMode('replace')}
                        className="text-emerald-600"
                      />
                      <span className="font-bold text-xs">استبدال الكتالوج بالكامل (موصى به)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 mr-5">
                      تفريغ الكتالوج الحالي واستبداله تماماً ببيانات الشيت وتقسيماته الجديدة.
                    </p>
                  </div>

                  <div
                    onClick={() => setMode('append')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      mode === 'append'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={mode === 'append'}
                        onChange={() => setMode('append')}
                        className="text-emerald-600"
                      />
                      <span className="font-bold text-xs">تحديث وإضافة الأصناف الجديدة</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 mr-5">
                      الإبقاء على المنتجات الحالية وتحديث المطابق منها وإضافة الجديد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Template & Guidance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-5 h-5 text-teal-600 shrink-0" />
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    هل ترغب في نموذج إكسيل فارغ بنفس الأعمدة والتقسيمات القياسية؟
                  </div>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل قالب الشيت الفارغ</span>
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!result && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>

            {fileBase64 && (
              <button
                onClick={handleImportUploadedFile}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الاستيراد...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>استيراد ومعالجة الملف المرفوع</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
