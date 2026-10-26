import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { getDefaultProductVariant } from '../data/products';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, selectedWeight?: string, quantity?: number) => void;
  removeItem: (productId: string, selectedWeight: string) => void;
  updateQuantity: (productId: string, selectedWeight: string, quantity: number) => void;
  clearCart: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  couponCode: string;
  discount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  delivery: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const FREE_SHIPPING_THRESHOLD = 799;
export const STANDARD_DELIVERY_FEE = 60;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sjt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState<string>(() => {
    return localStorage.getItem('sjt_coupon') || '';
  });
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(() => {
    return localStorage.getItem('sjt_coupon') ? 10 : 0;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sjt_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addItem = (product: Product, selectedWeight?: string, quantity: number = 1) => {
    const weight = selectedWeight || getDefaultProductVariant(product);
    const price = product.weightPrices[weight] || product.price;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.selectedWeight === weight
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevItems, { product, selectedWeight: weight, price, quantity }];
      }
    });

    setIsDrawerOpen(true);
  };

  const removeItem = (productId: string, selectedWeight: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.selectedWeight === selectedWeight)
      )
    );
  };

  const updateQuantity = (productId: string, selectedWeight: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, selectedWeight);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId && item.selectedWeight === selectedWeight) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponDiscountPercent(0);
    localStorage.removeItem('sjt_cart');
    localStorage.removeItem('sjt_coupon');
  };

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'FIRSTCUP10' || cleanCode === 'SJT10' || cleanCode === 'FRESHAROMA') {
      setCouponCode(cleanCode);
      setCouponDiscountPercent(10);
      localStorage.setItem('sjt_coupon', cleanCode);
      return { success: true, message: 'Coupon applied! 10% discount added.' };
    } else if (cleanCode === 'FARM20') {
      setCouponCode(cleanCode);
      setCouponDiscountPercent(20);
      localStorage.setItem('sjt_coupon', cleanCode);
      return { success: true, message: 'Super coupon! 20% discount applied.' };
    } else {
      return { success: false, message: 'Invalid coupon code. Try FIRSTCUP10 or FARM20' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscountPercent(0);
    localStorage.removeItem('sjt_coupon');
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = Math.round((subtotal * couponDiscountPercent) / 100);
  const delivery = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const total = Math.max(0, subtotal - discount + delivery);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isDrawerOpen,
        setIsDrawerOpen,
        couponCode,
        discount,
        applyCoupon,
        removeCoupon,
        subtotal,
        delivery,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
