import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCms } from './CmsContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { settings } = useCms();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('app_cart') || localStorage.getItem('chefaa_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isFreeShippingPromo, setIsFreeShippingPromo] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const prodId = product.id || product.productId;
      const existing = prev.find((item) => (item.id || item.productId) === prodId);
      if (existing) {
        return prev.map((item) =>
          (item.id || item.productId) === prodId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: prodId,
          productId: prodId,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          activeIngredient: product.activeIngredient,
          category: product.category,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          isPrescriptionRequired: product.isPrescriptionRequired,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        (item.id === productId || item.productId === productId) ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId && item.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(null);
    setDiscountAmount(0);
    setIsFreeShippingPromo(false);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const applyPromoCode = async (code) => {
    const clean = code.trim().toUpperCase();
    try {
      const res = await api.validatePromoCode(clean, subtotal, cartItems);
      if (res) {
        setAppliedPromo(clean);
        const freeShip = Boolean(res.isFreeShipping);
        setIsFreeShippingPromo(freeShip);

        let disc = 0;
        if (res.calculatedDiscount !== undefined) {
          disc = res.calculatedDiscount;
        } else if (res.discountPercentage) {
          const base = res.eligibleSubtotal !== undefined ? res.eligibleSubtotal : subtotal;
          disc = Math.min(
            Math.round((base * res.discountPercentage) / 100),
            res.maxDiscount || 9999,
          );
        }
        setDiscountAmount(disc);

        let msg = `تم تطبيق كود الخصم (${clean}) بنجاح!`;
        if (freeShip && disc > 0) {
          msg = `تم تفعيل الشحن المجاني وخصم ${disc} ج.م بنجاح!`;
        } else if (freeShip) {
          msg = `تم تفعيل الشحن المجاني بنجاح بكود الخصم!`;
        } else if (disc > 0) {
          msg = `تم تطبيق كود الخصم بنجاح! تم توفير ${disc} ج.م`;
        }
        return { success: true, message: msg };
      }
    } catch (e) {
      return { success: false, message: e.message || 'كود الخصم غير صالح أو منتهي الصلاحية' };
    }
    return { success: false, message: 'كود الخصم غير صالح أو منتهي الصلاحية' };
  };

  const standardFee = settings?.deliveryFee !== undefined ? Number(settings.deliveryFee) : 25;
  const freeThreshold = settings?.freeDeliveryThreshold !== undefined ? Number(settings.freeDeliveryThreshold) : 500;
  const deliveryFee = (isFreeShippingPromo || subtotal >= freeThreshold || subtotal === 0) ? 0 : standardFee;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyPromoCode,
        appliedPromo,
        isFreeShippingPromo,
        discountAmount,
        subtotal,
        deliveryFee,
        total,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
