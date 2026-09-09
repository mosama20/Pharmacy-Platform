import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  FileText,
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Pill,
  Sparkles,
  Phone,
  User,
  CreditCard,
  MapPin,
  Loader2,
  Check,
  MessageCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useCms } from '../../context/CmsContext';
import { pushCustomerNotification } from '../../services/notificationStorage';

// Helper to compress image client-side before sending
const compressImage = (file, maxWidth = 1600, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve({
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
          name: file.name || 'document.jpg',
          size: `${approxSizeKb} KB`,
          dataUrl,
          isPdf: false,
        });
      };
      img.onerror = () => {
        resolve({
          name: file.name || 'document.jpg',
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

export const InsuranceContractModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedGovernorate, selectedDistrict } = useLocation();
  const { settings } = useCms();

  const companiesList = (settings?.insuranceCompanies && settings.insuranceCompanies.length > 0)
    ? settings.insuranceCompanies.filter((c) => c.isActive !== false)
    : [
        {
          id: 'ins_samsung',
          name: 'سامسونج مصر (Samsung)',
          code: 'SAMSUNG',
          logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=300&q=80',
          discountOrCoverage: 'تغطية طبية شاملة حتى 85%',
        },
        {
          id: 'ins_toshiba',
          name: 'مجموعة العربي - توشيبا (Toshiba)',
          code: 'TOSHIBA',
          logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80',
          discountOrCoverage: 'تغطية تأمينية للعاملين وأسرهم',
        },
        {
          id: 'ins_unicare',
          name: 'يونيكير للرعاية الطبية (UniCare)',
          code: 'UNICARE',
          logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
          discountOrCoverage: 'شبكة بطاقات يونيكير المعتمدة',
        },
        {
          id: 'ins_axa',
          name: 'أكسا للرعاية الصحية (AXA OneHealth)',
          code: 'AXA',
          logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=300&q=80',
          discountOrCoverage: 'موافقة فورية لبطاقات أكسا',
        },
        {
          id: 'ins_mednet',
          name: 'ميدنت مصر (MedNet)',
          code: 'MEDNET',
          logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
          discountOrCoverage: 'تأمين طبي مباشر لشبكة ميدنت',
        },
        {
          id: 'ins_careplus',
          name: 'كير بلس للرعاية الصحية (Care Plus)',
          code: 'CAREPLUS',
          logo: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=300&q=80',
          discountOrCoverage: 'كروت النقابات والرعاية الصحية',
        },
      ];

  // Steps: 1 = Choose Company, 2 = Member & Card Info, 3 = Prescriptions & Autocomplete, 4 = Success
  const [step, setStep] = useState(1);

  // Selected Company state
  const [selectedCompanyId, setSelectedCompanyId] = useState(companiesList[0]?.id || 'ins_samsung');
  const [customCompanyName, setCustomCompanyName] = useState('');

  // Patient & Card Form
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [insuranceCardNumber, setInsuranceCardNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [cardPhoto, setCardPhoto] = useState(null);

  // Medications method: 'both' | 'autocomplete' | 'upload'
  const [rxImage, setRxImage] = useState(null);
  const [allowAlternatives, setAllowAlternatives] = useState(true);
  const [notes, setNotes] = useState('');

  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const cardInputRef = useRef(null);
  const rxFileInputRef = useRef(null);
  const rxCameraInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Debounced product search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.getProducts({ search: q, limit: 8 });
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentCompany = companiesList.find((c) => c.id === selectedCompanyId);
  const finalCompanyName = selectedCompanyId === 'other' ? customCompanyName.trim() : (currentCompany?.name || 'تعاقد خاص');

  // Handle Card Photo
  const handleCardFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await compressImage(file);
      setCardPhoto(processed);
    } catch (err) {
      console.error(err);
      setError('تعذر قراءة صورة كارت التأمين');
    }
  };

  // Handle Rx Photo
  const handleRxFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await compressImage(file);
      setRxImage(processed);
    } catch (err) {
      console.error(err);
      setError('تعذر قراءة صورة الروشتة');
    }
  };

  // Add item from autocomplete
  const handleAddMedicine = (product) => {
    if (selectedItems.some((it) => it.productId === product.id)) {
      setSelectedItems((prev) =>
        prev.map((it) => (it.productId === product.id ? { ...it, quantity: it.quantity + 1 } : it))
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.nameAr || product.nameEn,
          nameEn: product.nameEn,
          price: Number(product.price) || 0,
          quantity: 1,
          dosageNote: '',
          image: product.image,
        },
      ]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUpdateItemQuantity = (index, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((it, i) => {
          if (i === index) {
            const newQty = Math.max(1, it.quantity + delta);
            return { ...it, quantity: newQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const handleUpdateItemDosage = (index, dosage) => {
    setSelectedItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, dosageNote: dosage } : it))
    );
  };

  const handleRemoveItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Form validations for steps
  const handleProceedToStep2 = () => {
    if (selectedCompanyId === 'other' && !customCompanyName.trim()) {
      setError('يرجى كتابة اسم شركة أو جهة التأمين');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleProceedToStep3 = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('يرجى كتابة اسم المريض ورقم الهاتف للتواصل');
      return;
    }
    if (!insuranceCardNumber.trim()) {
      setError('يرجى إدخال رقم الكارت / الرقم التأميني');
      return;
    }
    setError('');
    setStep(3);
  };

  // Submit contract order
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!rxImage && selectedItems.length === 0) {
      setError('يرجى إما تصوير الروشتة أو اختيار دواء واحد على الأقل بالبحث');
      return;
    }

    setLoading(true);

    try {
      let cleanRxUrl = rxImage?.dataUrl || '';
      if (rxImage?.dataUrl && api.uploadBase64) {
        try {
          const uploadRes = await api.uploadBase64(rxImage.dataUrl, 'prescriptions', rxImage.name || 'rx.jpg');
          if (uploadRes?.url) cleanRxUrl = uploadRes.url;
        } catch (_) {}
      }

      let cleanCardUrl = cardPhoto?.dataUrl || '';
      if (cardPhoto?.dataUrl && api.uploadBase64) {
        try {
          const uploadCardRes = await api.uploadBase64(cardPhoto.dataUrl, 'prescriptions', cardPhoto.name || 'card.jpg');
          if (uploadCardRes?.url) cleanCardUrl = uploadCardRes.url;
        } catch (_) {}
      }

      const fullAddress = [selectedGovernorate, selectedDistrict, addressDetails].filter(Boolean).join(' - ');

      const res = await api.uploadPrescription({
        customerId: user?.id || 'guest_' + Date.now(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: fullAddress || 'القاهرة',
        governorate: selectedGovernorate,
        district: selectedDistrict,
        hasInsurance: true,
        insuranceCompany: finalCompanyName,
        insuranceCardNumber: insuranceCardNumber.trim(),
        insuranceCardPhoto: cleanCardUrl,
        nationalId: nationalId.trim() || undefined,
        images: cleanRxUrl ? [cleanRxUrl] : [],
        imageUrl: cleanRxUrl || cleanCardUrl || undefined,
        allowAlternatives,
        notes: notes.trim() || `طلب تعاقد وتأمين (${finalCompanyName} - كارت: ${insuranceCardNumber})`,
        patientNotes: notes.trim() || `طلب تعاقد وتأمين (${finalCompanyName} - كارت: ${insuranceCardNumber})`,
        requestedItems: selectedItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
          dosageNote: it.dosageNote,
          image: it.image,
        })),
      });

      const data = res?.prescription || res;

      pushCustomerNotification({
        title: 'تم استلام طلب التعاقد والتأمين 🏥',
        body: `تم تسجيل طلبك لكارت ${finalCompanyName} بنجاح #${data.id || ''} وجاري المراجعة والتسعير من الصيدلي.`,
        type: 'prescription',
        rxId: data.id,
      });

      setSuccessResult(data);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message || 'فشل إرسال طلب التعاقد، يرجى المحاولة ثانية.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setSelectedItems([]);
    setRxImage(null);
    setCardPhoto(null);
    setNotes('');
    setAddressDetails('');
    setSuccessResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl glass-card shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 font-cairo">
        {/* Hidden Inputs */}
        <input
          ref={cardInputRef}
          type="file"
          accept="image/*"
          onChange={handleCardFileChange}
          className="hidden"
        />
        <input
          ref={rxFileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleRxFileChange}
          className="hidden"
        />
        <input
          ref={rxCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleRxFileChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base font-tajawal">
                  خدمة التعاقدات والتأمين الطبي
                </h3>
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  معتمد
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                صرف أدوية الشركات وكروت الرعاية الصحية مع نسبة التغطية
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Only if not in success step) */}
        {step < 4 && (
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </span>
              <span className={`font-bold ${step === 1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                جهة التعاقد
              </span>
            </div>

            <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </span>
              <span className={`font-bold ${step === 2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                بيانات الكارت
              </span>
            </div>

            <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </span>
              <span className={`font-bold ${step === 3 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                تحديد الأدوية
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="m-4 mb-0 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* STEP 1: SELECT COMPANY / CARD */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  اختر كارت التأمين أو جهة التعاقد التابع لها:
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  الصيدلية متعاقدة مع كبرى الشركات وبطاقات الرعاية الصحية
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {companiesList.map((comp) => {
                  const isSelected = selectedCompanyId === comp.id;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompanyId(comp.id);
                        setError('');
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md shadow-emerald-600/10'
                          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
                        {comp.logo ? (
                          <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>

                      <div className="flex-1 truncate">
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {comp.name}
                        </h5>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          {comp.discountOrCoverage || 'تغطية معتمدة'}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Other Company Option */}
                <div
                  onClick={() => {
                    setSelectedCompanyId('other');
                    setError('');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    selectedCompanyId === 'other'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-500">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      شركة أو جهة أخرى
                    </h5>
                    <p className="text-[10px] text-slate-400">إذا لم تجد بطاقتك بالقائمة</p>
                  </div>
                  {selectedCompanyId === 'other' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {selectedCompanyId === 'other' && (
                <div className="pt-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اكتب اسم شركة أو كارت التأمين:
                  </label>
                  <input
                    type="text"
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    placeholder="مثال: نقابة المهندسين، بنك مصر، كير بلس..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MEMBER DETAILS & CARD PHOTO */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">
                    الجهة المختارة: {finalCompanyName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    يرجى تسجيل بيانات المشترك بدقة لصرف الدواء وفقاً لسياسة التعاقد
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم المريض ثلاثي / رباعي: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="اسم حامل البطاقة"
                      className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الهاتف / واتساب: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الكارت / الرقم التأميني: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={insuranceCardNumber}
                      onChange={(e) => setInsuranceCardNumber(e.target.value)}
                      placeholder="الرقم المدون على كارت التأمين"
                      className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الرقم القومي (اختياري):
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="14 رقماً بالبطاقة الشخصية"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Upload Card Photo */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  صورة كارت التأمين (الوجه الأمامي):
                </label>
                {cardPhoto ? (
                  <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={cardPhoto.dataUrl}
                        alt="Card"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          تم إرفاق صورة الكارت بنجاح
                        </span>
                        <span className="text-[10px] text-slate-400">{cardPhoto.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCardPhoto(null)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => cardInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      اضغط لتصوير أو رفع صورة كارت التأمين
                    </span>
                    <span className="text-[10px] text-slate-400">
                      تساعد الصيدلي في سرعة اعتماد الموافقة الطبية
                    </span>
                  </div>
                )}
              </div>

              {/* Address info */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان التوصيل (الشارع / العمارة):
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder={`مثال: شارع النصر، عمارة 15 - التوصيل لـ (${selectedGovernorate} - ${selectedDistrict})`}
                    className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MEDICATIONS (AUTOCOMPLETE SEARCH & RX PHOTO) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  تحديد الأدوية المطلوبة:
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  يمكنك البحث عن اسم الدواء وإضافته، أو تصوير الروشتة/الموافقة، أو الجمع بينهما!
                </p>
              </div>

              {/* SECTION A: AUTOCOMPLETE MEDICINES SEARCH */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span>البحث الفوري عن الأدوية (Autocomplete):</span>
                  </span>
                  {selectedItems.length > 0 && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      {selectedItems.length} أدوية مضافة
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اكتب اسم الدواء (مثال: بنادول، كونكور، أوجمنتين، جلوكوفاج)..."
                    className="w-full pr-4 pl-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute left-3 top-3" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  )}

                  {/* Autocomplete Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {searchResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleAddMedicine(prod)}
                          className="p-2.5 flex items-center justify-between hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=100&q=80'}
                              alt={prod.nameAr}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="truncate">
                              <h6 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {prod.nameAr}
                              </h6>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {prod.nameEn || prod.activeIngredient}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-xs text-emerald-600 font-mono">
                              {prod.price} ج.م
                            </span>
                            <button
                              type="button"
                              className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Medicines List */}
                {selectedItems.length > 0 && (
                  <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-0.5">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.price ? `${item.price} ج.م` : 'تسعير تأميني'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Dosage input */}
                          <input
                            type="text"
                            value={item.dosageNote}
                            onChange={(e) => handleUpdateItemDosage(idx, e.target.value)}
                            placeholder="الجرعة (اختياري)"
                            className="w-28 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-900 dark:text-white focus:outline-none"
                          />

                          {/* Stepper */}
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, -1)}
                              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="px-2.5 text-xs font-bold font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, 1)}
                              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION B: PRESCRIPTION / APPROVAL PHOTO UPLOAD */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>تصوير أو رفع روشتة العلاج / الموافقة الطبية:</span>
                </span>

                {rxImage ? (
                  <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      {rxImage.isPdf ? (
                        <FileText className="w-10 h-10 text-rose-500 shrink-0" />
                      ) : (
                        <img
                          src={rxImage.dataUrl}
                          alt="Prescription"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          تم إرفاق ملف الروشتة بنجاح
                        </span>
                        <span className="text-[10px] text-slate-400">{rxImage.size}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRxImage(null)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => rxCameraInputRef.current?.click()}
                      className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 bg-white dark:bg-slate-900 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <Camera className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        تصوير بالكاميرا فوراً
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => rxFileInputRef.current?.click()}
                      className="p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <UploadCloud className="w-5 h-5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        رفع صورة أو ملف PDF
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Alternatives switch & Notes */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowAlternatives}
                    onChange={(e) => setAllowAlternatives(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    السماح بالبدائل المتطابقة (نفس المادة الفعالة) في حالة نقص أو تعذر صنف
                  </span>
                </label>

                <div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية للصيدلي (مثال: موعد التوصيل المفضل، أو أي تفاصيل تخص الكارت)..."
                    className="w-full px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && successResult && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900 dark:text-white font-tajawal">
                  تم استلام طلب التعاقد والتأمين بنجاح!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  يقوم الصيدلي المناوب الآن بمراجعة بيانات كارت {finalCompanyName} وتدقيق الأصناف لتجهيزها والتواصل معك.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 max-w-sm mx-auto text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم الطلب:</span>
                  <span className="font-bold font-mono text-emerald-600">#{successResult.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الجهة / الكارت:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{finalCompanyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">حالة الطلب:</span>
                  <span className="font-bold text-amber-600">قيد الفحص والمراجعة (24/7)</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/2${settings?.whatsapp || '01012345678'}?text=${encodeURIComponent(
                    `مرحباً، أود متابعة طلب أدوية التأمين والتعاقدات كود #${successResult.id} الخاص بـ ${customerName}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تأكيد المتابعة عبر واتساب الصيدلية</span>
                </a>

                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  إغلاق والعودة للمتجر
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Controls for Steps 1, 2, 3) */}
        {step < 4 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep((s) => s - 1);
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold"
              >
                إلغاء
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <span>متابعة لتسجيل الكارت</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <span>متابعة لتحديد الأدوية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>تأكيد وإرسال طلب التأمين</span>
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
