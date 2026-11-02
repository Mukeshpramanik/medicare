# Low-Level Design (LLD) — MediCare Platform

This document describes the module architecture, core types, service classes, design patterns, and storage abstractions for the **MediCare** healthcare platform.

---

## 1. Architectural Style & Design Principles

MediCare is structured as a **modular feature-based application** decoupled from any direct storage or third-party SDK dependencies.

```
+-------------------------------------------------------------+
|                      Presentation Layer                      |
|   Next.js 14 (App Router) + React Hook Form + Tailwind CSS   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     State & Context Layer                   |
|       AuthContext, CartContext, ToastContext / Event Bus    |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      Domain Service Layer                   |
|   AuthService, DoctorService, AppointmentService,           |
|   ProductService, CartService, PaymentService,              |
|   OrderService, PrescriptionService, NotificationService    |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   Repository & Adapter Layer                |
|   StorageAdapter Interface <--> LocalStorageAdapter         |
+-------------------------------------------------------------+
```

### Key Design Patterns

1. **Repository / Storage Abstraction Pattern**:
   The UI never calls `localStorage` directly. All reads and writes pass through `StorageAdapter` (`getItem`, `setItem`, `removeItem`, `clear`), providing defense against missing/corrupt values and storage quota limitations.
2. **Observer / Pub-Sub Pattern**:
   `LocalStorageAdapter` implements an internal event bus (`subscribe`, `notifySubscribers`). When an order is completed, product stock decrements or appointment slots are booked, all dashboard subscribers update immediately without polling.
3. **Service Layer Pattern**:
   All business logic (stock validation, atomic reschedule slot release, price snapshots, duplicate booking prevention, order status transitions) is strictly encapsulated inside typed domain services.
4. **Strategy Pattern for Simulated Payments**:
   `PaymentService` encapsulates payment processing via deterministic simulation (`SUCCESS`, `FAIL`, `CANCEL`) generating fake transaction references without touching real financial gateways.
5. **Route Guards & Role-Based Access Control (RBAC)**:
   `RoleGuard` and `AuthGuard` protect sensitive dashboard routes (`/dashboard/patient`, `/dashboard/doctor`, `/dashboard/admin`), redirecting unauthorized roles.

---

## 2. Core Modules & Class/Service Definitions

### 2.1 AuthService (`src/features/auth/auth.service.ts`)
- `login(credentials: LoginCredentials)`: Validates email and demo password representation, initializes session token.
- `register(data: RegisterData)`: Prevents duplicate email registration, seeds default patient profile, auto-signs in.
- `logout()`: Clears active session, writes activity log.
- `getCurrentSession()`, `getCurrentUser()`: Resolves authenticated user with latest profile updates.
- `updateUserProfile(userId, updates)`: Updates patient profile, contact numbers, and saved addresses.

### 2.2 DoctorService (`src/features/doctors/doctor.service.ts`)
- `filterDoctors(filters: DoctorFilters)`: Filters by name, specialization, consultation type (`CLINIC` | `ONLINE`), rating, and fee range.
- `getDoctorSlots(doctorId, includeBooked)`: Retrieves active open slots.
- `addSlot(doctorId, date, startTime, endTime, type)`: Validates against past dates and overlapping times.
- `removeSlot(slotId)`: Enforces safety check preventing removal of booked slots.
- `updateDoctor(doctorId, updates)`, `toggleDoctorActive(doctorId)`: Admin and doctor profile controls.

### 2.3 AppointmentService (`src/features/appointments/appointment.service.ts`)
- `bookAppointment(input: BookAppointmentInput)`:
  - Enforces concurrency check: fails if slot is already booked.
  - Rejects past date slots.
  - Sets appointment status to `CONFIRMED`.
  - Atomically marks `DoctorSlot.isBooked = true` and records `appointmentId`.
  - Emits in-app notifications to patient and doctor.
- `rescheduleAppointment(appointmentId, newSlotId, changedByUserId)`:
  - Atomically releases old slot (`isBooked = false`).
  - Reserves new slot (`isBooked = true`).
  - Appends to appointment status history.
