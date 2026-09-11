import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCms } from '../context/CmsContext';

// Layout & Common

import { AdminLayout } from '../components/admin/layout/AdminLayout';
import { AuthRoleGateway } from '../components/admin/AuthRoleGateway';

// Modals

import { OrderDetailModal } from '../components/admin/modals/OrderDetailModal';
import { PrescriptionReviewModal } from '../components/admin/modals/PrescriptionReviewModal';
import { ExcelImportModal } from '../components/admin/modals/ExcelImportModal';
import { NewStaffModal } from '../components/admin/modals/NewStaffModal';
import { NewProductModal } from '../components/admin/modals/NewProductModal';
import { NewBannerModal } from '../components/admin/modals/NewBannerModal';
import { NewCouponModal } from '../components/admin/modals/NewCouponModal';
import { NewArticleModal } from '../components/admin/modals/NewArticleModal';
import { NewCategoryModal } from '../components/admin/modals/NewCategoryModal';
import { NewMediaModal } from '../components/admin/modals/NewMediaModal';

// Tabs

import { OrdersTab } from '../components/admin/tabs/OrdersTab';
import { PrescriptionsTab } from '../components/admin/tabs/PrescriptionsTab';
import { ProductsTab } from '../components/admin/tabs/ProductsTab';
import { StaffTab } from '../components/admin/tabs/StaffTab';
import { RefillsTab } from '../components/admin/tabs/RefillsTab';
import { CustomersTab } from '../components/admin/tabs/CustomersTab';
import { AnalyticsTab } from '../components/admin/tabs/AnalyticsTab';
import { CourierView } from '../components/admin/tabs/CourierView';
import { CmsTab } from '../components/admin/tabs/CmsTab';
import { InsuranceTab } from '../components/admin/tabs/InsuranceTab';
import { SystemBackupTab } from '../components/admin/tabs/SystemBackupTab';

