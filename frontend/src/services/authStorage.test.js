import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStorage } from './authStorage';

describe('authStorage (Unit Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should store and retrieve session tokens and user data', () => {
    const mockUser = { id: 'usr_1', email: 'test@example.com', role: 'CUSTOMER' };
    authStorage.setSession({
      accessToken: 'access_abc',
      refreshToken: 'refresh_xyz',
      user: mockUser,
    });

    expect(authStorage.getAccessToken()).toBe('access_abc');
    expect(authStorage.getRefreshToken()).toBe('refresh_xyz');
    expect(authStorage.getUser()).toEqual(mockUser);
  });

  it('should dispatch auth:session_updated custom event on setSession', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const mockUser = { id: 'usr_1', email: 'test@example.com', role: 'ADMIN' };

    authStorage.setSession({
      accessToken: 'token_1',
      refreshToken: 'refresh_1',
      user: mockUser,
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth:session_updated',
        detail: { user: mockUser, accessToken: 'token_1' },
      }),
    );
  });

  it('should update user information and merge with existing profile', () => {
    authStorage.setSession({
      accessToken: 'tok',
      user: { id: 'usr_1', name: 'Original Name', points: 100 },
    });

    authStorage.updateUser({ points: 250, city: 'القاهرة' });

    const updated = authStorage.getUser();
    expect(updated.name).toBe('Original Name');
    expect(updated.points).toBe(250);
    expect(updated.city).toBe('القاهرة');
  });

  it('should clear all session tokens and dispatch auth:session_cleared event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    authStorage.setSession({
      accessToken: 'tok',
      refreshToken: 'ref',
      user: { id: 'usr_1' },
    });

    authStorage.clearSession();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth:session_cleared',
      }),
    );
  });

  it('should return null safely when localStorage contains malformed JSON for user', () => {
    localStorage.setItem('pharmacy_user', '{ invalid json ...');
    expect(authStorage.getUser()).toBeNull();
  });

  it('should notify session expiration, clear session and dispatch auth:session_expired', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    authStorage.notifySessionExpired('انتهت الجلسة');

    expect(authStorage.getAccessToken()).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth:session_expired',
        detail: { reason: 'انتهت الجلسة' },
      }),
    );
  });
});
