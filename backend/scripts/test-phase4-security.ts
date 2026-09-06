import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { INestApplication } from '@nestjs/common';
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
  console.log('🧪 Starting Phase 4 — Secure Critical Endpoints Test Suite...\n');

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(5099);

  const authService = app.get(AuthService);

  // Generate tokens for testing
  const adminTokens = await authService.login('admin@chefaa.com', 'ChefaaAdmin@2026');
  const customerTokens = await authService.login('customer@chefaa.com', 'ChefaaCustomer@2026');
  const pharmacistTokens = await authService.login('pharmacist@chefaa.com', 'ChefaaStaff@2026');

  const adminToken = adminTokens.accessToken;
  const customerToken = customerTokens.accessToken;
  const pharmacistToken = pharmacistTokens.accessToken;
  const adminUser = adminTokens.user;

  console.log('🔑 Test tokens generated successfully.');

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

  // --- 1. AI Endpoints Security ---
  console.log('\n--- 1. Testing AI Endpoints Authentication ---');

  const aiAnalyzeNoAuth = await makeRequest(5099, '/api/ai/analyze-prescription', 'POST', { notes: 'Panadol' });
  assert(aiAnalyzeNoAuth.status === 401, 'Unauthenticated prescription AI analysis returns 401 Unauthorized');

  const aiInteractionsNoAuth = await makeRequest(5099, '/api/ai/check-interactions', 'POST', { productIds: ['prod_1'] });
  assert(aiInteractionsNoAuth.status === 401, 'Unauthenticated drug interaction check returns 401 Unauthorized');

  const aiAnalyzeAuth = await makeRequest(
    5099,
    '/api/ai/analyze-prescription',
    'POST',
    { notes: 'بانادول للصداع' },
    customerToken,
  );
  assert(aiAnalyzeAuth.status === 201 || aiAnalyzeAuth.status === 200, 'Authenticated prescription AI analysis succeeds');

  const aiInteractionsAuth = await makeRequest(
    5099,
    '/api/ai/check-interactions',
    'POST',
    { productIds: ['prod_1', 'prod_4'] },
    customerToken,
  );
  assert(aiInteractionsAuth.status === 201 || aiInteractionsAuth.status === 200, 'Authenticated drug interaction check succeeds');

  // --- 2. Chatbot Removal Verification ---
  console.log('\n--- 2. Verifying Pharmacist Chatbot Removal ---');

  const chatbotReq = await makeRequest(5099, '/api/ai/pharmacist-consult', 'POST', { message: 'hello' }, customerToken);
  assert(chatbotReq.status === 404, 'AI Chatbot endpoint POST /api/ai/pharmacist-consult returns 404 (completely removed)');

  // --- 3. Products Controller Endpoints Security ---
  console.log('\n--- 3. Testing Products Critical Endpoints Security ---');

  const templateNoAuth = await makeRequest(5099, '/api/products/template-excel', 'GET');
  assert(templateNoAuth.status === 401, 'Unauthenticated Excel template download returns 401 Unauthorized');

  const templateCustomer = await makeRequest(5099, '/api/products/template-excel', 'GET', undefined, customerToken);
  assert(templateCustomer.status === 403, 'Customer role downloading Excel template returns 403 Forbidden');

  const templatePharmacist = await makeRequest(5099, '/api/products/template-excel', 'GET', undefined, pharmacistToken);
  assert(templatePharmacist.status === 200, 'Pharmacist downloading Excel template succeeds (200 OK)');

  const importNoAuth = await makeRequest(5099, '/api/products/import-excel', 'POST', {});
  assert(importNoAuth.status === 401, 'Unauthenticated Excel import returns 401 Unauthorized');

  const importCustomer = await makeRequest(5099, '/api/products/import-excel', 'POST', {}, customerToken);
  assert(importCustomer.status === 403, 'Customer role attempting Excel import returns 403 Forbidden');

  // --- 4. Platform Settings Security ---
  console.log('\n--- 4. Testing Platform Settings Security (ADMIN only) ---');

  const settingsNoAuth = await makeRequest(5099, '/api/cms/settings', 'PUT', { websiteName: 'Hacked' });
  assert(settingsNoAuth.status === 401, 'Unauthenticated platform settings update returns 401 Unauthorized');

  const settingsCustomer = await makeRequest(5099, '/api/cms/settings', 'PUT', { websiteName: 'Hacked' }, customerToken);
  assert(settingsCustomer.status === 403, 'Customer role updating platform settings returns 403 Forbidden');

  const settingsPharmacist = await makeRequest(5099, '/api/cms/settings', 'PUT', { websiteName: 'Hacked' }, pharmacistToken);
  assert(settingsPharmacist.status === 403, 'Pharmacist role updating platform settings returns 403 Forbidden (strictly ADMIN only)');

  const settingsAdmin = await makeRequest(
    5099,
    '/api/cms/settings',
    'PUT',
    { websiteName: 'شفاء - منصة الصيدلية المتكاملة' },
    adminToken,
  );
  assert(settingsAdmin.status === 200, 'Admin role updating platform settings succeeds (200 OK)');

  // --- 5. Self-Lockout & Self-Destruction Prevention ---
  console.log('\n--- 5. Testing Admin Self-Lockout & Self-Destruction Protection ---');

  const selfDeleteUser = await makeRequest(5099, `/api/users/${adminUser.id}`, 'DELETE', undefined, adminToken);
  assert(selfDeleteUser.status === 400, 'Admin deleting their own user account is blocked (400 Bad Request)');

  const selfDeactivateUser = await makeRequest(
    5099,
    `/api/users/${adminUser.id}/status`,
    'PATCH',
    { status: 'INACTIVE' },
    adminToken,
  );
  assert(selfDeactivateUser.status === 400, 'Admin deactivating their own account status is blocked (400 Bad Request)');

  const selfDemoteUser = await makeRequest(
    5099,
    `/api/users/${adminUser.id}/role`,
    'PATCH',
    { role: 'CUSTOMER' },
    adminToken,
  );
  assert(selfDemoteUser.status === 400, 'Admin demoting their own role is blocked (400 Bad Request)');

  const selfDeleteStaff = await makeRequest(5099, `/api/staff/${adminUser.id}`, 'DELETE', undefined, adminToken);
  assert(selfDeleteStaff.status === 400, 'Admin deleting their own staff record is blocked (400 Bad Request)');

  const selfDeactivateStaff = await makeRequest(
    5099,
    `/api/staff/${adminUser.id}`,
    'PUT',
    { status: 'SUSPENDED' },
    adminToken,
  );
  assert(selfDeactivateStaff.status === 400, 'Admin suspending their own staff status is blocked (400 Bad Request)');

  const selfDemoteStaff = await makeRequest(
    5099,
    `/api/staff/${adminUser.id}`,
    'PUT',
    { role: 'PHARMACIST' },
    adminToken,
  );
  assert(selfDemoteStaff.status === 400, 'Admin demoting their own staff role is blocked (400 Bad Request)');

  console.log(`\n🎉 ALL ${passedTests}/${totalTests} PHASE 4 SECURITY TESTS PASSED!`);

  await app.close();
}

runTests().catch((err) => {
  console.error('\n❌ Phase 4 Security Tests failed:', err);
  process.exit(1);
});