- `cancelAppointment(appointmentId, cancelledByUserId, reason)`:
  - Validates cancellation policy.
  - Marks status as `CANCELLED`.
  - Automatically frees the slot for future patient booking.

### 2.4 ProductService (`src/features/products/product.service.ts`)
- `filterProducts(filters: ProductFilters)`: Supports search, category filters, price slider, in-stock only, and prescription-required filters.
- `createProduct(data)`: Adds new catalog item with SKU and active status.
- `updateProductStock(productId, newStock)`: Inline inventory updater with non-negative validation.
- `toggleProductActive(productId)`: Archive or reactivate catalog items.

### 2.5 CartService (`src/features/cart/cart.service.ts`)
- `getCart()`, `saveCart(cart)`: Always recalculates totals and validates catalog stock server-side.
- `addToCart(productId, quantity)`: Enforces `quantity <= product.stock`.
- `updateQuantity(productId, quantity)`: Adjusts cart quantity or removes item if quantity reaches zero.
- `removeFromCart(productId)`, `clearCart()`.
- **Pricing formula**:
  - `subtotal = sum(priceSnapshot * quantity)`
  - `deliveryFee = subtotal >= 1000 ? 0 : 50`
  - `discount = subtotal >= 2500 ? 150 : 0`
  - `total = max(0, subtotal + deliveryFee - discount)`

### 2.6 OrderService (`src/features/orders/order.service.ts`)
- `checkout(input: CheckoutInput)`:
  1. Validates inventory levels for all items.
  2. If any item requires prescription, verifies that patient has an `APPROVED` demo prescription.
  3. Executes `PaymentService.simulatePayment`.
  4. On payment success:
     - Atomically decrements product stock in catalog.
     - Creates order with snapshot prices.
     - Clears the shopping cart.
     - Generates in-app notification and audit activity.
  5. On payment fail / cancel:
     - Rejects checkout, preserves cart and stock untouched.
- `updateOrderStatus(orderId, newStatus, changedBy, note)`:
  - Enforces state machine transition matrix (`ORDER_STATUS_FLOW`).
  - If cancelled before dispatch, restores item quantities back into product inventory.
- `cancelOrder(orderId, patientId, reason)`:
  - Allows cancellation prior to shipping (`SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`).

### 2.7 PaymentService (`src/features/payments/payment.service.ts`)
- Isolated simulation provider supporting `SUCCESS`, `FAIL`, and `CANCEL` actions.
- Records simulated transactions with status: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`.

### 2.8 PrescriptionService (`src/features/prescriptions/prescription.service.ts`)
- `uploadPrescription(patientId, patientName, fileName, doctorNotes)`: Stores demo document request with status `PENDING_REVIEW`.
- `reviewPrescription(id, status, reviewerName, reviewerNotes)`: Clinical admin approval or rejection with patient notification.
- `hasApprovedPrescription(patientId)`: Required boolean check before order checkout for restricted medicines.

---

## 3. Storage Keys & Memory Schema

All keys are prefixed with `medicare.`:
- `medicare.users`: `User[]`
- `medicare.session`: `AuthSession | null`
- `medicare.doctors`: `Doctor[]`
- `medicare.slots`: `DoctorSlot[]`
- `medicare.appointments`: `Appointment[]`
- `medicare.products`: `Product[]`
- `medicare.cart`: `Cart`
- `medicare.orders`: `Order[]`
- `medicare.payments`: `Payment[]`
- `medicare.prescriptions`: `PrescriptionRequest[]`
- `medicare.notifications`: `Notification[]`
- `medicare.activityLogs`: `ActivityLog[]`
- `medicare.seedVersion`: `string` ("1.0.0")

---

## 4. Security & Demo Environment Disclaimer
- **Browser LocalStorage is client-accessible and unencrypted.**
- No real medical documents, clinical evaluations, or payment card numbers are collected or stored.
- Password hashes in this demo are marked specifically for prototype authentication and must be replaced with Argon2 / bcrypt / OAuth2 in production.
