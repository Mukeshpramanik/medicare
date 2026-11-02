import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { Doctor, DoctorSlot, ConsultationType } from '@/types';
import { generateId } from '@/lib/utils';
import { addActivityLog } from '@/features/admin/admin.service';

export interface DoctorFilters {
  search?: string;
  specialization?: string;
  consultationType?: ConsultationType | 'ALL';
  minFee?: number;
  maxFee?: number;
  minRating?: number;
  sortBy?: 'recommended' | 'rating' | 'fee-asc' | 'fee-desc' | 'experience';
}

export class DoctorService {
  static getDoctors(): Doctor[] {
    return localStorageAdapter.getItem<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
  }

  static getActiveDoctors(): Doctor[] {
    return this.getDoctors().filter((d) => d.isActive);
  }

  static getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.id === id);
  }

  static getDoctorByUserId(userId: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.userId === userId);
  }

  static getSpecializations(): string[] {
    const doctors = this.getDoctors();
    const specs = new Set(doctors.map((d) => d.specialization));
    return Array.from(specs);
  }

  static filterDoctors(filters: DoctorFilters = {}): Doctor[] {
    let list = this.getActiveDoctors();

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.languages.some((l) => l.toLowerCase().includes(q)) ||
          d.clinicAddress.toLowerCase().includes(q)
      );
    }

    if (filters.specialization && filters.specialization !== 'ALL') {
      list = list.filter((d) => d.specialization.toLowerCase() === filters.specialization?.toLowerCase());
    }

    if (filters.consultationType && filters.consultationType !== 'ALL') {
      list = list.filter((d) => d.availableTypes.includes(filters.consultationType as ConsultationType));
    }

    if (filters.minFee !== undefined) {
      list = list.filter((d) => d.consultationFee >= filters.minFee!);
    }
    if (filters.maxFee !== undefined) {
      list = list.filter((d) => d.consultationFee <= filters.maxFee!);
    }

    if (filters.minRating !== undefined && filters.minRating > 0) {
      list = list.filter((d) => d.rating >= filters.minRating!);
    }

    switch (filters.sortBy) {
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'fee-asc':
        list.sort((a, b) => a.consultationFee - b.consultationFee);
        break;
      case 'fee-desc':
        list.sort((a, b) => b.consultationFee - a.consultationFee);
        break;
      case 'experience':
        list.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
      case 'recommended':
      default:
        list.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount);
        break;
    }

    return list;
  }

  // Slot Management
  static getAllSlots(): DoctorSlot[] {
    return localStorageAdapter.getItem<DoctorSlot[]>(STORAGE_KEYS.SLOTS, []);
  }

  static getDoctorSlots(doctorId: string, includeBooked: boolean = false): DoctorSlot[] {
    const slots = this.getAllSlots().filter((s) => s.doctorId === doctorId);
    if (!includeBooked) {
      return slots.filter((s) => !s.isBooked);
    }
    return slots;
  }

  static getDoctorSlotsByDate(doctorId: string, date: string, includeBooked: boolean = false): DoctorSlot[] {
    return this.getDoctorSlots(doctorId, includeBooked).filter((s) => s.date === date);
  }

  static getSlotById(slotId: string): DoctorSlot | undefined {
    return this.getAllSlots().find((s) => s.id === slotId);
  }

  static addSlot(doctorId: string, date: string, startTime: string, endTime: string, type: ConsultationType): { success: boolean; slot?: DoctorSlot; error?: string } {
    const slots = this.getAllSlots();
    // Validate past dates
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return { success: false, error: 'Cannot create slots in the past.' };
    }

    // Check overlap
    const existing = slots.find(
      (s) => s.doctorId === doctorId && s.date === date && s.startTime === startTime
    );
    if (existing) {
      return { success: false, error: 'A slot already exists for this doctor at this date and time.' };
    }

    const newSlot: DoctorSlot = {
      id: generateId('slot'),
      doctorId,
      date,
      startTime,
      endTime,
      type,
      isBooked: false,
    };

    slots.push(newSlot);
    localStorageAdapter.setItem(STORAGE_KEYS.SLOTS, slots);

    const doc = this.getDoctorById(doctorId);
    addActivityLog({
      userId: doctorId,
      userName: doc?.name || 'Doctor',
      action: 'ADDED_SLOT',
      details: `Added new slot on ${date} at ${startTime} (${type})`,
      entityType: 'DOCTOR',
      entityId: doctorId,
    });

    return { success: true, slot: newSlot };
  }

  static removeSlot(slotId: string): { success: boolean; error?: string } {
    const slots = this.getAllSlots();
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) {
      return { success: false, error: 'Slot not found.' };
    }
    if (slot.isBooked) {
      return { success: false, error: 'Cannot delete a slot that has an active booking.' };
    }

    const filtered = slots.filter((s) => s.id !== slotId);
    localStorageAdapter.setItem(STORAGE_KEYS.SLOTS, filtered);
    return { success: true };
  }

  // Doctor Admin / Profile
  static updateDoctor(doctorId: string, updates: Partial<Doctor>): { success: boolean; doctor?: Doctor; error?: string } {
    const doctors = this.getDoctors();
    const idx = doctors.findIndex((d) => d.id === doctorId);
    if (idx === -1) {
      return { success: false, error: 'Doctor not found.' };
    }

    doctors[idx] = { ...doctors[idx], ...updates };
    localStorageAdapter.setItem(STORAGE_KEYS.DOCTORS, doctors);

    addActivityLog({
      userId: doctorId,
      userName: doctors[idx].name,
      action: 'UPDATED_DOCTOR_PROFILE',
      details: `Updated doctor profile details`,
      entityType: 'DOCTOR',
      entityId: doctorId,
    });

    return { success: true, doctor: doctors[idx] };
  }

  static toggleDoctorActive(doctorId: string): { success: boolean; isActive?: boolean; error?: string } {
    const doctors = this.getDoctors();
    const doc = doctors.find((d) => d.id === doctorId);
    if (!doc) return { success: false, error: 'Doctor not found' };

    doc.isActive = !doc.isActive;
    localStorageAdapter.setItem(STORAGE_KEYS.DOCTORS, doctors);

    addActivityLog({
      userId: 'admin',
      userName: 'Admin',
      action: doc.isActive ? 'ACTIVATED_DOCTOR' : 'DEACTIVATED_DOCTOR',
      details: `${doc.name} was ${doc.isActive ? 'activated' : 'deactivated'}`,
      entityType: 'DOCTOR',
      entityId: doctorId,
    });

    return { success: true, isActive: doc.isActive };
  }

  static createDoctor(newDocData: Omit<Doctor, 'id' | 'rating' | 'reviewCount'>): { success: boolean; doctor?: Doctor; error?: string } {
    const doctors = this.getDoctors();
    const newDoc: Doctor = {
      ...newDocData,
      id: generateId('doc'),
      rating: 5.0,
      reviewCount: 0,
    };
    doctors.push(newDoc);
    localStorageAdapter.setItem(STORAGE_KEYS.DOCTORS, doctors);

    addActivityLog({
      userId: 'admin',
      userName: 'Admin',
      action: 'CREATED_DOCTOR',
      details: `Added new doctor profile: ${newDoc.name} (${newDoc.specialization})`,
      entityType: 'DOCTOR',
      entityId: newDoc.id,
    });

    return { success: true, doctor: newDoc };
  }
}

