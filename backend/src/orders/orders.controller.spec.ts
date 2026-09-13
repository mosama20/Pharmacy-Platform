import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('OrdersController (API Integration Tests via Supertest)', () => {
  let app: INestApplication;
  let ordersService: any;
  let trackingService: any;

  beforeEach(async () => {
    ordersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCustomer: jest.fn(),
      findByCourier: jest.fn(),
      getCourierStats: jest.fn(),
      getDashboardStats: jest.fn(),
      updateStatus: jest.fn(),
      updateCourierLocation: jest.fn(),
    };

    trackingService = {
      getLiveTracking: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
        { provide: TrackingService, useValue: trackingService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'usr_cust_1', role: 'CUSTOMER', name: 'أحمد' };
          return true;
        },
      })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'usr_cust_1', role: 'CUSTOMER', name: 'أحمد' };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /orders', () => {
    it('should create an order and return 201 Created', async () => {
      const mockOrder = {
        id: 'ord_new_1',
        orderNumber: 'CHF-2026-9999',
        total: 150,
        status: 'PENDING',
      };
      ordersService.create.mockResolvedValue(mockOrder);

      const res = await request(app.getHttpServer())
        .post('/orders')
        .send({
          customerName: 'أحمد',
          customerPhone: '01012345678',
          items: [{ productId: 'prod_1', quantity: 2, price: 50 }],
        })
        .expect(201);

      expect(res.body.id).toBe('ord_new_1');
      expect(ordersService.create).toHaveBeenCalled();
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order details for authorized user', async () => {
      const mockOrder = {
        id: 'ord_123',
        orderNumber: 'CHF-2026-1234',
        customerId: 'usr_cust_1',
        total: 100,
      };
      ordersService.findOne.mockResolvedValue(mockOrder);

      const res = await request(app.getHttpServer())
        .get('/orders/ord_123')
        .expect(200);

      expect(res.body.id).toBe('ord_123');
      expect(ordersService.findOne).toHaveBeenCalledWith('ord_123', expect.any(Object));
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status and return 200 OK', async () => {
      ordersService.updateStatus.mockResolvedValue({
        message: 'تم تحديث حالة الطلب بنجاح',
        order: { id: 'ord_123', status: 'CANCELLED' },
      });

      const res = await request(app.getHttpServer())
        .patch('/orders/ord_123/status')
        .send({ status: 'CANCELLED' })
        .expect(200);

      expect(res.body.order.status).toBe('CANCELLED');
    });
  });
});
