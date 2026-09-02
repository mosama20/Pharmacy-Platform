import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, HeroBanner, CategoryItem, PromoCode, ArticleItem, PlatformSettings } from '../database/db.service';

@Injectable()
export class CmsService {
  constructor(private db: DbService) {}

  // --- Banners ---
  getBanners(onlyActive = false): HeroBanner[] {
    const list = this.db.banners.sort((a, b) => a.order - b.order);
    return onlyActive ? list.filter((b) => b.isActive) : list;
  }

  createBanner(bannerData: Omit<HeroBanner, 'id'>): HeroBanner {
    const newBanner: HeroBanner = {
      id: `ban_${Date.now()}`,
      order: this.db.banners.length + 1,
      isActive: true,
      ...bannerData,
    };
    this.db.banners.push(newBanner);
    this.db.persist();
    return newBanner;
  }

  updateBanner(id: string, updates: Partial<HeroBanner>): HeroBanner {
    const index = this.db.banners.findIndex((b) => b.id === id);
    if (index === -1) throw new NotFoundException('البانر غير موجود');
    this.db.banners[index] = { ...this.db.banners[index], ...updates };
    this.db.persist();
    return this.db.banners[index];
  }

  deleteBanner(id: string): { success: boolean } {
    const initialLen = this.db.banners.length;
    this.db.banners = this.db.banners.filter((b) => b.id !== id);
    if (this.db.banners.length === initialLen) throw new NotFoundException('البانر غير موجود');
    this.db.persist();
    return { success: true };
  }

  // --- Categories ---
  getCategories(): CategoryItem[] {
    return this.db.categories.sort((a, b) => a.order - b.order);
  }

  createCategory(categoryData: Omit<CategoryItem, 'id'>): CategoryItem {
    const newCategory: CategoryItem = {
      id: `cat_${Date.now()}`,
      order: this.db.categories.length + 1,
      ...categoryData,
    };
    this.db.categories.push(newCategory);
    this.db.persist();
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<CategoryItem>): CategoryItem {
    const index = this.db.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException('الفئة غير موجودة');
    this.db.categories[index] = { ...this.db.categories[index], ...updates };
    this.db.persist();
    return this.db.categories[index];
  }

  deleteCategory(id: string): { success: boolean } {
    this.db.categories = this.db.categories.filter((c) => c.id !== id);
    this.db.persist();
    return { success: true };
  }

  // --- Promo Codes ---
  getPromoCodes(): PromoCode[] {
    return this.db.promoCodes;
  }

  validatePromoCode(code: string, cartTotal: number): PromoCode {
    const promo = this.db.promoCodes.find(
      (p) => p.code.toUpperCase() === code.toUpperCase() && p.isActive
    );
    if (!promo) {
      throw new BadRequestException('كود الخصم غير صحيح أو غير مفعل');
    }
    if (new Date(promo.expiresAt) < new Date()) {
      throw new BadRequestException('عذراً، انتهت صلاحية كود الخصم');
    }
    if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
      throw new BadRequestException('عذراً، لقد استنفد كود الخصم الحد الأقصى لمرات الاستخدام');
    }
    if (cartTotal < promo.minOrderValue) {
      throw new BadRequestException(`الحد الأدنى لتطبيق هذا الكوبون هو ${promo.minOrderValue} ج.م`);
    }
    return promo;
  }

  createPromoCode(data: Omit<PromoCode, 'id' | 'timesUsed'>): PromoCode {
    const exists = this.db.promoCodes.find((p) => p.code.toUpperCase() === data.code.toUpperCase());
    if (exists) throw new BadRequestException('كود الخصم موجود بالفعل');
    const newPromo: PromoCode = {
      id: `promo_${Date.now()}`,
      timesUsed: 0,
      isActive: true,
      ...data,
      code: data.code.toUpperCase(),
    };
    this.db.promoCodes.push(newPromo);
    this.db.persist();
    return newPromo;
  }

  updatePromoCode(id: string, updates: Partial<PromoCode>): PromoCode {
    const index = this.db.promoCodes.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException('كود الخصم غير موجود');
    this.db.promoCodes[index] = { ...this.db.promoCodes[index], ...updates };
    this.db.persist();
    return this.db.promoCodes[index];
  }

  deletePromoCode(id: string): { success: boolean } {
    this.db.promoCodes = this.db.promoCodes.filter((p) => p.id !== id);
    this.db.persist();
    return { success: true };
  }

  // --- Articles ---
  getArticles(): ArticleItem[] {
    return this.db.articles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  getArticleById(id: string): ArticleItem {
    const art = this.db.articles.find((a) => a.id === id);
    if (!art) throw new NotFoundException('المقال الطبي غير موجود');
    return art;
  }

  createArticle(data: Omit<ArticleItem, 'id' | 'publishedAt'>): ArticleItem {
    const newArt: ArticleItem = {
      id: `art_${Date.now()}`,
      publishedAt: new Date().toISOString().split('T')[0],
      isFeatured: false,
      ...data,
    };
    this.db.articles.push(newArt);
    this.db.persist();
    return newArt;
  }

  updateArticle(id: string, updates: Partial<ArticleItem>): ArticleItem {
    const index = this.db.articles.findIndex((a) => a.id === id);
    if (index === -1) throw new NotFoundException('المقال غير موجود');
    this.db.articles[index] = { ...this.db.articles[index], ...updates };
    this.db.persist();
    return this.db.articles[index];
  }

  deleteArticle(id: string): { success: boolean } {
    this.db.articles = this.db.articles.filter((a) => a.id !== id);
    this.db.persist();
    return { success: true };
  }

  // --- Platform Settings ---
  getSettings(): PlatformSettings {
    return this.db.settings;
  }

  updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    this.db.settings = {
      ...this.db.settings,
      ...updates,
      socialLinks: updates.socialLinks
        ? { ...this.db.settings.socialLinks, ...updates.socialLinks }
        : this.db.settings.socialLinks,
      navigationMenu: updates.navigationMenu || this.db.settings.navigationMenu,
      footerColumns: updates.footerColumns || this.db.settings.footerColumns,
      mediaLibrary: updates.mediaLibrary || this.db.settings.mediaLibrary,
    };
    this.db.persist();
    return this.db.settings;
  }
}
