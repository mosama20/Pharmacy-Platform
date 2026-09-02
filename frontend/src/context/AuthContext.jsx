import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || localStorage.getItem('chefaa_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('auth_token') || localStorage.getItem('chefaa_token');
      const savedUser = localStorage.getItem('auth_user') || localStorage.getItem('chefaa_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        try {
          setUser(JSON.parse(savedUser));
          const profile = await api.getProfile();
          setUser(profile);
          localStorage.setItem('auth_user', JSON.stringify(profile));
        } catch (e) {
          console.error('Session expired or error loading profile', e);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('chefaa_token');
    localStorage.removeItem('chefaa_user');
  };

  const isAdminOrStaff = user && ['ADMIN', 'PHARMACIST', 'DELIVERY', 'SUPPORT'].includes(user.role);
  const isPharmacist = user && ['ADMIN', 'PHARMACIST'].includes(user.role);
  const isCourier = user && user.role === 'DELIVERY';
  const isSupport = user && user.role === 'SUPPORT';
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdminOrStaff,
        isPharmacist,
        isCourier,
        isSupport,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
