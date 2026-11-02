'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Cart } from '@/types';
import { CartService } from './cart.service';
import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';

interface CartContextType {
  cart: Cart;
  itemCount: number;
  addToCart: (productId: string, quantity?: number) => { success: boolean; error?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; error?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  refreshCart: () => void;
}

const defaultCart: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  requiresPrescription: false,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>(defaultCart);

  const loadCart = () => {
    try {
      const current = CartService.getCart();
      setCart(current);
    } catch {
      setCart(defaultCart);
    }
  };

  useEffect(() => {
    loadCart();

    const unsubscribe = localStorageAdapter.subscribe(STORAGE_KEYS.CART, (newVal) => {
      if (newVal) {
        setCart(newVal as Cart);
      } else {
        loadCart();
      }
    });

    return () => unsubscribe();
  }, []);

  const addToCart = (productId: string, quantity: number = 1) => {
    const res = CartService.addToCart(productId, quantity);
    if (res.success) {
      setCart(res.cart);
    }
    return res;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const res = CartService.updateQuantity(productId, quantity);
    if (res.success) {
      setCart(res.cart);
    }
    return res;
  };

  const removeFromCart = (productId: string) => {
    const res = CartService.removeFromCart(productId);
    setCart(res.cart);
  };

  const clearCart = () => {
    const res = CartService.clearCart();
    setCart(res);
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

