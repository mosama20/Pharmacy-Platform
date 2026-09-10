import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const defaultSettings = {
  websiteName: 'الصيدلية الذكية',
  brandTagline: 'صيدليتك أونلاين 24/7',
  brandDescription: 'منصة الرعاية الصحية والصيدلية الإلكترونية الشاملة، تهدف لتمكين المرضى وعائلاتهم من طلب وتكرار أدويتهم واحتياجاتهم الصحية بسهولة وسرعة وأمان.',
  logoText: 'صـ',
  logoUrl: '',
  faviconUrl: '',
  appIconUrl: '',
  primaryColor: '#059669',
  accentColor: '#0d9488',
  hotline: '19876',
  whatsapp: '01012345678',
  supportEmail: 'admin@pharmacy.com',
  address: 'شارع التسعين، التجمع الخامس، القاهرة، جمهورية مصر العربية',
  workingHours: 'خدمة 24 ساعة طوال أيام الأسبوع',
  operatingCities: ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا', 'أسيوط', 'الإسماعيلية'],
  deliveryFee: 25,
  freeDeliveryThreshold: 500,
  estimatedDeliveryMin: 35,
  announcementText: 'خصم 15% على جميع مستلزمات العناية بالبشرة والفيتامينات بكود: WELCOME15',
  isAnnouncementActive: true,
  allowPrescriptionUpload: true,
  refillDiscountPercent: 15,
  refillFreeDelivery: true,
  seoTitle: 'الصيدلية الذكية | صيدليتك أونلاين - أسرع توصيل دواء',
  seoDescription: 'اطلب كل احتياجاتك من الصيدلية أونلاين، ارفع الروشتة، اسأل صيدلي، وخدمة الدواء الشهري مع أسرع خدمة توصيل.',
  seoKeywords: 'صيدلية اونلاين, دواء, توصيل ادوية, روشتة, دواء شهري, مستحضرات تجميل, فيتامينات',
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com',
    tiktok: 'https://tiktok.com',
  },
  navigationMenu: [
    { id: 'nav_upload', label: 'ارفع الروشتة', url: '#upload', icon: 'FileText', isVisible: true, order: 1 },
    { id: 'nav_refill', label: 'الدواء الشهري', url: '#refill', icon: 'Clock', isVisible: true, order: 2 },
    { id: 'nav_deals', label: 'عروض التوفير', url: '#deals', icon: 'Flame', isVisible: true, order: 3 },
    { id: 'nav_articles', label: 'نصائح طبية', url: '#articles', icon: 'BookOpen', isVisible: true, order: 4 },
  ],
  footerColumns: [
    {
      title: 'خدماتنا',
      links: [
        { label: 'ارفع الروشتة واطلب دواك', url: '#upload' },
        { label: 'خدمة الدواء الشهري للمزمن', url: '#refill' },
        { label: 'محرك البحث عن بدائل الأدوية', url: '#search' },
        { label: 'عروض وخصومات Big Save', url: '#deals' },
      ],
    },
    {
      title: 'الأقسام الأكثر طلباً',
      links: [
        { label: 'مسكنات وخافض للحرارة', url: '#cat_meds' },
        { label: 'علاج السكر والضغط والقلب', url: '#cat_chronic' },
        { label: 'منتجات العناية بالبشرة والشعر', url: '#cat_skin' },
        { label: 'الفيتامينات والمكملات الغذائية', url: '#cat_supp' },
        { label: 'أجهزة قياس السكر وضغط الدم', url: '#cat_devices' },
      ],
    },
  ],
  mediaLibrary: [],
  quickCards: [
    {
      id: 'card_upload',
      title: 'رفع وتصوير الروشتة',
      subtitle: 'تسعير وفحص روشتتك وتوصيلها فوراً',
      icon: 'FileText',
      actionType: 'upload',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconBg: 'bg-emerald-600',
      order: 1,
      isVisible: true,
    },
    {
      id: 'card_refill',
      title: 'الدواء الشهري للمزمن',
      subtitle: 'توصيل تلقائي لأدوية السكر والضغط',
      icon: 'Clock',
      actionType: 'refill',
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
      gradient: 'from-amber-500/10 to-orange-500/10',
      iconBg: 'bg-amber-500',
      order: 4,
      isVisible: true,
    },
  ],
  insuranceCompanies: [
    {
      id: 'ins_samsung',
      name: 'سامسونج مصر (Samsung)',
      code: 'SAMSUNG',
      logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=300&q=80',
      discountOrCoverage: 'تغطية طبية شاملة حتى 85%',
      notes: 'يرجى إرفاق صورة الكارت ورقم العضوية',
      requiresCardPhoto: true,
      isActive: true,
      order: 1,
    },
    {
      id: 'ins_toshiba',
      name: 'مجموعة العربي - توشيبا (Toshiba)',
      code: 'TOSHIBA',
      logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80',
      discountOrCoverage: 'تغطية تأمينية للعاملين وأسرهم',
      notes: 'صرف الأدوية المزمنة والحادة مع الرقم التأميني',
      requiresCardPhoto: true,
      isActive: true,
      order: 2,
    },
    {
      id: 'ins_unicare',
      name: 'يونيكير للرعاية الطبية (UniCare)',
      code: 'UNICARE',
      logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
      discountOrCoverage: 'شبكة بطاقات يونيكير المعتمدة',
      notes: 'تغطية حسب نسبة التحمل المدونة على الكارت',
      requiresCardPhoto: true,
      isActive: true,
      order: 3,
    },
    {
      id: 'ins_axa',
      name: 'أكسا للرعاية الصحية (AXA OneHealth)',
      code: 'AXA',
      logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=300&q=80',
      discountOrCoverage: 'موافقة فورية لبطاقات أكسا',
      notes: 'خصم وصرف أدوية التعاقد مباشرة',
      requiresCardPhoto: true,
      isActive: true,
      order: 4,
    },
    {
      id: 'ins_mednet',
      name: 'ميدنت مصر (MedNet)',
      code: 'MEDNET',
      logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
      discountOrCoverage: 'تأمين طبي مباشر لشبكة ميدنت',
      notes: 'يتطلب رقم البطاقة وتاريخ الانتهاء',
      requiresCardPhoto: true,
      isActive: true,
      order: 5,
    },
    {
      id: 'ins_careplus',
      name: 'كير بلس للرعاية الصحية (Care Plus)',
      code: 'CAREPLUS',
      logo: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=300&q=80',
      discountOrCoverage: 'كروت النقابات والرعاية الصحية',
      notes: 'صرف الأدوية بخصومات التعاقد المعتمدة',
      requiresCardPhoto: true,
      isActive: true,
      order: 6,
    },
  ],
};

