import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { ActivityLog, User, Doctor, Appointment, Order, Product } from '@/types';
import { generateId } from '@/lib/utils';

export function getActivityLogs(): ActivityLog[] {
  const logs = localStorageAdapter.getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addActivityLog(
  log: Omit<ActivityLog, 'id' | 'createdAt'>
): ActivityLog {
  const logs = localStorageAdapter.getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  const newLog: ActivityLog = {
    ...log,
    id: generateId('act'),
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  // Keep last 150 activity items to prevent memory bloat
  const trimmed = logs.slice(0, 150);
  localStorageAdapter.setItem(STORAGE_KEYS.ACTIVITY_LOGS, trimmed);
  return newLog;
}

export interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  activeDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalOrders: number;
  pendingOrders: number;
  simulatedRevenue: number;
  lowStockCount: number;
  pendingPrescriptions: number;
}

export function getAdminStats(): AdminStats {
  const users = localStorageAdapter.getItem<User[]>(STORAGE_KEYS.USERS, []);
  const doctors = localStorageAdapter.getItem<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
  const appointments = localStorageAdapter.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  const orders = localStorageAdapter.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  const products = localStorageAdapter.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const prescriptions = localStorageAdapter.getItem<{ status: string }[]>(STORAGE_KEYS.PRESCRIPTIONS, []);

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((sum, o) => sum + o.total, 0) +
    appointments
    .filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED')
    .reduce((sum, a) => sum + a.fee, 0);

  return {
    totalUsers: users.length,
    totalPatients: users.filter((u) => u.role === 'PATIENT').length,
    activeDoctors: doctors.filter((d) => d.isActive).length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter((a) => a.status === 'PENDING').length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'PLACED' || o.status === 'CONFIRMED' || o.status === 'PROCESSING').length,
    simulatedRevenue: totalRevenue,
    lowStockCount: products.filter((p) => p.stock < 30).length,
    pendingPrescriptions: prescriptions.filter((p) => p.status === 'PENDING_REVIEW').length,
  };
}

export function getAnalyticsData() {
  const appointments = localStorageAdapter.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  const orders = localStorageAdapter.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  const products = localStorageAdapter.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: count,
  }));

  // Appointment status counts
  const aptStatusCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    aptStatusCounts[a.status] = (aptStatusCounts[a.status] || 0) + 1;
  });
  const appointmentBreakdown = Object.entries(aptStatusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Monthly / recent daily orders volume (last 7 days simulation)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
    const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      orders: dayOrders.length,
      revenue,
    };
  });

  return {
    categoryDistribution,
    appointmentBreakdown,
    revenueTimeline: last7Days,
  };
}