export const AdminDashboard = ({ onBackToStore, initialTab, portalType }) => {
  const { user, login, logout, isAdmin, isPharmacist, isCourier, isSupport } = useAuth();
  const { refreshCmsData, saveSettings } = useCms();

  // Tab state (defaults based on initialTab or role)
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    if (portalType === 'pharmacy' || user?.role === 'PHARMACIST') return 'prescriptions';
    if (portalType === 'delivery' || user?.role === 'DELIVERY') return 'courier';
    return 'orders';
  });

  const [cmsActiveSubTab, setCmsActiveSubTab] = useState('identity');

  // Data state
  const [stats, setStats] = useState(null);
  const [courierStats, setCourierStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [refillsList, setRefillsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);


  // Filter & Search states
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // CMS dynamic state
  const [cmsSettings, setCmsSettings] = useState(null);
  const [cmsBanners, setCmsBanners] = useState([]);
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsPromoCodes, setCmsPromoCodes] = useState([]);
  const [cmsArticles, setCmsArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const settingsInitializedRef = useRef(false);

  // Selected for modals
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [selectedRxForReview, setSelectedRxForReview] = useState(null);

  // New Item Modals
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewBannerModalOpen, setIsNewBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isNewCouponModalOpen, setIsNewCouponModalOpen] = useState(false);
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewMediaModalOpen, setIsNewMediaModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Platform Settings Form

  const [settingsForm, setSettingsForm] = useState({
    websiteName: '',
    brandTagline: '',
    brandDescription: '',
    logoText: '',
    logoUrl: '',
    faviconUrl: '',
    appIconUrl: '',
    primaryColor: '',
    accentColor: '',
    hotline: '',
    whatsapp: '',
    supportEmail: '',
    address: '',
    workingHours: '',
    operatingCities: [],
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    estimatedDeliveryMin: 0,
    announcementText: '',
    isAnnouncementActive: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
    },
    navigationMenu: [],
    footerColumns: [],
    mediaLibrary: [],
    quickCards: [],
    refillDiscountPercent: 15,
    refillFreeDelivery: true,
    telegramBotToken: '8816040899:AAHn5t7WDimz6JudP27PccRPlwFuj8aDMHc',
    telegramChatId: '8800720269',
    telegramNotificationsEnabled: true,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: 'صيدلية د. شيماء <orders@drshimaa.com>',
    adminNotificationEmail: 'admin@drshimaa.com',
    emailNotificationsEnabled: true,
  });

  const fetchData = async (forceInitSettings = false) => {
    if (forceInitSettings || !settingsInitializedRef.current) {
      setLoading(true);
    }
    try {
      if (user?.role === 'DELIVERY') {
        const [delivOrders, cStats] = await Promise.all([
          api.getAllOrders().catch(() => []),
          api.getCourierStats().catch(() => null),
        ]);
        setOrders(Array.isArray(delivOrders) ? delivOrders : []);
        setCourierStats(cStats);
      } else {
        const shouldFetchProducts = forceInitSettings || productsList.length === 0;
        const [
          statsData,
          ordersData,
          rxData,
          staffData,
          custData,
          prodsData,
          refillsData,
          bannersData,
          categoriesData,
          couponsData,
          articlesData,
          settingsData,
          allUsersData,
        ] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getAllOrders().catch(() => []),
          api.getAllPrescriptions().catch(() => []),
          api.getAllStaff().catch(() => []),
          api.getAllCustomers().catch(() => []),
          shouldFetchProducts ? api.getProducts({ all: true }).catch(() => []) : Promise.resolve(null),
          api.getAllRefills().catch(() => []),
          api.getBanners().catch(() => []),
          api.getCMSCategories().catch(() => []),
          api.getPromoCodes().catch(() => []),
          api.getArticles().catch(() => []),
          api.getPlatformSettings().catch(() => null),
          user?.role === 'ADMIN' ? api.getAllUsers().catch(() => []) : Promise.resolve([]),
        ]);

        setStats(statsData && !statsData.statusCode ? statsData : null);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setPrescriptions(Array.isArray(rxData) ? rxData : []);
        setStaffList(Array.isArray(staffData) ? staffData : []);
        setCustomersList(Array.isArray(custData) ? custData : []);
        if (Array.isArray(allUsersData) && allUsersData.length > 0) {
          setAllUsersList(allUsersData);
        }
        if (Array.isArray(prodsData)) {
          setProductsList(prodsData);
        }
        setRefillsList(Array.isArray(refillsData) ? refillsData : []);
        setCmsBanners(Array.isArray(bannersData) ? bannersData : []);
        setCmsCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCmsPromoCodes(Array.isArray(couponsData) ? couponsData : []);
        setCmsArticles(Array.isArray(articlesData) ? articlesData : []);

        if (settingsData) {
          setCmsSettings(settingsData);
          if (forceInitSettings || !settingsInitializedRef.current) {
            settingsInitializedRef.current = true;
            setSettingsForm({
              websiteName: settingsData.websiteName || 'الصيدلية الذكية',
              brandTagline: settingsData.brandTagline || 'صيدليتك أونلاين 24/7',
              brandDescription: settingsData.brandDescription || '',
              logoText: settingsData.logoText || 'صـ',
              logoUrl: settingsData.logoUrl || '',
              faviconUrl: settingsData.faviconUrl || '',
              appIconUrl: settingsData.appIconUrl || '',
              primaryColor: settingsData.primaryColor || '#059669',
              accentColor: settingsData.accentColor || '#0d9488',
              hotline: settingsData.hotline || '19876',
              whatsapp: settingsData.whatsapp || '01012345678',
              supportEmail: settingsData.supportEmail || 'admin@pharmacy.com',
              address: settingsData.address || 'شارع التسعين، التجمع الخامس، القاهرة، مصر',
              workingHours: settingsData.workingHours || 'خدمة 24 ساعة طوال أيام الأسبوع',
              operatingCities: settingsData.operatingCities || ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا'],
              deliveryFee: settingsData.deliveryFee ?? 25,
              freeDeliveryThreshold: settingsData.freeDeliveryThreshold ?? 500,
              estimatedDeliveryMin: settingsData.estimatedDeliveryMin ?? 35,
              announcementText: settingsData.announcementText || '',
              isAnnouncementActive: settingsData.isAnnouncementActive ?? true,
              seoTitle: settingsData.seoTitle || '',
              seoDescription: settingsData.seoDescription || '',
              seoKeywords: settingsData.seoKeywords || '',
              socialLinks: {
                facebook: settingsData.socialLinks?.facebook || '',
                instagram: settingsData.socialLinks?.instagram || '',
                twitter: settingsData.socialLinks?.twitter || '',
                linkedin: settingsData.socialLinks?.linkedin || '',
                youtube: settingsData.socialLinks?.youtube || '',
                tiktok: settingsData.socialLinks?.tiktok || '',
              },
              navigationMenu: settingsData.navigationMenu || [],
              footerColumns: settingsData.footerColumns || [],
              mediaLibrary: settingsData.mediaLibrary || [],
              quickCards: settingsData.quickCards || [],
              refillDiscountPercent: settingsData.refillDiscountPercent ?? 15,
              refillFreeDelivery: settingsData.refillFreeDelivery ?? true,
              telegramBotToken: settingsData.telegramBotToken || '8816040899:AAHn5t7WDimz6JudP27PccRPlwFuj8aDMHc',
              telegramChatId: settingsData.telegramChatId || '8800720269',
              telegramNotificationsEnabled: settingsData.telegramNotificationsEnabled ?? true,
              smtpHost: settingsData.smtpHost || '',
              smtpPort: settingsData.smtpPort || 587,
              smtpUser: settingsData.smtpUser || '',
              smtpPass: settingsData.smtpPass || '',
              smtpFrom: settingsData.smtpFrom || 'صيدلية د. شيماء <orders@drshimaa.com>',
              adminNotificationEmail: settingsData.adminNotificationEmail || 'admin@drshimaa.com',
              emailNotificationsEnabled: settingsData.emailNotificationsEnabled ?? true,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    settingsInitializedRef.current = false;
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus, courierId) => {
    try {
      await api.updateOrderStatus(orderId, {
        status: newStatus,
        assignedCourierId: courierId,
      });
      fetchData();
    } catch (err) {
      alert('فشل تحديث حالة الطلب: ' + err.message);
    }
  };

  // Staff Creation & Deletion
  const handleCreateStaff = async (formData) => {
    await api.createStaff(formData);
    fetchData();
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف حساب هذا الموظف؟')) return;
    try {
      await api.deleteStaff(id);
      fetchData();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  // Product Creation
  const handleCreateProduct = async (formData) => {
    try {
      await api.createProduct(formData);
      alert('تمت إضافة الدواء بنجاح إلى قاعدة البيانات!');
      fetchData();
    } catch (err) {
      alert('خطأ أثناء إضافة المنتج: ' + err.message);
    }
  };

  // Prescription Quotation & Status
  const handleSubmitQuote = async (rxId, quoteData) => {
    try {
      await api.quotePrescription(rxId, quoteData);
      alert('تم إرسال التسعيرة للعميل بنجاح!');
      setSelectedRxForReview(null);
      fetchData();
    } catch (err) {
      alert('فشل تسعير الروشتة: ' + err.message);
    }
  };

  const handleUpdateRxStatus = async (rxId, status, cancellationReason) => {
    try {
      await api.updatePrescriptionStatus(rxId, status, cancellationReason);
      fetchData();
      if (selectedRxForReview?.id === rxId) {
        setSelectedRxForReview(null);
      }
    } catch (err) {
      alert('فشل تحديث حالة الروشتة: ' + err.message);
    }
  };

  const handleUpdateProductStock = async (productId, newStock) => {
    try {
      await api.updateProduct(productId, { stock: Math.max(0, Number(newStock)) });
      setProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, Number(newStock)) } : p))
      );
    } catch (err) {
      alert('فشل تحديث رصيد المخزون: ' + err.message);
    }
  };

  const handleUpdateProduct = async (productId, updatedData) => {
    try {
      await api.updateProduct(productId, updatedData);
      alert('تم تحديث بيانات المنتج بنجاح!');
      fetchData();
    } catch (err) {
      alert('فشل تحديث بيانات المنتج: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج (${productName || productId})؟`)) return;
    try {
      await api.deleteProduct(productId);
      alert('تم حذف المنتج بنجاح!');
      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      fetchData();
    } catch (err) {
      alert('فشل حذف المنتج: ' + err.message);
    }
  };

  const handleClearCatalog = async () => {
    try {
      await api.clearAllProducts();
      setProductsList([]);
      alert('تم إفراغ كتالوج المنتجات بالكامل بنجاح!');
      fetchData();
    } catch (err) {
      alert('فشل إفراغ الكتالوج: ' + err.message);
    }
  };

  // CMS Handlers
  const handleSaveBanner = async (bannerData, bannerId) => {
    try {
      if (bannerId) {
        await api.updateBanner(bannerId, bannerData);
        alert('تم تعديل وحفظ بيانات البانر بنجاح!');
      } else {
        await api.createBanner(bannerData);
        alert('تمت إضافة البانر بنجاح للموقع!');
      }
      setEditingBanner(null);
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل حفظ البانر: ' + err.message);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      await api.deleteBanner(id);
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  const handleCreateCoupon = async (couponData) => {
    try {
      await api.createPromoCode(couponData);
      alert('تم تفعيل كود الخصم بنجاح!');
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل إنشاء كود الخصم: ' + err.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('هل أنت متأكد من تعطيل وحذف كود الخصم؟')) return;
    try {
      await api.deletePromoCode(id);
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  const handleCreateArticle = async (articleData) => {
    try {
      await api.createArticle(articleData);
      alert('تم نشر المقال والنصيحة الطبية بنجاح!');
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل نشر المقال: ' + err.message);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    try {
      await api.deleteArticle(id);
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  const handleCreateCategory = async (catData) => {
    try {
      await api.createCMSCategory(catData);
      alert('تمت إضافة القسم بنجاح!');
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل إضافة القسم: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    try {
      await api.deleteCMSCategory(id);
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  const handleCreateMediaAsset = async (mediaData) => {
    try {
      const updatedMedia = [
        ...(settingsForm.mediaLibrary || []),
        {
          id: `med_${Date.now()}`,
          name: mediaData.name,
          url: mediaData.url,
          alt: mediaData.alt || mediaData.name,
          category: mediaData.category || 'أدوية',
          createdAt: new Date().toISOString(),
        },
      ];
      await api.updatePlatformSettings({ mediaLibrary: updatedMedia });
      setSettingsForm((prev) => ({ ...prev, mediaLibrary: updatedMedia }));
      alert('تمت إضافة الصورة إلى مكتبة الوسائط بنجاح!');
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل إضافة الصورة: ' + err.message);
    }
  };

  const handleDeleteMediaAsset = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة من المكتبة؟')) return;
    try {
      const updatedMedia = (settingsForm.mediaLibrary || []).filter((m) => m.id !== id);
      await api.updatePlatformSettings({ mediaLibrary: updatedMedia });
      setSettingsForm((prev) => ({ ...prev, mediaLibrary: updatedMedia }));
      fetchData();
      if (typeof refreshCmsData === 'function') refreshCmsData();
    } catch (err) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    try {
      await saveSettings(settingsForm);
      alert('تم حفظ إعدادات المنصة بنجاح وتحديث المتجر بالكامل!');
      fetchData(true);
    } catch (err) {
      alert('فشل حفظ الإعدادات: ' + err.message);
    }
  };

  const couriers = Array.isArray(staffList) ? staffList.filter((s) => s.role === 'DELIVERY') : [];
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const pendingRxCount = prescriptions.filter((p) => p.status === 'PENDING' && !p.hasInsurance && !p.insuranceCompany).length;
  const pendingInsuranceCount = prescriptions.filter((p) => p.status === 'PENDING' && (p.hasInsurance || p.insuranceCompany)).length;
  const activeDeliveriesCount = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const readyDeliveriesCount = orders.filter((o) => o.status === 'PREPARING').length;

  // Unauthenticated / Non-Staff Gateway
  if (!user || !['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT'].includes(user?.role)) {
    return <AuthRoleGateway setActiveTab={setActiveTab} onBackToStore={onBackToStore} />;
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      cmsActiveSubTab={cmsActiveSubTab}
      setCmsActiveSubTab={setCmsActiveSubTab}
      onRefresh={() => fetchData(true)}
      loading={loading}
      onBackToStore={onBackToStore}
      pendingOrdersCount={pendingOrdersCount}
      pendingRxCount={pendingRxCount}
      pendingInsuranceCount={pendingInsuranceCount}
      activeDeliveriesCount={activeDeliveriesCount}
      readyDeliveriesCount={readyDeliveriesCount}
    >
      {/* 1. Orders Tab */}
      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          orderFilter={orderFilter}
          setOrderFilter={setOrderFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
          onUpdateStatus={handleUpdateOrderStatus}
          couriers={couriers}
        />
      )}

      {/* 2. Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <PrescriptionsTab
          prescriptions={prescriptions}
          onSelectRxForReview={(rx) => setSelectedRxForReview(rx)}
          onUpdateRxStatus={handleUpdateRxStatus}
        />
      )}

      {/* 2.5 Insurance & Corporate Contracts Tab */}
      {activeTab === 'insurance' && (
        <InsuranceTab
          prescriptions={prescriptions}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          onSaveSettings={handleSaveSettings}
          onSelectRxForReview={(rx) => setSelectedRxForReview(rx)}
          onUpdateRxStatus={handleUpdateRxStatus}
        />
      )}

      {/* 3. Products & Inventory Tab */}
      {activeTab === 'products' && (
        <ProductsTab
          products={productsList}
          categories={cmsCategories}
          onOpenNewProductModal={() => setIsNewProductModalOpen(true)}
          onOpenExcelImportModal={() => setIsExcelImportModalOpen(true)}
          onUpdateStock={handleUpdateProductStock}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onClearCatalog={handleClearCatalog}
          onRefresh={() => fetchData(true)}
        />
      )}

      {/* 4. Staff Accounts Tab */}
      {activeTab === 'staff' && (
        <StaffTab
          staffList={staffList}
          onOpenNewStaffModal={() => setIsNewStaffModalOpen(true)}
          onDeleteStaff={handleDeleteStaff}
        />
      )}

      {/* 5. Refills Tab */}
      {activeTab === 'refills' && (
        <RefillsTab
          refills={refillsList}
          refillDiscountPercent={settingsForm.refillDiscountPercent ?? 15}
          onUpdateDiscount={async (newDiscount) => {
            const updated = { ...settingsForm, refillDiscountPercent: Number(newDiscount) };
            setSettingsForm(updated);
            await saveSettings(updated);
            fetchData(true);
          }}
          onRefreshRefills={() => fetchData(true)}
        />
      )}

      {/* 6. Customers Directory & Full User Control Center */}
      {activeTab === 'customers' && (
        <CustomersTab
          customers={customersList}
          allUsers={allUsersList}
          onRefreshUsers={() => fetchData(true)}
        />
      )}

      {/* 7. Analytics & Revenue Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsTab
          stats={stats}
          orders={orders}
          prescriptions={prescriptions}
        />
      )}

      {/* 8. Courier View Tab */}
      {activeTab === 'courier' && (
        <CourierView
          orders={orders}
          courierStats={courierStats}
          onUpdateStatus={handleUpdateOrderStatus}
          onRefresh={fetchData}
          loading={loading}
          onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
        />
      )}

      {/* 9. CMS Hub Tab */}
      {activeTab === 'cms' && (
        <CmsTab
          cmsActiveSubTab={cmsActiveSubTab}
          setCmsActiveSubTab={setCmsActiveSubTab}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          onSaveSettings={handleSaveSettings}
          cmsBanners={cmsBanners}
          cmsCategories={cmsCategories}
          cmsPromoCodes={cmsPromoCodes}
          cmsArticles={cmsArticles}
          onOpenNewBannerModal={() => {
            setEditingBanner(null);
            setIsNewBannerModalOpen(true);
          }}
          onEditBanner={(banner) => {
            setEditingBanner(banner);
            setIsNewBannerModalOpen(true);
          }}
          onDeleteBanner={handleDeleteBanner}
          onOpenNewCategoryModal={() => setIsNewCategoryModalOpen(true)}
          onDeleteCategory={handleDeleteCategory}
          onOpenNewCouponModal={() => setIsNewCouponModalOpen(true)}
          onDeleteCoupon={handleDeleteCoupon}
          onOpenNewArticleModal={() => setIsNewArticleModalOpen(true)}
          onDeleteArticle={handleDeleteArticle}
          onOpenNewMediaModal={() => setIsNewMediaModalOpen(true)}
          onDeleteMedia={handleDeleteMediaAsset}
        />
      )}

      {/* 10. System Backup & Factory Reset Tab */}
      {activeTab === 'backup' && <SystemBackupTab />}

      {/* Global Admin Modals */}
      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          couriers={couriers}
        />
      )}

      {selectedRxForReview && (
        <PrescriptionReviewModal
          rx={selectedRxForReview}
          products={productsList}
          onClose={() => setSelectedRxForReview(null)}
          onSubmitQuote={handleSubmitQuote}
          onUpdateStatus={handleUpdateRxStatus}
        />
      )}

      <NewStaffModal
        isOpen={isNewStaffModalOpen}
        onClose={() => setIsNewStaffModalOpen(false)}
        onSubmit={handleCreateStaff}
      />

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSubmit={handleCreateProduct}
        categories={cmsCategories}
      />

      <NewBannerModal
        isOpen={isNewBannerModalOpen}
        onClose={() => {
          setIsNewBannerModalOpen(false);
          setEditingBanner(null);
        }}
        onSubmit={handleSaveBanner}
        bannerToEdit={editingBanner}
      />

      <NewCouponModal
        isOpen={isNewCouponModalOpen}
        onClose={() => setIsNewCouponModalOpen(false)}
        onSubmit={handleCreateCoupon}
      />

      <NewArticleModal
        isOpen={isNewArticleModalOpen}
        onClose={() => setIsNewArticleModalOpen(false)}
        onSubmit={handleCreateArticle}
      />

      <NewCategoryModal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        onSubmit={handleCreateCategory}
      />

      <NewMediaModal
        isOpen={isNewMediaModalOpen}
        onClose={() => setIsNewMediaModalOpen(false)}
        onSubmit={handleCreateMediaAsset}
      />
      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportSuccess={fetchData}
      />
    </AdminLayout>
  );
};

