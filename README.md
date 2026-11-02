# MediCare — Full-Stack Healthcare Platform

MediCare is a healthcare web application built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. It combines verified doctor discovery and consultation booking, a healthcare product catalog, shopping cart and checkout with simulated payments, and dedicated dashboards for Patients, Doctors, and Administrators.

> **Healthcare & Demo Disclaimer:** MediCare is a prototype application built for demonstration and educational purposes. Consultation bookings, catalog pharmaceuticals, and checkout payments are simulated using browser LocalStorage. No real medical advice, clinical evaluations, or financial transactions take place.

---

## Features

- **Doctor Discovery & Appointment Booking:**
  - Search doctors by name or medical specialization.
  - Multi-dimensional filters: Specialization, Consultation Type (`In-Clinic` vs. `Video Teleconsultation`), Fee range slider, and Star rating.
  - Interactive doctor profiles showing qualifications, experience, languages, bio, clinic address, and next 14 days of open slots.
  - Real-time double-booking prevention, atomic rescheduling (releases old slot and reserves new slot), and cancellation slot recovery.
- **Healthcare Catalog & Store:**
  - 20+ realistic catalog items across wellness & nutrition, first aid & safety, digital health monitors, and hygiene essentials.
  - Clear labeling and compliance validation for prescription-required demonstration products (`Rx Required`).
  - Search, category tabs, price slider, in-stock filtering, and responsive sorting (Price, Rating, Featured).
- **Cart, Checkout & Simulated Payments:**
  - Cart quantity controls with live inventory boundary checks.
  - Automatic delivery fee calculation (Free above ₹1,000, else ₹50) and cart savings discounts.
  - Mandatory verified prescription check for restricted items with an instant simulated upload and approval flow.
  - Isolated `PaymentService` offering deterministic test simulation: **Simulate Success**, **Simulate Failure** (simulated decline), and **Cancel Payment**.
  - On successful payment: automatic stock decrement, order generation with item price snapshots, and delivery timeline tracking.
- **Role-Based Portals & Dashboards:**
  - **Patient Dashboard:** Upcoming appointments, reschedule/cancel controls, order fulfillment tracker with real-time status timeline, prescription document uploads, and saved delivery addresses.
  - **Doctor Dashboard:** Daily schedule metrics, pending appointment requests (Accept/Decline), consultation session conclusions with clinical notes, slot availability manager, and profile editor.
  - **Admin Dashboard:** Platform KPI metrics, Recharts analytics (7-day simulated revenue trends, category distribution), doctor status controls, product stock inventory editor, order fulfillment state machine transitions, prescription review queue, payment ledger, and system activity audit log.
- **Deterministic Seed Data & LocalStorage Adapter:**
  - Seeded with 8 doctors, 20+ products, 8 patients, appointments, orders, and activity logs.
  - Single-click **"Reset Demo Data"** action available anytime from the top banner, admin settings, and login portal.

---

## Demo Accounts & Credentials

Quickly sign in using the **One-Click Demo Accounts** panel on the login page, or use these credentials:

| Role | Email | Password | Pre-seeded User Name |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medicare.demo` | `Patient123!` | Ananya Verma |
| **Doctor** | `doctor@medicare.demo` | `Doctor123!` | Dr. Rajesh Sharma (Cardiologist) |
| **Admin** | `admin@medicare.demo` | `Admin123!` | Dr. Sarah Mitchell |

*Note: You can also register a brand new patient account on `/register`.*

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **Icons:** Lucide React
- **Charts & Data Visualization:** Recharts
- **Forms & Validation:** React Hook Form + Zod
- **Persistence & Architecture:** Client-side `StorageAdapter` pattern backed by browser `LocalStorage`
- **Testing:** Vitest + React Testing Library + JSDOM

---

## Folder Structure

```
medical-demo/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout with banner, navbar, footer & providers
│   │   ├── page.tsx                       # Public landing page (Hero, featured doctors & products)
│   │   ├── globals.css                    # Tailwind CSS directives & global scrollbar styles
│   │   ├── providers.tsx                  # Auth, Cart, and Toast context providers
│   │   ├── route-guards/
│   │   │   ├── AuthGuard.tsx              # Authenticated session boundary
│   │   │   └── RoleGuard.tsx              # Role-based dashboard protection
│   │   ├── doctors/
│   │   │   ├── page.tsx                   # Doctor directory with multi-filter sidebar
│   │   │   └── [id]/page.tsx              # Doctor detail & slot booking widget
│   │   ├── products/
│   │   │   ├── page.tsx                   # Healthcare catalog & search
│   │   │   └── [id]/page.tsx              # Product detail & add to cart
│   │   ├── cart/page.tsx                  # Shopping cart & subtotal calculator
│   │   ├── checkout/page.tsx              # Checkout, prescription check & payment simulation
│   │   ├── login/page.tsx                 # Demo login & one-click credentials switcher
│   │   ├── register/page.tsx              # Patient registration form
│   │   └── dashboard/
│   │       ├── patient/page.tsx           # Patient portal (Appointments, Orders, Rx, Profile)
│   │       ├── doctor/page.tsx            # Doctor portal (Schedule, Availability, Session notes)
│   │       └── admin/page.tsx             # Admin console (Analytics, Inventory, Orders, Rx queue)
│   ├── components/
│   │   ├── layout/                        # Navbar, Footer, DemoNoticeBanner
│   │   └── ui/                            # Button, Input, Modal, Badge, Card, Toast, EmptyState
│   ├── features/                          # Domain services & contexts
│   │   ├── auth/                          # AuthService & AuthContext
│   │   ├── doctors/                       # DoctorService & filters
│   │   ├── appointments/                  # AppointmentService & booking validation
│   │   ├── products/                      # ProductService & inventory
│   │   ├── cart/                          # CartService & CartContext
│   │   ├── orders/                        # OrderService & fulfillment state machine
│   │   ├── payments/                      # PaymentService & simulated transactions
│   │   ├── prescriptions/                 # PrescriptionService & review queue
│   │   ├── notifications/                 # NotificationService
│   │   └── admin/                         # AdminService, stats & activity audit trail
│   ├── data/
│   │   ├── seed/seed-data.ts              # Deterministic initial seed collections
│   │   └── seed.ts                        # Seed initialization & resetDemoData()
│   ├── lib/
│   │   ├── storage/                       # StorageAdapter & LocalStorageAdapter
│   │   └── utils.ts                       # Formatters, transitions & helpers
│   └── types/                             # Central TypeScript models & interfaces
├── tests/
│   ├── auth.test.ts                       # Login, invalid credentials, duplicate prevention
│   ├── appointments.test.ts               # Booking, double booking prevention, slot release
│   ├── cart-and-checkout.test.ts          # Cart limits, Rx checks, payment & inventory update
│   └── orders-and-admin.test.ts           # Order transitions, stock management, factory reset
├── docs/
│   ├── LLD.md                             # Low-level design & service architectures
│   ├── ERD.md                             # Future PostgreSQL / MySQL relational ER diagram
│   └── BUSINESS_FLOWS.md                  # Mermaid sequence & state transition diagrams
├── vitest.config.ts                       # Vitest test configuration
├── package.json
└── README.md
```

---

## Installation & Local Development

### Prerequisites
- Node.js `v18+` (or `v20+`)
- npm `v9+`

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Test Suite
```bash
npm test
```
Runs all 18 Vitest test suites verifying authentication, double-booking prevention, atomic rescheduling, cart rules, prescription constraints, and order lifecycle transitions.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## LocalStorage Data Behavior & Reset

- **Data Persistence:** All demo modifications (new appointments, orders, stock adjustments, new doctors) are persisted directly to your browser's LocalStorage under keys prefixed with `medicare.*`.
- **Factory Reset:** Click **"Reset Demo Data"** in the top black notification bar or on `/dashboard/admin?tab=settings` at any time to restore the system to its initial pristine state.

---

## Main User Journeys

### 1. Patient Journey
1. Open the landing page (`/`) and browse featured doctors or healthcare items.
2. Search doctors (`/doctors`), filter by specialization (e.g., *Cardiology*), and open a doctor profile.
3. Select an upcoming date and time slot, choose between *In-Clinic* or *Video Teleconsultation*, and click **"Proceed to Payment"**.
4. Confirm simulated payment (`Success`), receiving an instant booking confirmation.
5. In the **Patient Dashboard** (`/dashboard/patient`), view your upcoming appointment, reschedule to another slot atomically, or cancel.
6. Browse products (`/products`), add vitamins or monitors to your cart, proceed to checkout (`/checkout`), and place an order.
7. Track order fulfillment along the simulated dispatch timeline.

### 2. Doctor Journey
1. Sign in as `doctor@medicare.demo`.
2. Lands directly on the **Doctor Dashboard** (`/dashboard/doctor`).
3. Review upcoming patient appointments for today and the next 14 days.
4. Accept or reject pending appointments, or click **"Complete Session"** to record clinical consultation notes.
5. Manage availability: add custom slots for future dates or delete unbooked slots.
6. Update consultation fees, bio, and clinic center addresses.

### 3. Administrator Journey
1. Sign in as `admin@medicare.demo`.
2. Lands directly on the **Admin Console** (`/dashboard/admin`).
3. Review platform KPIs and Recharts analytics (7-day revenue trend, category distribution).
4. Advance order fulfillment through allowed lifecycle states (`PLACED` -> `CONFIRMED` -> `PROCESSING` -> `PACKED` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
5. Review pending prescription verification requests from patients and approve/reject them.
6. Manage product catalog stock inline (+10 / -5 units) or add new doctors and products.
7. Inspect the real-time activity log and audit history.

---

## Screenshots & Visual Overview

```
+-----------------------------------------------------------------------------------------+
| [Simulation Sandbox] Demo environment with browser-persisted mock data. [Reset Demo Data] |
|                                                                                         |
|  MediCare  Find Doctors   Healthcare Store              [Cart: 2] [Bell] [Ananya (Patient) v] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Compassionate healthcare,                                                              |
|  seamlessly connected.                                                                  |
|                                                                                         |
|  [ Find a Doctor ]   [ Shop Essentials ]                                                |
|                                                                                         |
|  [ Search doctors, specializations, clinics...                        ] [ Search ]      |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [Top Medical Specialties]      [Verified Medical Specialists]      [Featured Store Items]|
|  Cardiology, Dermatology...     Dr. Rajesh Sharma, Dr. Priya Sen    Blood Pressure Cuff...|
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## Known Limitations

- **Browser-Local Storage:** LocalStorage is scoped to the specific browser profile. It does not synchronize across different devices or incognito windows.
- **Client-Side Simulation:** Simulated payments and order fulfillment do not connect to external payment processors (Stripe/Razorpay) or logistics delivery APIs.

---

## Future Backend Migration Plan

When migrating MediCare to a production architecture:
1. **Database:** Implement PostgreSQL with Prisma or Drizzle ORM using the relational schema in [docs/ERD.md](docs/ERD.md).
2. **Authentication:** Replace mock password comparisons with NextAuth.js / Auth0 / Supabase Auth using Argon2 password hashing and HTTP-only JWT cookies.
3. **Payments:** Swap the simulation provider in `PaymentService` with official Stripe / Razorpay Webhooks.
4. **Prescription Storage:** Store uploaded documents in an S3-compatible bucket (AWS S3 / Google Cloud Storage) with presigned read URLs and HIPAA-compliant encryption at rest.