const CmsContext = createContext(null);

export const CmsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCmsData = useCallback(async () => {
    try {
      const [settingsRes, bannersRes, categoriesRes, articlesRes] = await Promise.all([
        api.getPlatformSettings().catch(() => null),
        api.getBanners(true).catch(() => []),
        api.getCMSCategories().catch(() => []),
        api.getArticles().catch(() => []),
      ]);

      if (settingsRes && typeof settingsRes === 'object' && !settingsRes.statusCode) {
        setSettings((prev) => ({
          ...prev,
          ...settingsRes,
          socialLinks: { ...prev.socialLinks, ...(settingsRes.socialLinks || {}) },
          navigationMenu: settingsRes.navigationMenu?.length ? settingsRes.navigationMenu : prev.navigationMenu,
          footerColumns: settingsRes.footerColumns?.length ? settingsRes.footerColumns : prev.footerColumns,
          mediaLibrary: settingsRes.mediaLibrary?.length ? settingsRes.mediaLibrary : prev.mediaLibrary,
          quickCards: settingsRes.quickCards?.length ? settingsRes.quickCards : prev.quickCards,
        }));
      }

      if (Array.isArray(bannersRes) && bannersRes.length > 0) {
        setBanners(bannersRes);
      }
      if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
        setCategories(categoriesRes);
      }
      if (Array.isArray(articlesRes) && articlesRes.length > 0) {
        setArticles(articlesRes);
      }
    } catch (err) {
      console.error('Error loading CMS data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCmsData();
  }, [fetchCmsData]);

  // Synchronize Document Meta, Title, Favicon, and Brand Colors with dynamic CMS settings
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // 1. Title
      if (settings.seoTitle) {
        document.title = settings.seoTitle;
      } else if (settings.websiteName) {
        document.title = `${settings.websiteName} | ${settings.brandTagline || 'صيدليتك أونلاين'}`;
      }

      // 2. Meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      if (settings.seoDescription) {
        metaDesc.content = settings.seoDescription;
      }

      // 3. Favicon
      if (settings.faviconUrl) {
        let linkIcon = document.querySelector("link[rel~='icon']");
        if (!linkIcon) {
          linkIcon = document.createElement('link');
          linkIcon.rel = 'icon';
          document.head.appendChild(linkIcon);
        }
        linkIcon.href = settings.faviconUrl;
      }

      // 4. Custom colors (Theme color & CSS variables)
      if (settings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
          metaTheme = document.createElement('meta');
          metaTheme.name = 'theme-color';
          document.head.appendChild(metaTheme);
        }
        metaTheme.content = settings.primaryColor;
      }
      if (settings.accentColor) {
        document.documentElement.style.setProperty('--accent-color', settings.accentColor);
      }
    }
  }, [settings]);

  const saveSettings = async (newUpdates) => {
    try {
      const updated = await api.updatePlatformSettings(newUpdates);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        socialLinks: { ...prev.socialLinks, ...(updated.socialLinks || {}) },
        navigationMenu: updated.navigationMenu || prev.navigationMenu,
        footerColumns: updated.footerColumns || prev.footerColumns,
        mediaLibrary: updated.mediaLibrary || prev.mediaLibrary,
        quickCards: updated.quickCards || prev.quickCards,
      }));
      return updated;
    } catch (err) {
      console.error('Failed to save settings:', err);
      throw err;
    }
  };

  return (
    <CmsContext.Provider
      value={{
        settings,
        setSettings,
        banners,
        setBanners,
        categories,
        setCategories,
        articles,
        setArticles,
        loading,
        refreshCmsData: fetchCmsData,
        saveSettings,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
