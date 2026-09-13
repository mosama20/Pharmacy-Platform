import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { DbService } from '../database/db.service';
import { UserStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let prismaService: any;
  let dbService: any;
  let jwtService: any;

  const mockPassword = 'Password123!';
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(mockPassword, 10);
  });

  const mockUser: any = {
    id: 'usr_test_123',
    name: 'أحمد محمود',
    email: 'ahmed@example.com',
    phone: '01012345678',
    password: '',
    role: Role.CUSTOMER,
    status: UserStatus.ACTIVE,
    points: 100,
    walletBalance: 50,
    city: 'القاهرة',
    address: 'شارع 9 المعادي',
    refreshTokenHash: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    mockUser.password = hashedPassword;
    mockUser.status = UserStatus.ACTIVE;
    mockUser.refreshTokenHash = null;

    prismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    dbService = {
      users: [mockUser],
    };

    jwtService = {
      sign: jest.fn((payload, options) => `signed_jwt_${payload.type || 'token'}`),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: DbService, useValue: dbService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('should successfully log in an active user with valid credentials', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({ ...mockUser });

      const result = await authService.login('ahmed@example.com', mockPassword);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('signed_jwt_access');
      expect(result.refreshToken).toBe('signed_jwt_refresh');
      expect(result.user.email).toBe('ahmed@example.com');
      expect(result.user.name).toBe('أحمد محمود');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            refreshTokenHash: expect.any(String),
          }),
        }),
      );
    });

    it('should reject login if email/phone or password is missing', async () => {
      await expect(authService.login('', mockPassword)).rejects.toThrow(BadRequestException);
      await expect(authService.login('ahmed@example.com', '')).rejects.toThrow(BadRequestException);
    });

    it('should reject login if user is not found in database', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', mockPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject login if user account is suspended or inactive', async () => {
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      prismaService.user.findFirst.mockResolvedValue(suspendedUser);

      await expect(authService.login('ahmed@example.com', mockPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject login if password does not match', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(authService.login('ahmed@example.com', 'WrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken() & Token Rotation', () => {
    it('should rotate tokens and return new access/refresh token pair on valid refresh token', async () => {
      const incomingRefreshToken = 'valid_raw_refresh_token';
      const incomingHash = crypto.createHash('sha256').update(incomingRefreshToken).digest('hex');

      jwtService.verify.mockReturnValue({ sub: mockUser.id, type: 'refresh' });
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: incomingHash,
      });
      prismaService.user.update.mockResolvedValue({ ...mockUser });

      const res = await authService.refreshToken(incomingRefreshToken);

      expect(res).toBeDefined();
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should detect replay attack (token hash mismatch) and revoke all tokens for the user', async () => {
      const stolenToken = 'old_or_stolen_token';
      const legitimateHash = crypto.createHash('sha256').update('different_current_token').digest('hex');

      jwtService.verify.mockReturnValue({ sub: mockUser.id, type: 'refresh' });
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: legitimateHash,
      });

      await expect(authService.refreshToken(stolenToken)).rejects.toThrow(UnauthorizedException);

      // Replay attack response: revoke token!
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshTokenHash: null },
      });
    });

    it('should throw UnauthorizedException if refresh token is expired or invalid JWT', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refreshToken('expired_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerCustomer()', () => {
    it('should successfully register a new customer', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          ...data,
          status: UserStatus.ACTIVE,
          role: Role.CUSTOMER,
          points: 0,
          walletBalance: 0,
          createdAt: new Date('2026-01-01'),
        }),
      );
      prismaService.user.update.mockResolvedValue({});

      const dto = {
        name: 'كريم أحمد',
        email: 'karim@example.com',
        phone: '01099887766',
        password: 'StrongPassword123',
        city: 'الإسكندرية',
      };

      const result = await authService.registerCustomer(dto);

      expect(result).toBeDefined();
      expect(result.user.email).toBe('karim@example.com');
      expect(result.user.name).toBe('كريم أحمد');
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should reject registration if required fields are missing', async () => {
      const invalidDto: any = { name: '', email: 'test@mail.com', phone: '', password: '' };
      await expect(authService.registerCustomer(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if password is less than 8 characters', async () => {
      const shortPassDto = {
        name: 'كريم',
        email: 'karim2@example.com',
        phone: '01099887766',
        password: 'short',
      };
      await expect(authService.registerCustomer(shortPassDto)).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if email or phone already exists', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const duplicateDto = {
        name: 'أحمد محمود',
        email: 'ahmed@example.com',
        phone: '01012345678',
        password: 'Password123!',
      };

      await expect(authService.registerCustomer(duplicateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout()', () => {
    it('should revoke active refresh token hash for given userId', async () => {
      prismaService.user.updateMany.mockResolvedValue({ count: 1 });
      const res = await authService.logout('usr_123');

      expect(res.message).toContain('تم تسجيل الخروج');
      expect(prismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'usr_123' },
        data: { refreshTokenHash: null },
      });
    });
  });

  describe('forgotPassword() & resetPassword()', () => {
    it('should return safe generic message for non-existent email (anti-enumeration)', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      const res = await authService.forgotPassword('nonexistent@example.com');

      expect(res.message).toContain('إذا كان البريد الإلكتروني مسجلاً');
    });

    it('should generate reset token and store hash when user is found', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      const res = await authService.forgotPassword('ahmed@example.com');
      expect(res.message).toContain('إذا كان البريد الإلكتروني مسجلاً');
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should reject resetPassword with short password', async () => {
      await expect(authService.resetPassword('some_token', 'short')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully reset password, update hash, and revoke active sessions', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);

      const res = await authService.resetPassword('valid_token', 'NewSecurePassword123!');
      expect(res.message).toContain('تم تغيير كلمة المرور بنجاح');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetTokenHash: null,
            refreshTokenHash: null, // Sessions revoked!
          }),
        }),
      );
    });
  });

  describe('getProfile()', () => {
    it('should return safe user profile without password or hash fields', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const profile = await authService.getProfile('usr_123');
      expect(profile.email).toBe('ahmed@example.com');
      expect((profile as any).password).toBeUndefined();
      expect((profile as any).refreshTokenHash).toBeUndefined();
    });
  });
});

