import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiFetch, productsApi } from './api';
import { authStorage } from './authStorage';

describe('Frontend API Client (api.js) Hardening Tests (Phase 12)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Standard Request & Authorization Headers', () => {
    it('should attach Bearer token to headers when user is authenticated', async () => {
      authStorage.setSession({
        accessToken: 'valid_access_token_123',
        refreshToken: 'valid_refresh_token_456',
        user: { id: 'usr_1', role: 'CUSTOMER' },
      });

      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      await apiFetch('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers['Authorization']).toBe('Bearer valid_access_token_123');
    });

    it('should throw friendly offline error when fetch network request fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(apiFetch('/orders')).rejects.toThrow(
        'تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت',
      );
    });
  });

  describe('Silent 401 Token Refresh & Request Replay', () => {
    it('should catch 401, refresh tokens silently, and retry original request with new token', async () => {
      authStorage.setSession({
        accessToken: 'expired_access_token',
        refreshToken: 'valid_refresh_token',
        user: { id: 'usr_1' },
      });

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url) => {
        callCount++;
        // First call to /profile returns 401 Unauthorized
        if (callCount === 1) {
          return { status: 401, ok: false };
        }
        // Second call is /auth/refresh
        if (url.includes('/auth/refresh')) {
          return {
            status: 200,
            ok: true,
            json: async () => ({
              accessToken: 'fresh_new_token_789',
              refreshToken: 'fresh_refresh_token_000',
              user: { id: 'usr_1' },
            }),
          };
        }
        // Third call is the replayed /profile request with new token
        return {
          status: 200,
          ok: true,
          json: async () => ({ profile: 'Sara' }),
        };
      });

      const response = await apiFetch('/profile');
      expect(response.status).toBe(200);

      // Verify that authStorage has been updated with new access token
      expect(authStorage.getAccessToken()).toBe('fresh_new_token_789');

      // Total fetches: 1 (original 401) + 1 (refresh) + 1 (replayed original)
      expect(callCount).toBe(3);
    });
  });

  describe('Concurrent 401 Mutex / Single Refresh Call', () => {
    it('should trigger only ONE refresh call when multiple concurrent requests receive 401', async () => {
      authStorage.setSession({
        accessToken: 'expired_token',
        refreshToken: 'valid_refresh_token',
        user: { id: 'usr_1' },
      });

      let refreshCallCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url, options) => {
        if (url.includes('/auth/refresh')) {
          refreshCallCount++;
          // Small delay to simulate async network roundtrip
          await new Promise((r) => setTimeout(r, 20));
          return {
            status: 200,
            ok: true,
            json: async () => ({
              accessToken: 'single_mutex_token',
              refreshToken: 'single_refresh_token',
              user: { id: 'usr_1' },
            }),
          };
        }

        // If authorization header has expired_token, return 401
        if (options?.headers?.Authorization === 'Bearer expired_token') {
          return { status: 401, ok: false };
        }

        // Replayed request with single_mutex_token returns 200 OK
        return {
          status: 200,
          ok: true,
          json: async () => ({ data: url }),
        };
      });

      // Fire 3 requests simultaneously
      const [res1, res2, res3] = await Promise.all([
        apiFetch('/orders/1'),
        apiFetch('/orders/2'),
        apiFetch('/orders/3'),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);

      // CRITICAL: Mutex must ensure only 1 refresh call was made!
      expect(refreshCallCount).toBe(1);
      expect(authStorage.getAccessToken()).toBe('single_mutex_token');
    });

    it('should notify session expired when refresh fails', async () => {
      authStorage.setSession({
        accessToken: 'expired_token',
        refreshToken: 'invalid_or_expired_refresh_token',
        user: { id: 'usr_1' },
      });

      const notifySpy = vi.spyOn(authStorage, 'notifySessionExpired');

      global.fetch = vi.fn().mockImplementation(async (url) => {
        if (url.includes('/auth/refresh')) {
          return { status: 401, ok: false }; // Refresh token rejected!
        }
        return { status: 401, ok: false };
      });

      const res = await apiFetch('/profile');
      expect(res.status).toBe(401);
      expect(notifySpy).toHaveBeenCalled();
    });
  });
});
