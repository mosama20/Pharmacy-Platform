import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import { api } from '../services/api';

// Mock dependencies
vi.mock('../services/api', () => ({
  api: {
    createOrder: vi.fn(),
    validatePromoCode: vi.fn(),
    login: vi.fn(),
    getProfile: vi.fn(),
  },
  ordersApi: {
    create: vi.fn(),
  },
}));

vi.mock('../context/CmsContext', () => ({
  useCms: () => ({
    settings: { deliveryFee: 25, freeDeliveryThreshold: 500 },
  }),
}));

const renderCheckout = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <CheckoutPage />
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
};

describe('CheckoutPage UI Resilience & Error States (Phase 14 & 15)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should render Empty Cart State when user accesses checkout with 0 items in cart', () => {
    renderCheckout();
    expect(screen.getByText(/سلة مشترياتك فارغة/i)).toBeInTheDocument();
    expect(screen.getByText(/لا توجد أدوية أو منتجات في السلة/i)).toBeInTheDocument();
  });

  describe('Form Validation & Error States (with seeded cart)', () => {
    beforeEach(() => {
      const cartSeed = [
        { id: 'p1', nameAr: 'بانادول إكسترا', price: 50, quantity: 2, image: 'img.jpg' },
      ];
      localStorage.setItem('chefaa_cart', JSON.stringify(cartSeed));
    });

    it('should display validation error when submitting with missing recipient name', async () => {
      renderCheckout();

      const submitBtn = screen.getByRole('button', { name: /تأكيد وإرسال الطلب/i });
      fireEvent.submit(submitBtn.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/يرجى إدخال اسم المستلم بالكامل/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when submitting with invalid phone number', async () => {
      renderCheckout();

      const nameInput = screen.getByPlaceholderText(/مثال: د\. محمد أحمد/i);
      fireEvent.change(nameInput, { target: { value: 'محمد أحمد' } });

      const phoneInput = screen.getByPlaceholderText(/010XXXXXXXX/i);
      fireEvent.change(phoneInput, { target: { value: '123' } }); // Too short!

      const submitBtn = screen.getByRole('button', { name: /تأكيد وإرسال الطلب/i });
      fireEvent.submit(submitBtn.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد التسليم/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when submitting with missing street address', async () => {
      renderCheckout();

      const nameInput = screen.getByPlaceholderText(/مثال: د\. محمد أحمد/i);
      fireEvent.change(nameInput, { target: { value: 'محمد أحمد' } });

      const phoneInput = screen.getByPlaceholderText(/010XXXXXXXX/i);
      fireEvent.change(phoneInput, { target: { value: '01012345678' } });

      const submitBtn = screen.getByRole('button', { name: /تأكيد وإرسال الطلب/i });
      fireEvent.submit(submitBtn.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/يرجى كتابة اسم الشارع والمنطقة بوضوح/i)).toBeInTheDocument();
      });
    });

    it('should display error alert when server rejects order submission (API Error State)', async () => {
      api.createOrder.mockRejectedValue(new Error('الكمية المطلوبة غير متوفرة حالياً بالمخزون'));

      renderCheckout();

      const nameInput = screen.getByPlaceholderText(/مثال: د\. محمد أحمد/i);
      fireEvent.change(nameInput, { target: { value: 'محمد أحمد' } });

      const phoneInput = screen.getByPlaceholderText(/010XXXXXXXX/i);
      fireEvent.change(phoneInput, { target: { value: '01012345678' } });

      const streetInput = screen.getByPlaceholderText(/مثال: شارع مصطفى النحاس، متفرع من عباس العقاد/i);
      fireEvent.change(streetInput, { target: { value: 'شارع التسعين' } });

      const submitBtn = screen.getByRole('button', { name: /تأكيد وإرسال الطلب/i });
      fireEvent.submit(submitBtn.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/الكمية المطلوبة غير متوفرة حالياً بالمخزون/i)).toBeInTheDocument();
      });
    });

    it('should complete Customer Checkout Journey and show confirmation screen (Phase 15 E2E Flow)', async () => {
      api.createOrder.mockResolvedValue({
        id: 'ord_success_999',
        orderNumber: 'CHF-2026-9999',
        total: 125,
        deliveryType: 'EXPRESS_45M',
        paymentMethod: 'CASH_ON_DELIVERY',
      });

      renderCheckout();

      const nameInput = screen.getByPlaceholderText(/مثال: د\. محمد أحمد/i);
      fireEvent.change(nameInput, { target: { value: 'سارة مصطفى' } });

      const phoneInput = screen.getByPlaceholderText(/010XXXXXXXX/i);
      fireEvent.change(phoneInput, { target: { value: '01099887766' } });

      const streetInput = screen.getByPlaceholderText(/مثال: شارع مصطفى النحاس، متفرع من عباس العقاد/i);
      fireEvent.change(streetInput, { target: { value: 'شارع الهرم، الجيزة' } });

      const submitBtn = screen.getByRole('button', { name: /تأكيد وإرسال الطلب/i });
      fireEvent.submit(submitBtn.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/تهانينا! تم تأكيد واستلام طلبك بنجاح/i)).toBeInTheDocument();
        expect(screen.getByText(/CHF-2026-9999/i)).toBeInTheDocument();
      });
    });
  });
});
