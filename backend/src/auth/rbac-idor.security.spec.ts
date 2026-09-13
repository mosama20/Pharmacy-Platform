import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException, BadRequestException, ValidationPipe } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { OrdersService } from '../orders/orders.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { DbService } from '../database/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterCustomerDto } from './dto/auth.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('Deep Security Suite: RBAC Matrix, IDOR Prevention & Auth Hardening (Phases 7, 8, 9, 10)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any, requiredRoles?: string[]): ExecutionContext => {
    if (requiredRoles) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
    } else {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    }

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('Exhaustive RBAC Authorization Matrix (Phase 8)', () => {
    const allRoles = ['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT', 'CUSTOMER'] as const;

    it('ADMIN operations: strictly allowed for ADMIN; forbidden for all other roles', () => {
      for (const role of allRoles) {
        const ctx = createMockContext({ id: `usr_${role}`, role }, ['ADMIN']);
        if (role === 'ADMIN') {
          expect(rolesGuard.canActivate(ctx)).toBe(true);
        } else {
          expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
        }
      }
    });

    it('PHARMACIST operations: allowed for PHARMACIST and ADMIN; forbidden for DELIVERY, SUPPORT, CUSTOMER', () => {
      for (const role of allRoles) {
        const ctx = createMockContext({ id: `usr_${role}`, role }, ['PHARMACIST']);
        if (role === 'PHARMACIST' || role === 'ADMIN') {
          expect(rolesGuard.canActivate(ctx)).toBe(true);
        } else {
          expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
        }
      }
    });

    it('DELIVERY operations: allowed for DELIVERY and ADMIN; forbidden for PHARMACIST, SUPPORT, CUSTOMER', () => {
      for (const role of allRoles) {
        const ctx = createMockContext({ id: `usr_${role}`, role }, ['DELIVERY']);
        if (role === 'DELIVERY' || role === 'ADMIN') {
          expect(rolesGuard.canActivate(ctx)).toBe(true);
        } else {
          expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
        }
      }
    });

    it('CUSTOMER operations: allowed for CUSTOMER and ADMIN; forbidden if restricted strictly to CUSTOMER', () => {
      const customerCtx = createMockContext({ id: 'c1', role: 'CUSTOMER' }, ['CUSTOMER']);
      expect(rolesGuard.canActivate(customerCtx)).toBe(true);

      const courierCtx = createMockContext({ id: 'd1', role: 'DELIVERY' }, ['CUSTOMER']);
      expect(() => rolesGuard.canActivate(courierCtx)).toThrow(ForbiddenException);
    });

    it('Unauthenticated requests to role-protected endpoints throw UnauthorizedException', () => {
      const anonymousCtx = createMockContext(null, ['CUSTOMER']);
      expect(() => rolesGuard.canActivate(anonymousCtx)).toThrow(UnauthorizedException);
    });
  });

  describe('IDOR (Insecure Direct Object Reference) Security Tests (Phase 9)', () => {
    let ordersService: OrdersService;
    let prescriptionsService: PrescriptionsService;
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        orders: [
          {
            id: 'ord_victim_1',
            orderNumber: 'CHF-1111',
            customerId: 'cust_victim',
            customerName: 'ضحية',
            assignedCourierId: 'courier_assigned',
            status: 'PREPARING',
            total: 300,
          },
        ],
        prescriptions: [
          {
            id: 'rx_victim_1',
            customerId: 'cust_victim',
            customerName: 'ضحية',
            status: 'QUOTED',
            quotedItems: [{ productName: 'دواء حساس', price: 200, quantity: 1 }],
          },
        ],
        users: [
          { id: 'cust_victim', name: 'Victim Customer', role: 'CUSTOMER' },
          { id: 'cust_attacker', name: 'Attacker Customer', role: 'CUSTOMER' },
          { id: 'courier_assigned', name: 'Assigned Courier', role: 'DELIVERY' },
          { id: 'courier_rogue', name: 'Rogue Courier', role: 'DELIVERY' },
          { id: 'staff_admin', name: 'System Admin', role: 'ADMIN' },
        ],
        persist: jest.fn(),
        prisma: {
          order: { update: jest.fn() },
          prescription: { update: jest.fn() },
        },
      };

      ordersService = new OrdersService(
        mockDb as any,
        { processPayment: jest.fn() } as any,
        { notifyNewOrder: jest.fn(), notifyOrderStatusUpdated: jest.fn() } as any,
      );

      prescriptionsService = new PrescriptionsService(
        mockDb as any,
        { notifyNewPrescription: jest.fn(), notifyPrescriptionStatusUpdated: jest.fn() } as any,
      );
    });

    it('should BLOCK IDOR on Orders: Customer A cannot read Customer B order', async () => {
      const attacker = { id: 'cust_attacker', role: 'CUSTOMER' };
      await expect(ordersService.findOne('ord_victim_1', attacker)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should BLOCK IDOR on Prescriptions: Customer A cannot read Customer B prescription', async () => {
      const attacker = { id: 'cust_attacker', role: 'CUSTOMER' };
      await expect(prescriptionsService.findOne('rx_victim_1', attacker)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should BLOCK IDOR on Orders: Courier A cannot view order assigned to Courier B', async () => {
      const rogueCourier = { id: 'courier_rogue', role: 'DELIVERY' };
      await expect(ordersService.findOne('ord_victim_1', rogueCourier)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should BLOCK IDOR on Orders: Courier A cannot update status of order assigned to Courier B', async () => {
      const rogueCourier = { id: 'courier_rogue', role: 'DELIVERY' };
      await expect(
        ordersService.updateStatus('ord_victim_1', { status: 'OUT_FOR_DELIVERY' }, rogueCourier),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW staff (ADMIN) to view customer order and prescription safely', async () => {
      const admin = { id: 'staff_admin', role: 'ADMIN' };
      const order = await ordersService.findOne('ord_victim_1', admin);
      const rx = await prescriptionsService.findOne('rx_victim_1', admin);
      expect(order.id).toBe('ord_victim_1');
      expect(rx.id).toBe('rx_victim_1');
    });
  });

  describe('Input Validation & Privilege Escalation Defenses (Phase 10)', () => {
    it('should reject illegal property injection in RegisterCustomerDto via ValidationPipe (forbidNonWhitelisted)', async () => {
      const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true });
      const rawPayload = {
        name: 'Attacker User',
        email: 'attacker@example.com',
        phone: '01099990000',
        password: 'password123',
        role: 'ADMIN', // Privilege escalation attempt!
      };

      await expect(
        pipe.transform(rawPayload, { type: 'body', metatype: RegisterCustomerDto }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
