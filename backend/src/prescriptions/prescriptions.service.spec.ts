import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { DbService } from '../database/db.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PrescriptionsService (Unit Tests)', () => {
  let service: PrescriptionsService;
  let dbService: any;
  let notificationsService: any;

  const mockRx: any = {
    id: 'rx_test_100',
    customerId: 'usr_cust_1',
    customerName: 'فاطمة أحمد',
    customerPhone: '01122334455',
    images: ['https://images.unsplash.com/photo-prescription.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-prescription.jpg',
    status: 'PENDING',
    allowAlternatives: true,
    hasInsurance: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    dbService = {
      prescriptions: [{ ...mockRx }],
      products: [
        { id: 'prod_1', nameAr: 'أوجمنتين', stock: 15 },
      ],
      users: [{ id: 'usr_cust_1', name: 'فاطمة أحمد' }],
      persist: jest.fn(),
      prisma: {
        prescription: {
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({}),
        },
        product: {
          update: jest.fn().mockResolvedValue({}),
        },
      },
    };

    notificationsService = {
      notifyNewPrescription: jest.fn(),
      notifyPrescriptionQuoted: jest.fn(),
      notifyPrescriptionStatusUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: DbService, useValue: dbService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  describe('findOne() & IDOR Security', () => {
    it('should allow owner customer to view their prescription', async () => {
      const owner = { id: 'usr_cust_1', role: 'CUSTOMER' };
      const rx = await service.findOne('rx_test_100', owner);
      expect(rx.id).toBe('rx_test_100');
    });

    it('should allow staff (ADMIN / PHARMACIST) to view any prescription', async () => {
      const pharm = { id: 'usr_pharm_1', role: 'PHARMACIST' };
      const rx = await service.findOne('rx_test_100', pharm);
      expect(rx.id).toBe('rx_test_100');
    });

    it('should BLOCK IDOR: non-owner customer receives 403 Forbidden', async () => {
      const stranger = { id: 'usr_stranger', role: 'CUSTOMER' };
      await expect(service.findOne('rx_test_100', stranger)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if prescription does not exist', async () => {
      await expect(service.findOne('rx_non_existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('quotePrescription() Workflow', () => {
    it('should allow pharmacist to quote a pending prescription', async () => {
      const dto: any = {
        pharmacistNotes: 'الجرعة قرص كل 12 ساعة',
        quotedItems: [
          { productId: 'prod_1', productName: 'أوجمنتين 1 جم', price: 90, quantity: 2 },
        ],
      };

      const result = await service.quotePrescription('rx_test_100', 'د. سارة', dto);

      expect(result.prescription.status).toBe('QUOTED');
      expect(result.prescription.totalQuote).toBe(180); // 90 * 2
      expect(result.prescription.reviewedBy).toBe('د. سارة');
      expect(dbService.persist).toHaveBeenCalled();
    });

    it('should reject quote if prescription is already QUOTED or COMPLETED', async () => {
      dbService.prescriptions[0].status = 'ORDER_CREATED';

      const dto: any = {
        quotedItems: [{ productName: 'دواء', price: 50, quantity: 1 }],
      };

      await expect(service.quotePrescription('rx_test_100', 'د. سارة', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject quote if quotedItems array is empty', async () => {
      const dto: any = { quotedItems: [] };
      await expect(service.quotePrescription('rx_test_100', 'د. سارة', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus() State Machine & Customer Permissions', () => {
    it('should allow customer to ACCEPT a QUOTED prescription', async () => {
      dbService.prescriptions[0].status = 'QUOTED';
      const customer = { id: 'usr_cust_1', role: 'CUSTOMER' };

      const res = await service.updateStatus('rx_test_100', 'ACCEPTED', customer);
      expect(res.status).toBe('ACCEPTED');
    });

    it('should reject customer attempting to ACCEPT a PENDING prescription that has not been quoted', async () => {
      dbService.prescriptions[0].status = 'PENDING';
      const customer = { id: 'usr_cust_1', role: 'CUSTOMER' };

      await expect(service.updateStatus('rx_test_100', 'ACCEPTED', customer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should deduct stock when pharmacist transitions prescription to ORDER_CREATED', async () => {
      dbService.prescriptions[0].status = 'ACCEPTED';
      dbService.prescriptions[0].quotedItems = [
        { productId: 'prod_1', productName: 'أوجمنتين', quantity: 3, price: 90 },
      ];
      const admin = { id: 'usr_admin', role: 'ADMIN' };

      await service.updateStatus('rx_test_100', 'ORDER_CREATED', admin);

      // Stock was 15, deducted 3 -> 12
      expect(dbService.products[0].stock).toBe(12);
    });

    it('should allow customer to REJECT or CANCEL a QUOTED prescription with a reason', async () => {
      dbService.prescriptions[0].status = 'QUOTED';
      const customer = { id: 'usr_cust_1', role: 'CUSTOMER' };

      const res = await service.updateStatus('rx_test_100', 'CANCELLED', customer, 'السعر مرتفع');
      expect(res.status).toBe('CANCELLED');
      expect(res.cancellationReason).toBe('السعر مرتفع');
    });

    it('should reject non-staff attempting unauthorized transitions', async () => {
      dbService.prescriptions[0].status = 'PENDING';
      const courier = { id: 'usr_courier', role: 'DELIVERY' };

      await expect(service.updateStatus('rx_test_100', 'ORDER_CREATED', courier)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadPrescription() Workflow', () => {
    it('should successfully create a pending prescription with valid image URL', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'فاطمة أحمد',
        customerPhone: '01122334455',
        imageUrl: 'https://images.unsplash.com/sample-rx.png',
        patientNotes: 'يرجى مراجعة الجرعة',
        allowAlternatives: true,
      };

      const result = await service.uploadPrescription(dto);
      expect(result.prescription).toBeDefined();
      expect(result.prescription.id).toBeDefined();
      expect(result.prescription.status).toBe('PENDING');
      expect(result.prescription.images).toContain('https://images.unsplash.com/sample-rx.png');
      expect(notificationsService.notifyNewPrescription).toHaveBeenCalled();
    });

    it('should reject prescription without any images or requested items', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'فاطمة',
        customerPhone: '01122334455',
        images: [],
      };

      await expect(service.uploadPrescription(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject prescription exceeding maximum allowable images (5 images)', async () => {
      const dto: any = {
        customerId: 'usr_cust_1',
        customerName: 'فاطمة',
        customerPhone: '01122334455',
        images: [
          'https://images.unsplash.com/1.jpg',
          'https://images.unsplash.com/2.jpg',
          'https://images.unsplash.com/3.jpg',
          'https://images.unsplash.com/4.jpg',
          'https://images.unsplash.com/5.jpg',
          'https://images.unsplash.com/6.jpg', // 6 images!
        ],
      };

      await expect(service.uploadPrescription(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll() & findByCustomer()', () => {
    it('should filter prescriptions by status', async () => {
      const all = await service.findAll('PENDING');
      expect(all.length).toBe(1);
      expect(all[0].status).toBe('PENDING');
    });

    it('should return prescriptions for specific customer', async () => {
      const customerRxs = await service.findByCustomer('usr_cust_1');
      expect(customerRxs.length).toBe(1);
      expect(customerRxs[0].customerId).toBe('usr_cust_1');
    });
  });
});

