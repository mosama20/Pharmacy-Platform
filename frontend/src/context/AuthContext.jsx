import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { authStorage } from '../services/authStorage';

const AuthContext = createContext();

export const getRoleDefaultPath = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'PHARMACIST':
      return '/pharmacy';
    case 'DELIVERY':
      return '/delivery';
    case 'SUPPORT':
      return '/admin';
    case 'CUSTOMER':
    default:
      return '/';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [token, setToken] = useState(() => authStorage.getAccessToken());
  const [loading, setLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const savedToken = authStorage.getAccessToken();
      const savedRefreshToken = authStorage.getRefreshToken();
      const savedUser = authStorage.getUser();

      if (savedToken && savedUser) {
        setUser(savedUser);
        setToken(savedToken);

        try {
          // Verify session validity with backend
          const profile = await api.getProfile();
          if (isMounted && profile) {
            setUser(profile);
            authStorage.updateUser(profile);
          }
        } catch (e) {
          console.warn('[AuthContext] Profile verification failed on init, attempting refresh:', e);
          if (savedRefreshToken) {
            try {
              const refreshed = await api.refreshToken(savedRefreshToken);
              if (isMounted && refreshed?.user) {
                setUser(refreshed.user);
                setToken(refreshed.accessToken);
              }
            } catch (refErr) {
              console.warn('[AuthContext] Session expired:', refErr);
              if (isMounted) {
                authStorage.clearSession();
                setUser(null);
                setToken(null);
              }
            }
          } else {
            if (isMounted) {
              authStorage.clearSession();
              setUser(null);
              setToken(null);
            }
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Event listeners for cross-tab & storage events
    const handleSessionUpdated = (e) => {
      if (!isMounted) return;
      if (e.detail?.user) setUser(e.detail.user);
      if (e.detail?.accessToken) setToken(e.detail.accessToken);
    };

    const handleUserUpdated = (e) => {
      if (!isMounted) return;
      if (e.detail?.user) setUser(e.detail.user);
    };

    const handleSessionCleared = () => {
      if (!isMounted) return;
      setUser(null);
      setToken(null);
    };

    const handleSessionExpired = (e) => {
      if (!isMounted) return;
      setUser(null);
      setToken(null);
      setSessionExpiredNotice(e.detail?.reason || 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
    };

    window.addEventListener('auth:session_updated', handleSessionUpdated);
    window.addEventListener('auth:user_updated', handleUserUpdated);
    window.addEventListener('auth:session_cleared', handleSessionCleared);
    window.addEventListener('auth:session_expired', handleSessionExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:session_updated', handleSessionUpdated);
      window.removeEventListener('auth:user_updated', handleUserUpdated);
      window.removeEventListener('auth:session_cleared', handleSessionCleared);
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (emailOrPhone, password) => {
    const data = await api.login(emailOrPhone, password);
    setToken(data.accessToken);
    setUser(data.user);
    setSessionExpiredNotice(null);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await api.register(userData);
    setToken(data.accessToken);
    setUser(data.user);
    setSessionExpiredNotice(null);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('[AuthContext] Backend logout notice failed:', e);
    } finally {
      authStorage.clearSession();
      setToken(null);
      setUser(null);
    }
  }, []);

  // Role Checks & Helpers
  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isPharmacist = role === 'PHARMACIST';
  const isCourier = role === 'DELIVERY';
  const isSupport = role === 'SUPPORT';
  const isCustomer = role === 'CUSTOMER' || !role;
  const isAdminOrStaff = ['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT'].includes(role);

  const hasRole = useCallback((allowedRoles) => {
    if (!role) return false;
    if (role === 'ADMIN') return true; // Superuser bypass
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(role);
    }
    return role === allowedRoles;
  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        sessionExpiredNotice,
        setSessionExpiredNotice,
        login,
        register,
        logout,
        isAdmin,
        isPharmacist,
        isCourier,
        isSupport,
        isCustomer,
        isAdminOrStaff,
        hasRole,
        getRoleDefaultPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
