'use client';

import React from 'react';
import { AuthProvider } from '@/features/auth/auth.context';
import { CartProvider } from '@/features/cart/cart.context';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
