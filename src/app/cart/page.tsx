'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '@/features/cart/cart.context';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 w-full">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="Browse our pharmacy essentials, daily wellness nutrition, and clinical diagnostics."
          actionText="Explore Healthcare Store"
          onAction={() => router.push('/products')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/products" className="hover:text-slate-800">Healthcare Store</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-medium">Shopping Cart</span>
      </div>

      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your healthcare products, adjust quantities, and proceed to checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.requiresPrescription && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Prescription Required for Some Items:</strong>
                Your cart contains items that require an approved doctor prescription before order dispatch. You will be able to verify or upload your prescription document during checkout.
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {cart.items.map((item) => (
              <div key={item.productId} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="font-bold text-slate-900 text-sm hover:text-brand-600 transition">
                          {item.product.name}
                        </h3>
                      </Link>
                      {item.product.requiresPrescription && (
                        <Badge variant="warning" size="sm">Rx</Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">{item.product.category} • {item.product.packSize}</div>
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.priceSnapshot)} <span className="text-xs font-normal text-slate-400">each</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right min-w-[90px]">
                    <div className="text-base font-extrabold text-slate-900">
                      {formatCurrency(item.priceSnapshot * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 mt-1 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery Fee:</span>
                {cart.deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-bold text-slate-800">{formatCurrency(cart.deliveryFee)}</span>
                )}
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Cart Savings:</span>
                  <span className="font-bold">-{formatCurrency(cart.discount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base">
                <span className="font-bold text-slate-900">Estimated Total:</span>
                <span className="font-black text-brand-700">{formatCurrency(cart.total)}</span>
              </div>
            </div>

            {cart.deliveryFee > 0 && (
              <div className="p-3 rounded-xl bg-tealbrand-50/60 border border-tealbrand-100 text-[11px] text-tealbrand-800">
                Add {formatCurrency(1000 - cart.subtotal)} more to qualify for <strong>FREE Delivery</strong>!
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-tealbrand-600" />
              <span>Simulated demo checkout • No card charges</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

