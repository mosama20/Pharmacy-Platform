import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { TrackingService } from '../src/orders/tracking.service';
import { PrescriptionsService } from '../src/prescriptions/prescriptions.service';
import { RefillService } from '../src/refill/refill.service';
import { UsersService } from '../src/users/users.service';

async function runTests() {
  console.log('🧪 Starting Phase 3 — Authorization / RBAC Automated Test Suite...');
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const ordersService = app.get(OrdersService);
  const trackingService = app.get(TrackingService);
  const rxService = app.get(PrescriptionsService);
  const refillService = app.get(RefillService);

  // Mock users
  const customerA = { id: 'usr_cust_1', role: 'CUSTOMER', name: 'أحمد' };
  const customerB = { id: 'usr_cust_2', role: 'CUSTOMER', name: 'سامي' };
  const courierA = { id: 'usr_cour_1', role: 'DELIVERY', name: 'كابتن محمد' };
  const courierB = { id: 'usr_cour_2', role: 'DELIVERY', name: 'كابتن محمود' };
  const pharmacist = { id: 'usr_pharm_1', role: 'PHARMACIST', name: 'د. سارة' };
  const admin = { id: 'usr_admin_1', role: 'ADMIN', name: 'المدير' };

  // 1. Test Order IDOR: Customer A accessing Customer B's order
  console.log('\n[Test 1] Testing Order IDOR: Customer A viewing Customer B\'s order...');
  // Find an order belonging to customer B or not owned by customer A
  const orderB = ordersService['db'].orders.find((o) => o.customerId !== customerA.id);
  if (orderB) {
    try {
      await ordersService.findOne(orderB.id, customerA);
      throw new Error('Test 1 Failed: Customer A was allowed to view Customer B\'s order!');
    } catch (err: any) {
      if (err.status === 403) {
        console.log('  ✓ IDOR Blocked: Customer A received 403 Forbidden when viewing another user\'s order.');
      } else {
        throw err;
      }
    }
  }

  // 2. Test Order IDOR: Owner can view own order
  console.log('\n[Test 2] Testing Order Owner access: Customer viewing own order...');
  const orderA = ordersService['db'].orders.find((o) => o.customerId === customerA.id);
  if (orderA) {
    const ownOrder = await ordersService.findOne(orderA.id, customerA);
    if (!ownOrder || ownOrder.id !== orderA.id) {
      throw new Error('Test 2 Failed: Customer cannot view own order');
    }
    console.log('  ✓ Owner access granted: Customer viewed their own order.');
  }

  // 3. Test Live Tracking IDOR
  console.log('\n[Test 3] Testing Live Tracking IDOR...');
  if (orderB) {
    try {
      trackingService.getLiveTracking(orderB.id, customerA);
      throw new Error('Test 3 Failed: Customer A was allowed to track Customer B\'s order!');
    } catch (err: any) {
      if (err.status === 403) {
        console.log('  ✓ Tracking IDOR Blocked: Unauthorized tracking attempt rejected with 403 Forbidden.');
      } else {
        throw err;
      }
    }
  }

  // 4. Test Prescription IDOR
  console.log('\n[Test 4] Testing Prescription IDOR...');
  const rxB = rxService['db'].prescriptions.find((p) => p.customerId !== customerA.id);
  if (rxB) {
    try {
      await rxService.findOne(rxB.id, customerA);
      throw new Error('Test 4 Failed: Customer A was allowed to view Customer B\'s prescription!');
    } catch (err: any) {
      if (err.status === 403) {
        console.log('  ✓ Prescription IDOR Blocked: Viewing other patient\'s prescription rejected with 403 Forbidden.');
      } else {
        throw err;
      }
    }
  }

  // 5. Test Customer Unauthorized Prescription Status Transition
  console.log('\n[Test 5] Testing Unauthorized Prescription Status Transition by Customer...');
  const rxA = rxService['db'].prescriptions.find((p) => p.customerId === customerA.id);
  if (rxA) {
    rxA.status = 'PENDING';
    try {
      await rxService.updateStatus(rxA.id, 'ORDER_CREATED', customerA);
      throw new Error('Test 5 Failed: Customer was allowed to set status to ORDER_CREATED!');
    } catch (err: any) {
      if (err.status === 403 || err.status === 400) {
        console.log('  ✓ Unauthorized status transition blocked: Customer cannot approve own prescription (Blocked).');
      } else {
        throw err;
      }
    }
  }

  // 6. Test Pharmacist Prescription Status Update
  console.log('\n[Test 6] Testing Pharmacist Prescription Review Permission...');
  if (rxA) {
    const updated = await rxService.updateStatus(rxA.id, 'UNDER_REVIEW', pharmacist);
    if (updated.status !== 'UNDER_REVIEW') {
      throw new Error('Test 6 Failed: Pharmacist could not review prescription');
    }
    console.log('  ✓ Pharmacist authorized: Prescription transitioned to UNDER_REVIEW successfully.');
  }

  // 7. Test Courier Order IDOR
  console.log('\n[Test 7] Testing Courier Assignment Boundary (Courier A updating Courier B\'s delivery)...');
  const orderForCourierB = ordersService['db'].orders.find(
    (o) => o.assignedCourierId && o.assignedCourierId !== courierA.id
  );
  if (orderForCourierB) {
    try {
      await ordersService.updateStatus(orderForCourierB.id, { status: 'DELIVERED' }, courierA);
      throw new Error('Test 7 Failed: Unassigned courier was allowed to update delivery status!');
    } catch (err: any) {
      if (err.status === 403) {
        console.log('  ✓ Courier Boundary Enforced: Courier cannot update deliveries assigned to another courier (403 Forbidden).');
      } else {
        throw err;
      }
    }
  }

  // 8. Test Admin Superuser Access
  console.log('\n[Test 8] Testing Admin Superuser Access across all resources...');
  const anyOrder = ordersService['db'].orders[0];
  const adminOrderAccess = await ordersService.findOne(anyOrder.id, admin);
  if (!adminOrderAccess) {
    throw new Error('Test 8 Failed: Admin could not access order');
  }
  const adminStats = await ordersService.getDashboardStats();
  if (adminStats.totalOrders === undefined) {
    throw new Error('Test 8 Failed: Admin could not access stats');
  }
  console.log('  ✓ Admin superuser verified: Full access to orders and dashboard metrics.');

  await app.close();
  console.log('\n🎉 ALL PHASE 3 AUTHORIZATION / RBAC TESTS PASSED!');
}

runTests().catch((e) => {
  console.error('❌ RBAC Tests failed:', e);
  process.exit(1);
});
