import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Payment, PaymentStatus } from '@/types';
import { generateId } from '@/lib/utils';
import { addActivityLog } from '@/features/admin/admin.service';

export type PaymentSimulationAction = 'SUCCESS' | 'FAIL' | 'CANCEL';

export interface InitiatePaymentParams {
  userId: string;
  amount: number;
  purpose: 'APPOINTMENT' | 'PRODUCT_ORDER';
  relatedEntityId: string;
  paymentMethod?: string;
  action: PaymentSimulationAction;
}

export class PaymentService {
  static getPayments(): Payment[] {
    return localStorageAdapter.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
  }

  static getPaymentById(id: string): Payment | undefined {
    return this.getPayments().find((p) => p.id === id);
  }

  static getPaymentsByUser(userId: string): Payment[] {
    return this.getPayments()
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static simulatePayment(params: InitiatePaymentParams): {
    success: boolean;
    payment: Payment;
    error?: string;
  } {
    const payments = this.getPayments();
    const paymentId = generateId('pay');
    const nowIso = new Date().toISOString();
    const txnRef = `SIM_TXN_${params.purpose === 'APPOINTMENT' ? 'APT' : 'ORD'}_${Math.floor(100000 + Math.random() * 900000)}`;

    let finalStatus: PaymentStatus;
    let errorMessage: string | undefined;

    switch (params.action) {
      case 'SUCCESS':
        finalStatus = 'SUCCESS';
        break;
      case 'FAIL':
        finalStatus = 'FAILED';
        errorMessage = 'Simulated payment failed (card declined / bank unavailable in simulation).';
        break;
      case 'CANCEL':
      default:
        finalStatus = 'CANCELLED';
        errorMessage = 'Payment was cancelled by user during simulated checkout.';
        break;
    }

    const newPayment: Payment = {
      id: paymentId,
      transactionRef: txnRef,
      userId: params.userId,
      amount: params.amount,
      currency: 'INR',
      status: finalStatus,
      paymentMethod: params.paymentMethod || 'Simulated Instant UPI / Card',
      purpose: params.purpose,
      relatedEntityId: params.relatedEntityId,
      createdAt: nowIso,
      updatedAt: nowIso,
      isSimulatedDemo: true,
    };

    payments.unshift(newPayment);
    localStorageAdapter.setItem(STORAGE_KEYS.PAYMENTS, payments);

    addActivityLog({
      userId: params.userId,
      userName: 'User',
      action: `PAYMENT_${finalStatus}`,
      details: `Simulated payment of ₹${params.amount} for ${params.purpose} resulted in ${finalStatus}.`,
      entityType: 'ORDER',
      entityId: params.relatedEntityId,
    });

    return {
      success: finalStatus === 'SUCCESS',
      payment: newPayment,
      error: errorMessage,
    };
  }

  static refundPayment(paymentId: string, reason?: string): { success: boolean; payment?: Payment; error?: string } {
    const payments = this.getPayments();
    const target = payments.find((p) => p.id === paymentId);
    if (!target) {
      return { success: false, error: 'Payment record not found.' };
    }
    if (target.status !== 'SUCCESS') {
      return { success: false, error: `Only successful payments can be refunded. Current: ${target.status}` };
    }

    target.status = 'REFUNDED';
    target.updatedAt = new Date().toISOString();
    localStorageAdapter.setItem(STORAGE_KEYS.PAYMENTS, payments);

    addActivityLog({
      userId: target.userId,
      userName: 'User',
      action: 'PAYMENT_REFUNDED',
      details: `Refunded simulated payment of ₹${target.amount} (Ref: ${target.transactionRef}). Reason: ${reason || 'User cancelled order'}`,
      entityType: 'ORDER',
      entityId: target.relatedEntityId,
    });

    return { success: true, payment: target };
  }
}
