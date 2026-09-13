import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../../context/AuthContext';

describe('ProtectedRoute (Component & Security Tests)', () => {
  const renderWithRouter = (ui, { route = '/admin' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/admin" element={ui} />
          <Route path="/staff/login" element={<div>صفحة تسجيل دخول الكادر</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('should show loading spinner when auth is loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      loading: true,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>لوحة تحكم المدير</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText(/جاري التحقق من الصلاحيات الأمنية/i)).toBeInTheDocument();
  });

  it('should redirect unauthenticated users to /staff/login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      loading: false,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>لوحة تحكم المدير</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('صفحة تسجيل دخول الكادر')).toBeInTheDocument();
  });

  it('should render children when user is authenticated with the allowed role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr_1', role: 'ADMIN', status: 'ACTIVE' },
      token: 'valid_token',
      loading: false,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>لوحة تحكم المدير</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('لوحة تحكم المدير')).toBeInTheDocument();
  });

  it('should allow ADMIN to access any role-gated portal (superuser access)', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr_admin', role: 'ADMIN', status: 'ACTIVE' },
      token: 'valid_token',
      loading: false,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['PHARMACIST']}>
        <div>بوابة الصيدلي</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('بوابة الصيدلي')).toBeInTheDocument();
  });

  it('should show security warning when user role is not allowed (e.g. CUSTOMER accessing ADMIN portal)', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr_cust', name: 'عميل عادي', role: 'CUSTOMER', status: 'ACTIVE' },
      token: 'valid_token',
      loading: false,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>لوحة تحكم المدير</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText(/تنبيه الصلاحيات الأمنية/i)).toBeInTheDocument();
    expect(screen.queryByText('لوحة تحكم المدير')).not.toBeInTheDocument();
  });

  it('should display account suspended view when user status is not ACTIVE', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr_1', role: 'ADMIN', status: 'SUSPENDED' },
      token: 'valid_token',
      loading: false,
      logout: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div>لوحة تحكم المدير</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText(/الحساب معطل أو موقوف/i)).toBeInTheDocument();
    expect(screen.queryByText('لوحة تحكم المدير')).not.toBeInTheDocument();
  });
});
