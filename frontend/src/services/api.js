import fallbackProducts from '../data/fallbackProducts.json';

const API_BASE = import.meta.env.VITE_API_BASE || (
  typeof window !== 'undefined'
    ? (window.location.port === '5173'
        ? `http://${window.location.hostname || 'localhost'}:5000/api`
        : (window.location.hostname && window.location.hostname.includes('github.io')
            ? ''
            : (window.location.port === '' || window.location.port === '80'
                ? '/api'
                : `http://${window.location.hostname || 'localhost'}:5000/api`)))
    : 'http://localhost:5000/api'
);

const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

const filterFallbackProducts = (params = {}) => {
  let list = [...fallbackProducts];

  if (params.search) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
        (p.activeIngredient && p.activeIngredient.toLowerCase().includes(q))
    );
  }

  if (params.category && params.category !== 'الكل') {
    list = list.filter((p) => p.category === params.category || p.category?.includes(params.category));
  }

  if (params.subCategory && params.subCategory !== 'ALL') {
    list = list.filter((p) => p.subCategory === params.subCategory || p.subCategory?.includes(params.subCategory));
  }

  if (params.isHotDeal !== undefined) {
    list = list.filter((p) => p.isHotDeal || (p.discountPercentage && p.discountPercentage > 0));
  }

  if (params.isPrescriptionRequired !== undefined) {
    list = list.filter((p) => Boolean(p.isPrescriptionRequired) === Boolean(params.isPrescriptionRequired));
  }

  if (params.sortBy === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (params.sortBy === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (params.sortBy === 'rating_desc') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (params.limit) {
    list = list.slice(0, Number(params.limit));
  }

  return list;
};

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
    if (isGitHubPages && !import.meta.env.VITE_API_BASE) {
      return filterFallbackProducts(params);
    }
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

    try {
      const res = await fetch(`${API_BASE}/products?${query.toString()}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch (e) {
      console.warn('API connection failed, using offline fallback catalog:', e);
      return filterFallbackProducts(params);
    }
  },

  getCatalogStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/products/catalog-stats`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      totalProducts: fallbackProducts.length,
      hotDealsCount: fallbackProducts.filter((p) => p.isHotDeal).length,
      prescriptionCount: fallbackProducts.filter((p) => p.isPrescriptionRequired).length,
      categoriesCount: 8,
    };
  },

  getProductCategories: async () => {
    try {
      const res = await fetch(`${API_BASE}/products/categories`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [
      'الأدوية (Medications)',
      'الفيتامينات والمكملات',
      'العناية بالبشرة والجمال',
      'رعاية الأم والطفل',
      'الأجهزة والمستلزمات الطبية',
      'العناية الشخصية اليومية',
    ];
  },

  getProductById: async (id) => {
    if (isGitHubPages && !import.meta.env.VITE_API_BASE) {
      const p = fallbackProducts.find((item) => item.id === id);
      if (p) return p;
    }
    try {
      const res = await fetch(`${API_BASE}/products/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'المنتج غير موجود');
      return data;
    } catch (e) {
      const p = fallbackProducts.find((item) => item.id === id);
      if (p) return p;
      throw new Error('المنتج غير موجود');
    }
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
    const rawImages = Array.isArray(rxData.images) && rxData.images.length > 0
      ? rxData.images
      : (rxData.imageUrl ? [rxData.imageUrl] : []);
    const primaryImg = rxData.imageUrl || rawImages[0] || '';

    const payload = {
      ...rxData,
      images: rawImages,
      imageUrl: primaryImg,
      patientNotes: rxData.patientNotes || rxData.notes || '',
    };

    if (isGitHubPages && !import.meta.env.VITE_API_BASE) {
      const demoId = `rx_demo_${Date.now()}`;
      const demoRx = {
        id: demoId,
        prescriptionNumber: `RX-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PENDING',
        customerId: rxData.customerId || 'guest_user',
        customerName: rxData.customerName || rxData.patientName || 'المريض',
        customerPhone: rxData.customerPhone || rxData.patientPhone || '01000000000',
        customerAddress: rxData.customerAddress || 'القاهرة',
        notes: rxData.notes || '',
        patientNotes: rxData.notes || '',
        images: rawImages,
        imageUrl: primaryImg,
        createdAt: new Date().toISOString(),
      };
      try {
        const local = JSON.parse(localStorage.getItem('chefaa_demo_prescriptions') || '[]');
        localStorage.setItem('chefaa_demo_prescriptions', JSON.stringify([demoRx, ...local]));
      } catch (_) {}
      return {
        message: 'تم استلام الروشتة بنجاح (وضع المعاينة)',
        prescription: demoRx,
        ...demoRx,
      };
    }

    try {
      const res = await fetch(`${API_BASE}/prescriptions/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل رفع الروشتة');
      return data;
    } catch (e) {
      console.warn('API error, simulating prescription upload for demo:', e);
      const demoId = `rx_demo_${Date.now()}`;
      const demoRx = {
        id: demoId,
        prescriptionNumber: `RX-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PENDING',
        customerId: rxData.customerId || 'guest_user',
        customerName: rxData.customerName || rxData.patientName || 'المريض',
        customerPhone: rxData.customerPhone || rxData.patientPhone || '01000000000',
        customerAddress: rxData.customerAddress || 'القاهرة',
        notes: rxData.notes || '',
        patientNotes: rxData.notes || '',
        images: rawImages,
        imageUrl: primaryImg,
        createdAt: new Date().toISOString(),
      };
      try {
        const local = JSON.parse(localStorage.getItem('chefaa_demo_prescriptions') || '[]');
        localStorage.setItem('chefaa_demo_prescriptions', JSON.stringify([demoRx, ...local]));
      } catch (_) {}
      return {
        message: 'تم استلام الروشتة بنجاح (وضع المعاينة)',
        prescription: demoRx,
        ...demoRx,
      };
    }
  },

  getAllPrescriptions: async (status) => {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE}/prescriptions${query}`, {
        headers: getHeaders(true),
      });
      if (res.ok) {
        const list = await res.json();
        return (Array.isArray(list) ? list : []).map((p) => ({
          ...p,
          imageUrl: p.imageUrl || (p.images && p.images[0]) || '',
          patientNotes: p.patientNotes || p.notes || '',
        }));
      }
    } catch (_) {}

    try {
      const local = JSON.parse(localStorage.getItem('chefaa_demo_prescriptions') || '[]');
      if (status && status !== 'ALL') {
        return local.filter((p) => p.status === status);
      }
      return local;
    } catch (_) {
      return [];
    }
  },

  getMyPrescriptions: async () => {
    try {
      const res = await fetch(`${API_BASE}/prescriptions/my`, {
        headers: getHeaders(true),
      });
      if (res.ok) {
        const list = await res.json();
        return (Array.isArray(list) ? list : []).map((p) => ({
          ...p,
          imageUrl: p.imageUrl || (p.images && p.images[0]) || '',
          patientNotes: p.patientNotes || p.notes || '',
        }));
      }
    } catch (_) {}

    try {
      return JSON.parse(localStorage.getItem('chefaa_demo_prescriptions') || '[]');
    } catch (_) {
      return [];
    }
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
    if (isGitHubPages && !import.meta.env.VITE_API_BASE) {
      const mockOrder = {
        id: `ord_demo_${Date.now()}`,
        orderNumber: `CHF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...orderData,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('my_orders') || '[]');
        existing.unshift(mockOrder);
        localStorage.setItem('my_orders', JSON.stringify(existing));
      } catch (_) {}
      return mockOrder;
    }
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تأكيد الطلب');
      return data;
    } catch (e) {
      console.warn('API error, simulating order for demo:', e);
      const mockOrder = {
        id: `ord_demo_${Date.now()}`,
        orderNumber: `CHF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...orderData,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('my_orders') || '[]');
        existing.unshift(mockOrder);
        localStorage.setItem('my_orders', JSON.stringify(existing));
      } catch (_) {}
      return mockOrder;
    }
  },

  getAllOrders: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    try {
      const res = await fetch(`${API_BASE}/orders?${query.toString()}`, {
        headers: getHeaders(true),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return [];
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

  // Users & Account Control (Admin Suite)
  getAllUsers: async ({ role, status, q } = {}) => {
    const params = new URLSearchParams();
    if (role && role !== 'ALL') params.append('role', role);
    if (status && status !== 'ALL') params.append('status', status);
    if (q) params.append('q', q);
    const res = await fetch(`${API_BASE}/users?${params.toString()}`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

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

  updateUserRole: async (id, role) => {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل تحديث صلاحية الحساب');
    return data;
  },

  resetUserPassword: async (id, password) => {
    const res = await fetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل إعادة تعيين كلمة المرور');
    return data;
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل حذف الحساب');
    return data;
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
    try {
      const query = activeOnly ? '?activeOnly=true' : '';
      const res = await fetch(`${API_BASE}/cms/banners${query}`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [];
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
    try {
      const res = await fetch(`${API_BASE}/cms/articles`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return [];
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

