import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { DbService } from '../database/db.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingService } from './tracking.service';
import { PaymentService } from './payment.service';

describe('Orders & Inventory Concurrency / Race Condition Tests (Phase 4)', () => {
  let ordersService: OrdersService;
  let mockDbService: any;
  let mockNotificationsService: any;
  let mockTrackingService: any;
  let mockPaymentService: any;

  beforeEach(() => {
    mockDbService = {
      orders: [],
      products: [
        {
          id: 'scarce-prod-1',
          nameAr: 'دواء نادر',
          nameEn: 'Scarce Medicine',
          price: 150,
          stock: 1, // Only 1 item in stock!
          category: 'critical',
          isPrescriptionRequired: false,
          image: 'scarce.jpg',
        },
      ],
      promoCodes: [
        {
          code: 'ONCE10',
          type: 'PERCENTAGE',
          value: 10,
          isActive: true,
          usageLimit: 1, // Global limit: only 1 use allowed!
          timesUsed: 0,
        },
      ],
      promoUsages: [],
      settings: { deliveryFee: 25, freeDeliveryThreshold: 500 },
      couriers: [],
      users: [],
      persist: jest.fn(),
      saveData: jest.fn(),
      prisma: {
        product: { update: jest.fn().mockResolvedValue({}) },
        order: { create: jest.fn().mockResolvedValue({}) },
        promoCode: { update: jest.fn().mockResolvedValue({}) },
        promoUsage: { create: jest.fn().mockResolvedValue({}) },
      },
    };

    mockNotificationsService = {
      notifyNewOrder: jest.fn(),
      notifyOrderStatusUpdated: jest.fn(),
    };

    mockPaymentService = {
      processPayment: jest.fn().mockResolvedValue({ paymentStatus: 'PENDING' }),
    };

    ordersService = new OrdersService(
      mockDbService as DbService,
      mockPaymentService as PaymentService,
      mockNotificationsService as NotificationsService,
    );
  });

  it('should prevent double-allocation when two concurrent orders compete for stock = 1', async () => {
    const orderPayload1: any = {
      customerId: 'cust-concurrent-1',
      customerName: 'Customer A',
      customerPhone: '01011110001',
      address: 'Nasr City, Cairo',
      items: [{ productId: 'scarce-prod-1', quantity: 1, price: 150 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    };

    const orderPayload2: any = {
      customerId: 'cust-concurrent-2',
      customerName: 'Customer B',
      customerPhone: '01011110002',
      address: 'Heliopolis, Cairo',
      items: [{ productId: 'scarce-prod-1', quantity: 1, price: 150 }],
      paymentMethod: 'CASH_ON_DELIVERY',
    };

    // Fire both requests concurrently using Promise.allSettled
    const results = await Promise.allSettled([
      ordersService.create(orderPayload1),
      ordersService.create(orderPayload2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one order must succeed and one must be rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // The rejected request must be a BadRequestException citing out-of-stock
    const errorReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(errorReason).toBeInstanceOf(BadRequestException);
    expect(errorReason.message).toContain('غير متوفرة حالياً في المخزون');

    // Final inventory must never be negative!
    const product = mockDbService.products.find((p: any) => p.id === 'scarce-prod-1');
    expect(product.stock).toBe(0);

    // Only 1 order stored
    expect(mockDbService.orders.length).toBe(1);
  });

  it('should prevent exceeding global promo code usage limits under concurrent redemptions', async () => {
    // Add plenty of stock for regular product
    mockDbService.products.push({
      id: 'regular-prod',
      nameAr: 'منتج عادي',
      nameEn: 'Regular Product',
      price: 100,
      stock: 50,
    });

    const promoPayload1: any = {
      customerId: 'user-promo-1',
      customerName: 'User 1',
      customerPhone: '01011110011',
      address: 'Cairo',
      items: [{ productId: 'regular-prod', quantity: 1 }],
      promoCode: 'ONCE10',
    };

    const promoPayload2: any = {
      customerId: 'user-promo-2',
      customerName: 'User 2',
      customerPhone: '01011110012',
      address: 'Giza',
      items: [{ productId: 'regular-prod', quantity: 1 }],
      promoCode: 'ONCE10',
    };

    const results = await Promise.allSettled([
      ordersService.create(promoPayload1),
      ordersService.create(promoPayload2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // One order receives discount; second is rejected because limit of 1 was exhausted
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const promo = mockDbService.promoCodes.find((p: any) => p.code === 'ONCE10');
    expect(promo.timesUsed).toBe(1);
  });
});
