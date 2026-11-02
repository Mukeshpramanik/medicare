# Business Workflows & State Lifecycles — MediCare

This document maps out the core business workflows and state transition machines powering MediCare.

---

## 1. Doctor Appointment Booking Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant UI as Doctor Details UI
    participant ApptService as AppointmentService
    participant DoctorService as DoctorService
    participant PayService as PaymentService
    participant Storage as LocalStorageAdapter

    Patient->>UI: Select Doctor & Available Future Slot
    Patient->>UI: Select Consultation Type (Clinic / Online)
    Patient->>UI: Click "Proceed to Payment"
    UI->>PayService: simulatePayment(action: SUCCESS | FAIL | CANCEL)
    alt Payment Fails / Cancelled
        PayService-->>UI: Return Payment Error / Cancelled
        UI-->>Patient: Display notice (Slot remains open)
    else Payment Successful
        PayService-->>UI: Return Payment Success (Txn Ref)
        UI->>ApptService: bookAppointment(slotId, patientId, doctorId, fee)
        ApptService->>Storage: Verify slot is NOT booked & NOT in past
        ApptService->>Storage: Mark slot.isBooked = true
        ApptService->>Storage: Save Appointment (status: CONFIRMED)
        ApptService->>Storage: Create Notifications for Patient & Doctor
        ApptService->>Storage: Log Activity
        ApptService-->>UI: Return Confirmed Appointment
        UI-->>Patient: Display Confirmation Screen & Add to Dashboard
    end
```

---

## 2. Appointment Status State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Patient requests slot (offline/unpaid)
    [*] --> CONFIRMED: Booked & simulated payment successful

    PENDING --> CONFIRMED: Doctor accepts request
    PENDING --> REJECTED: Doctor declines (slot released)
    PENDING --> CANCELLED: Patient cancels (slot released)

    CONFIRMED --> COMPLETED: Consultation concluded by Doctor
    CONFIRMED --> CANCELLED: Patient or Doctor cancels >2h before (slot released)

    COMPLETED --> [*]
    CANCELLED --> [*]
    REJECTED --> [*]
```

---

## 3. Product Catalog, Cart & Checkout Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Cart as CartService
    participant Order as OrderService
    participant Rx as PrescriptionService
    participant Pay as PaymentService
    participant Inv as ProductService

    Patient->>Cart: Add Products to Cart (quantity)
    Cart->>Inv: Validate product active & quantity <= stock
    Cart-->>Patient: Cart updated with snapshot prices & totals
    Patient->>Order: Proceed to Checkout (Address, Payment Outcome)
    
    alt Cart contains items with requiresPrescription = true
        Order->>Rx: hasApprovedPrescription(patientId)
        alt No Approved Prescription
            Order-->>Patient: Block Checkout: Request Demo Prescription Upload
        end
    end

    Order->>Pay: simulatePayment(total, action)
    alt Payment Fails or Cancelled
        Pay-->>Order: Return Failed / Cancelled
        Order-->>Patient: Display simulated failure (Stock untouched)
    else Payment Successful
        Pay-->>Order: Payment SUCCESS (Record Txn)
        Order->>Inv: Decrement stock units atomically
        Order->>Cart: clearCart()
        Order->>Order: Create Order (status: PLACED)
        Order-->>Patient: Render Order Confirmation & Delivery Timeline
    end
```

---

## 4. Controlled Order Fulfillment State Machine

```mermaid
stateDiagram-v2
    [*] --> PLACED: Payment confirmed & stock reserved
    
    PLACED --> CONFIRMED: Admin / Warehouse verifies order
    PLACED --> CANCELLED: Cancelled before processing (Stock restored, Refunded)

    CONFIRMED --> PROCESSING: Order sent to pharmacy/warehouse
    CONFIRMED --> CANCELLED: Cancelled (Stock restored, Refunded)

    PROCESSING --> PACKED: Packed in tamper-evident parcel
    PROCESSING --> CANCELLED: Cancelled before dispatch (Stock restored, Refunded)

    PACKED --> SHIPPED: Handed to courier partner (AWB assigned)

    SHIPPED --> OUT_FOR_DELIVERY: Out with local delivery executive

    OUT_FOR_DELIVERY --> DELIVERED: Successfully handed to patient

    DELIVERED --> REFUND_PENDING: Return or complaint initiated
    REFUND_PENDING --> REFUNDED: Simulated refund credited

    CANCELLED --> [*]
    DELIVERED --> [*]
    REFUNDED --> [*]
```

---

## 5. Atomic Rescheduling Workflow

When a patient reschedules an existing appointment:
1. `AppointmentService.rescheduleAppointment(appointmentId, newSlotId, userId)`
2. Validates that `appointment.status` is eligible (`CONFIRMED` or `PENDING`).
3. Validates that `newSlot.isBooked === false`.
4. Atomically within the same service operation:
   - Sets `oldSlot.isBooked = false` (releasing old slot to the doctor's public directory).
   - Sets `newSlot.isBooked = true` (reserving the new slot).
   - Updates `appointment.date`, `appointment.time`, and appends an entry to `appointment.statusHistory`.
   - Dispatches in-app notification to patient.
