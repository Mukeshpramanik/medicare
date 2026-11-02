export const STORAGE_KEYS = {
  USERS: 'medicare.users',
  SESSION: 'medicare.session',
  DOCTORS: 'medicare.doctors',
  SLOTS: 'medicare.slots',
  APPOINTMENTS: 'medicare.appointments',
  PRODUCTS: 'medicare.products',
  CART: 'medicare.cart',
  ORDERS: 'medicare.orders',
  PAYMENTS: 'medicare.payments',
  PRESCRIPTIONS: 'medicare.prescriptions',
  NOTIFICATIONS: 'medicare.notifications',
  ACTIVITY_LOGS: 'medicare.activityLogs',
  SEED_VERSION: 'medicare.seedVersion',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
export const CURRENT_SEED_VERSION = '1.0.0';

