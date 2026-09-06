import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';

async function runTests() {
  console.log('🧪 Starting Phase 2 — Authentication Automated Test Suite...');
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const authService = app.get(AuthService);
  const prisma = app.get(PrismaService);

  // 1. Test Seed User Login
  console.log('\n[Test 1] Testing login with valid credentials (admin@chefaa.com)...');
  const loginRes = await authService.login('admin@chefaa.com', 'ChefaaAdmin@2026');
  if (!loginRes.accessToken || !loginRes.refreshToken || loginRes.user.email !== 'admin@chefaa.com') {
    throw new Error('Test 1 Failed: Invalid login response');
  }
  console.log('  ✓ Login succeeded with access and refresh tokens returned.');

  // 2. Test Rejection of Role Shortcuts
  console.log('\n[Test 2] Testing rejection of role shortcuts ("admin", "pharmacist")...');
  try {
    await authService.login('admin', 'ChefaaAdmin@2026');
    throw new Error('Test 2 Failed: Role shortcut "admin" was accepted!');
  } catch (err: any) {
    if (err.status === 401) {
      console.log('  ✓ Role shortcut "admin" correctly rejected with 401.');
    } else {
      throw err;
    }
  }

  // 3. Test Invalid Password
  console.log('\n[Test 3] Testing rejection of wrong password...');
  try {
    await authService.login('admin@chefaa.com', 'WrongPassword123');
    throw new Error('Test 3 Failed: Wrong password was accepted!');
  } catch (err: any) {
    if (err.status === 401) {
      console.log('  ✓ Wrong password correctly rejected with 401.');
    } else {
      throw err;
    }
  }

  // 4. Test Token Refresh and Rotation
  console.log('\n[Test 4] Testing Refresh Token Rotation...');
  const refreshRes = await authService.refreshToken(loginRes.refreshToken);
  if (!refreshRes.accessToken || !refreshRes.refreshToken) {
    throw new Error('Test 4 Failed: Refresh did not return new token pair');
  }
  if (refreshRes.refreshToken === loginRes.refreshToken) {
    throw new Error('Test 4 Failed: Refresh token was not rotated!');
  }
  console.log('  ✓ Refresh succeeded and issued new rotated refresh token.');

  // 5. Test Replay Attack Prevention (Old token cannot be reused)
  console.log('\n[Test 5] Testing Replay Attack Prevention (old refresh token reused)...');
  try {
    await authService.refreshToken(loginRes.refreshToken);
    throw new Error('Test 5 Failed: Old refresh token was accepted after rotation!');
  } catch (err: any) {
    if (err.status === 401) {
      console.log('  ✓ Replay attack blocked: Old refresh token rejected with 401.');
    } else {
      throw err;
    }
  }

  // 6. Test Secure Logout and Revocation
  console.log('\n[Test 6] Testing Secure Logout and Session Revocation...');
  await authService.logout(loginRes.user.id);
  const userInDb = await prisma.user.findUnique({ where: { id: loginRes.user.id } });
  if (userInDb?.refreshTokenHash !== null) {
    throw new Error('Test 6 Failed: Refresh token hash was not cleared on logout');
  }

  try {
    await authService.refreshToken(refreshRes.refreshToken);
    throw new Error('Test 6 Failed: Token was valid after logout!');
  } catch (err: any) {
    if (err.status === 401) {
      console.log('  ✓ Session revoked: Refresh attempt after logout failed with 401.');
    } else {
      throw err;
    }
  }

  // 7. Test Customer Registration
  console.log('\n[Test 7] Testing Customer Registration with password validation...');
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const regRes = await authService.registerCustomer({
    name: 'عميل تجريبي',
    email: testEmail,
    phone: `012${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'SecurePassword@2026',
  });
  if (!regRes.accessToken || !regRes.refreshToken || regRes.user.points !== 100) {
    throw new Error('Test 7 Failed: Registration response invalid');
  }
  console.log('  ✓ Customer registered successfully with hashed password and bonus points.');

  // 8. Test Password Reset Flow
  console.log('\n[Test 8] Testing Password Reset Flow...');
  const forgotRes = await authService.forgotPassword(testEmail);
  const resetToken = (forgotRes as any).resetToken;
  if (!resetToken) {
    throw new Error('Test 8 Failed: Reset token was not generated');
  }

  const newPass = 'UpdatedSecurePassword@2026';
  await authService.resetPassword(resetToken, newPass);

  // Try logging in with new password
  const newLogin = await authService.login(testEmail, newPass);
  if (!newLogin.accessToken) {
    throw new Error('Test 8 Failed: Cannot login with new password');
  }
  console.log('  ✓ Password successfully reset and validated with new credentials.');

  // Clean up test customer
  await prisma.user.delete({ where: { id: regRes.user.id } });

  await app.close();
  console.log('\n🎉 ALL PHASE 2 AUTHENTICATION TESTS PASSED!');
}

runTests().catch((e) => {
  console.error('❌ Tests failed:', e);
  process.exit(1);
});
