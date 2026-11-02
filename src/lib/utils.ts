import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OrderStatus, AppointmentStatus, PrescriptionStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return timeStr;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['REFUND_PENDING'],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  const allowed = ORDER_STATUS_FLOW[current] || [];
  return allowed.includes(next);
}

export const APPOINTMENT_STATUS_FLOW: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function canTransitionAppointmentStatus(current: AppointmentStatus, next: AppointmentStatus): boolean {
  if (current === next) return true;
  const allowed = APPOINTMENT_STATUS_FLOW[current] || [];
  return allowed.includes(next);
}

export function getOrderStatusBadge(status: OrderStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'PLACED':
      return { label: 'Placed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'CONFIRMED':
      return { label: 'Confirmed', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'PROCESSING':
      return { label: 'Processing', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'PACKED':
      return { label: 'Packed', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'SHIPPED':
      return { label: 'Shipped', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', bg: 'bg-tealbrand-50', text: 'text-tealbrand-700', border: 'border-tealbrand-300' };
    case 'DELIVERED':
      return { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'REFUND_PENDING':
      return { label: 'Refund Pending', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'REFUNDED':
      return { label: 'Refunded', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getAppointmentStatusBadge(status: AppointmentStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'CONFIRMED':
      return { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'COMPLETED':
      return { label: 'Completed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'REJECTED':
      return { label: 'Declined', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getPrescriptionStatusBadge(status: PrescriptionStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'PENDING_REVIEW':
      return { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'APPROVED':
      return { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'REJECTED':
      return { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}
