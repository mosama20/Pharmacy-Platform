import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Upload,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pill,
  CreditCard,
  User,
  Phone,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Zap,
  Sparkles,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import { useCms } from '../context/CmsContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

// Helper image compressor to ensure smooth uploads
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          name: file.name,
          dataUrl,
          size: Math.round((dataUrl.length * 3) / 4),
        });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const DEFAULT_PARTNERS = [
  {
    id: 'ins_samsung',
    name: 'سامسونج مصر (Samsung)',
    code: 'SAMSUNG',
    logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'تغطية طبية شاملة حتى 85%',
    notes: 'يرجى إرفاق صورة الكارت ورقم العضوية',
    isActive: true,
  },
  {
    id: 'ins_toshiba',
    name: 'مجموعة العربي - توشيبا (Toshiba)',
    code: 'TOSHIBA',
    logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'تغطية تأمينية للعاملين وأسرهم',
    notes: 'صرف الأدوية المزمنة والحادة مع الرقم التأميني',
    isActive: true,
  },
  {
    id: 'ins_unicare',
    name: 'يونيكير للرعاية الطبية (UniCare)',
    code: 'UNICARE',
    logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'شبكة بطاقات يونيكير المعتمدة',
    notes: 'تغطية حسب نسبة التحمل المدونة على الكارت',
    isActive: true,
  },
  {
    id: 'ins_axa',
    name: 'أكسا للرعاية الصحية (AXA OneHealth)',
    code: 'AXA',
    logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'موافقة فورية لبطاقات أكسا',
    notes: 'خصم وصرف أدوية التعاقد مباشرة',
    isActive: true,
  },
  {
    id: 'ins_mednet',
    name: 'ميدنت مصر (MedNet)',
    code: 'MEDNET',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'تأمين طبي مباشر لشبكة ميدنت',
    notes: 'يتطلب رقم البطاقة وتاريخ الانتهاء',
    isActive: true,
  },
  {
    id: 'ins_careplus',
    name: 'كير بلس للرعاية الصحية (Care Plus)',
    code: 'CAREPLUS',
    logo: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=300&q=80',
    discountOrCoverage: 'كروت النقابات والرعاية الصحية',
    notes: 'صرف الأدوية بخصومات التعاقد المعتمدة',
    isActive: true,
  },
];

