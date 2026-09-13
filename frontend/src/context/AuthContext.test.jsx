import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth, getRoleDefaultPath } from './AuthContext';
import { authStorage } from '../services/authStorage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getProfile: vi.fn(),
    refreshToken: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('AuthContext & Role Routing (Unit & State Tests)', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getRoleDefaultPath()', () => {
    it('should map ADMIN to /admin', () => {
      expect(getRoleDefaultPath('ADMIN')).toBe('/admin');
    });

    it('should map PHARMACIST to /pharmacy', () => {
      expect(getRoleDefaultPath('PHARMACIST')).toBe('/pharmacy');
    });

    it('should map DELIVERY to /delivery', () => {
      expect(getRoleDefaultPath('DELIVERY')).toBe('/delivery');
    });

    it('should map SUPPORT to /admin', () => {
      expect(getRoleDefaultPath('SUPPORT')).toBe('/admin');
    });

    it('should map CUSTOMER and unknown roles to storefront root /', () => {
      expect(getRoleDefaultPath('CUSTOMER')).toBe('/');
      expect(getRoleDefaultPath('UNKNOWN')).toBe('/');
      expect(getRoleDefaultPath(null)).toBe('/');
    });
  });

  describe('AuthProvider State', () => {
    it('should initialize with unauthenticated state when storage is empty', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.role).toBeNull();
    });

    it('should initialize with stored user and token and verify profile', async () => {
      const mockUser = { id: 'usr_1', name: 'أيمن', role: 'ADMIN', status: 'ACTIVE' };
      authStorage.setSession({
        accessToken: 'access_123',
        refreshToken: 'refresh_123',
        user: mockUser,
      });

      api.getProfile.mockResolvedValue({
        ...mockUser,
        points: 50,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Profile was updated
      await act(async () => {});

      expect(result.current.user).toBeDefined();
      expect(result.current.token).toBe('access_123');
      expect(result.current.role).toBe('ADMIN');
      expect(result.current.isAdmin).toBe(true);
    });

    it('should perform logout cleanly and clear session storage', async () => {
      authStorage.setSession({
        accessToken: 'access_123',
        user: { id: 'usr_1', role: 'CUSTOMER' },
      });

      api.getProfile.mockResolvedValue({ id: 'usr_1', role: 'CUSTOMER' });
      api.logout.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(authStorage.getAccessToken()).toBeNull();
    });
  });
});
