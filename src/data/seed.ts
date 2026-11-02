import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS, CURRENT_SEED_VERSION } from '@/lib/storage/storage.keys';
import {
  INITIAL_USERS,
  INITIAL_DOCTORS,
  INITIAL_PRODUCTS,
  INITIAL_APPOINTMENTS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  generateInitialSlots,
} from './seed/seed-data';
import { Cart } from '@/types';

const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  requiresPrescription: false,
};

export function isDataSeeded(): boolean {
  const version = localStorageAdapter.getItem<string | null>(STORAGE_KEYS.SEED_VERSION, null);
  const users = localStorageAdapter.getItem<unknown[]>(STORAGE_KEYS.USERS, []);
  return Boolean(version && users.length > 0);
}

export function initializeSeedData(force: boolean = false): void {
  if (!force && isDataSeeded()) {
    return;
  }

  const initialSlots = generateInitialSlots(INITIAL_DOCTORS);

  // Mark slots booked that correspond to INITIAL_APPOINTMENTS
  INITIAL_APPOINTMENTS.forEach((apt) => {
    const slot = initialSlots.find((s) => s.id === apt.slotId || (s.doctorId === apt.doctorId && s.date === apt.date && s.startTime === apt.time));
    if (slot) {
      slot.isBooked = true;
      slot.appointmentId = apt.id;
    }
  });

  localStorageAdapter.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  localStorageAdapter.setItem(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
  localStorageAdapter.setItem(STORAGE_KEYS.SLOTS, initialSlots);
  localStorageAdapter.setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  localStorageAdapter.setItem(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  localStorageAdapter.setItem(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  localStorageAdapter.setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  localStorageAdapter.setItem(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
  localStorageAdapter.setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  localStorageAdapter.setItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  localStorageAdapter.setItem(STORAGE_KEYS.CART, EMPTY_CART);
  localStorageAdapter.setItem(STORAGE_KEYS.SEED_VERSION, CURRENT_SEED_VERSION);

  console.log(`[MediCare] Seed data initialized (v${CURRENT_SEED_VERSION}).`);
}

export function resetDemoData(): void {
  // Clear all medicare keys
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorageAdapter.removeItem(key);
  });
  // Re-seed cleanly
  initializeSeedData(true);
}
