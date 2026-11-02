import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Appointment, AppointmentStatus, ConsultationType, DoctorSlot } from '@/types';
import { generateId, canTransitionAppointmentStatus } from '@/lib/utils';
import { DoctorService } from '@/features/doctors/doctor.service';
import { NotificationService } from '@/features/notifications/notification.service';
import { addActivityLog } from '@/features/admin/admin.service';

export interface BookAppointmentInput {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  slotId: string;
  type: ConsultationType;
  notes?: string;
  paymentId?: string;
}

export class AppointmentService {
  static getAppointments(): Appointment[] {
    return localStorageAdapter.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  }

  static getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find((a) => a.id === id);
  }

  static getAppointmentsByPatient(patientId: string): Appointment[] {
    return this.getAppointments()
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }

  static getAppointmentsByDoctor(doctorId: string): Appointment[] {
    return this.getAppointments()
      .filter((a) => a.doctorId === doctorId)
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }

  static bookAppointment(input: BookAppointmentInput): { success: boolean; appointment?: Appointment; error?: string } {
    const slots = localStorageAdapter.getItem<DoctorSlot[]>(STORAGE_KEYS.SLOTS, []);
    const slotIndex = slots.findIndex((s) => s.id === input.slotId);

    if (slotIndex === -1) {
      return { success: false, error: 'Selected appointment slot was not found.' };
    }

    const slot = slots[slotIndex];

    // Concurrency check: Ensure slot is not already booked
    if (slot.isBooked) {
      return { success: false, error: 'This appointment slot has already been booked by another patient.' };
    }

    // Past date check
    const today = new Date().toISOString().split('T')[0];
    if (slot.date < today) {
      return { success: false, error: 'Cannot book an appointment slot in the past.' };
    }

    const doctor = DoctorService.getDoctorById(input.doctorId);
    if (!doctor || !doctor.isActive) {
      return { success: false, error: 'The requested doctor is currently unavailable.' };
    }

    const appointmentId = generateId('apt');
    const nowIso = new Date().toISOString();

    const newAppointment: Appointment = {
      id: appointmentId,
      patientId: input.patientId,
      patientName: input.patientName,
      patientEmail: input.patientEmail,
      patientPhone: input.patientPhone,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      doctorAvatar: doctor.avatar,
      slotId: slot.id,
      date: slot.date,
      time: slot.startTime,
      type: input.type,
      fee: doctor.consultationFee,
      status: 'CONFIRMED',
      statusHistory: [
        {
          status: 'CONFIRMED',
          changedAt: nowIso,
          changedBy: input.patientId,
          note: `Slot confirmed via demo payment.`,
        },
      ],
      notes: input.notes,
      paymentId: input.paymentId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Atomic update: Mark slot as booked & save appointment
    slots[slotIndex] = {
      ...slot,
      isBooked: true,
      appointmentId: newAppointment.id,
    };
    localStorageAdapter.setItem(STORAGE_KEYS.SLOTS, slots);

    const appointments = this.getAppointments();
    appointments.unshift(newAppointment);
    localStorageAdapter.setItem(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Notify patient
    NotificationService.createNotification({
      userId: input.patientId,
      title: 'Appointment Booked Successfully',
      message: `Your appointment with ${doctor.name} on ${slot.date} at ${slot.startTime} is confirmed.`,
      type: 'success',
      link: '/dashboard/patient?tab=appointments',
    });

    // Notify doctor
    NotificationService.createNotification({
      userId: doctor.userId,
      title: 'New Appointment Scheduled',
      message: `${input.patientName} has booked an appointment on ${slot.date} at ${slot.startTime}.`,
      type: 'info',
      link: '/dashboard/doctor?tab=appointments',
    });

    // Activity Log
    addActivityLog({
      userId: input.patientId,
      userName: input.patientName,
      action: 'BOOKED_APPOINTMENT',
      details: `Booked appointment with ${doctor.name} for ${slot.date} at ${slot.startTime}`,
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
    });

    return { success: true, appointment: newAppointment };
  }

  static rescheduleAppointment(
    appointmentId: string,
    newSlotId: string,
    changedByUserId: string
  ): { success: boolean; appointment?: Appointment; error?: string } {
    const appointments = this.getAppointments();
    const aptIndex = appointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) {
      return { success: false, error: 'Appointment not found.' };
    }

    const apt = appointments[aptIndex];
    if (apt.status === 'COMPLETED' || apt.status === 'CANCELLED' || apt.status === 'REJECTED') {
      return { success: false, error: `Cannot reschedule an appointment that is already ${apt.status}.` };
    }

    const slots = localStorageAdapter.getItem<DoctorSlot[]>(STORAGE_KEYS.SLOTS, []);
    const newSlotIndex = slots.findIndex((s) => s.id === newSlotId);
    if (newSlotIndex === -1) {
      return { success: false, error: 'New slot was not found.' };
    }

    const newSlot = slots[newSlotIndex];
    if (newSlot.isBooked) {
      return { success: false, error: 'The newly selected slot is already booked.' };
    }

    // Atomic slot swap:
    // 1. Release old slot
    const oldSlotIndex = slots.findIndex((s) => s.id === apt.slotId);
    if (oldSlotIndex !== -1) {
      slots[oldSlotIndex] = {
        ...slots[oldSlotIndex],
        isBooked: false,
        appointmentId: undefined,
      };
    }

    // 2. Book new slot
    slots[newSlotIndex] = {
      ...newSlot,
      isBooked: true,
      appointmentId: apt.id,
    };
    localStorageAdapter.setItem(STORAGE_KEYS.SLOTS, slots);

    // 3. Update appointment
    const nowIso = new Date().toISOString();
    const updatedApt: Appointment = {
      ...apt,
      slotId: newSlot.id,
      date: newSlot.date,
      time: newSlot.startTime,
      type: newSlot.type,
      updatedAt: nowIso,
      statusHistory: [
        ...apt.statusHistory,
        {
          status: apt.status,
          changedAt: nowIso,
          changedBy: changedByUserId,
          note: `Rescheduled to ${newSlot.date} at ${newSlot.startTime}`,
        },
      ],
    };

    appointments[aptIndex] = updatedApt;
    localStorageAdapter.setItem(STORAGE_KEYS.APPOINTMENTS, appointments);

    NotificationService.createNotification({
      userId: apt.patientId,
      title: 'Appointment Rescheduled',
      message: `Your appointment with ${apt.doctorName} is now on ${newSlot.date} at ${newSlot.startTime}.`,
      type: 'info',
      link: '/dashboard/patient?tab=appointments',
    });

    addActivityLog({
      userId: changedByUserId,
      userName: apt.patientName,
      action: 'RESCHEDULED_APPOINTMENT',
      details: `Rescheduled appointment with ${apt.doctorName} to ${newSlot.date} at ${newSlot.startTime}`,
      entityType: 'APPOINTMENT',
      entityId: apt.id,
    });

    return { success: true, appointment: updatedApt };
  }

  static cancelAppointment(
    appointmentId: string,
    cancelledByUserId: string,
    reason?: string
  ): { success: boolean; appointment?: Appointment; error?: string } {
    return this.updateAppointmentStatus(appointmentId, 'CANCELLED', cancelledByUserId, reason || 'Cancelled by user');
  }

  static updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    changedByUserId: string,
    note?: string
  ): { success: boolean; appointment?: Appointment; error?: string } {
    const appointments = this.getAppointments();
    const aptIndex = appointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) {
      return { success: false, error: 'Appointment not found.' };
    }

    const apt = appointments[aptIndex];
    if (!canTransitionAppointmentStatus(apt.status, newStatus)) {
      return { success: false, error: `Invalid transition from ${apt.status} to ${newStatus}.` };
    }

    const nowIso = new Date().toISOString();

    // If cancelling or rejecting, release the slot so it can be re-booked
    if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
      const slots = localStorageAdapter.getItem<DoctorSlot[]>(STORAGE_KEYS.SLOTS, []);
      const slotIndex = slots.findIndex((s) => s.id === apt.slotId);
      if (slotIndex !== -1) {
        slots[slotIndex] = {
          ...slots[slotIndex],
          isBooked: false,
          appointmentId: undefined,
        };
        localStorageAdapter.setItem(STORAGE_KEYS.SLOTS, slots);
      }
    }

    const updatedApt: Appointment = {
      ...apt,
      status: newStatus,
      updatedAt: nowIso,
      statusHistory: [
        ...apt.statusHistory,
        {
          status: newStatus,
          changedAt: nowIso,
          changedBy: changedByUserId,
          note,
        },
      ],
    };

    appointments[aptIndex] = updatedApt;
    localStorageAdapter.setItem(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Notify patient
    NotificationService.createNotification({
      userId: apt.patientId,
      title: `Appointment ${newStatus}`,
      message: `Your appointment with ${apt.doctorName} on ${apt.date} is now marked as ${newStatus}.`,
      type: newStatus === 'CONFIRMED' || newStatus === 'COMPLETED' ? 'success' : 'info',
      link: '/dashboard/patient?tab=appointments',
    });

    addActivityLog({
      userId: changedByUserId,
      userName: apt.patientName,
      action: `APPOINTMENT_${newStatus}`,
      details: `Appointment with ${apt.doctorName} marked as ${newStatus}: ${note || ''}`,
      entityType: 'APPOINTMENT',
      entityId: apt.id,
    });

    return { success: true, appointment: updatedApt };
  }
}
