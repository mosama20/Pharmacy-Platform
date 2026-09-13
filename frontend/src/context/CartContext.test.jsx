import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { api } from '../services/api';

// Mock CmsContext to isolate CartContext logic
vi.mock('./CmsContext', () => ({
  useCms: () => ({
    settings: {
      deliveryFee: 25,
      freeDeliveryThreshold: 500,
    },
  }),
}));

// Mock api service
vi.mock('../services/api', () => ({
  api: {
    validatePromoCode: vi.fn(),
  },
}));

describe('CartContext (Unit & Business Rule Tests)', () => {
  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockProduct = {
    id: 'prod_1',
    nameAr: 'بانادول إكسترا',
    price: 50,
    image: 'panadol.jpg',
  };

  it('should initialize with an empty cart and zero totals', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cartItems).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.deliveryFee).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('should add an item to cart and calculate subtotal and delivery fee correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 2);
    });

    expect(result.current.cartItems.length).toBe(1);
    expect(result.current.cartItems[0].quantity).toBe(2);
    expect(result.current.subtotal).toBe(100); // 50 * 2
    expect(result.current.deliveryFee).toBe(25); // subtotal 100 < 500
    expect(result.current.total).toBe(125); // 100 + 25
    expect(result.current.totalCount).toBe(2);
  });

  it('should increment existing item quantity when adding the same product again', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 1);
    });
    act(() => {
      result.current.addToCart(mockProduct, 3);
    });

    expect(result.current.cartItems.length).toBe(1);
    expect(result.current.cartItems[0].quantity).toBe(4);
    expect(result.current.subtotal).toBe(200); // 50 * 4
  });

  it('should update quantity and remove item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 2);
    });
    act(() => {
      result.current.updateQuantity('prod_1', 5);
    });

    expect(result.current.cartItems[0].quantity).toBe(5);
    expect(result.current.subtotal).toBe(250);

    // Setting quantity to 0 removes the item
    act(() => {
      result.current.updateQuantity('prod_1', 0);
    });

    expect(result.current.cartItems.length).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('should apply free delivery when subtotal meets or exceeds threshold (>= 500)', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const expensiveProduct = { id: 'prod_exp', nameAr: 'جهاز سكر', price: 600 };

    act(() => {
      result.current.addToCart(expensiveProduct, 1);
    });

    expect(result.current.subtotal).toBe(600);
    expect(result.current.deliveryFee).toBe(0); // Free delivery!
    expect(result.current.total).toBe(600);
  });

  it('should apply promo code discount correctly and adjust total', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 4); // 50 * 4 = 200
    });

    api.validatePromoCode.mockResolvedValue({
      valid: true,
      code: 'WELCOME10',
      discountPercentage: 10,
      calculatedDiscount: 20,
      isFreeShipping: false,
    });

    let promoResult;
    await act(async () => {
      promoResult = await result.current.applyPromoCode('welcome10');
    });

    expect(promoResult.success).toBe(true);
    expect(result.current.appliedPromo).toBe('WELCOME10');
    expect(result.current.discountAmount).toBe(20);
    // Total = subtotal (200) + delivery (25) - discount (20) = 205
    expect(result.current.total).toBe(205);
  });

  it('should remove specific item via removeFromCart()', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 2);
      result.current.addToCart({ id: 'prod_2', nameAr: 'فيتامين سي', price: 40 }, 1);
    });

    expect(result.current.cartItems.length).toBe(2);

    act(() => {
      result.current.removeFromCart('prod_1');
    });

    expect(result.current.cartItems.length).toBe(1);
    expect(result.current.cartItems[0].id).toBe('prod_2');
    expect(result.current.subtotal).toBe(40);
  });

  it('should handle free shipping promo code and set delivery fee to 0', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 2); // 100 EGP (< 500 threshold)
    });

    expect(result.current.deliveryFee).toBe(25);

    api.validatePromoCode.mockResolvedValue({
      valid: true,
      code: 'SHIPFREE',
      isFreeShipping: true,
      calculatedDiscount: 0,
    });

    let promoResult;
    await act(async () => {
      promoResult = await result.current.applyPromoCode('shipfree');
    });

    expect(promoResult.success).toBe(true);
    expect(result.current.isFreeShippingPromo).toBe(true);
    expect(result.current.deliveryFee).toBe(0);
    expect(result.current.total).toBe(100);
  });

  it('should cap discount amount at maxDiscount when percentage exceeds cap', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 10); // 50 * 10 = 500
    });

    // 50% discount on 500 is 250, but maxDiscount is 50
    api.validatePromoCode.mockResolvedValue({
      valid: true,
      code: 'HALF50',
      discountPercentage: 50,
      maxDiscount: 50,
      isFreeShipping: false,
    });

    await act(async () => {
      await result.current.applyPromoCode('HALF50');
    });

    expect(result.current.discountAmount).toBe(50); // Capped at 50!
  });

  it('should return error message when promo code validation fails', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    api.validatePromoCode.mockRejectedValue(new Error('كود غير صالح'));

    let promoResult;
    await act(async () => {
      promoResult = await result.current.applyPromoCode('EXPIRED');
    });

    expect(promoResult.success).toBe(false);
    expect(promoResult.message).toBe('كود غير صالح');
  });

  it('should clear all cart items and reset discounts upon clearCart()', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProduct, 2);
      result.current.clearCart();
    });

    expect(result.current.cartItems).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.appliedPromo).toBeNull();
  });
});

