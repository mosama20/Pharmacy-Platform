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

      // Active Ingredient
      const activeIngredient = (
        row['المادة الفعالة'] ||
        row['activeIngredient'] ||
        row['ActiveIngredient'] ||
        brand ||
        'مستحضر دوائي وصحي'
      ).toString().trim();

      // Current Price
      const rawPrice =
        row['السعر الحالي (جنيه مصري)'] ||
        row['السعر (جنيه مصري)'] ||
        row['السعر الحالي'] ||
        row['السعر'] ||
        row['price'] ||
        row['Price'] ||
        0;
      const price = parseFloat(rawPrice) || 0;

      // Original Price (Before Discount)
      const rawOriginalPrice =
        row['السعر قبل الخصم (جنيه مصري)'] ||
        row['السعر قبل الخصم'] ||
        row['السعر الأصلي'] ||
        row['سعر قبل الخصم'] ||
        row['originalPrice'] ||
        row['OriginalPrice'] ||
        row['oldPrice'] ||
        0;
      const parsedOrig = parseFloat(rawOriginalPrice) || 0;
      const originalPrice = parsedOrig > price ? parsedOrig : price;

      // Discount Percentage & Hot Deal
      const rawDiscount =
        row['نسبة الخصم %'] ||
        row['نسبة الخصم'] ||
        row['الخصم %'] ||
        row['discountPercentage'] ||
        0;
      let discountPercentage = parseFloat(rawDiscount) || 0;
      if (!discountPercentage && originalPrice > price) {
        discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

      // Stock
      const rawStock =
        row['الكمية المتاحة بالمخزن'] ||
        row['الكمية بالمخزن (الرصيد)'] ||
        row['الكمية بالمخزن'] ||
        row['الكمية'] ||
        row['المخزون'] ||
        row['الرصيد'] ||
        row['stock'] ||
        row['Stock'] ||
        row['quantity'] ||
        row['Quantity'];
      const stock =
        rawStock !== undefined && rawStock !== null && rawStock !== ''
          ? Math.max(0, parseInt(rawStock, 10) || 0)
          : 50;

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

      const rawHotDeal = (
        row['عرض توفير؟ (نعم / لا)'] ||
        row['عرض توفير؟'] ||
        row['عرض ساخن'] ||
        row['isHotDeal'] ||
        ''
      ).toString().toLowerCase();
      const isHotDeal =
        discountPercentage > 0 ||
        rawHotDeal.includes('نعم') ||
        rawHotDeal.includes('yes') ||
        rawHotDeal.includes('true') ||
        rawHotDeal.includes('1');

      let id = rawSku ? `prod_${rawSku}` : `prod_${uuidv4().substring(0, 8)}`;
      if (seenIds.has(id)) {
        id = `${id}_${i + 1}`;
      }
      seenIds.add(id);

      parsedProducts.push({
        id,
        nameAr,
        nameEn: brand ? `${nameAr} - ${brand}` : nameAr,
        activeIngredient,
        category: mainCat,
        subCategory: subCat,
        price,
        originalPrice,
        discountPercentage,
        stock,
        isPrescriptionRequired,
        isHotDeal,
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
    defaultPath = process.env.DEFAULT_EXCEL_PATH || '',
    mode: 'replace' | 'append' = 'replace',
  ) {
    if (!defaultPath || !fs.existsSync(defaultPath)) {
      throw new NotFoundException(`الملف غير موجود في المسار: ${defaultPath || '(لم يتم تحديد مسار)'}`);
    }

    const buffer = fs.readFileSync(defaultPath);
    return this.importFromExcelBuffer(buffer, mode);
  }

  generateExcelTemplate(): Buffer {
    // 1. Gather all dynamic categories and their subcategories
    const categoryTree = new Map<string, Set<string>>();

    // From registered CMS categories
    if (Array.isArray(this.db.categories)) {
      for (const cat of this.db.categories) {
        if (!cat.name || cat.name === 'الكل' || cat.isSpecial) continue;
        if (!categoryTree.has(cat.name)) {
          categoryTree.set(cat.name, new Set());
        }
      }
    }

    // From current products
    if (Array.isArray(this.db.products)) {
      for (const prod of this.db.products) {
        const main = prod.category || 'الأدوية (Medications)';
        const sub = prod.subCategory || 'عام';
        if (!categoryTree.has(main)) {
          categoryTree.set(main, new Set());
        }
        if (sub) {
          categoryTree.get(main)!.add(sub);
        }
      }
    }

    // If no categories exist yet, provide standard base pharmacy departments
    if (categoryTree.size === 0) {
      categoryTree.set('الأدوية (Medications)', new Set(['مسكنات الألم', 'المضادات الحيوية', 'أدوية السكر والضغط', 'نزلات البرد']));
      categoryTree.set('العناية بالبشرة (Skin Care)', new Set(['الترطيب', 'واقي الشمس', 'غسول ومقشر']));
      categoryTree.set('الفيتامينات والمكملات (Vitamins)', new Set(['الفيتامينات والمعادن', 'مكملات الطاقة', 'أوميجا وزيوت']));
      categoryTree.set('الأم والطفل (Mom & Baby)', new Set(['حليب ورضاعة', 'حفاضات ومناديل', 'شامبو واستحمام']));
      categoryTree.set('المستلزمات والأجهزة (Medical Devices)', new Set(['أجهزة قياس الضغط', 'أجهزة السكر والشرائط', 'ترمومتر حرارة']));
    }

    // Ensure every category has at least one subcategory
    for (const [catName, subSet] of categoryTree.entries()) {
      if (subSet.size === 0) {
        subSet.add('عام');
        subSet.add('منتجات متنوعة');
      }
    }

    // 2. Build dynamic sample template rows reflecting actual categories
    const templateRows: any[] = [];
    const entries = Array.from(categoryTree.entries());

    const sampleMocks: Record<string, any> = {
      'الأدوية (Medications)': {
        name: 'بانادول اكسترا اوبتيزورب لتخفيف الألم | 24 قرص',
        brand: 'بانادول (Panadol)',
        ingredient: 'باراسيتامول 500 مجم + كافيين 65 مجم',
        price: 58,
        originalPrice: 65,
        stock: 150,
        rx: 'لا',
        sku: 'panadol-extra-24',
        desc: 'مسكن سريع وممتد المفعول لتسكين آلام الصداع وخفض الحرارة.',
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      },
      'العناية بالبشرة (Skin Care)': {
        name: 'سيرافي لوشن مرطب للبشرة الجافة 236 مل',
        brand: 'سيرافي (CeraVe)',
        ingredient: 'سيراميد + حمض الهيالورونيك',
        price: 390,
        originalPrice: 430,
        stock: 45,
        rx: 'لا',
        sku: 'cerave-moist-236',
        desc: 'لوشن مرطب يومي للبشرة العادية إلى الجافة غني بالسيراميد الأساسي.',
        img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
      },
      'الفيتامينات والمكملات (Vitamins)': {
        name: 'أوميجا 3 بلس 30 كبسولة زيت سمك وزيت جنين القمح',
        brand: 'سيديكو (SEDICO)',
        ingredient: 'زيت سمك 1000 مجم + زيت جنين القمح 100 مجم',
        price: 110,
        originalPrice: 125,
        stock: 80,
        rx: 'لا',
        sku: 'omega-3-sedico',
        desc: 'مكمل غذائي غني بالأحماض الدهنية الأساسية لصحة القلب والدماغ.',
        img: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=400&q=80',
      },
      'الأم والطفل (Mom & Baby)': {
        name: 'حفاضات بامبرز كلوت مقاس 4 عبوة جامبو 60 حفاضة',
        brand: 'بامبرز (Pampers)',
        ingredient: 'طبقات حماية فائقة الامتصاص ولطيفة على بشرة الطفل',
        price: 380,
        originalPrice: 410,
        stock: 60,
        rx: 'لا',
        sku: 'pampers-pants-size4',
        desc: 'حفاضات سهلة الارتداء مع قنوات هوائية تحافظ على جفاف بشرة الطفل حتى 12 ساعة.',
        img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&q=80',
      },
    };

    let sampleCount = 0;
    for (const [mainCat, subSet] of entries) {
      if (sampleCount >= 6) break;
      const subList = Array.from(subSet);
      const subCat = subList[0] || 'عام';
      const mock = sampleMocks[mainCat] || {
        name: `منتج نموذج - ${mainCat}`,
        brand: 'علامة تجارية مصرحة',
        ingredient: 'مكونات طبية وصحية فعالة',
        price: 85,
        originalPrice: 99,
        stock: 50,
        rx: 'لا',
        sku: `sku-${sampleCount + 1}`,
        desc: `وصف تفصيلي كامل لمنتج صيدلي يتبع تصنيف ${mainCat} (${subCat})`,
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      };

      templateRows.push({
        'القسم الرئيسي': mainCat,
        'القسم الفرعي': subCat,
        'اسم المنتج': mock.name,
        'البراند / الشركة': mock.brand,
        'المادة الفعالة': mock.ingredient,
        'السعر الحالي (جنيه مصري)': mock.price,
        'السعر قبل الخصم (جنيه مصري)': mock.originalPrice,
        'الكمية المتاحة بالمخزن': mock.stock,
        'يحتاج روشتة / وصفة؟': mock.rx,
        'كود المنتج (SKU)': mock.sku,
        'وصف المنتج': mock.desc,
        'رابط صورة المنتج': mock.img,
      });
      sampleCount++;
    }

    const wb = xlsx.utils.book_new();

    // Sheet 1: Products Table
    const wsProducts = xlsx.utils.json_to_sheet(templateRows);
    wsProducts['!cols'] = [
      { wch: 32 }, // القسم الرئيسي
      { wch: 25 }, // القسم الفرعي
      { wch: 45 }, // اسم المنتج
      { wch: 25 }, // البراند / الشركة
      { wch: 35 }, // المادة الفعالة
      { wch: 22 }, // السعر الحالي (جنيه مصري)
      { wch: 24 }, // السعر قبل الخصم (جنيه مصري)
      { wch: 22 }, // الكمية المتاحة بالمخزن
      { wch: 22 }, // يحتاج روشتة / وصفة؟
      { wch: 25 }, // كود المنتج (SKU)
      { wch: 45 }, // وصف المنتج
      { wch: 45 }, // رابط صورة المنتج
    ];
    xlsx.utils.book_append_sheet(wb, wsProducts, 'جميع المنتجات المصنفة');

    // Sheet 2: Categories Guide
    const directoryRows: any[] = [];
    for (const [mainCat, subSet] of entries) {
      const subs = Array.from(subSet).join(' ، ');
      directoryRows.push({
        'القسم الرئيسي المعتمد': mainCat,
        'الأقسام الفرعية التابعة له': subs || 'عام',
        'ملاحظة الاستخدام': 'يمكنك استخدام هذه الأقسام في ورقة المنتجات أو كتابة أي قسم جديد تريده وسيتم اعتماده آلياً',
      });
    }

    const wsDirectory = xlsx.utils.json_to_sheet(directoryRows);
    wsDirectory['!cols'] = [
      { wch: 35 }, // القسم الرئيسي المعتمد
      { wch: 55 }, // الأقسام الفرعية التابعة له
      { wch: 75 }, // ملاحظة الاستخدام
    ];
    xlsx.utils.book_append_sheet(wb, wsDirectory, 'دليل الأقسام والتصنيفات');

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

  async refreshCmsCategories() {
    const catTree = await this.getCategoriesTree();
    this.syncCmsCategories(catTree);
  }

  async create(dto: Partial<Product>) {
    const price = Number(dto.price) || 0;
    const originalPrice = dto.originalPrice !== undefined && dto.originalPrice !== null ? Number(dto.originalPrice) : price;
    const discountPercentage = dto.discountPercentage !== undefined && dto.discountPercentage !== null
      ? Number(dto.discountPercentage)
      : (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

    const newProduct: Product = {
      id: `prod_${uuidv4().substring(0, 8)}`,
      nameAr: dto.nameAr || '',
      nameEn: dto.nameEn || '',
      activeIngredient: dto.activeIngredient || 'غير محدد',
      category: dto.category || 'الأدوية (Medications)',
      subCategory: dto.subCategory || 'عام',
      price,
      originalPrice,
      discountPercentage,
      stock: dto.stock !== undefined ? Number(dto.stock) : 50,
      isPrescriptionRequired: Boolean(dto.isPrescriptionRequired),
      isHotDeal: Boolean(dto.isHotDeal) || (discountPercentage > 15),
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
    await this.refreshCmsCategories();
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

    const existing = this.db.products[index];
    const price = dto.price !== undefined ? Number(dto.price) : existing.price;
    const originalPrice = dto.originalPrice !== undefined ? Number(dto.originalPrice) : (existing.originalPrice || price);
    let discountPercentage = dto.discountPercentage !== undefined ? Number(dto.discountPercentage) : existing.discountPercentage;
    if (dto.discountPercentage === undefined && (dto.price !== undefined || dto.originalPrice !== undefined)) {
      discountPercentage = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    }

    this.db.products[index] = {
      ...existing,
      ...dto,
      price,
      originalPrice,
      discountPercentage,
      stock: dto.stock !== undefined ? Number(dto.stock) : existing.stock,
      isPrescriptionRequired: dto.isPrescriptionRequired !== undefined ? Boolean(dto.isPrescriptionRequired) : existing.isPrescriptionRequired,
      isHotDeal: dto.isHotDeal !== undefined ? Boolean(dto.isHotDeal) : (discountPercentage > 15 || existing.isHotDeal),
    };
    await this.refreshCmsCategories();
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
    await this.refreshCmsCategories();
    this.db.persistNow();

    try {
      if (this.db.prisma?.product) {
        await this.db.prisma.product.delete({ where: { id } });
      }
    } catch (e) {
      // ignore if storage is JSON-only
    }

    return {
      message: 'تم حذف المنتج من الكتالوج بنجاح',
      product: removed,
    };
  }

  async clearAll() {
    const count = this.db.products.length;
    this.db.products = [];

    // Reset productCount in categories
    if (Array.isArray(this.db.categories)) {
      this.db.categories.forEach((c) => {
        c.productCount = 0;
      });
    }

    this.db.persistNow();

    try {
      if (this.db.prisma?.product) {
        await this.db.prisma.product.deleteMany({});
      }
    } catch (e) {
      // ignore if storage is JSON-only
    }

    return {
      success: true,
      message: `تم إفراغ كتالوج المنتجات بنجاح (${count} منتج)`,
      clearedCount: count,
      totalCatalogCount: 0,
    };
  }
}
