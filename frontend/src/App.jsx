import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CmsProvider } from './context/CmsContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { StorefrontPortal } from './pages/StorefrontPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffLogin } from './pages/StaffLogin';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export function AppRoutes() {
  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('app_dark') === 'true' ||
      localStorage.getItem('chefaa_dark') === 'true'
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_dark', 'false');
    }
  }, [darkMode]);

  // Backward compatibility with hash navigation (#admin -> /admin)
  useEffect(() => {
    if (window.location.hash === '#admin') {
      window.location.href = '/admin';
    } else if (window.location.hash === '#pharmacy') {
      window.location.href = '/pharmacy';
    } else if (window.location.hash === '#delivery') {
      window.location.href = '/delivery';
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Storefront Portal for Patients and Customers (URL: /) */}
        <Route
          path="/"
          element={<StorefrontPortal darkMode={darkMode} setDarkMode={setDarkMode} />}
        />

        {/* 2. Admin HQ Portal (URL: /admin and /admin/*) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard
                initialTab="orders"
                portalType="admin"
                onBackToStore={() => (window.location.href = '/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard
                initialTab="orders"
                portalType="admin"
                onBackToStore={() => (window.location.href = '/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <StaffLogin
              defaultPortalTitle="مدير المنظومة (Admin)"
              targetRole="ADMIN"
            />
          }
        />

        {/* 3. Clinical Pharmacist Portal (URL: /pharmacy and /pharmacy/*) */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']}>
              <AdminDashboard
                initialTab="prescriptions"
                portalType="pharmacy"
                onBackToStore={() => (window.location.href = '/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/*"
          element={
            <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']}>
              <AdminDashboard
                initialTab="prescriptions"
                portalType="pharmacy"
                onBackToStore={() => (window.location.href = '/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/login"
          element={
            <StaffLogin
              defaultPortalTitle="دكتور صيدلي مراجع (Pharmacist)"
              targetRole="PHARMACIST"
            />
          }
        />

        {/* 4. Courier Driver Portal (URL: /delivery and /delivery/*) */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute allowedRoles={['DELIVERY', 'ADMIN']}>
              <AdminDashboard
                initialTab="courier"
                portalType="delivery"
                onBackToStore={() => (window.location.href = '/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/*"
          element={
            <ProtectedRoute allowedRoles={['DELIVERY', 'ADMIN']}>
              <AdminDashboard
                initialTab="courier"
                portalType="delivery"
                onBackToStore={() => (window.location.href = '/')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/login"
          element={
            <StaffLogin
              defaultPortalTitle="كابتن توصيل سريع (Courier)"
              targetRole="DELIVERY"
            />
          }
        />

        {/* General Staff Login */}
        <Route
          path="/staff/login"
          element={<StaffLogin defaultPortalTitle="الكادر الطبي والإداري" />}
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <CmsProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </CmsProvider>
  );
}
