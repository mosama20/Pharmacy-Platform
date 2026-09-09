import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Check, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { api } from '../../services/api';

export const ImageUploadInput = ({
  value = '',
  onChange,
  folder = 'general',
  label = 'صورة',
  placeholder = 'اختر ملف من جهازك أو اسحبه هنا',
  helperText = 'الصيغ المدعومة: PNG, JPG, WEBP, SVG (بحد أقصى 10 ميجابايت)',
  previewHeight = 'h-24',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('حجم الملف كبير جداً، الحد الأقصى المسموح به هو 15 ميجابايت.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadFile(file, folder);
      if (res?.url) {
        onChange(res.url);
      } else {
        throw new Error('لم يتم استلام رابط الصورة من الخادم');
      }
    } catch (err) {
      setError(err.message || 'فشل رفع الملف من جهازك، يرجى المحاولة ثانية.');
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2 font-cairo">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'إخفاء الرابط اليدوي' : 'إدخال رابط مباشر (URL)'}</span>
        </button>
      </div>

      {/* Main Upload Dropzone & Preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 transition-all cursor-pointer ${
          dragOver
            ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/70'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
          accept="image/*,.svg,.ico,.webp"
          className="hidden"
        />

        {/* Thumbnail Preview if exists */}
        {value ? (
          <div className="relative shrink-0 group/prev">
            <img
              src={value}
              alt="Preview"
              className={`${previewHeight} w-24 object-contain rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shadow-xs`}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:bg-rose-600 transition-colors"
              title="إزالة الصورة"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
        )}

        {/* Text Instructions */}
        <div className="flex-1 text-center sm:text-right space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              {uploading ? 'جاري رفع الملف وحفظه سحابياً...' : (value ? 'تغيير الصورة أو سحب صورة جديدة' : 'اضغط لرفع الصورة من جهازك')}
            </span>
            {value && !uploading && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                <Check className="w-3 h-3" />
                <span>تم الرفع بنجاح</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {placeholder} • {helperText}
          </p>
        </div>
      </div>

      {/* Manual URL input if toggled */}
      {showUrlInput && (
        <div className="pt-1">
          <input
            type="url"
            placeholder="https://.../image.png"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
