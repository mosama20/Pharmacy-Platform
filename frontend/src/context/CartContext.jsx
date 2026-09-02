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

  useEffect(() => {
    localStorage.setItem('app_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
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
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(null);
    setDiscountAmount(0);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const applyPromoCode = async (code) => {
    const clean = code.trim().toUpperCase();
    try {
      const res = await api.validatePromoCode(clean, subtotal);
      if (res && res.discountPercentage) {
        setAppliedPromo(clean);
        const disc = Math.min(
          Math.round((subtotal * res.discountPercentage) / 100),
          res.maxDiscount || 9999
        );
        setDiscountAmount(disc);
        return { success: true, message: `تم تطبيق كود الخصم (${res.discountPercentage}%) بنجاح! تم توفير ${disc} ج.م` };
      }
    } catch (e) {
      return { success: false, message: e.message || 'كود الخصم غير صالح أو منتهي الصلاحية' };
    }
    return { success: false, message: 'كود الخصم غير صالح أو منتهي الصلاحية' };
  };

  const standardFee = settings?.deliveryFee !== undefined ? Number(settings.deliveryFee) : 25;
  const freeThreshold = settings?.freeDeliveryThreshold !== undefined ? Number(settings.freeDeliveryThreshold) : 500;
  const deliveryFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : standardFee;
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
