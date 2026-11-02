export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface PatientProfile {
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  addresses: Address[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  // Demo password hash/representation - clearly labeled as demo only
  demoPasswordHash?: string;
  patientProfile?: PatientProfile;
  doctorId?: string; // links to Doctor record if role is DOCTOR
}

export type ConsultationType = 'CLINIC' | 'ONLINE';

export interface DoctorSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: ConsultationType;
  isBooked: boolean;
  appointmentId?: string;
}

export interface WeeklyAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDurationMinutes: number; // e.g. 30
  consultationType: ConsultationType;
  enabled: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  languages: string[];
  consultationFee: number;
  rating: number;
  reviewCount: number;
  bio: string;
  clinicAddress: string;
  avatar: string;
  availableTypes: ConsultationType[];
  weeklyAvailability: WeeklyAvailability[];
  isActive: boolean;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface AppointmentStatusHistory {
  status: AppointmentStatus;
  changedAt: string;
  changedBy: string; // User ID or role
  note?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar: string;
  slotId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: ConsultationType;
  fee: number;
  status: AppointmentStatus;
  statusHistory: AppointmentStatusHistory[];
  notes?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'wellness'
  | 'first-aid'
  | 'monitoring'
  | 'hygiene'
  | 'prescription';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  usageInfo: string;
  packSize: string;
  price: number;
  stock: number;
  sku: string;
  isActive: boolean;
  requiresPrescription: boolean;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  priceSnapshot: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  requiresPrescription: boolean;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  priceSnapshot: number;
  totalPrice: number;
  requiresPrescription: boolean;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  paymentId: string;
  prescriptionRequestId?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryDate: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  transactionRef: string;
  userId: string;
  amount: number;
  currency: string; // 'INR'
  status: PaymentStatus;
  paymentMethod: string; // e.g. "Simulated Card", "Simulated UPI"
  purpose: 'APPOINTMENT' | 'PRODUCT_ORDER';
  relatedEntityId: string; // appointmentId or orderId
  createdAt: string;
  updatedAt: string;
  isSimulatedDemo: true;
}

export type PrescriptionStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PrescriptionRequest {
  id: string;
  patientId: string;
  patientName: string;
  fileName: string;
  fileSize: string;
  doctorNotes?: string;
  status: PrescriptionStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  isSimulatedDemo: true;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  entityType: 'APPOINTMENT' | 'ORDER' | 'PRODUCT' | 'DOCTOR' | 'PRESCRIPTION' | 'USER' | 'SYSTEM';
  entityId?: string;
  createdAt: string;
}
