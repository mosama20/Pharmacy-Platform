import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { DbService } from '../database/db.service';

describe('ProductsService (Unit Tests)', () => {
  let service: ProductsService;
  let dbService: any;

  const mockProducts = [
    {
      id: 'prod_1',
      nameAr: 'بانادول إكسترا 500 مجم',
      nameEn: 'Panadol Extra 500mg',
      activeIngredient: 'Paracetamol',
      category: 'أدوية وعلاج',
      subCategory: 'مسكنات',
      price: 52.0,
      stock: 50,
      isHotDeal: true,
      isPrescriptionRequired: false,
      rating: 4.8,
      reviewCount: 120,
      tags: ['مسكن', 'صداع'],
    },
    {
      id: 'prod_2',
      nameAr: 'أوجمنتين 1 جم مضاد حيوي',
      nameEn: 'Augmentin 1g',
      activeIngredient: 'Amoxicillin',
      category: 'أدوية وعلاج',
      subCategory: 'مضادات حيوية',
      price: 135.0,
      stock: 20,
      isHotDeal: false,
      isPrescriptionRequired: true,
      rating: 4.5,
      reviewCount: 45,
      tags: ['مضاد حيوي'],
    },
    {
      id: 'prod_3',
      nameAr: 'سيرافي لوشن مرطب',
      nameEn: 'CeraVe Moisturizing Lotion',
      activeIngredient: 'Ceramides',
      category: 'العناية بالبشرة',
      subCategory: 'مرطبات',
      price: 320.0,
      stock: 15,
      isHotDeal: true,
      isPrescriptionRequired: false,
      rating: 4.9,
      reviewCount: 200,
      tags: ['ترطيب', 'عناية'],
    },
  ];

  beforeEach(async () => {
    dbService = {
      products: [...mockProducts.map((p) => ({ ...p }))],
      categories: [
        { id: 'cat_meds', name: 'أدوية وعلاج', productCount: 2 },
        { id: 'cat_skin', name: 'العناية بالبشرة', productCount: 1 },
      ],
      persist: jest.fn(),
      persistNow: jest.fn(),
      prisma: {
        product: {
          delete: jest.fn().mockResolvedValue({}),
          deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: DbService, useValue: dbService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll() Catalog Filtering & Search', () => {
    it('should return all products when no filter is specified', async () => {
      const res: any = await service.findAll();
      expect(res.length).toBe(3);
    });

    it('should filter products by category', async () => {
      const res: any = await service.findAll({ category: 'العناية بالبشرة' });
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('prod_3');
    });

    it('should filter products by prescription requirement', async () => {
      const res: any = await service.findAll({ isPrescriptionRequired: true });
      expect(res.length).toBe(1);
      expect(res[0].nameEn).toBe('Augmentin 1g');
    });

    it('should search products by Arabic keyword or active ingredient', async () => {
      const resAr: any = await service.findAll({ search: 'بانادول' });
      expect(resAr.length).toBe(1);
      expect(resAr[0].id).toBe('prod_1');

      const resIng: any = await service.findAll({ search: 'amoxicillin' });
      expect(resIng.length).toBe(1);
      expect(resIng[0].id).toBe('prod_2');
    });

    it('should sort products by price ascending', async () => {
      const res: any = await service.findAll({ sortBy: 'price_asc' });
      expect(res[0].price).toBe(52.0);
      expect(res[2].price).toBe(320.0);
    });

    it('should sort products by price descending', async () => {
      const res: any = await service.findAll({ sortBy: 'price_desc' });
      expect(res[0].price).toBe(320.0);
      expect(res[2].price).toBe(52.0);
    });

    it('should support pagination metadata when paginated=true is requested', async () => {
      const res: any = await service.findAll({ page: 1, limit: 2, paginated: true });
      expect(res.data.length).toBe(2);
      expect(res.meta.total).toBe(3);
      expect(res.meta.totalPages).toBe(2);
      expect(res.meta.hasNext).toBe(true);
    });
  });

  describe('findOne()', () => {
    it('should return product by id along with generic alternatives', async () => {
      const product = await service.findOne('prod_1');
      expect(product).toBeDefined();
      expect(product.id).toBe('prod_1');
      expect(product.nameAr).toBe('بانادول إكسترا 500 مجم');
      expect(Array.isArray(product.alternativeProducts)).toBe(true);
    });

    it('should throw NotFoundException if product is missing', async () => {
      await expect(service.findOne('non_existent_prod')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('should remove product from catalog and update categories count', async () => {
      const result = await service.remove('prod_1');
      expect(result.product.id).toBe('prod_1');
      expect(dbService.products.length).toBe(2);
    });

    it('should throw NotFoundException when attempting to remove non-existent product', async () => {
      await expect(service.remove('prod_non_existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create() & update()', () => {
    it('should create product, compute discount, and persist', async () => {
      const dto: any = {
        nameAr: 'كونجستال',
        nameEn: 'Congestal',
        price: 30,
        originalPrice: 40,
        category: 'أدوية البرد',
        stock: 25,
      };

      const result = await service.create(dto);
      expect(result.product).toBeDefined();
      expect(result.product.nameEn).toBe('Congestal');
      expect(result.product.discountPercentage).toBe(25); // (40 - 30) / 40 = 25%
      expect(dbService.persist).toHaveBeenCalled();
    });

    it('should update product fields and recalculate discount', async () => {
      const result = await service.update('prod_1', { price: 40, originalPrice: 50 });
      expect(result.product.price).toBe(40);
      expect(result.product.discountPercentage).toBe(20); // (50 - 40) / 50 = 20%
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      await expect(service.update('prod_missing', { price: 100 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCatalogStats() & getCategoriesTree()', () => {
    it('should compute inventory counts, low stock, and out of stock', async () => {
      const stats = await service.getCatalogStats();
      expect(stats.totalProducts).toBe(3);
      expect(stats.categoriesCount).toBeDefined();
      expect(typeof stats.lowStockCount).toBe('number');
      expect(typeof stats.outOfStockCount).toBe('number');
    });

    it('should return hierarchical categories tree', async () => {
      const tree = await service.getCategoriesTree();
      expect(Array.isArray(tree)).toBe(true);
      expect(tree.length).toBeGreaterThan(0);
    });
  });
});
