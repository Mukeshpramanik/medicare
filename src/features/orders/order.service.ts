import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Order, OrderItem, OrderStatus, Address, Product } from '@/types';
import { generateId, canTransitionOrderStatus } from '@/lib/utils';
import { CartService } from '@/features/cart/cart.service';
import { ProductService } from '@/features/products/product.service';
import { PrescriptionService } from '@/features/prescriptions/prescription.service';
import { PaymentService, PaymentSimulationAction } from '@/features/payments/payment.service';
import { NotificationService } from '@/features/notifications/notification.service';
import { addActivityLog } from '@/features/admin/admin.service';

export interface CheckoutInput {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  shippingAddress: Address;
  paymentAction: PaymentSimulationAction;
  paymentMethod?: string;
}

export class OrderService {
  static getOrders(): Order[] {
    return localStorageAdapter.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  static getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  }

  static getOrdersByPatient(patientId: string): Order[] {
    return this.getOrders()
      .filter((o) => o.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static checkout(input: CheckoutInput): {
    success: boolean;
    order?: Order;
    error?: string;
  } {
    const cart = CartService.getCart();

    if (cart.items.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    // 1. Stock verification
    const products = ProductService.getProducts();
    for (const item of cart.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || !prod.isActive) {
        return { success: false, error: `Product "${item.product.name}" is no longer available.` };
      }
      if (prod.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Only ${prod.stock} available.`,
        };
      }
    }

    // 2. Prescription verification
    if (cart.requiresPrescription) {
      const hasApproved = PrescriptionService.hasApprovedPrescription(input.patientId);
      if (!hasApproved) {
        return {
          success: false,
          error:
            'One or more items in your cart require a verified doctor prescription. Please submit a prescription for demo review before proceeding.',
        };
      }
    }

    const orderId = generateId('ord');

    // 3. Simulated Payment Execution
    const paymentResult = PaymentService.simulatePayment({
      userId: input.patientId,
      amount: cart.total,
      purpose: 'PRODUCT_ORDER',
      relatedEntityId: orderId,
      paymentMethod: input.paymentMethod || 'Simulated Payment Card',
      action: input.paymentAction,
    });

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error || 'Simulated payment was not completed.',
      };
    }

    // 4. Payment was successful -> Decrement Stock atomically
    for (const item of cart.items) {
      const prodIndex = products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.quantity);
      }
    }
    localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);

    // 5. Build order snapshot
    const orderItems: OrderItem[] = cart.items.map((ci) => ({
      productId: ci.productId,
      productName: ci.product.name,
      productImage: ci.product.imageUrl,
      category: ci.product.category,
      quantity: ci.quantity,
      priceSnapshot: ci.priceSnapshot,
      totalPrice: ci.priceSnapshot * ci.quantity,
      requiresPrescription: ci.product.requiresPrescription,
    }));

    const nowIso = new Date().toISOString();
    const estDeliveryDate = new Date();
    estDeliveryDate.setDate(estDeliveryDate.getDate() + 3);

    const approvedRx = cart.requiresPrescription
      ? PrescriptionService.getPrescriptionsByPatient(input.patientId).find((p) => p.status === 'APPROVED')?.id
      : undefined;

    const newOrder: Order = {
      id: orderId,
      patientId: input.patientId,
      patientName: input.patientName,
      patientEmail: input.patientEmail,
      patientPhone: input.patientPhone,
      items: orderItems,
      shippingAddress: input.shippingAddress,
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      discount: cart.discount,
      total: cart.total,
      status: 'PLACED',
      statusHistory: [
        {
          status: 'PLACED',
          changedAt: nowIso,
          changedBy: input.patientId,
          note: `Order placed via simulated payment (Ref: ${paymentResult.payment.transactionRef}).`,
        },
      ],
      paymentId: paymentResult.payment.id,
      prescriptionRequestId: approvedRx,
      createdAt: nowIso,
      updatedAt: nowIso,
      estimatedDeliveryDate: estDeliveryDate.toISOString().split('T')[0],
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    localStorageAdapter.setItem(STORAGE_KEYS.ORDERS, orders);

    // 6. Clear Cart
    CartService.clearCart();

    // 7. Notifications & Activity Logs
    NotificationService.createNotification({
      userId: input.patientId,
      title: 'Order Placed Successfully!',
      message: `Your order #${newOrder.id} for ${cart.items.length} items (Total: ₹${cart.total}) has been placed.`,
      type: 'success',
      link: '/dashboard/patient?tab=orders',
    });

    addActivityLog({
      userId: input.patientId,
      userName: input.patientName,
      action: 'ORDER_PLACED',
      details: `Placed order ${newOrder.id} with ${cart.items.length} items (Total ₹${cart.total})`,
      entityType: 'ORDER',
      entityId: newOrder.id,
    });

    return { success: true, order: newOrder };
  }

  static updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string
  ): { success: boolean; order?: Order; error?: string } {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Order not found.' };
    }

    const order = orders[orderIndex];

    if (!canTransitionOrderStatus(order.status, newStatus)) {
      return {
        success: false,
        error: `Cannot transition order status from ${order.status} to ${newStatus}.`,
      };
    }

    const nowIso = new Date().toISOString();

    // If cancelling, restore stock
    if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
      const products = ProductService.getProducts();
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
        }
      });
      localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, products);

      // Refund payment in demo
      if (order.paymentId) {
        PaymentService.refundPayment(order.paymentId, 'Order cancelled by patient/admin');
      }
    }

    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: nowIso,
      statusHistory: [
        ...order.statusHistory,
        {
          status: newStatus,
          changedAt: nowIso,
          changedBy,
          note: note || `Order updated to ${newStatus}`,
        },
      ],
    };

    orders[orderIndex] = updatedOrder;
    localStorageAdapter.setItem(STORAGE_KEYS.ORDERS, orders);

    // Notify patient
    NotificationService.createNotification({
      userId: order.patientId,
      title: `Order Status: ${newStatus}`,
      message: `Your order #${order.id} status is now ${newStatus.replace('_', ' ')}.${note ? ` Note: ${note}` : ''}`,
      type: newStatus === 'DELIVERED' ? 'success' : newStatus === 'CANCELLED' ? 'error' : 'info',
      link: '/dashboard/patient?tab=orders',
    });

    addActivityLog({
      userId: changedBy,
      userName: 'User / Admin',
      action: `ORDER_${newStatus}`,
      details: `Order #${order.id} moved to ${newStatus}: ${note || ''}`,
      entityType: 'ORDER',
      entityId: order.id,
    });

    return { success: true, order: updatedOrder };
  }

  static cancelOrder(
    orderId: string,
    patientId: string,
    reason?: string
  ): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    if (order.patientId !== patientId) {
      return { success: false, error: 'Unauthorized to cancel this order.' };
    }

    if (order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      return { success: false, error: `Order cannot be cancelled after dispatch (${order.status}).` };
    }

    return this.updateOrderStatus(orderId, 'CANCELLED', patientId, reason || 'Cancelled by patient');
  }
}
