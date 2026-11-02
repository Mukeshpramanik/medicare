'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Truck,
  MapPin,
  Lock,
  FileText,
  Upload,
  ChevronRight,
  ArrowRight,
  Package,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth.context';
import { useCart } from '@/features/cart/cart.context';
import { OrderService } from '@/features/orders/order.service';
import { PrescriptionService } from '@/features/prescriptions/prescription.service';
import { Address, Order, PrescriptionRequest } from '@/types';
import { formatCurrency, formatDate, getOrderStatusBadge } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const { success, error, warning } = useToast();

  const [shippingAddress, setShippingAddress] = useState<Address>({
    id: 'addr_checkout',
    fullName: currentUser?.name || 'Ananya Verma',
    phone: currentUser?.phone || '+91 98222 33445',
    addressLine1: 'Flat 402, Green Glen Heights',
    addressLine2: 'Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560103',
    isDefault: true,
  });

  const [paymentAction, setPaymentAction] = useState<'SUCCESS' | 'FAIL' | 'CANCEL'>('SUCCESS');
  const [paymentMethod, setPaymentMethod] = useState('Simulated UPI / Cards');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Prescription verification state
  const [hasApprovedRx, setHasApprovedRx] = useState(false);
  const [patientPrescriptions, setPatientPrescriptions] = useState<PrescriptionRequest[]>([]);
  const [demoUploadFile, setDemoUploadFile] = useState<string>('doctor_prescription_scan.pdf');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (currentUser?.patientProfile?.addresses?.[0]) {
      setShippingAddress(currentUser.patientProfile.addresses[0]);
    }

    if (currentUser) {
      const rxList = PrescriptionService.getPrescriptionsByPatient(currentUser.id);
      setPatientPrescriptions(rxList);
      setHasApprovedRx(PrescriptionService.hasApprovedPrescription(currentUser.id));
    }
  }, [isAuthenticated, currentUser, router]);

  const handleDemoUploadPrescription = () => {
    if (!currentUser) return;
    const res = PrescriptionService.uploadPrescription(
      currentUser.id,
      currentUser.name,
      demoUploadFile,
      'Submitted during checkout flow for demonstration.'
    );
    if (res.success && res.prescription) {
      // In demo mode, automatically approve or offer quick approve
      PrescriptionService.reviewPrescription(
        res.prescription.id,
        'APPROVED',
        'Clinical Pharmacist (Demo Verified)',
        'Verified demo prescription for checkout testing.'
      );
      setHasApprovedRx(true);
      setPatientPrescriptions(PrescriptionService.getPrescriptionsByPatient(currentUser.id));
      success('Demo prescription uploaded & instantly approved for demo checkout!');
    }
  };

  const handlePlaceOrder = () => {
    if (!currentUser) return;

    if (cart.items.length === 0 && !createdOrder) {
      error('Your cart is empty.');
      router.push('/products');
      return;
    }

    if (cart.requiresPrescription && !hasApprovedRx) {
      error('Please submit or verify a prescription for restricted items before completing checkout.');
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.postalCode) {
      error('Please provide a complete shipping address.');
      return;
    }

    if (paymentAction === 'CANCEL') {
      warning('Payment was cancelled by user. Order was not created.');
      return;
    }

    if (paymentAction === 'FAIL') {
      error('Simulated payment failed (card declined in simulation). Please retry.');
      return;
    }

    setIsSubmitting(true);

    const res = OrderService.checkout({
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientEmail: currentUser.email,
      patientPhone: shippingAddress.phone || currentUser.phone || '+91 98000 00000',
      shippingAddress,
      paymentAction,
      paymentMethod,
    });

    setIsSubmitting(false);

    if (res.success && res.order) {
      setCreatedOrder(res.order);
      success('Order placed successfully!');
    } else {
      error(res.error || 'Failed to place order.');
    }
  };

  // Order Confirmation View
  if (createdOrder) {
    const badge = getOrderStatusBadge(createdOrder.status);
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Order Confirmed!</h1>
          <p className="text-sm text-slate-600">
            Thank you, {createdOrder.patientName}. Your order has been placed with simulated payment.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-400 font-mono">ORDER ID</div>
              <div className="text-base font-bold text-slate-900">{createdOrder.id}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">ESTIMATED DELIVERY</div>
              <div className="text-sm font-bold text-tealbrand-700">
                {formatDate(createdOrder.estimatedDeliveryDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">STATUS</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Timeline visualization */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Simulated Delivery Timeline
            </h4>
            <div className="relative border-l-2 border-brand-500 ml-4 space-y-6 pb-2">
              {createdOrder.statusHistory.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-brand-600 border-2 border-white" />
                  <div className="text-xs font-bold text-slate-900">{step.status.replace('_', ' ')}</div>
                  <div className="text-[11px] text-slate-500">{step.note}</div>
                  <div className="text-[10px] text-slate-400">{formatDate(step.changedAt)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Purchased Items</h4>
            <div className="divide-y divide-slate-100">
              {createdOrder.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">{item.productName}</span>
                      <span className="text-slate-400 block">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Shipping */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Delivery Address:</span>
              <span className="font-medium text-slate-800">
                {createdOrder.shippingAddress.addressLine1}, {createdOrder.shippingAddress.city} - {createdOrder.shippingAddress.postalCode}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-slate-400 block">Total Amount Paid:</span>
              <span className="text-lg font-extrabold text-brand-700">{formatCurrency(createdOrder.total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => router.push('/dashboard/patient?tab=orders')}
            >
              View Order in Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cart" className="hover:text-slate-800">Cart</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-medium">Checkout</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Checkout & Simulated Payment
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Provide shipping address and select simulated payment resolution.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 cols: Address + Prescription Verification + Payment options */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>1. Shipping & Delivery Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={shippingAddress.fullName}
                onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
              />
              <Input
                label="Contact Phone"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
              />
            </div>

            <Input
              label="Street Address / Flat / Building"
              value={shippingAddress.addressLine1}
              onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              />
              <Input
                label="State"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
              />
              <Input
                label="Postal Code"
                value={shippingAddress.postalCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
              />
            </div>
          </div>

          {/* Prescription Check (if required) */}
          {cart.requiresPrescription && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
                <FileText className="w-4 h-4 text-tealbrand-600" />
                <span>2. Doctor Prescription Verification (Demo Flow)</span>
              </div>

              {hasApprovedRx ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5">Prescription Verified for this Patient:</strong>
                    You have an approved prescription on file. Demo order dispensing is authorized.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-0.5">Verification Required:</strong>
                      Cart includes prescription-required demo pharmaceuticals. Submit a fictional demo prescription document below to approve this order.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={demoUploadFile}
                      onChange={(e) => setDemoUploadFile(e.target.value)}
                      placeholder="prescription_scan.pdf"
                      className="text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white flex-1"
                    />
                    <Button variant="teal" size="sm" onClick={handleDemoUploadPrescription}>
                      <Upload className="w-3.5 h-3.5 mr-1" /> Upload & Verify
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Method & Simulation Control */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-sm text-slate-900">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>{cart.requiresPrescription ? '3.' : '2.'} Payment Simulation Engine</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
              <Lock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Safe Demo Environment:</strong>
                No real payment gateway is called. No card numbers or passwords collected. Choose your test outcome:
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Simulation Outcome
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAction('SUCCESS')}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition ${
                    paymentAction === 'SUCCESS'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ✓ Success
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAction('FAIL')}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition ${
                    paymentAction === 'FAIL'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 font-bold ring-2 ring-rose-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ✕ Simulate Fail
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAction('CANCEL')}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition ${
                    paymentAction === 'CANCEL'
                      ? 'border-slate-600 bg-slate-100 text-slate-900 font-bold ring-2 ring-slate-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ⊘ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Order summary and Place Order CTA */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Items in Order ({cart.items.length})
            </h2>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cart.items.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 line-clamp-1">{item.product.name}</div>
                      <div className="text-slate-400">Qty: {item.quantity} × {formatCurrency(item.priceSnapshot)}</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(item.priceSnapshot * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-bold text-slate-800">
                  {cart.deliveryFee === 0 ? 'FREE' : formatCurrency(cart.deliveryFee)}
                </span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Savings:</span>
                  <span className="font-bold">-{formatCurrency(cart.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
                <span className="font-bold text-slate-900">Total Payable:</span>
                <span className="font-black text-brand-700">{formatCurrency(cart.total)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting || (cart.requiresPrescription && !hasApprovedRx)}
              isLoading={isSubmitting}
              onClick={handlePlaceOrder}
            >
              Simulate Pay & Place Order ({formatCurrency(cart.total)})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
