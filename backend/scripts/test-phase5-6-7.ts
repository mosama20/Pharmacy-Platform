import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { DbService } from '../src/database/db.service';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import * as http from 'http';

async function makeRequest(
  port: number,
  path: string,
  method: string,
  body?: any,
  token?: string,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: rawData });
          }
        });
      },
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Phases 5, 6 & 7 Automated Test Suite (DTOs, Order Logic, Payments)...\n');

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(5098);

  const authService = app.get(AuthService);
  const db = app.get(DbService);

  const customerTokens = await authService.login('customer@chefaa.com', 'ChefaaCustomer@2026');
  const customerToken = customerTokens.accessToken;
  const customerUser = customerTokens.user;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName} — ${detail || ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // --- PHASE 5: DTO Validation & Mass Assignment Prevention ---
  console.log('--- Phase 5: DTO Validation & Mass Assignment Prevention ---');

  // Test 1: Mass Assignment Attack in Order Creation (Unknown field injected)
  const massAssignmentOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [{ productId: 'prod_1', quantity: 1 }],
      injectedRole: 'SUPER_ADMIN', // Attack payload!
    },
    customerToken,
  );
  assert(
    massAssignmentOrder.status === 400,
    'Mass assignment attack in order creation rejected with 400 (forbidNonWhitelisted)',
    JSON.stringify(massAssignmentOrder.body),
  );

  // Test 2: Invalid quantity in Order Item (quantity < 1)
  const invalidQtyOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [{ productId: 'prod_1', quantity: 0 }], // min is 1
    },
    customerToken,
  );
  assert(invalidQtyOrder.status === 400, 'Order item quantity < 1 rejected with 400 Bad Request');

  // Test 3: Invalid Email in Registration
  const invalidEmailRegister = await makeRequest(5098, '/api/auth/register', 'POST', {
    name: 'عميل جديد',
    email: 'not-an-email',
    phone: '01222222222',
    password: 'password123',
  });
  assert(invalidEmailRegister.status === 400, 'Registration with invalid email format rejected with 400 Bad Request');

  // Test 4: Short Password in Registration (< 6 chars)
  const shortPassRegister = await makeRequest(5098, '/api/auth/register', 'POST', {
    name: 'عميل جديد',
    email: 'valid@gmail.com',
    phone: '01222222222',
    password: '123',
  });
  assert(shortPassRegister.status === 400, 'Registration with short password (< 6 chars) rejected with 400 Bad Request');

  // --- PHASE 6: Order Business Logic Hardening ---
  console.log('\n--- Phase 6: Order Business Logic Hardening ---');

  // Find a product with known price and stock
  const testProduct = db.products.find((p) => p.price > 10 && p.stock > 10)!;
  const initialStock = testProduct.stock;
  const realPrice = testProduct.price;

  // Test 5: Client-side Price Tampering Prevention
  // Client attempts to send price: 1 EGP instead of realPrice
  const tamperedOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد محمود',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [
        {
          productId: testProduct.id,
          quantity: 2,
          price: 1, // Tampered price attempt!
        },
      ],
      paymentMethod: 'CASH_ON_DELIVERY',
    },
    customerToken,
  );

  assert(tamperedOrder.status === 201, 'Order created successfully with server-side pricing');
  assert(
    tamperedOrder.body.items[0].price === realPrice,
    `Price tampering thwarted: Server enforced catalog price (${realPrice} EGP) instead of tampered price (1 EGP)`,
  );
  assert(
    tamperedOrder.body.subtotal === realPrice * 2,
    `Subtotal correctly calculated server-side (${realPrice * 2} EGP)`,
  );

  // Test 6: Stock Decrement
  assert(
    testProduct.stock === initialStock - 2,
    `Product stock atomically decremented from ${initialStock} to ${testProduct.stock}`,
  );

  // Test 7: Insufficient Stock Rejection
  const excessOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد محمود',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [
        {
          productId: testProduct.id,
          quantity: testProduct.stock + 100, // Demands more than stock
        },
      ],
    },
    customerToken,
  );
  assert(excessOrder.status === 400, 'Order demanding more than available stock rejected with 400 Bad Request');

  // Test 8: Per-User Promo Code Limit
  // Setup a test promo code
  const promoCode = 'SAVE10_' + Date.now();
  db.promoCodes = db.promoCodes.filter((p) => p.code !== promoCode);
  db.promoCodes.push({
    id: 'promo_test_1',
    code: promoCode,
    discountPercentage: 10,
    minOrderValue: 20,
    maxDiscount: 50,
    expiresAt: '2030-12-31',
    usageLimit: 100,
    timesUsed: 0,
    isActive: true,
  });

  const firstPromoOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد محمود',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [{ productId: testProduct.id, quantity: 1 }],
      promoCode,
    },
    customerToken,
  );
  assert(firstPromoOrder.status === 201, 'First use of promo code succeeds');
  assert(firstPromoOrder.body.discount > 0, 'Promo discount correctly applied to order');

  // Attempting to re-use the same promo code by same customer
  const secondPromoOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد محمود',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [{ productId: testProduct.id, quantity: 1 }],
      promoCode,
    },
    customerToken,
  );
  assert(
    secondPromoOrder.status === 400,
    'Re-use of promo code by same customer blocked (400 Bad Request: per-user limit)',
  );

  // Test 9: Collision-proof Order Number
  assert(
    tamperedOrder.body.orderNumber.startsWith('CHF-') && tamperedOrder.body.orderNumber.length >= 14,
    `Order number follows collision-proof format (${tamperedOrder.body.orderNumber})`,
  );

  // --- PHASE 7: Payment Processing Abstraction ---
  console.log('\n--- Phase 7: Payment Processing Abstraction ---');

  // Test 10: Cash On Delivery payment status is PENDING
  assert(
    firstPromoOrder.body.paymentMethod === 'CASH_ON_DELIVERY' &&
      firstPromoOrder.body.paymentStatus === 'PENDING',
    'Cash on delivery orders are marked paymentStatus: PENDING',
  );

  // Test 11: Electronic Payment processes through payment abstraction and marks PAID
  const cardOrder = await makeRequest(
    5098,
    '/api/orders',
    'POST',
    {
      customerName: 'أحمد محمود',
      customerPhone: '01111111111',
      deliveryAddress: {
        governorate: 'القاهرة',
        city: 'المعادي',
        street: 'شارع النصر',
      },
      items: [{ productId: testProduct.id, quantity: 1 }],
      paymentMethod: 'CREDIT_CARD',
    },
    customerToken,
  );
  assert(cardOrder.status === 201, 'Electronic payment order created');
  assert(cardOrder.body.paymentMethod === 'CREDIT_CARD', 'Payment method correctly recorded');
  assert(cardOrder.body.paymentStatus === 'PAID', 'Verified electronic payment marked paymentStatus: PAID');

  console.log(`\n🎉 ALL ${passedTests}/${totalTests} TESTS PASSED FOR PHASES 5, 6 & 7!`);

  await app.close();
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite failed:', err);
  process.exit(1);
});
