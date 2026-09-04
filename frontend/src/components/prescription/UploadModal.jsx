import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

// Helper to compress high-res phone camera photos client-side to ~300KB
const compressImage = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    // If PDF, read directly
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: e.target.result,
        isPdf: true,
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          name: file.name || 'prescription_photo.jpg',
          size: `${approxSizeKb} KB`,
          dataUrl,
          isPdf: false,
        });
      };
      img.onerror = () => {
        // Fallback to raw dataUrl
        resolve({
          name: file.name || 'prescription_photo.jpg',
          size: (file.size / 1024).toFixed(1) + ' KB',
          dataUrl: event.target.result,
          isPdf: false,
        });
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const UploadModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedGovernorate, selectedDistrict } = useLocation();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [addressDetails, setAddressDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [allowAlternatives, setAllowAlternatives] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Live in-browser WebRTC camera viewfinder state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');

  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Clean up camera stream when modal or live camera closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  if (!isOpen) return null;

  // Handle selected file or camera photo from native input
  const handleFileChange = async (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const processed = await compressImage(file);
      setUploadedImage(processed);
    } catch (err) {
      console.error('Image processing failed:', err);
      setError('تعذر معالجة الصورة، يرجى المحاولة مرة أخرى أو اختيار صورة أخرى.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Start live in-browser camera stream
  const startLiveCamera = async () => {
    setError('');
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        // Fallback to native capture input
        cameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsLiveCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 200);
    } catch (err) {
      console.warn('WebRTC camera error, falling back to native file capture:', err);
      // Seamlessly fall back to native camera input
      cameraInputRef.current?.click();
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

      setUploadedImage({
        name: `prescription_${Date.now()}.jpg`,
        size: `${approxSizeKb} KB`,
        dataUrl,
        isPdf: false,
      });

      stopLiveCamera();
    } catch (err) {
      console.error('Failed to capture photo from stream:', err);
      stopLiveCamera();
      cameraInputRef.current?.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!uploadedImage) {
      setError('يرجى التقاط أو إرفاق صورة الروشتة أولاً.');
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
        allowAlternatives,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[94vh] flex flex-col bg-white dark:bg-slate-900">
        {/* Hidden Inputs for File and Camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onClick={(e) => {
            e.target.value = null;
          }}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onClick={(e) => {
            e.target.value = null;
          }}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base font-tajawal">
                رفع وتصوير الروشتة الطبية
              </h3>
              <p className="text-[11px] text-emerald-100">
                تسعير فوري ومراجعة من صيدلي مرخص خلال دقائق
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

        {/* Live Camera Viewfinder Overlay */}
        {isLiveCameraOpen && (
          <div className="p-4 bg-black text-white flex-1 flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between py-2 text-xs">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Camera className="w-4 h-4" />
                <span>ضع الروشتة داخل الإطار لالتقاطها</span>
              </span>
              <button
                onClick={stopLiveCamera}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>

            <div className="relative w-full aspect-3/4 max-h-[50vh] rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-xs">
                  إطار محاذاة الروشتة
                </span>
              </div>
            </div>

            <div className="py-4 flex items-center justify-center gap-4 w-full">
              <button
                type="button"
                onClick={captureLivePhoto}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 border-4 border-white shadow-xl flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
                title="التقاط الصورة"
              >
                <Camera className="w-7 h-7" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        {!isLiveCameraOpen && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {successResult ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white font-tajawal">
                  تم استلام روشتتك بنجاح!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  رقم طلب الروشتة:{' '}
                  <strong className="font-mono text-emerald-600 text-sm">
                    {successResult.id}
                  </strong>
                  <br />
                  يقوم الصيدلي المناوب بمراجعة الأدوية وتجهيز طلبك فوراً، وسنتصل بك على ({customerPhone}) لتأكيد التسعير وموعد التوصيل.
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
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. ATTACH OR CAPTURE SECTION */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    صورة الروشتة الطبية *
                  </label>

                  {isProcessingImage ? (
                    <div className="p-8 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col items-center justify-center gap-2.5 text-center">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        جاري معالجة وضبط جودة صورة الروشتة...
                      </span>
                      <span className="text-[10px] text-slate-500">
                        يتم ضغط الصورة تلقائياً لتسريع الإرسال بدقة عالية
                      </span>
                    </div>
                  ) : !uploadedImage ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Camera Button */}
                      <button
                        type="button"
                        onClick={startLiveCamera}
                        className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-emerald-400/90 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/60 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group active:scale-95 shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm">
                          تصوير بالكاميرا فوراً
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          التقاط صورة مباشرة
                        </span>
                      </button>

                      {/* Attach Photo Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-teal-400/90 bg-teal-50/60 dark:bg-teal-950/40 hover:bg-teal-100/60 text-teal-800 dark:text-teal-300 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group active:scale-95 shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm">
                          إرفاق من المعرض
                        </span>
                        <span className="text-[10px] text-teal-700 dark:text-teal-400">
                          صور أو ملفات PDF
                        </span>
                      </button>
                    </div>
                  ) : (
                    /* Attached Photo / Camera Preview */
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/40 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {uploadedImage.isPdf ? (
                            <div className="w-14 h-14 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                              <FileText className="w-7 h-7" />
                            </div>
                          ) : (
                            <img
                              src={uploadedImage.dataUrl}
                              alt="Prescription Preview"
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>تم التقاط الروشتة بنجاح</span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-mono mt-0.5">
                              {uploadedImage.name} ({uploadedImage.size})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                            title="حذف الصورة وإعادة التصوير"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Retake shortcut button */}
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveImage();
                          startLiveCamera();
                        }}
                        className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>إعادة تصوير الروشتة</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. CUSTOMER DATA SECTION */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>بيانات المستلم والتوصيل:</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {selectedDistrict} ({selectedGovernorate})
                    </span>
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
                        placeholder="الاسم ثلاثي أو ثنائي"
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      رقم الهاتف للتواصل وتأكيد السعر *
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
                      عنوان التوصيل بالتفصيل (الشارع / رقم العمارة / الشقة) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="text"
                        required
                        value={addressDetails}
                        onChange={(e) => setAddressDetails(e.target.value)}
                        placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة"
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
                        placeholder="مثال: يرجى إحضار شريط واحد فقط، أو التواصل قبل التوصيل"
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Allow Alternatives toggle */}
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowAlternatives}
                      onChange={(e) => setAllowAlternatives(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      أوافق على اقتراح بدائل أرخص بنفس المادة الفعالة في حال نقص الصنف
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || isProcessingImage || !uploadedImage}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الروشتة للصيدلي...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>إرسال الروشتة للصيدلي وتجهيز الطلب فوراً</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
