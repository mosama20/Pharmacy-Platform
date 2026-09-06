import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DbService, Product, CategoryItem } from '../database/db.service';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

export interface CategoryNode {
  name: string;
  count: number;
  subCategories: Array<{
    name: string;
    count: number;
  }>;
}

@Injectable()
export class ProductsService {
  constructor(private readonly db: DbService) {}

  async findAll(query?: {
    search?: string;
    category?: string;
    subCategory?: string;
    isHotDeal?: boolean;
    isPrescriptionRequired?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular';
    limit?: number;
    page?: number;
    all?: boolean | string;
    format?: string;
    paginated?: boolean | string;
  }) {
    let list = this.db.products;

    if (query?.category && query.category !== 'ALL' && query.category !== 'الكل') {
      const catQuery = query.category.trim();
      list = list.filter((p) => p.category === catQuery || p.category.includes(catQuery));
    }

    if (query?.subCategory && query.subCategory !== 'ALL' && query.subCategory !== 'الكل') {
      const subQuery = query.subCategory.trim();
      list = list.filter((p) => p.subCategory === subQuery || p.subCategory?.includes(subQuery));
    }

    if (query?.isHotDeal !== undefined) {
      list = list.filter((p) => Boolean(p.isHotDeal) === Boolean(query.isHotDeal));
    }

    if (query?.isPrescriptionRequired !== undefined) {
      list = list.filter(
        (p) => Boolean(p.isPrescriptionRequired) === Boolean(query.isPrescriptionRequired),
      );
    }

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameAr?.toLowerCase().includes(q) ||
          p.nameEn?.toLowerCase().includes(q) ||
          p.activeIngredient?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.subCategory?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (query?.sortBy === 'price_asc') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (query?.sortBy === 'price_desc') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (query?.sortBy === 'rating') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (query?.sortBy === 'popular') {
      list = [...list].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }

    // Return all items if requested explicitly
    if (query?.all === true || query?.all === 'true' || query?.limit === 0 || query?.limit === -1) {
      return list;
    }

    const total = list.length;
    const limit = query?.limit ? Number(query.limit) : 200;
    const page = query?.page ? Math.max(1, Number(query.page)) : 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    if (
      query?.format === 'paginated' ||
      query?.paginated === true ||
      query?.paginated === 'true'
    ) {
      return {
        data: paginatedItems,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: startIndex + limit < total,
          hasPrev: page > 1,
        },
      };
    }

