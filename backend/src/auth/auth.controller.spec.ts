import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('AuthController (API Integration Tests via Supertest)', () => {
  let app: INestApplication;
  let authService: any;

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      registerCustomer: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'usr_test_1', email: 'user@example.com', role: 'CUSTOMER' };
          return true;
        },
      })
      .overrideGuard(OptionalJwtAuthGuard)
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

  describe('POST /auth/login', () => {
    it('should return 200 OK and token payload for valid credentials', async () => {
      const mockResponse = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        user: { id: 'usr_1', email: 'user@example.com', role: 'CUSTOMER' },
      };
      authService.login.mockResolvedValue(mockResponse);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          emailOrPhone: 'user@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.accessToken).toBe('mock_access_token');
      expect(res.body.user.email).toBe('user@example.com');
      expect(authService.login).toHaveBeenCalledWith('user@example.com', 'Password123!');
    });

    it('should return 400 Bad Request when request body has forbidden non-whitelisted properties', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          emailOrPhone: 'user@example.com',
          password: 'Password123!',
          maliciousInjectedField: true,
        })
        .expect(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should return 201 Created on valid customer registration', async () => {
      const mockUser = {
        id: 'usr_new',
        name: 'كريم',
        email: 'karim@example.com',
        phone: '01012345678',
      };
      authService.registerCustomer.mockResolvedValue({
        accessToken: 'access_123',
        user: mockUser,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'كريم',
          email: 'karim@example.com',
          phone: '01012345678',
          password: 'Password123!',
        })
        .expect(201);

      expect(res.body.user.name).toBe('كريم');
      expect(authService.registerCustomer).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 OK and rotated tokens', async () => {
      authService.refreshToken.mockResolvedValue({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'existing_valid_token',
        })
        .expect(200);

      expect(res.body.accessToken).toBe('new_access');
      expect(res.body.refreshToken).toBe('new_refresh');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return 200 OK with authenticated user profile', async () => {
      authService.getProfile.mockResolvedValue({
        id: 'usr_test_1',
        email: 'user@example.com',
        role: 'CUSTOMER',
      });

      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(200);

      expect(res.body.email).toBe('user@example.com');
      expect(authService.getProfile).toHaveBeenCalledWith('usr_test_1');
    });
  });
});
