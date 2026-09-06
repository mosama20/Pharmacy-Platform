import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

const TEST_PORT = 5095;
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

    const custRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@chefaa.com', password: 'ChefaaCustomer@2026' }),
    });
    const custData = await custRes.json();
    const custToken = custData.accessToken;

    console.log('\n--- Phase 13: Observability & Health Checks ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert('Health Check: GET /api/health returns 200 OK', healthRes.status === 200);
    assert('Health Check: status is "ok"', healthData.status === 'ok');
    assert('Health Check: database provider is postgresql', healthData.database?.provider === 'postgresql');
    assert('Health Check: database status is "healthy"', healthData.database?.status === 'healthy');
    assert('Health Check: memory metrics included', typeof healthData.memory?.heapUsedMb === 'number');

    const liveRes = await fetch(`${BASE_URL}/health/live`);
    const liveData = await liveRes.json();
    assert('Liveness Probe: GET /api/health/live returns 200 { status: "alive" }', liveRes.status === 200 && liveData.status === 'alive');

    const readyRes = await fetch(`${BASE_URL}/health/ready`);
    const readyData = await readyRes.json();
    assert('Readiness Probe: GET /api/health/ready returns 200 { status: "ready" }', readyRes.status === 200 && readyData.status === 'ready');

    console.log('\n--- Phase 14: Audit Logging ---');
    // Customer attempting to access audit logs -> 403 Forbidden
    const custAuditRes = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    assert('Audit Security: Non-admin role blocked from /api/audit-logs (403 Forbidden)', custAuditRes.status === 403);

    // Admin updates a user status to generate an audit log
    const testCustId = custData.user.id;
    const updateRes = await fetch(`${BASE_URL}/users/${testCustId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert('Admin Action: User status update succeeds', updateRes.status === 200);

    // Admin reads audit logs
    const adminAuditRes = await fetch(`${BASE_URL}/audit-logs?action=USER_STATUS_UPDATE`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await adminAuditRes.json();
    assert('Audit Logs: Admin can fetch audit logs (200 OK)', adminAuditRes.status === 200);
    assert('Audit Logs: Response contains paginated data array', Array.isArray(auditData.data));
    assert('Audit Logs: Metadata contains total and pagination details', typeof auditData.meta?.total === 'number');
    const hasLog = auditData.data.some((l: any) => l.action === 'USER_STATUS_UPDATE');
    assert('Audit Logs: Contains logged action USER_STATUS_UPDATE', hasLog);

    console.log('\n--- Phase 15: Server-Side Pagination ---');
    // Products pagination
    const prodPageRes = await fetch(`${BASE_URL}/products?paginated=true&page=1&limit=10`);
    const prodPageData = await prodPageRes.json();
    assert('Products Pagination: Returns 200 OK', prodPageRes.status === 200);
    assert('Products Pagination: Exactly 10 items in data array', Array.isArray(prodPageData.data) && prodPageData.data.length === 10);
    assert('Products Pagination: Meta has total > 10,000 products', prodPageData.meta?.total > 10000);
    assert('Products Pagination: Meta has page=1, limit=10, hasNext=true, hasPrev=false', 
      prodPageData.meta?.page === 1 && 
      prodPageData.meta?.limit === 10 && 
      prodPageData.meta?.hasNext === true && 
      prodPageData.meta?.hasPrev === false
    );

    // Backward compatibility: Standard call without paginated=true returns array directly
    const prodArrayRes = await fetch(`${BASE_URL}/products?limit=5`);
    const prodArrayData = await prodArrayRes.json();
    assert('Backward Compatibility: Standard product request returns array directly', Array.isArray(prodArrayData) && prodArrayData.length === 5);

    // Orders pagination
    const orderPageRes = await fetch(`${BASE_URL}/orders?paginated=true&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderPageData = await orderPageRes.json();
    assert('Orders Pagination: Returns 200 OK', orderPageRes.status === 200);
    assert('Orders Pagination: Response has data array and meta', Array.isArray(orderPageData.data) && typeof orderPageData.meta?.total === 'number');

    console.log('\n--- Phase 17: Database Indexing & Performance ---');
    const startBench = Date.now();
    await fetch(`${BASE_URL}/products?category=أدوية%20وعلاجات&limit=20`);
    const benchDuration = Date.now() - startBench;
    assert('Performance: Filtered category query executes under 100ms', benchDuration < 100, `${benchDuration}ms`);

  } catch (err: any) {
    console.error('Fatal error during test run:', err);
    failed++;
  } finally {
    await app.close();
  }

  console.log(`\n========================================`);
  console.log(`🏁 Phase 13, 14, 15, 17 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
