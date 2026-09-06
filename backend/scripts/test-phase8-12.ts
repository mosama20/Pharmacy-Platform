import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

const TEST_PORT = 5096;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function main() {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'chefaa_prod_secret_key_2026_super_secure_min_32_chars';
  }

  const app = await NestFactory.create(AppModule, { logger: false });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'sameorigin' },
      noSniff: true,
    }),
  );

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (defaultAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Error: Access from origin ${origin} is not allowed.`), false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(TEST_PORT);
  console.log(`\n🧪 Test server running on ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate tokens
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@chefaa.com', password: 'ChefaaAdmin@2026' }),
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.accessToken;

    const pharmRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pharmacist@chefaa.com', password: 'ChefaaStaff@2026' }),
    });
    const pharmData = await pharmRes.json();
    const pharmToken = pharmData.accessToken;

    const custRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@chefaa.com', password: 'ChefaaCustomer@2026' }),
    });
    const custData = await custRes.json();
    const custToken = custData.accessToken;

    console.log('\n--- Test Phase 11: Security Headers & CORS ---');
    // Test Security Headers
    const headersRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert('Helmet: X-Content-Type-Options is nosniff', headersRes.headers.get('x-content-type-options') === 'nosniff');
    assert('Helmet: X-Frame-Options is SAMEORIGIN', headersRes.headers.get('x-frame-options') === 'SAMEORIGIN');

    // Test CORS from unauthorized origin
    const corsRes = await fetch(`${BASE_URL}/products`, {
      headers: { Origin: 'http://malicious-attacker-site.com' },
    });
    const allowHeader = corsRes.headers.get('access-control-allow-origin');
    assert('CORS: Disallowed origin is not echoed back', allowHeader !== 'http://malicious-attacker-site.com');

    console.log('\n--- Test Phase 8 & 12: Prescription & Upload Security ---');
    // Test uploading prescription with fake/spoofed base64 (invalid magic bytes)
    const fakeBase64 = 'data:image/png;base64,' + Buffer.from('NOT_A_REAL_PNG_IMAGE_CONTENT').toString('base64');
    const badUploadRes = await fetch(`${BASE_URL}/prescriptions/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        customerName: 'مريض تجريبي',
        customerPhone: '01011112222',
        images: [fakeBase64],
      }),
    });
    assert('Prescription Upload: Reject spoofed base64 image (invalid magic bytes)', badUploadRes.status === 400);

    // Test uploading prescription with SSRF URL
    const ssrfUploadRes = await fetch(`${BASE_URL}/prescriptions/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        customerName: 'مريض تجريبي',
        customerPhone: '01011112222',
        images: ['http://169.254.169.254/latest/meta-data/'],
      }),
    });
    assert('Prescription Upload: Reject SSRF private metadata URL', ssrfUploadRes.status === 400);

    // Test uploading prescription with valid PNG magic bytes
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validPngBase64 = `data:image/png;base64,${validPngBuffer.toString('base64')}`;
    const goodUploadRes = await fetch(`${BASE_URL}/prescriptions/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        customerName: 'مريض تجريبي',
        customerPhone: '01011112222',
        images: [validPngBase64],
      }),
    });
    const goodUploadData = await goodUploadRes.json();
    assert('Prescription Upload: Accept valid PNG magic bytes', goodUploadRes.status === 201 || goodUploadRes.status === 200);
    const createdRxId = goodUploadData?.prescription?.id;

    // Pharmacist quotes the prescription
    const quoteRes = await fetch(`${BASE_URL}/prescriptions/${createdRxId}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        quotedItems: [
          { productName: 'بانادول إكسترا', quantity: 2, price: 45 },
        ],
        pharmacistNotes: 'الجرعة قرص مرتين يوميا بعد الأكل',
      }),
    });
    assert('Pharmacist: Successfully quotes prescription', quoteRes.status === 200 || quoteRes.status === 201);

    // Attempt to quote AGAIN after status is already QUOTED -> Should fail
    const reQuoteRes = await fetch(`${BASE_URL}/prescriptions/${createdRxId}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pharmToken}`,
      },
      body: JSON.stringify({
        quotedItems: [{ productName: 'دواء آخر', quantity: 1, price: 100 }],
      }),
    });
    assert('Prescription State: Re-quoting a QUOTED prescription is rejected', reQuoteRes.status === 400);

    // Customer accepts their quoted prescription
    const acceptRes = await fetch(`${BASE_URL}/prescriptions/${createdRxId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    assert('Customer: Successfully accepts own quoted prescription', acceptRes.status === 200);

    // Customer attempts invalid status change (e.g. back to PENDING) -> Should fail
    const badStateRes = await fetch(`${BASE_URL}/prescriptions/${createdRxId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ status: 'PENDING' }),
    });
    assert('Prescription State: Customer cannot revert to PENDING', badStateRes.status === 400 || badStateRes.status === 403);

    console.log('\n--- Test Phase 9: Tracking Security ---');
    // Fetch a real product with available stock
    const prodRes = await fetch(`${BASE_URL}/products`);
    const products = await prodRes.json();
    const realProduct = products.find((p: any) => p.stock > 5) || products[0];

    // Create an order first
    const newOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        customerName: 'أحمد محمود',
        customerPhone: '01099887766',
        deliveryAddress: {
          governorate: 'القاهرة',
          city: 'المعادي',
          street: 'شارع النصر',
        },
        items: [{ productId: realProduct.id, quantity: 1 }],
      }),
    });
    const newOrderData = await newOrderRes.json();
    const testOrderId = newOrderData?.id || newOrderData?.order?.id;
    assert('Orders: Created test order for tracking tests', Boolean(testOrderId));

    // Assign courier to order as Admin
    await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'OUT_FOR_DELIVERY',
        assignedCourierId: 'usr_courier_1',
      }),
    });

    // Customer attempting to update courier location -> Must be 403 Forbidden
    const custLocRes = await fetch(`${BASE_URL}/orders/${testOrderId}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({ lat: 30.0444, lng: 31.2357 }),
    });
    assert('Tracking Security: Customer cannot update courier location (403)', custLocRes.status === 403);

    // Admin updating courier location -> Allowed
    const adminLocRes = await fetch(`${BASE_URL}/orders/${testOrderId}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ lat: 30.0444, lng: 31.2357 }),
    });
    assert('Tracking Security: Admin can update courier location', adminLocRes.status === 200);

    // Updating with invalid coordinates (out of bounds) -> 400 Bad Request
    const badCoordsRes = await fetch(`${BASE_URL}/orders/${testOrderId}/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ lat: 199.9, lng: 31.2357 }),
    });
    assert('Tracking Security: Out-of-bounds latitude (>90) is rejected (400)', badCoordsRes.status === 400);

    console.log('\n--- Test Phase 10: Rate Limiting ---');
    // Rapid calls to /auth/login to trigger throttler
    let throttled = false;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad@chefaa.com', password: 'wrong' }),
      });
      if (res.status === 429) {
        throttled = true;
        break;
      }
    }
    assert('Rate Limiting: Exceeding auth limit returns 429 Too Many Requests', throttled);

  } catch (err: any) {
    console.error('Fatal error during test run:', err);
    failed++;
  } finally {
    await app.close();
  }

  console.log(`\n========================================`);
  console.log(`🏁 Phase 8-12 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
