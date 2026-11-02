import { describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '@/features/orders/order.service';
import { ProductService } from '@/features/products/product.service';
import { DoctorService } from '@/features/doctors/doctor.service';
import { resetDemoData, isDataSeeded } from '@/data/seed';
import { canTransitionOrderStatus } from '@/lib/utils';

describe('Order Status Transitions, Admin Management & Reset', () => {
  beforeEach(() => {
    resetDemoData();
  });

  it('12. validates order status transitions according to lifecycle map', () => {
    // Valid transitions
    expect(canTransitionOrderStatus('PLACED', 'CONFIRMED')).toBe(true);
    expect(canTransitionOrderStatus('CONFIRMED', 'PROCESSING')).toBe(true);
    expect(canTransitionOrderStatus('PROCESSING', 'PACKED')).toBe(true);
    expect(canTransitionOrderStatus('PACKED', 'SHIPPED')).toBe(true);
    expect(canTransitionOrderStatus('SHIPPED', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransitionOrderStatus('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);

    // Invalid backwards or jump transitions
    expect(canTransitionOrderStatus('DELIVERED', 'PLACED')).toBe(false);
    expect(canTransitionOrderStatus('PACKED', 'PLACED')).toBe(false);
    expect(canTransitionOrderStatus('PLACED', 'DELIVERED')).toBe(false);

    // Service level rejection
    const orders = OrderService.getOrders();
    const targetOrder = orders.find((o) => o.status === 'PLACED')!;

    // Trying to jump directly from PLACED to DELIVERED must fail
    const invalidRes = OrderService.updateOrderStatus(targetOrder.id, 'DELIVERED', 'Admin');
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toContain('Cannot transition');

    // Valid transition PLACED -> CONFIRMED must succeed
    const validRes = OrderService.updateOrderStatus(targetOrder.id, 'CONFIRMED', 'Admin');
    expect(validRes.success).toBe(true);
    expect(validRes.order?.status).toBe('CONFIRMED');
  });

  it('13. supports admin product and inventory stock management', () => {
    // Create new product
    const createRes = ProductService.createProduct({
      name: 'Clinical Digital Glucometer Strips 50s',
      category: 'monitoring',
      description: 'Accurate enzyme glucose sensor strips.',
      usageInfo: 'Single use diagnostic test strip.',
      packSize: 'Vial of 50 Strips',
      price: 650,
      stock: 40,
      sku: 'DEV-GLU-NEW',
      isActive: true,
      requiresPrescription: false,
      imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300',
      tags: ['diabetes', 'glucose'],
    });

    expect(createRes.success).toBe(true);
    const newId = createRes.product!.id;

    // Update stock directly
    const stockRes = ProductService.updateProductStock(newId, 120);
    expect(stockRes.success).toBe(true);
    expect(ProductService.getProductById(newId)?.stock).toBe(120);

    // Toggle active
    const toggleRes = ProductService.toggleProductActive(newId);
    expect(toggleRes.success).toBe(true);
    expect(ProductService.getProductById(newId)?.isActive).toBe(false);
  });

  it('14. resetDemoData restores all initial seed collections', () => {
    // Make changes: add a product and book a slot
    ProductService.createProduct({
      name: 'Temporary Test Product',
      category: 'hygiene',
      description: 'Temporary item',
      usageInfo: 'None',
      packSize: '1',
      price: 99,
      stock: 10,
      sku: 'TEMP-01',
      isActive: true,
      requiresPrescription: false,
      imageUrl: '',
      tags: [],
    });

    expect(ProductService.getProducts().some((p) => p.name === 'Temporary Test Product')).toBe(true);

    // Now execute factory reset
    resetDemoData();

    // The temporary product should no longer exist, and initial seed data is restored
    expect(ProductService.getProducts().some((p) => p.name === 'Temporary Test Product')).toBe(false);
    expect(isDataSeeded()).toBe(true);
    expect(DoctorService.getDoctors().length).toBeGreaterThanOrEqual(8);
    expect(ProductService.getProducts().length).toBeGreaterThanOrEqual(20);
  });
});

