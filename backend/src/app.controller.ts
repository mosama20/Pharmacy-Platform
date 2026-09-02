import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiRoot() {
    return {
      status: 'ok',
      message: 'Chefaa Healthcare & Pharmacy Platform API is running 🚀',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        cmsSettings: '/api/cms/settings',
        cmsBanners: '/api/cms/banners',
        cmsCategories: '/api/cms/categories',
        cmsPromoCodes: '/api/cms/promo-codes',
        cmsArticles: '/api/cms/articles',
        authLogin: '/api/auth/login',
        products: '/api/products',
        orders: '/api/orders',
        prescriptions: '/api/prescriptions',
      },
    };
  }
}
