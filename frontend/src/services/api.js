const API_BASE = 'http://localhost:5000/api';

const getHeaders = (isAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (isAuth) {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('chefaa_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تسجيل الدخول');
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل إنشاء الحساب');
    return data;
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل جلب الملف الشخصي');
    return data;
  },

  // Products
  getProducts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'الكل') query.append('category', params.category);
    if (params.subCategory) query.append('subCategory', params.subCategory);
    if (params.isHotDeal !== undefined) query.append('isHotDeal', params.isHotDeal);
    if (params.isPrescriptionRequired !== undefined)
      query.append('isPrescriptionRequired', params.isPrescriptionRequired);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.all) query.append('all', 'true');
    if (params.limit !== undefined) query.append('limit', params.limit);
    if (params.page !== undefined) query.append('page', params.page);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    return res.json();
  },

  getCatalogStats: async () => {
    const res = await fetch(`${API_BASE}/products/catalog-stats`);
    return res.json();
  },

  getProductCategories: async () => {
    const res = await fetch(`${API_BASE}/products/categories`);
    return res.json();
  },

  getProductById: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'المنتج غير موجود');
    return data;
  },

  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل إضافة المنتج');
    return data;
  },

  updateProduct: async (id, productData) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تعديل المنتج');
    return data;
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل حذف المنتج');
    return data;
  },

  getCategoriesTree: async () => {
    const res = await fetch(`${API_BASE}/products/categories-tree`);
    return res.json();
  },

  importProductsExcel: async ({ base64, filePath, mode = 'replace' }) => {
    const res = await fetch(`${API_BASE}/products/import-excel`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ base64, filePath, mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل استيراد شيت الإكسيل');
    return data;
  },

  importDefaultExcel: async (mode = 'replace') => {
    const res = await fetch(`${API_BASE}/products/import-default`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل استيراد الشيت الافتراضي');
    return data;
  },

  downloadExcelTemplateUrl: () => `${API_BASE}/products/template-excel`,

  // Prescriptions
  uploadPrescription: async (rxData) => {
    const res = await fetch(`${API_BASE}/prescriptions/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(rxData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل رفع الروشتة');
    return data;
  },

  getAllPrescriptions: async (status) => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/prescriptions${query}`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  getMyPrescriptions: async () => {
    const res = await fetch(`${API_BASE}/prescriptions/my`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  quotePrescription: async (id, quoteData) => {
    const res = await fetch(`${API_BASE}/prescriptions/${id}/quote`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(quoteData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تسعير الروشتة');
    return data;
  },

  updatePrescriptionStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/prescriptions/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Orders
  createOrder: async (orderData) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تأكيد الطلب');
    return data;
  },

  getAllOrders: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const res = await fetch(`${API_BASE}/orders?${query.toString()}`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  getMyOrders: async () => {
    const res = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  getMyDeliveries: async () => {
    const res = await fetch(`${API_BASE}/orders/my-deliveries`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  getCourierStats: async () => {
    const res = await fetch(`${API_BASE}/orders/courier-stats`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  getOrderById: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'الطلب غير موجود');
    return data;
  },

  updateOrderStatus: async (id, statusData) => {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(statusData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تحديث حالة الطلب');
    return data;
  },

  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/orders/dashboard-stats`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  // Staff
  getAllStaff: async (role) => {
    const query = role ? `?role=${role}` : '';
    const res = await fetch(`${API_BASE}/staff${query}`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  createStaff: async (staffData) => {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(staffData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل إنشاء حساب الموظف');
    return data;
  },

  updateStaff: async (id, staffData) => {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(staffData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تعديل بيانات الموظف');
    return data;
  },

  deleteStaff: async (id) => {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل حذف الموظف');
    return data;
  },

  // Customers
  getAllCustomers: async (search) => {
    const query = search ? `?q=${search}` : '';
    const res = await fetch(`${API_BASE}/users/customers${query}`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  updateCustomerStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Refill
  createRefill: async (refillData) => {
    const res = await fetch(`${API_BASE}/refill`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(refillData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل إنشاء اشتراك الدواء الشهري');
    return data;
  },

  getMyRefills: async () => {
    const res = await fetch(`${API_BASE}/refill/my`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  getAllRefills: async () => {
    const res = await fetch(`${API_BASE}/refill`);
    return res.json();
  },

  // CMS - Banners
  getBanners: async (activeOnly = false) => {
    const query = activeOnly ? '?activeOnly=true' : '';
    const res = await fetch(`${API_BASE}/cms/banners${query}`);
    return res.json();
  },

  createBanner: async (data) => {
    const res = await fetch(`${API_BASE}/cms/banners`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل إنشاء البانر');
    return json;
  },

  updateBanner: async (id, data) => {
    const res = await fetch(`${API_BASE}/cms/banners/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل تحديث البانر');
    return json;
  },

  deleteBanner: async (id) => {
    const res = await fetch(`${API_BASE}/cms/banners/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل حذف البانر');
    return json;
  },

  // CMS - Categories
  getCMSCategories: async () => {
    const res = await fetch(`${API_BASE}/cms/categories`);
    return res.json();
  },

  createCMSCategory: async (data) => {
    const res = await fetch(`${API_BASE}/cms/categories`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل إضافة الفئة');
    return json;
  },

  updateCMSCategory: async (id, data) => {
    const res = await fetch(`${API_BASE}/cms/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل تعديل الفئة');
    return json;
  },

  deleteCMSCategory: async (id) => {
    const res = await fetch(`${API_BASE}/cms/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل حذف الفئة');
    return json;
  },

  // CMS - Promo Codes
  getPromoCodes: async () => {
    const res = await fetch(`${API_BASE}/cms/promo-codes`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  validatePromoCode: async (code, cartTotal) => {
    const res = await fetch(`${API_BASE}/cms/promo-codes/validate`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ code, cartTotal }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'كود الخصم غير صالح');
    return data;
  },

  createPromoCode: async (data) => {
    const res = await fetch(`${API_BASE}/cms/promo-codes`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل إنشاء كود الخصم');
    return json;
  },

  updatePromoCode: async (id, data) => {
    const res = await fetch(`${API_BASE}/cms/promo-codes/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل تعديل كود الخصم');
    return json;
  },

  deletePromoCode: async (id) => {
    const res = await fetch(`${API_BASE}/cms/promo-codes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل حذف كود الخصم');
    return json;
  },

  // CMS - Articles
  getArticles: async () => {
    const res = await fetch(`${API_BASE}/cms/articles`);
    return res.json();
  },

  getArticleById: async (id) => {
    const res = await fetch(`${API_BASE}/cms/articles/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'المقال غير موجود');
    return data;
  },

  createArticle: async (data) => {
    const res = await fetch(`${API_BASE}/cms/articles`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل إضافة المقال');
    return json;
  },

  updateArticle: async (id, data) => {
    const res = await fetch(`${API_BASE}/cms/articles/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل تعديل المقال');
    return json;
  },

  deleteArticle: async (id) => {
    const res = await fetch(`${API_BASE}/cms/articles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل حذف المقال');
    return json;
  },

  // CMS - Platform Settings
  getPlatformSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/cms/settings`);
      return res.json();
    } catch {
      return null;
    }
  },

  updatePlatformSettings: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/cms/settings`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً كمسؤول (Admin)');
        }
        if (res.status === 403) {
          throw new Error('ليس لديك صلاحية كافية لتعديل إعدادات المنصة (يجب تسجيل الدخول كمدير نظام)');
        }
        const msg = Array.isArray(json?.message) ? json.message.join(' - ') : json?.message;
        throw new Error(msg || 'فشل حفظ الإعدادات');
      }
      return json;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError')) {
        throw new Error('تعذر الاتصال بالسيرفر (Backend API). يرجى التأكد من تشغيل الخادم على المنفذ 5000');
      }
      throw err;
    }
  },

  // AI & OCR Services
  analyzePrescriptionAi: async (data) => {
    const res = await fetch(`${API_BASE}/ai/analyze-prescription`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل تحليل الروشتة بالذكاء الاصطناعي');
    return json;
  },

  consultPharmacistAi: async (data) => {
    const res = await fetch(`${API_BASE}/ai/pharmacist-consult`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل استشارة الصيدلي الذكي');
    return json;
  },

  checkDrugInteractions: async (productIds) => {
    const res = await fetch(`${API_BASE}/ai/check-interactions`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ productIds }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل فحص التداخلات الدوائية');
    return json;
  },

  // Real-time GPS Tracking
  getOrderLiveTracking: async (orderId) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/live-tracking`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل جلب إحداثيات التتبع الحي');
    return json;
  },
};

