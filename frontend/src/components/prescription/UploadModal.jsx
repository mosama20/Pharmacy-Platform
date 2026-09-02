import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Trash2,
  User,
  Phone,
  MapPin,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

export const UploadModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedGovernorate, selectedDistrict } = useLocation();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [addressDetails, setAddressDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Handle selected file or captured camera photo
  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً، الحد الأقصى المسموح به هو 15 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage({
        name: file.name || 'prescription_photo.jpg',
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: event.target.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!uploadedImage) {
      setError('يرجى إرفاق أو التقاط صورة الروشتة أولاً.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('يرجى إدخال اسم المستلم ورقم الهاتف للتواصل معك.');
      return;
    }

    setLoading(true);

    try {
      const fullAddress = addressDetails.trim()
        ? `${addressDetails.trim()} - ${selectedDistrict} - ${selectedGovernorate}`
        : `${selectedDistrict} - ${selectedGovernorate}`;

      const res = await api.uploadPrescription({
        customerId: user?.id || 'guest_' + Date.now(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        governorate: selectedGovernorate,
        district: selectedDistrict,
        customerAddress: fullAddress,
        images: [uploadedImage.dataUrl],
        notes: notes.trim() || 'طلب روشتة مباشرة',
        allowAlternatives: true,
      });

      setSuccessResult(res.prescription);
    } catch (err) {
      setError(err.message || 'فشل إرسال الروشتة، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setUploadedImage(null);
    setNotes('');
    setAddressDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Hidden Inputs for File and Camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">رفع وتصوير الروشتة</h3>
              <p className="text-xs text-emerald-100">
                أرفق الروشتة وسنقوم بمراجعتها وتوصيلها فوراً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {successResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                تم استلام الروشتة بنجاح!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                رقم طلب الروشتة:{' '}
                <strong className="font-mono text-emerald-600 text-sm">
                  {successResult.id}
                </strong>
                <br />
                يقوم الصيدلي بمراجعة وتجهيز الأدوية الآن، وسيتم التواصل معك هاتفياً على ({customerPhone}) لتأكيد موعد التوصيل.
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                العودة للمتجر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. ATTACH OR CAPTURE SECTION */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  صورة الروشتة الطبية *
                </label>

                {!uploadedImage ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Attach Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-emerald-400/80 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xs">إرفاق صورة الروشتة</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">من المعرض أو الملفات</span>
                    </button>

                    {/* Camera Capture Button */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-teal-400/80 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xs">تصوير بالكاميرا فوراً</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">التقاط صورة مباشرة</span>
                    </button>
                  </div>
                ) : (
                  /* Attached Photo Preview */
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedImage.dataUrl}
                        alt="Prescription Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block max-w-[180px] truncate">
                          {uploadedImage.name}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          تم إرفاق الصورة بنجاح ({uploadedImage.size})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. CUSTOMER DATA SECTION */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  بيانات التواصل والتوصيل:
                </h5>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    اسم المريض / المستلم *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: أحمد محمد"
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    رقم الهاتف للتواصل *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    عنوان التوصيل بالتفصيل (اسم الشارع / رقم العمارة / الشقة) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      required
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      placeholder={`مثال: شارع الجمهورية، عمارة 12، ${selectedDistrict} (${selectedGovernorate})`}
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ملاحظات إضافية للصيدلي (اختياري)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="مثال: يرجى إحضار شريطين فقط، أو الاتصال بي قبل التجهيز"
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>جاري إرسال الروشتة...</span>
                  </>
                ) : (
                  <span>إرسال الروشتة للصيدلي وتجهيز الطلب</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
