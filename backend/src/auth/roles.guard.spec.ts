import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard (RBAC Unit Tests)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required for the route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException if required roles exist but no user is attached to request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'PHARMACIST']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow ADMIN to access any role-protected route (superuser privileges)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['DELIVERY']);
    const context = createMockContext({ id: 'usr_admin', role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow user with matching role (e.g. PHARMACIST)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'PHARMACIST']);
    const context = createMockContext({ id: 'usr_pharm', role: 'PHARMACIST' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has insufficient role (e.g. CUSTOMER accessing staff route)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'PHARMACIST']);
    const context = createMockContext({ id: 'usr_cust', role: 'CUSTOMER' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if DELIVERY courier tries to access PHARMACIST-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['PHARMACIST']);
    const context = createMockContext({ id: 'usr_deliv', role: 'DELIVERY' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