    return paginatedItems;
  }

  async getCatalogStats() {
    const totalProducts = this.db.products.length;
    const categories = await this.getCategories();
    const lowStockCount = this.db.products.filter((p) => p.stock > 0 && p.stock <= 15).length;
    const outOfStockCount = this.db.products.filter((p) => p.stock === 0).length;

    return {
      totalProducts,
      categoriesCount: categories.length,
      lowStockCount,
      outOfStockCount,
      categories,
    };
  }

  async findOne(id: string) {
    const product = this.db.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException('المنتج أو الدواء غير متوفر في الصيدلية');
    }

    // Get alternatives
    let alternatives: Product[] = [];
    if (product.alternatives && product.alternatives.length > 0) {
      alternatives = this.db.products.filter((p) =>
        product.alternatives?.includes(p.id),
      );
    } else if (product.activeIngredient && product.activeIngredient !== 'غير محدد') {
      const ingredientPrefix = product.activeIngredient.split('(')[0].trim().toLowerCase();
      if (ingredientPrefix.length > 2) {
        alternatives = this.db.products.filter(
          (p) =>
            p.id !== product.id &&
            p.activeIngredient?.toLowerCase().includes(ingredientPrefix),
        ).slice(0, 4);
      }
    }

    return {
      ...product,
      alternativeProducts: alternatives,
    };
  }

  async getCategories() {
    const categoriesMap = new Map<string, Set<string>>();
    for (const prod of this.db.products) {
      const cat = prod.category || 'غير مصنف';
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, new Set());
      }
      if (prod.subCategory) {
        categoriesMap.get(cat)!.add(prod.subCategory);
      }
    }

    return Array.from(categoriesMap.entries()).map(([name, subs]) => ({
      name,
      subCategories: Array.from(subs),
      count: this.db.products.filter((p) => p.category === name).length,
    }));
  }

  async getCategoriesTree(): Promise<CategoryNode[]> {
    const map = new Map<string, Map<string, number>>();

    for (const p of this.db.products) {
      const main = p.category || 'الأدوية (Medications)';
      const sub = p.subCategory || 'عام';

      if (!map.has(main)) {
        map.set(main, new Map());
      }
      const subMap = map.get(main)!;
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
    }

    const result: CategoryNode[] = [];
    for (const [mainName, subMap] of map.entries()) {
      let mainCount = 0;
      const subCategories: Array<{ name: string; count: number }> = [];

      for (const [subName, count] of subMap.entries()) {
        mainCount += count;
        subCategories.push({ name: subName, count });
      }

      // Sort subcategories descending by count
      subCategories.sort((a, b) => b.count - a.count);

      result.push({
        name: mainName,
        count: mainCount,
        subCategories,
      });
    }

    // Sort main categories descending by count
    result.sort((a, b) => b.count - a.count);
    return result;
  }

  async importFromExcelBuffer(
    buffer: Buffer,
    mode: 'replace' | 'append' = 'replace',
  ) {
    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.read(buffer, { type: 'buffer' });
    } catch (err) {
      throw new BadRequestException('فشل في قراءة ملف الإكسيل. تأكد من أن الملف بصيغة .xlsx أو .xls صالحة.');
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new BadRequestException('ملف الإكسيل فارغ ولا يحتوي على أي أوراق عمل.');
    }

    // Find the products sheet: prioritize sheet with "منتجات" or the one with the most rows
    let targetSheetName = workbook.SheetNames[0];
    let maxRows = 0;
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const rows = xlsx.utils.sheet_to_json<any>(sheet);
      if (name.includes('منتجات') || name.includes('Products')) {
        targetSheetName = name;
        maxRows = rows.length;
        break;
      }
      if (rows.length > maxRows) {
        maxRows = rows.length;
        targetSheetName = name;
      }
    }

    const rawRows = xlsx.utils.sheet_to_json<any>(workbook.Sheets[targetSheetName]);
    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestException(`ورقة العمل (${targetSheetName}) لا تحتوي على أي صفوف بيانات.`);
    }

    const parsedProducts: Product[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      // Flexible column key extraction
      const mainCat = (
        row['القسم الرئيسي'] ||
        row['mainCategory'] ||
        row['Category'] ||
        row['القسم'] ||
        'الأدوية (Medications)'
      ).toString().trim();

      const subCat = (
        row['القسم الفرعي'] ||
        row['subCategory'] ||
        row['SubCategory'] ||
        row['التصنيف الفرعي'] ||
        'عام'
      ).toString().trim();

      const nameAr = (
        row['اسم المنتج'] ||
        row['nameAr'] ||
        row['Name'] ||
        row['الاسم'] ||
        `منتج ${i + 1}`
      ).toString().trim();

      const brand = (
        row['البراند / الشركة'] ||
        row['البراند'] ||
        row['الشركة'] ||
        row['brand'] ||
        row['Company'] ||
        ''
      ).toString().trim();

      const rawPrice = row['السعر (جنيه مصري)'] || row['السعر'] || row['price'] || row['Price'] || 0;
      const price = parseFloat(rawPrice) || 0;

      const rawRx = (
        row['يحتاج روشتة / وصفة؟'] ||
        row['يحتاج روشتة'] ||
        row['روشتة'] ||
        row['isPrescriptionRequired'] ||
        ''
      ).toString().toLowerCase();
      const isPrescriptionRequired =
        rawRx.includes('نعم') ||
        rawRx.includes('yes') ||
        rawRx.includes('true') ||
        rawRx.includes('1');

      const rawSku = (
        row['كود المنتج (SKU)'] ||
        row['كود المنتج'] ||
        row['SKU'] ||
        row['sku'] ||
        row['كود'] ||
        ''
      ).toString().trim();

      const descriptionAr = (
        row['وصف المنتج'] ||
        row['الوصف'] ||
        row['description'] ||
        row['Description'] ||
        ''
      ).toString().trim();

      const image = (
        row['رابط صورة المنتج'] ||
        row['رابط الصورة'] ||
        row['الصورة'] ||
        row['image'] ||
        row['Image'] ||
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80'
      ).toString().trim();

      let id = rawSku ? `prod_${rawSku}` : `prod_${uuidv4().substring(0, 8)}`;
      if (seenIds.has(id)) {
        id = `${id}_${i + 1}`;
      }
      seenIds.add(id);

      parsedProducts.push({
        id,
        nameAr,
        nameEn: brand ? `${nameAr} - ${brand}` : nameAr,
        activeIngredient: brand || 'مستحضر دوائي وصحي',
        category: mainCat,
        subCategory: subCat,
        price,
        originalPrice: Math.round(price * 1.1),
        discountPercentage: 0,
        stock: 100,
        isPrescriptionRequired,
        isHotDeal: false,
        rating: 4.8,
        reviewCount: Math.floor(Math.random() * 50) + 1,
        descriptionAr: descriptionAr || `${nameAr} - من قسم ${mainCat} (${subCat})`,
        dosage: 'حسب إرشادات الصيدلي والطبيب المعالج أو النشرة الداخلية.',
        image,
        tags: [mainCat, subCat, brand].filter(Boolean),
        alternatives: [],
      });
    }

    if (mode === 'replace') {
      this.db.products = parsedProducts;
    } else {
      // Append / Merge by ID
      const existingMap = new Map(this.db.products.map((p) => [p.id, p]));
      for (const p of parsedProducts) {
        existingMap.set(p.id, p);
      }
      this.db.products = Array.from(existingMap.values());
    }

    // Auto-synchronize CMS Categories so top navigation aligns with the Excel divisions
    const catTree = await this.getCategoriesTree();
    this.syncCmsCategories(catTree);

    // Persist immediately to disk
    this.db.persistNow();

    return {
      success: true,
      message: `تم استيراد ${parsedProducts.length} منتج بنجاح وتصنيفهم بدقة وفق شيت الإكسيل`,
      importedCount: parsedProducts.length,
      totalCatalogCount: this.db.products.length,
      categoriesCount: catTree.length,
      categoriesTree: catTree,
    };
  }

  async importFromDefaultFile(
    defaultPath = 'D:\\chefaa_products_final_cdn.xlsx',
    mode: 'replace' | 'append' = 'replace',
  ) {
    if (!fs.existsSync(defaultPath)) {
      throw new NotFoundException(`الملف غير موجود في المسار: ${defaultPath}`);
    }

    const buffer = fs.readFileSync(defaultPath);
    return this.importFromExcelBuffer(buffer, mode);
  }

  generateExcelTemplate(): Buffer {
    const templateRows = [
      {
        'القسم الرئيسي': 'الأدوية (Medications)',
        'القسم الفرعي': 'مسكنات الألم',
        'اسم المنتج': 'بانادول اكسترا اوبتيزورب لتخفيف الألم | 24 قرص',
        'البراند / الشركة': 'بانادول (Panadol)',
        'السعر (جنيه مصري)': 58,
        'يحتاج روشتة / وصفة؟': 'لا (صرف بدون روشتة)',
        'كود المنتج (SKU)': 'panadol-extra-tab',
        'وصف المنتج': 'مسكن فعال للصداع وخافض للحرارة.',
        'رابط المنتج على شفاء': 'https://chefaa.com/sample',
        'رابط صورة المنتج': 'https://cdn.jsdelivr.net/gh/mosama20/chefaa-images@main/images/panadol-extra-tab.png',
      },
      {
        'القسم الرئيسي': 'العناية بالبشرة (Skin Care)',
        'القسم الفرعي': 'الترطيب',
        'اسم المنتج': 'سيرافي لوشن مرطب للبشرة الجافة 236 مل',
        'البراند / الشركة': 'سيرافي (CeraVe)',
        'السعر (جنيه مصري)': 390,
        'يحتاج روشتة / وصفة؟': 'لا',
        'كود المنتج (SKU)': 'cerave-moist-lotion',
        'وصف المنتج': 'لوشن مرطب غني بالسيراميد وحمض الهيالورونيك.',
        'رابط المنتج على شفاء': 'https://chefaa.com/sample2',
        'رابط صورة المنتج': 'https://cdn.jsdelivr.net/gh/mosama20/chefaa-images@main/images/cerave.png',
      },
      {
        'القسم الرئيسي': 'الفيتامينات والمكملات (Vitamins)',
        'القسم الفرعي': 'الفيتامينات والمعادن',
        'اسم المنتج': 'أوميجا 3 بلس 30 كبسولة زيت سمك وزيت جنين القمح',
        'البراند / الشركة': 'سيديكو (SEDICO)',
        'السعر (جنيه مصري)': 110,
        'يحتاج روشتة / وصفة؟': 'لا',
        'كود المنتج (SKU)': 'omega-3-plus-caps',
        'وصف المنتج': 'مكمل غذائي لدعم صحة القلب والنشاط الذهني.',
        'رابط المنتج على شفاء': 'https://chefaa.com/sample3',
        'رابط صورة المنتج': 'https://cdn.jsdelivr.net/gh/mosama20/chefaa-images@main/images/omega.png',
      },
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateRows);

    // Auto fit column widths
    ws['!cols'] = [
      { wch: 30 }, // القسم الرئيسي
      { wch: 25 }, // القسم الفرعي
      { wch: 45 }, // اسم المنتج
      { wch: 25 }, // البراند / الشركة
      { wch: 18 }, // السعر (جنيه مصري)
      { wch: 22 }, // يحتاج روشتة / وصفة؟
      { wch: 25 }, // كود المنتج (SKU)
      { wch: 45 }, // وصف المنتج
      { wch: 35 }, // رابط المنتج على شفاء
      { wch: 45 }, // رابط صورة المنتج
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'جميع المنتجات المصنفة');
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private syncCmsCategories(catTree: CategoryNode[]) {
    // Map known category icons
    const iconMap: Record<string, string> = {
      'الأدوية (Medications)': 'Pill',
      'العناية بالشعر (Hair Care)': 'Sparkles',
      'العناية بالبشرة (Skin Care)': 'Sparkles',
      'الأم والطفل (Mom & Baby)': 'Baby',
      'الفيتامينات والمكملات (Vitamins)': 'HeartPulse',
      'العناية اليومية (Daily Essentials)': 'Smile',
      'المكياج و الاكسسوارات (Makeup)': 'Sparkles',
      'الصحة الجنسية (Sexual Wellness)': 'Heart',
      'المستلزمات الطبية (Health Care Devices)': 'Smile',
    };

    const newCategories: CategoryItem[] = [
      {
        id: 'cat_all',
        name: 'الكل',
        slug: 'all',
        iconName: 'Layers',
        order: 0,
        productCount: this.db.products.length,
      },
    ];

    catTree.forEach((c, idx) => {
      newCategories.push({
        id: `cat_${idx + 1}`,
        name: c.name,
        slug: `cat-${idx + 1}`,
        iconName: iconMap[c.name] || 'Pill',
        order: idx + 1,
        productCount: c.count,
      });
    });

    // Add Deals special tab
    newCategories.push({
      id: 'cat_deals',
      name: 'عروض التوفير (Big Save)',
      slug: 'deals',
      iconName: 'Flame',
      isSpecial: true,
      order: newCategories.length,
      productCount: this.db.products.filter((p) => p.isHotDeal || p.discountPercentage).length,
    });

    this.db.categories = newCategories;
  }

  async create(dto: Partial<Product>) {
    const newProduct: Product = {
      id: `prod_${uuidv4().substring(0, 8)}`,
      nameAr: dto.nameAr || '',
      nameEn: dto.nameEn || '',
      activeIngredient: dto.activeIngredient || 'غير محدد',
      category: dto.category || 'الأدوية (Medications)',
      subCategory: dto.subCategory || 'عام',
      price: Number(dto.price) || 0,
      originalPrice: dto.originalPrice ? Number(dto.originalPrice) : Number(dto.price),
      discountPercentage: dto.discountPercentage ? Number(dto.discountPercentage) : 0,
      stock: Number(dto.stock) || 50,
      isPrescriptionRequired: Boolean(dto.isPrescriptionRequired),
      isHotDeal: Boolean(dto.isHotDeal),
      rating: 5.0,
      reviewCount: 1,
      descriptionAr: dto.descriptionAr || '',
      dosage: dto.dosage || '',
      sideEffects: dto.sideEffects || '',
      image: dto.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      tags: dto.tags || [],
      alternatives: dto.alternatives || [],
    };

    this.db.products.unshift(newProduct);
    this.db.persist();
    return {
      message: 'تم إضافة المنتج بنجاح إلى مخزون الصيدلية',
      product: newProduct,
    };
  }

  async update(id: string, dto: Partial<Product>) {
    const index = this.db.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException('المنتج غير موجود');
    }

    this.db.products[index] = {
      ...this.db.products[index],
      ...dto,
    };
    this.db.persist();

    return {
      message: 'تم تحديث بيانات المنتج بنجاح',
      product: this.db.products[index],
    };
  }

  async remove(id: string) {
    const index = this.db.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException('المنتج غير موجود');
    }
    const removed = this.db.products.splice(index, 1)[0];
    this.db.persist();
    return {
      message: 'تم حذف المنتج من الكتالوج',
      product: removed,
    };
  }
}
