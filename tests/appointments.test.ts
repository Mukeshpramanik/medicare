import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentService } from '@/features/appointments/appointment.service';
import { DoctorService } from '@/features/doctors/doctor.service';
import { resetDemoData } from '@/data/seed';

describe('Appointment Workflows & Slot Integrity', () => {
  beforeEach(() => {
    resetDemoData();
  });

  it('4. should book an available future slot successfully and mark it booked', () => {
    const slots = DoctorService.getDoctorSlots('doc_1', false);
    expect(slots.length).toBeGreaterThan(0);
    const targetSlot = slots[0];

    const bookRes = AppointmentService.bookAppointment({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      doctorId: 'doc_1',
      slotId: targetSlot.id,
      type: 'CLINIC',
      notes: 'Initial cardiac evaluation',
    });

    expect(bookRes.success).toBe(true);
    expect(bookRes.appointment?.status).toBe('CONFIRMED');
    expect(bookRes.appointment?.doctorId).toBe('doc_1');

    // Slot must now be marked as booked
    const updatedSlot = DoctorService.getSlotById(targetSlot.id);
    expect(updatedSlot?.isBooked).toBe(true);
    expect(updatedSlot?.appointmentId).toBe(bookRes.appointment?.id);
  });

  it('5. should prevent duplicate booking of the same slot', () => {
    const slots = DoctorService.getDoctorSlots('doc_1', false);
    const targetSlot = slots[0];

    // First booking
    const bookRes1 = AppointmentService.bookAppointment({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      doctorId: 'doc_1',
      slotId: targetSlot.id,
      type: 'CLINIC',
    });
    expect(bookRes1.success).toBe(true);

    // Second booking attempt on the same slot must fail
    const bookRes2 = AppointmentService.bookAppointment({
      patientId: 'usr_pat_2',
      patientName: 'Vikram Mehta',
      patientEmail: 'vikram.mehta@example.com',
      patientPhone: '+91 98333 44556',
      doctorId: 'doc_1',
      slotId: targetSlot.id,
      type: 'CLINIC',
    });
    expect(bookRes2.success).toBe(false);
    expect(bookRes2.error).toContain('already been booked');
  });

  it('6. should cancel an appointment and release the slot back to available state', () => {
    const slots = DoctorService.getDoctorSlots('doc_2', false);
    const targetSlot = slots[0];

    // Book
    const bookRes = AppointmentService.bookAppointment({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      doctorId: 'doc_2',
      slotId: targetSlot.id,
      type: 'ONLINE',
    });
    expect(bookRes.success).toBe(true);
    const appointmentId = bookRes.appointment!.id;

    // Slot is now booked
    expect(DoctorService.getSlotById(targetSlot.id)?.isBooked).toBe(true);

    // Cancel appointment
    const cancelRes = AppointmentService.cancelAppointment(appointmentId, 'usr_pat_1', 'Patient scheduling conflict');
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.appointment?.status).toBe('CANCELLED');

    // Slot must now be released!
    const slotAfterCancel = DoctorService.getSlotById(targetSlot.id);
    expect(slotAfterCancel?.isBooked).toBe(false);
    expect(slotAfterCancel?.appointmentId).toBeUndefined();
  });

  it('6b. should reschedule an appointment atomically, releasing old slot and reserving new slot', () => {
    const openSlots = DoctorService.getDoctorSlots('doc_3', false);
    const slot1 = openSlots[0];
    const slot2 = openSlots[1];

    // Book slot 1
    const bookRes = AppointmentService.bookAppointment({
      patientId: 'usr_pat_1',
      patientName: 'Ananya Verma',
      patientEmail: 'patient@medicare.demo',
      patientPhone: '+91 98222 33445',
      doctorId: 'doc_3',
      slotId: slot1.id,
      type: 'CLINIC',
    });
    expect(bookRes.success).toBe(true);

    // Reschedule to slot 2
    const rescheduleRes = AppointmentService.rescheduleAppointment(bookRes.appointment!.id, slot2.id, 'usr_pat_1');
    expect(rescheduleRes.success).toBe(true);
    expect(rescheduleRes.appointment?.slotId).toBe(slot2.id);

    // Verify slot 1 is released
    expect(DoctorService.getSlotById(slot1.id)?.isBooked).toBe(false);
    // Verify slot 2 is booked
    expect(DoctorService.getSlotById(slot2.id)?.isBooked).toBe(true);
  });
});
