/**
 * Chefaa Enterprise Auth Storage & Multi-Tab Synchronization Service
 * Handles secure session persistence, token lifecycle, and cross-tab reactive updates.
 */

const KEYS = {
  ACCESS_TOKEN: 'chefaa_access_token',
  REFRESH_TOKEN: 'chefaa_refresh_token',
  USER: 'chefaa_user',
  // Legacy aliases for backward compatibility
  LEGACY_ACCESS_TOKEN: 'auth_token',
  LEGACY_ACCESS_TOKEN_ALT: 'chefaa_token',
  LEGACY_USER: 'auth_user',
};

class AuthStorage {
  constructor() {
    if (typeof window !== 'undefined') {
      this._initCrossTabListener();
    }
  }

  getAccessToken() {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem(KEYS.ACCESS_TOKEN) ||
      localStorage.getItem(KEYS.LEGACY_ACCESS_TOKEN) ||
      localStorage.getItem(KEYS.LEGACY_ACCESS_TOKEN_ALT) ||
      null
    );
  }

  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEYS.REFRESH_TOKEN) || null;
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    const raw =
      localStorage.getItem(KEYS.USER) ||
      localStorage.getItem(KEYS.LEGACY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('[AuthStorage] Failed to parse stored user JSON:', e);
      return null;
    }
  }

  setSession({ accessToken, refreshToken, user }) {
    if (typeof window === 'undefined') return;

    if (accessToken) {
      localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(KEYS.LEGACY_ACCESS_TOKEN, accessToken);
      localStorage.setItem(KEYS.LEGACY_ACCESS_TOKEN_ALT, accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    }

    if (user) {
      const serialized = JSON.stringify(user);
      localStorage.setItem(KEYS.USER, serialized);
      localStorage.setItem(KEYS.LEGACY_USER, serialized);
    }

    this._dispatchLocalEvent('auth:session_updated', { user, accessToken });
  }

  updateUser(updatedUser) {
    if (typeof window === 'undefined' || !updatedUser) return;
    const currentUser = this.getUser() || {};
    const merged = { ...currentUser, ...updatedUser };
    const serialized = JSON.stringify(merged);
    localStorage.setItem(KEYS.USER, serialized);
    localStorage.setItem(KEYS.LEGACY_USER, serialized);
    this._dispatchLocalEvent('auth:user_updated', { user: merged });
  }

  clearSession() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.LEGACY_ACCESS_TOKEN);
    localStorage.removeItem(KEYS.LEGACY_ACCESS_TOKEN_ALT);
    localStorage.removeItem(KEYS.LEGACY_USER);

    this._dispatchLocalEvent('auth:session_cleared');
  }

  notifySessionExpired(reason = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً') {
    this.clearSession();
    this._dispatchLocalEvent('auth:session_expired', { reason });
  }

  _dispatchLocalEvent(eventName, detail = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  _initCrossTabListener() {
    window.addEventListener('storage', (event) => {
      // If another tab cleared the session
      if (
        (event.key === KEYS.ACCESS_TOKEN || event.key === KEYS.LEGACY_ACCESS_TOKEN) &&
        !event.newValue
      ) {
        this._dispatchLocalEvent('auth:session_cleared', { fromCrossTab: true });
      }

      // If another tab logged in or refreshed tokens
      if (
        (event.key === KEYS.ACCESS_TOKEN || event.key === KEYS.LEGACY_ACCESS_TOKEN) &&
        event.newValue
      ) {
        const user = this.getUser();
        this._dispatchLocalEvent('auth:session_updated', {
          user,
          accessToken: event.newValue,
          fromCrossTab: true,
        });
      }
    });
  }
}

export const authStorage = new AuthStorage();
