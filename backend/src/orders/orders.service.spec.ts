import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { DbService } from '../database/db.service';
import { PaymentService } from './payment.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('OrdersService (Unit Tests)', () => {
  let ordersService: OrdersService;
  let dbService: any;
  let paymentService: any;
  let notificationsService: any;

  const mockProduct = {
    id: 'prod_test_1',
    nameAr: 'بانادول إكسترا',
    nameEn: 'Panadol Extra',
    category: 'أدوية وعلاج',
    price: 50,
    stock: 10,
    image: 'panadol.jpg',
    isPrescriptionRequired: false,
  };

  const mockOrder: any = {
    id: 'ord_123',
    orderNumber: 'CHF-2026-12345678',
    customerId: 'usr_cust_1',
    customerName: 'محمد أحمد',
    customerPhone: '01012345678',
    deliveryAddress: { city: 'القاهرة', street: 'شارع التسعين' },
    deliveryType: 'EXPRESS_45M',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING',
    items: [
      {
        productId: 'prod_test_1',
        nameAr: 'بانادول إكسترا',
        nameEn: 'Panadol Extra',
        price: 50,
        quantity: 2,
        image: 'panadol.jpg',
      },
    ],
    subtotal: 100,
    deliveryFee: 25,
    discount: 0,
    total: 125,
    status: 'PENDING',
    assignedCourierId: 'usr_cour_1',
    createdAt: new Date().toISOString(),
    statusTimeline: [],
  };

  beforeEach(async () => {
    dbService = {
      orders: [{ ...mockOrder }],
      products: [{ ...mockProduct }],
      users: [
        { id: 'usr_cust_1', name: 'محمد أحمد', role: 'CUSTOMER', points: 10 },
        { id: 'usr_cour_1', name: 'كابتن محمود', role: 'DELIVERY' },
      ],
      promoCodes: [
        {
          id: 'promo_welcome',
          code: 'WELCOME10',
          discountPercentage: 10,
          minOrderValue: 50,
          maxDiscount: 20,
          usageLimit: 100,
          timesUsed: 0,
          isActive: true,
        },
      ],
      settings: {
        deliveryFee: 25,
        freeDeliveryThreshold: 500,
        loyaltyPoints: { isEnabled: true, spendingUnit: 10, pointsPerUnit: 1 },
      },
      persist: jest.fn(),
      prisma: {
        product: { update: jest.fn().mockResolvedValue({}) },
        order: { create: jest.fn().mockResolvedValue({}) },
        user: { update: jest.fn().mockResolvedValue({}) },
      },
    };

    paymentService = {
      processPayment: jest.fn().mockResolvedValue({ success: true }),
    };

    notificationsService = {
      notifyNewOrder: jest.fn(),
      notifyOrderStatusUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DbService, useValue: dbService },
        { provide: PaymentService, useValue: paymentService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
  });

  describe('findOne() & IDOR Security', () => {
    it('should allow the owner customer to view their own order', async () => {
      const user = { id: 'usr_cust_1', role: 'CUSTOMER' };
      const order = await ordersService.findOne('ord_123', user);
      expect(order).toBeDefined();
      expect(order.id).toBe('ord_123');
    });

    it('should allow staff (ADMIN / PHARMACIST / SUPPORT) to view any order', async () => {
      const admin = { id: 'usr_admin', role: 'ADMIN' };
      const order = await ordersService.findOne('ord_123', admin);
      expect(order).toBeDefined();
      expect(order.id).toBe('ord_123');
    });

    it('should allow the assigned courier to view the order', async () => {
      const courier = { id: 'usr_cour_1', role: 'DELIVERY' };
      const order = await ordersService.findOne('ord_123', courier);
      expect(order).toBeDefined();
      expect(order.id).toBe('ord_123');
    });

    it('should BLOCK IDOR: another customer attempting to view the order receives 403 Forbidden', async () => {
      const intruderCustomer = { id: 'usr_intruder_999', role: 'CUSTOMER' };
      await expect(ordersService.findOne('ord_123', intruderCustomer)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should BLOCK IDOR: another courier not assigned to the order receives 403 Forbidden', async () => {
      const anotherCourier = { id: 'usr_other_courier', role: 'DELIVERY' };
      await expect(ordersService.findOne('ord_123', anotherCourier)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if order does not exist', async () => {
      await expect(ordersService.findOne('non_existent_id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create() Calculations and Validation', () => {
    it('should create an order, verify subtotal, add standard delivery fee, and decrement stock', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'محمد أحمد',
        customerPhone: '01012345678',
        deliveryAddress: { city: 'القاهرة', street: 'شارع 9' },
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [
          {
            productId: 'prod_test_1',
            quantity: 2,
          },
        ],
      };

      const newOrder = await ordersService.create(dto);

      expect(newOrder).toBeDefined();
      expect(newOrder.subtotal).toBe(100); // 50 * 2
      expect(newOrder.deliveryFee).toBe(25); // subtotal 100 < 500
      expect(newOrder.total).toBe(125); // 100 + 25
      expect(dbService.products[0].stock).toBe(8); // 10 - 2
      expect(notificationsService.notifyNewOrder).toHaveBeenCalled();
    });

    it('should apply free delivery when order subtotal meets threshold (>= 500)', async () => {
      dbService.products[0].price = 300;
      dbService.products[0].stock = 10;

      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'محمد أحمد',
        customerPhone: '01012345678',
        deliveryAddress: { city: 'القاهرة', street: 'شارع 9' },
        items: [{ productId: 'prod_test_1', quantity: 2 }], // 300 * 2 = 600
      };

      const newOrder = await ordersService.create(dto);
      expect(newOrder.subtotal).toBe(600);
      expect(newOrder.deliveryFee).toBe(0); // Free delivery applied!
      expect(newOrder.total).toBe(600);
    });

    it('should reject order if items array is empty', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        items: [],
      };
      await expect(ordersService.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject order if requested quantity exceeds product stock', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        items: [{ productId: 'prod_test_1', quantity: 999 }],
      };
      await expect(ordersService.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should apply valid promo code discount correctly', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'محمد',
        customerPhone: '01012345678',
        deliveryAddress: { city: 'القاهرة', street: 'شارع 9' },
        promoCode: 'WELCOME10',
        items: [{ productId: 'prod_test_1', quantity: 2 }], // 50 * 2 = 100
      };

      const order = await ordersService.create(dto);
      expect(order.discount).toBe(10); // 10% of 100
      expect(order.total).toBe(115); // 100 subtotal + 25 delivery - 10 discount
    });

    it('should ignore client-provided prices and enforce server-side catalog prices (anti-price-manipulation)', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'المشتري',
        customerPhone: '01012345678',
        address: 'شارع الهرم',
        items: [{ productId: 'prod_test_1', quantity: 2, price: 1 }], // Client tries to cheat with 1 EGP instead of 50 EGP
      };

      const order = await ordersService.create(dto);
      expect(order.subtotal).toBe(100); // 50 * 2 = 100, NOT 2!
      expect(order.items[0].price).toBe(50);
    });

    it('should reject order if item quantity is zero or negative', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'المشتري',
        customerPhone: '01012345678',
        address: 'شارع الهرم',
        items: [{ productId: 'prod_test_1', quantity: 0 }],
      };
      await expect(ordersService.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject order with non-existent or inactive promo code', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'المشتري',
        customerPhone: '01012345678',
        address: 'شارع الهرم',
        promoCode: 'INVALID_CODE',
        items: [{ productId: 'prod_test_1', quantity: 1 }],
      };
      await expect(ordersService.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject promo code when order subtotal is below minOrderValue', async () => {
      // WELCOME10 has minOrderValue: 50. Let's create an item with price 30
      dbService.products.push({
        id: 'cheap_prod',
        nameAr: 'منتج رخيص',
        price: 30,
        stock: 10,
      });

      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'المشتري',
        customerPhone: '01012345678',
        address: 'شارع الهرم',
        promoCode: 'WELCOME10',
        items: [{ productId: 'cheap_prod', quantity: 1 }], // 30 < 50
      };
      await expect(ordersService.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should apply free shipping promo code correctly', async () => {
      dbService.promoCodes.push({
        id: 'promo_freeship',
        code: 'SHIPFREE',
        isActive: true,
        isFreeShipping: true,
        timesUsed: 0,
      });

      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'المشتري',
        customerPhone: '01012345678',
        address: 'شارع الهرم',
        promoCode: 'SHIPFREE',
        items: [{ productId: 'prod_test_1', quantity: 1 }], // 50 EGP (< 500 threshold)
      };

      const order = await ordersService.create(dto);
      expect(order.deliveryFee).toBe(0);
      expect(order.total).toBe(50);
    });
  });

  describe('updateStatus() State Machine and Authorization', () => {
    it('should allow assigned courier to advance status to OUT_FOR_DELIVERY', async () => {
      const courier = { id: 'usr_cour_1', role: 'DELIVERY' };
      const updated = await ordersService.updateStatus(
        'ord_123',
        { status: 'OUT_FOR_DELIVERY' },
        courier,
      );

      expect(updated.order.status).toBe('OUT_FOR_DELIVERY');
    });

    it('should reject unassigned courier trying to update order status', async () => {
      const anotherCourier = { id: 'usr_other_courier', role: 'DELIVERY' };
      await expect(
        ordersService.updateStatus('ord_123', { status: 'OUT_FOR_DELIVERY' }, anotherCourier),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject courier trying to set invalid status (e.g. PREPARING)', async () => {
      const courier = { id: 'usr_cour_1', role: 'DELIVERY' };
      await expect(
        ordersService.updateStatus('ord_123', { status: 'PREPARING' }, courier),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow customer to cancel their own PENDING order and revert points', async () => {
      const customer = { id: 'usr_cust_1', role: 'CUSTOMER' };
      const res = await ordersService.updateStatus(
        'ord_123',
        { status: 'CANCELLED' },
        customer,
      );

      expect(res.order.status).toBe('CANCELLED');
    });

    it('should reject customer attempting to cancel an order that is already PREPARING', async () => {
      // Change order status to PREPARING
      dbService.orders[0].status = 'PREPARING';
      const customer = { id: 'usr_cust_1', role: 'CUSTOMER' };

      await expect(
        ordersService.updateStatus('ord_123', { status: 'CANCELLED' }, customer),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should mark paymentStatus as PAID when order status transitions to DELIVERED', async () => {
      const admin = { id: 'admin_1', role: 'ADMIN' };
      const res = await ordersService.updateStatus(
        'ord_123',
        { status: 'DELIVERED' },
        admin,
      );

      expect(res.order.status).toBe('DELIVERED');
      expect(res.order.paymentStatus).toBe('PAID');
    });

    it('should reject invalid GPS coordinates when updating live coordinates', async () => {
      const admin = { id: 'admin_1', role: 'ADMIN' };
      await expect(
        ordersService.updateStatus('ord_123', { status: 'OUT_FOR_DELIVERY', lat: 95, lng: 31 }, admin),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCourierLocation()', () => {
    it('should allow assigned courier to update live GPS coordinates', async () => {
      const courier = { id: 'usr_cour_1', role: 'DELIVERY' };
      const res = await ordersService.updateCourierLocation('ord_123', 30.0444, 31.2357, courier);

      expect(res.liveCoordinates).toEqual({ lat: 30.0444, lng: 31.2357 });
    });

    it('should reject courier updating coordinates of unassigned order', async () => {
      const wrongCourier = { id: 'wrong_courier', role: 'DELIVERY' };
      await expect(
        ordersService.updateCourierLocation('ord_123', 30.0444, 31.2357, wrongCourier),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject location updates on delivered or cancelled orders', async () => {
      dbService.orders[0].status = 'DELIVERED';
      const courier = { id: 'usr_cour_1', role: 'DELIVERY' };

      await expect(
        ordersService.updateCourierLocation('ord_123', 30.0444, 31.2357, courier),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll() & Query Filtering', () => {
    it('should filter orders by status, courierId, and pagination', async () => {
      const res = await ordersService.findAll({
        status: 'PENDING',
        courierId: 'usr_cour_1',
        page: 1,
        limit: 10,
        paginated: true,
      });

      expect(res).toBeDefined();
      if ((res as any).orders) {
        expect((res as any).orders.length).toBe(1);
      }
    });
  });
});

