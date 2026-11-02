import { describe, it, expect, beforeEach } from 'vitest';
import { CartService } from '@/features/cart/cart.service';
import { ProductService } from '@/features/products/product.service';
import { OrderService } from '@/features/orders/order.service';
import { PrescriptionService } from '@/features/prescriptions/prescription.service';
import { resetDemoData } from '@/data/seed';
import { Address } from '@/types';

const testAddress: Address = {
  id: 'addr_test',
  fullName: 'Ananya Verma',
  phone: '+91 98222 33445',
  addressLine1: 'Flat 402, Green Glen Heights',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560103',
};

describe('Cart, Prescription & Checkout Flows', () => {
  beforeEach(() => {
    resetDemoData();
    CartService.clearCart();
  });

  it('7. should add items to cart, update quantity, and remove items', () => {
    // Add prod_1 (Multivitamin)
    const addRes = CartService.addToCart('prod_1', 2);
    expect(addRes.success).toBe(true);
    expect(addRes.cart.items.length).toBe(1);
    expect(addRes.cart.items[0].quantity).toBe(2);

    // Update quantity
    const updateRes = CartService.updateQuantity('prod_1', 4);
    expect(updateRes.success).toBe(true);
    expect(updateRes.cart.items[0].quantity).toBe(4);

    // Remove item
    const removeRes = CartService.removeFromCart('prod_1');
    expect(removeRes.success).toBe(true);
    expect(removeRes.cart.items.length).toBe(0);
  });

  it('8. should prevent adding or updating quantity beyond available stock', () => {
    const prod = ProductService.getProductById('prod_1')!;
    const excessiveQty = prod.stock + 10;

    const res = CartService.addToCart('prod_1', excessiveQty);
    expect(res.success).toBe(false);
    expect(res.error).toContain('available in stock');
  });

  it('9. should require approved demo prescription status for restricted items', () => {
    // Patient 4 (Arjun Kapoor) does NOT have an approved prescription
    CartService.addToCart('prod_18', 1); // prod_18 is CardiaShield (requires prescription)

    const checkoutRes = OrderService.checkout({
      patientId: 'usr_pat_4',
      patientName: 'Arjun Kapoor',
      patientEmail: 'arjun@example.com',
      patientPhone: '+91 98555 66778',
      shippingAddress: testAddress,
      paymentAction: 'SUCCESS',
    });

    expect(checkoutRes.success).toBe(false);
    expect(checkoutRes.error).toContain('require a verified doctor prescription');
  });

  it('10. successful simulated payment creates an order and reduces product stock', () => {
    const prodBefore = ProductService.getProductById('prod_1')!;
    const initialStock = prodBefore.stock;

    CartService.addToCart('prod_1', 3);

    const checkoutRes = OrderService.checkout({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      shippingAddress: testAddress,
      paymentAction: 'SUCCESS',
    });

    expect(checkoutRes.success).toBe(true);
    expect(checkoutRes.order?.status).toBe('PLACED');
    expect(checkoutRes.order?.items[0].quantity).toBe(3);

    // Stock must have decreased by 3
    const prodAfter = ProductService.getProductById('prod_1')!;
    expect(prodAfter.stock).toBe(initialStock - 3);

    // Cart must be cleared
    const cartAfter = CartService.getCart();
    expect(cartAfter.items.length).toBe(0);
  });

  it('11. failed or cancelled payment does not create a paid order or reduce stock', () => {
    const prodBefore = ProductService.getProductById('prod_6')!;
    const initialStock = prodBefore.stock;

    CartService.addToCart('prod_6', 2);

    // Simulate failure
    const failedCheckout = OrderService.checkout({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      shippingAddress: testAddress,
      paymentAction: 'FAIL',
    });

    expect(failedCheckout.success).toBe(false);
    expect(failedCheckout.order).toBeUndefined();

    // Stock must remain intact
    const prodAfterFail = ProductService.getProductById('prod_6')!;
    expect(prodAfterFail.stock).toBe(initialStock);

    // Simulate cancellation
    const cancelCheckout = OrderService.checkout({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      shippingAddress: testAddress,
      paymentAction: 'CANCEL',
    });

    expect(cancelCheckout.success).toBe(false);
    const prodAfterCancel = ProductService.getProductById('prod_6')!;
    expect(prodAfterCancel.stock).toBe(initialStock);
  });
});