export const InsurancePage = () => {
  const navigate = useNavigate();
  const { settings } = useCms();
  const { user } = useAuth();
  const { selectedGovernorate: locGov, selectedDistrict: locDist } = useLocation();

  // Active companies from CMS or fallback
  const companiesList = useMemo(() => {
    const fromCms = settings?.insuranceCompanies;
    if (Array.isArray(fromCms) && fromCms.length > 0) {
      return fromCms.filter((c) => c.isActive !== false);
    }
    return DEFAULT_PARTNERS;
  }, [settings?.insuranceCompanies]);

  // Stepper State (1: Company, 2: Info & Card, 3: Medicines/Rx, 4: Success)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRx, setCreatedRx] = useState(null);

  // Form Fields
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [selectedGovernorate, setSelectedGovernorate] = useState(locGov || 'القاهرة');
  const [selectedDistrict, setSelectedDistrict] = useState(locDist || 'المعادي');
  const [addressDetails, setAddressDetails] = useState('');
  const [insuranceCardNumber, setInsuranceCardNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [cardPhoto, setCardPhoto] = useState(null);

  // Rx Photo or Autocomplete Items
  const [rxImage, setRxImage] = useState(null);
  const [allowAlternatives, setAllowAlternatives] = useState(true);
  const [notes, setNotes] = useState('');

  // Autocomplete search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Pre-select first company
  useEffect(() => {
    if (companiesList.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companiesList[0].id);
    }
  }, [companiesList, selectedCompanyId]);

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

  const currentCompany = companiesList.find((c) => c.id === selectedCompanyId);
  const finalCompanyName =
    selectedCompanyId === 'other'
      ? customCompanyName.trim()
      : currentCompany?.name || 'تعاقد خاص';

  // Photo handlers
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

  // Medicine items handlers
  const handleAddMedicine = (product) => {
    if (selectedItems.some((it) => it.productId === product.id)) {
      setSelectedItems((prev) =>
        prev.map((it) =>
          it.productId === product.id ? { ...it, quantity: it.quantity + 1 } : it
        )
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

  // Step Validations
  const handleProceedToStep2 = () => {
    if (selectedCompanyId === 'other' && !customCompanyName.trim()) {
      setError('يرجى كتابة اسم شركة أو جهة التأمين');
      return;
    }
    setError('');
    setStep(2);
    window.scrollTo({ top: 400, behavior: 'smooth' });
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
    window.scrollTo({ top: 400, behavior: 'smooth' });
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
          const uploadRes = await api.uploadBase64(
            rxImage.dataUrl,
            'prescriptions',
            rxImage.name || 'rx.jpg'
          );
          if (uploadRes?.url) cleanRxUrl = uploadRes.url;
        } catch (_) { }
      }

      let cleanCardUrl = cardPhoto?.dataUrl || '';
      if (cardPhoto?.dataUrl && api.uploadBase64) {
        try {
          const uploadCardRes = await api.uploadBase64(
            cardPhoto.dataUrl,
            'prescriptions',
            cardPhoto.name || 'card.jpg'
          );
          if (uploadCardRes?.url) cleanCardUrl = uploadCardRes.url;
        } catch (_) { }
      }

      const fullAddress = [selectedGovernorate, selectedDistrict, addressDetails]
        .filter(Boolean)
        .join(' - ');

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
        notes:
          notes.trim() ||
          `طلب تعاقد وتأمين (${finalCompanyName} - كارت: ${insuranceCardNumber})`,
        patientNotes:
          notes.trim() ||
          `طلب تعاقد وتأمين (${finalCompanyName} - كارت: ${insuranceCardNumber})`,
        requestedItems: selectedItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
          dosageNote: it.dosageNote,
          image: it.image,
        })),
      });

      setCreatedRx(res?.prescription || { id: 'rx_' + Date.now() });
      setStep(4);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ أثناء إرسال طلب التأمين، يرجى المحاولة ثانية'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCreatedRx(null);
    setRxImage(null);
    setCardPhoto(null);
    setSelectedItems([]);
    setNotes('');
    setError('');
  };

  return (
    <div className="min-h-screen pb-16 space-y-8 sm:space-y-12">
      {/* 1. Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <button
            onClick={() => navigate('/')}
            className="hover:text-emerald-600 transition-colors"
          >
            الرئيسية
          </button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-slate-700 dark:text-slate-200 font-bold">
            التعاقدات والتأمين الطبي
          </span>
        </nav>
      </div>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-3xl sm:rounded-4xl overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white p-6 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>شبكة معتمدة لكبرى بطاقات التأمين والشركات في مصر</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-tajawal leading-tight">
              خدمة التعاقدات والتأمين الطبي
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 leading-relaxed">
              اصرف علاجك الشهري والروشتات الطبية ببطاقة التأمين الخاصة بك أو تعاقد شركتك
              (سامسونج، العربي توشيبا، يونيكير، أكسا، وغيرها).
              اختر جهتك، صور الروشتة أو ابحث عن الأدوية، والصيدلية تتولى المراجعة والتوصيل فوراً.
            </p>

            {/* Quick action buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('contract-wizard');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>تقديم طلب صرف التأمين الآن</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>

              <a
                href="https://wa.me/201012345678"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>استفسار عبر واتساب الصيدلية</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Partner Companies Showcase */}
      <section className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-tajawal">
              جهات وشركات التعاقد المعتمدة
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              صيدليتنا معتمدة لدى أبرز شركات التأمين ومقدمي الرعاية الصحية المؤسسية
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {companiesList.length} جهة نشطة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {companiesList.map((comp) => (
            <div
              key={comp.id}
              onClick={() => {
                setSelectedCompanyId(comp.id);
                setStep(2);
                const el = document.getElementById('contract-wizard');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group flex flex-col items-center text-center justify-between shadow-xs hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2 mb-3 group-hover:scale-105 transition-transform">
                {comp.logo ? (
                  <img
                    src={comp.logo}
                    alt={comp.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                {comp.name}
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                {comp.discountOrCoverage || 'تغطية معتمدة'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. The In-Page Contract Order Wizard */}
      <section id="contract-wizard" className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Stepper Header */}
          <div className="bg-gradient-to-l from-emerald-600 to-teal-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-100">
                  خطوة {step} من 4
                </span>
                <h2 className="text-lg sm:text-2xl font-black font-tajawal">
                  {step === 1 && '1. اختر شركة أو جهة التأمين'}
                  {step === 2 && '2. بيانات المشترك وبطاقة التأمين'}
                  {step === 3 && '3. الأدوية المطلوبة والروشتة'}
                  {step === 4 && '4. تم إرسال الطلب بنجاح!'}
                </h2>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Stepper progress dots */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${step >= i ? 'bg-white' : 'bg-white/20'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Wizard Content */}
          <div className="p-6 sm:p-8">
            {/* ============================================================ */}
            {/* STEP 1: SELECT COMPANY */}
            {/* ============================================================ */}
            {step === 1 && (
              <div className="space-y-6">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  اختر بطاقتك التأمينية أو شركة العمل المتعاقدة لصرف العلاج بنسبة التغطية المقررة:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {companiesList.map((comp) => {
                    const isSelected = selectedCompanyId === comp.id;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedCompanyId(comp.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0 p-1 flex items-center justify-center">
                          {comp.logo ? (
                            <img
                              src={comp.logo}
                              alt={comp.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-emerald-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {comp.name}
                          </h4>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            {comp.discountOrCoverage || 'تغطية معتمدة'}
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                            }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}

                  {/* Option: Other company */}
                  <div
                    onClick={() => setSelectedCompanyId('other')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${selectedCompanyId === 'other'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 flex items-center justify-center font-bold">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        جهة أو شركة تأمين أخرى
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        اكتب اسم الشركة وسنتحقق من اعتمادها فوراً
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCompanyId === 'other'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                      {selectedCompanyId === 'other' && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>

                {selectedCompanyId === 'other' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      اسم شركة أو جهة التأمين / التعاقد:
                    </label>
                    <input
                      type="text"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      placeholder="مثال: شركة بترول، نقابة المهندسين، إلخ..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleProceedToStep2}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>المتابعة إلى بيانات المشترك</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: MEMBER & CARD INFO */}
            {/* ============================================================ */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    الجهة المختارة: {finalCompanyName}
                  </span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-emerald-600 hover:underline cursor-pointer font-bold"
                  >
                    تغيير
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      اسم المريض بالكامل *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="كما هو مدون بكارت التأمين"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      رقم هاتف التواصل (واتساب) *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-left font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      رقم الكارت التأميني / رقم العضوية *
                    </label>
                    <input
                      type="text"
                      value={insuranceCardNumber}
                      onChange={(e) => setInsuranceCardNumber(e.target.value)}
                      placeholder="مثال: SAM-98234 أو 1029384"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      الرقم القومي للمشترك (اختياري)
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="14 رقم"
                      maxLength={14}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      المحافظة
                    </label>
                    <input
                      type="text"
                      value={selectedGovernorate}
                      onChange={(e) => setSelectedGovernorate(e.target.value)}
                      placeholder="القاهرة"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      المنطقة أو الحي
                    </label>
                    <input
                      type="text"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      placeholder="المعادي / التجمع الخامس..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    عنوان التوصيل بالتفصيل
                  </label>
                  <input
                    type="text"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="اسم الشارع، رقم العمارة، الشقة، الدور، علامة مميزة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Card Photo Upload Box */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    صورة بطاقة / كارت التأمين (مستحسن لسرعة الاعتماد)
                  </label>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50 text-center">
                    {cardPhoto ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cardPhoto.dataUrl}
                            alt="كارت التأمين"
                            className="w-16 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                          />
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {cardPhoto.name}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-bold">
                              تم تحميل الصورة بنجاح
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCardPhoto(null)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          حذف الصورة
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2">
                        <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-emerald-600">اضغط لرفع صورة الكارت</span>{' '}
                          أو التقطها بالكاميرا
                        </div>
                        <p className="text-[10px] text-slate-400">
                          تأكد من وضوح رقم الكارت والاسم ونسبة التحمل
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCardFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    onClick={handleProceedToStep3}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>المتابعة إلى اختيار الأدوية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: MEDICINES & PRESCRIPTION (DUAL CHOICE) */}
            {/* ============================================================ */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200">
                  <p className="font-bold">خيارات طلب الدواء المرنة:</p>
                  <p className="text-[11px] mt-0.5 text-teal-800/90 dark:text-teal-300">
                    يمكنك <strong>تصوير الروشتة أو الموافقة الطبية</strong>، أو{' '}
                    <strong>البحث عن أسماء أدويتك وإضافتها مباشرة</strong>، أو كلاهما معاً!
                  </p>
                </div>

                {/* Option A: Search Autocomplete */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span>البحث السريع عن الأدوية (أوتوكومبليت)</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اكتب اسم الدواء (مثال: كونكور، بنادول، جلوكوفاج...)"
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    {isSearching && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Search Autocomplete Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-700">
                        {searchResults.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleAddMedicine(prod)}
                            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={prod.nameAr}
                                  className="w-8 h-8 rounded-lg object-contain bg-slate-50 dark:bg-slate-900 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Pill className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {prod.nameAr || prod.nameEn}
                                </p>
                                {prod.nameEn && prod.nameAr && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {prod.nameEn}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-left shrink-0">
                              <span className="text-xs font-black text-emerald-600">
                                {prod.price} ج.م
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                اضغط للإضافة
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Items List */}
                  {selectedItems.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span>الأدوية المحددة ({selectedItems.length})</span>
                        <span className="text-emerald-600 font-bold">
                          إجمالي السعر المبدئي:{' '}
                          {selectedItems.reduce(
                            (s, i) => s + (i.price || 0) * i.quantity,
                            0
                          )}{' '}
                          ج.م
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {item.productName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <input
                                type="text"
                                value={item.dosageNote}
                                onChange={(e) =>
                                  handleUpdateItemDosage(idx, e.target.value)
                                }
                                placeholder="الجرعة (مثال: قرص يومياً)"
                                className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-32 focus:outline-none"
                              />

                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, -1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-bold font-mono">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider with 'OR' */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="shrink mx-4 text-xs font-bold text-slate-400 bg-white dark:bg-slate-900 px-2">
                    أو / مع تصوير الروشتة
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                </div>

                {/* Option B: Prescription Image */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>تصوير أو رفع صورة الروشتة الطبية / الموافقة</span>
                  </label>

                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50 text-center">
                    {rxImage ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={rxImage.dataUrl}
                            alt="صورة الروشتة"
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                          />
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                              {rxImage.name}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-bold">
                              تم تحميل صورة الروشتة بنجاح
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRxImage(null)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-emerald-600">اضغط لرفع الروشتة</span>{' '}
                          أو التقطها بكاميرا الموبايل
                        </div>
                        <p className="text-[10px] text-slate-400">
                          يدعم صور JPG و PNG حتى 15 ميجابايت
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRxFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ملاحظات إضافية للصيدلي (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي توضيحات أو تعليمات خاصة بموعد التسليم أو الجرعات..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Alternatives Checkbox */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAlternatives}
                    onChange={(e) => setAllowAlternatives(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    أوافق على استبدال الأصناف الناقصة ببدائل معتمدة لها نفس المادة الفعالة بعد مراجعة الصيدلي
                  </span>
                </label>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري إرسال الطلب والتسعير...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>تأكيد وإرسال طلب التأمين</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* STEP 4: SUCCESS CONFIRMATION */}
            {/* ============================================================ */}
            {step === 4 && (
              <div className="text-center py-6 space-y-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-3xl font-black font-tajawal text-slate-900 dark:text-white">
                    تم استلام طلب التأمين بنجاح!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    يقوم الصيدلي المناوب الآن بفحص الروشتة والكارت التأميني وإعداد تسعيرة ونسبة التغطية.
                  </p>
                </div>

                {/* Summary Pill */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-xs space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-500">رقم متابعة الطلب:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {createdRx?.id || '#RX-INS'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">جهة التأمين:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {finalCompanyName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">رقم الكارت:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {insuranceCardNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">اسم المستفيد:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {customerName}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/201012345678?text=${encodeURIComponent(
                      `مرحباً صيدلية د. شيماء، أود متابعة طلب التأمين الطبي رقم (${createdRx?.id}) لشركة (${finalCompanyName}) كارت رقم: ${insuranceCardNumber}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>متابعة فورية عبر الواتساب</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    تقديم طلب تعاقد جديد
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    العودة للمتجر الرئيسي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Features Grid (Why choose our insurance service) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-tajawal">
            مميزات خدمة صرف التأمين والتعاقدات
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            تجربة رقمية فريدة لصرف الروشتات بدون طوابير الانتظار أو الإجراءات المعقدة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              اعتماد وتسعير فوري
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              فريق صيدلي متخصص لمراجعة نسب التغطية والتحمل فورياً واعتماد الروشتات دون تأخير.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              توصيل سريع لباب البيت
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              شحن سريع مع الحفاظ على سلسلة التبريد لأدوية الثلاجة والأنسولين لسلامة علاجك.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              تجديد العلاج الشهري
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              إمكانية جدولة صرف أدوية الأمراض المزمنة شهرياً بالتأمين مع تذكير تلقائي بموعد التجديد.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              دعم ومتابعة مستمرة
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تواصل مباشر مع صيادلة للمساعدة في البحث عن بدائل الأدوية ومتابعة طلبات التغطية.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 space-y-4">
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-tajawal">
            الأسئلة الأكثر شيوعاً حول التأمين
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            إجابات سريعة لأهم استفسارات العملاء
          </p>
        </div>

        <div className="space-y-3">
          <details className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 dark:text-white list-none">
              <span>ما هي المستندات المطلوبة لصرف علاج التأمين؟</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              تحتاج فقط إلى صورة بطاقة التأمين السارية، وصورة الروشتة الطبية الحديثة أو كتابة أسماء الأدوية المطلوبة بالبحث، ورقم هاتف للتواصل.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 dark:text-white list-none">
              <span>كيف يتم تحديد نسبة التحمل أو المبلغ المطلوب دفعه؟</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              يتم احتساب نسبة التحمل بدقة وفقاً للعقد المبرم مع شركة التأمين الخاصة بك (مثلاً 10% أو 15% أو 20%)، ويرسل لك الصيدلي إجمالي المبلغ المتبقي مع تفاصيل الفاتورة.
            </p>
          </details>

          <details className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <summary className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 dark:text-white list-none">
              <span>ماذا لو كانت شركة عملي غير مدرجة بالقائمة؟</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              اختر خيار "جهة أو شركة أخرى" واكتب اسم جهتك، وسيقوم فريق الصيدلية بالتحقق من شبكة التعاقدات والرد عليك فوراً بإمكانية الصرف ونسبة الخصم المتاحة.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
};
