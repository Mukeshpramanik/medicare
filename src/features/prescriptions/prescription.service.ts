import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { PrescriptionRequest, PrescriptionStatus } from '@/types';
import { generateId } from '@/lib/utils';
import { NotificationService } from '@/features/notifications/notification.service';
import { addActivityLog } from '@/features/admin/admin.service';

export class PrescriptionService {
  static getPrescriptions(): PrescriptionRequest[] {
    return localStorageAdapter.getItem<PrescriptionRequest[]>(STORAGE_KEYS.PRESCRIPTIONS, []);
  }

  static getPrescriptionById(id: string): PrescriptionRequest | undefined {
    return this.getPrescriptions().find((p) => p.id === id);
  }

  static getPrescriptionsByPatient(patientId: string): PrescriptionRequest[] {
    return this.getPrescriptions()
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static hasApprovedPrescription(patientId: string): boolean {
    const list = this.getPrescriptionsByPatient(patientId);
    return list.some((p) => p.status === 'APPROVED');
  }

  static uploadPrescription(
    patientId: string,
    patientName: string,
    fileName: string,
    doctorNotes?: string
  ): { success: boolean; prescription?: PrescriptionRequest; error?: string } {
    const list = this.getPrescriptions();

    const newReq: PrescriptionRequest = {
      id: generateId('rx_req'),
      patientId,
      patientName,
      fileName: fileName || 'prescription_document.pdf',
      fileSize: '650 KB',
      doctorNotes,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      isSimulatedDemo: true,
    };

    list.unshift(newReq);
    localStorageAdapter.setItem(STORAGE_KEYS.PRESCRIPTIONS, list);

    NotificationService.createNotification({
      userId: patientId,
      title: 'Prescription Submitted',
      message: `Your prescription "${newReq.fileName}" has been submitted for verification.`,
      type: 'info',
      link: '/dashboard/patient?tab=prescriptions',
    });

    addActivityLog({
      userId: patientId,
      userName: patientName,
      action: 'UPLOADED_PRESCRIPTION',
      details: `Uploaded demo prescription ${newReq.fileName}`,
      entityType: 'PRESCRIPTION',
      entityId: newReq.id,
    });

    return { success: true, prescription: newReq };
  }

  static reviewPrescription(
    prescriptionId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewerName: string,
    reviewerNotes?: string
  ): { success: boolean; prescription?: PrescriptionRequest; error?: string } {
    const list = this.getPrescriptions();
    const target = list.find((p) => p.id === prescriptionId);
    if (!target) {
      return { success: false, error: 'Prescription request not found.' };
    }

    target.status = status;
    target.reviewedBy = reviewerName;
    target.reviewerNotes = reviewerNotes || (status === 'APPROVED' ? 'Approved by clinical verification team.' : 'Verification rejected.');
    target.reviewedAt = new Date().toISOString();

    localStorageAdapter.setItem(STORAGE_KEYS.PRESCRIPTIONS, list);

    // Notify patient
    NotificationService.createNotification({
      userId: target.patientId,
      title: status === 'APPROVED' ? 'Prescription Approved!' : 'Prescription Review Notice',
      message: `Your prescription document "${target.fileName}" was ${status.toLowerCase()}.${reviewerNotes ? ` Note: ${reviewerNotes}` : ''}`,
      type: status === 'APPROVED' ? 'success' : 'error',
      link: '/dashboard/patient?tab=prescriptions',
    });

    addActivityLog({
      userId: 'admin',
      userName: reviewerName,
      action: `REVIEWED_PRESCRIPTION_${status}`,
      details: `Prescription ${target.id} was ${status} by ${reviewerName}`,
      entityType: 'PRESCRIPTION',
      entityId: target.id,
    });

    return { success: true, prescription: target };
  }
}

