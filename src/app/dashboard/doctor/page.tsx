'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Stethoscope,
  Plus,
  Trash2,
  Edit3,
  Video,
  Building2,
  Check,
  AlertCircle,
  FileText,
  DollarSign,
  Languages,
} from 'lucide-react';
import { RoleGuard } from '@/app/route-guards/RoleGuard';
import { useAuth } from '@/features/auth/auth.context';
import { DoctorService } from '@/features/doctors/doctor.service';
import { AppointmentService } from '@/features/appointments/appointment.service';
import { Doctor, Appointment, DoctorSlot, ConsultationType } from '@/types';
import { formatCurrency, formatDate, formatTime, getAppointmentStatusBadge } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type DoctorTab = 'overview' | 'appointments' | 'availability' | 'profile';

function DoctorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const tabParam = (searchParams.get('tab') as DoctorTab) || 'overview';
  const [activeTab, setActiveTab] = useState<DoctorTab>(tabParam);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Add Slot Modal
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newSlotTime, setNewSlotTime] = useState('11:00');
  const [newSlotType, setNewSlotType] = useState<ConsultationType>('CLINIC');

  // Complete consultation modal
  const [completeModalApt, setCompleteModalApt] = useState<Appointment | null>(null);
  const [consultNotes, setConsultNotes] = useState('');

  // Profile Editor state
  const [editFee, setEditFee] = useState<number>(900);
  const [editBio, setEditBio] = useState('');
  const [editClinicAddress, setEditClinicAddress] = useState('');

  const loadDoctorData = () => {
    if (!currentUser) return;
    // Find doctor by userId or doctorId
    const doc = DoctorService.getDoctorByUserId(currentUser.id) || DoctorService.getDoctorById(currentUser.doctorId || 'doc_1');
    if (doc) {
      setDoctor(doc);
      setEditFee(doc.consultationFee);
      setEditBio(doc.bio);
      setEditClinicAddress(doc.clinicAddress);

      const aptList = AppointmentService.getAppointmentsByDoctor(doc.id);
      setAppointments(aptList);

      const slotList = DoctorService.getDoctorSlots(doc.id, true);
      setSlots(slotList);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [currentUser]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: DoctorTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/doctor?tab=${tab}`);
  };

  // Appointment Status Actions
  const handleUpdateStatus = (aptId: string, status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED', note?: string) => {
    if (!doctor || !currentUser) return;
    const res = AppointmentService.updateAppointmentStatus(aptId, status, currentUser.id, note);
    if (res.success) {
      success(`Appointment marked as ${status}.`);
      loadDoctorData();
    } else {
      error(res.error || `Could not update appointment status.`);
    }
  };

  const handleCompleteAppointment = () => {
    if (!completeModalApt || !currentUser) return;
    const res = AppointmentService.updateAppointmentStatus(
      completeModalApt.id,
      'COMPLETED',
      currentUser.id,
      consultNotes || 'Clinical consultation concluded.'
    );
    if (res.success) {
      success('Appointment marked as Completed!');
      setCompleteModalApt(null);
      setConsultNotes('');
      loadDoctorData();
    } else {
      error(res.error || 'Failed to complete appointment.');
    }
  };

  // Slot Management
  const handleAddSlot = () => {
    if (!doctor) return;
    const [h, m] = newSlotTime.split(':').map(Number);
    const endMinutes = m + 30;
    const endTime = `${String(h + Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const res = DoctorService.addSlot(doctor.id, newSlotDate, newSlotTime, endTime, newSlotType);
    if (res.success) {
      success(`Added slot on ${newSlotDate} at ${newSlotTime}`);
      setIsAddSlotOpen(false);
      loadDoctorData();
    } else {
      error(res.error || 'Could not add slot.');
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    const res = DoctorService.removeSlot(slotId);
    if (res.success) {
      success('Slot removed.');
      loadDoctorData();
    } else {
      error(res.error || 'Could not delete slot.');
    }
  };

  // Profile Save
  const handleSaveProfile = () => {
    if (!doctor) return;
    const res = DoctorService.updateDoctor(doctor.id, {
      consultationFee: editFee,
      bio: editBio,
      clinicAddress: editClinicAddress,
    });
    if (res.success) {
      success('Professional profile updated.');
      loadDoctorData();
    } else {
      error(res.error || 'Failed to update profile.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING');
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');

  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === 'ALL') return true;
    return a.status === appointmentFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Doctor Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={doctor?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
            alt={doctor?.name || 'Doctor'}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{doctor?.name}</h1>
              <Badge variant="teal" size="sm">Doctor Portal</Badge>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              {doctor?.specialization} • {doctor?.qualification}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => setIsAddSlotOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Availability Slot
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2 sm:gap-6 overflow-x-auto text-sm font-medium scrollbar-thin">
        {[
          { key: 'overview', label: 'Overview & Metrics' },
          { key: 'appointments', label: `Appointments (${appointments.length})` },
          { key: 'availability', label: `Slot Availability (${slots.filter((s) => !s.isBooked).length})` },
          { key: 'profile', label: 'Doctor Profile Editor' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as DoctorTab)}
              className={`pb-3 pt-1 px-1 border-b-2 font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'border-tealbrand-600 text-tealbrand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tealbrand-50 text-tealbrand-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{todayAppointments.length}</div>
                <div className="text-xs text-slate-500">Today's Consultations</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{pendingAppointments.length}</div>
                <div className="text-xs text-slate-500">Pending Review</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{completedAppointments.length}</div>
                <div className="text-xs text-slate-500">Completed Sessions</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(
                    appointments
                      .filter((a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
                      .reduce((sum, a) => sum + a.fee, 0)
                  )}
                </div>
                <div className="text-xs text-slate-500">Simulated Revenue</div>
              </div>
            </div>
          </div>

          {/* Pending Requests & Schedule Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Upcoming Patient Schedule</h3>
              <span className="text-xs text-slate-500">{appointments.length} total consultations</span>
            </div>

            {appointments.slice(0, 5).map((apt) => {
              const badge = getAppointmentStatusBadge(apt.status);
              return (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(apt.date)} at {formatTime(apt.time)} • {apt.type} • {apt.patientPhone}
                    </div>
                    {apt.notes && <div className="text-xs text-slate-600 italic">"{apt.notes}"</div>}
                  </div>

                  <div className="flex items-center gap-2">
                    {apt.status === 'PENDING' && (
                      <>
                        <Button
                          variant="teal"
                          size="sm"
                          onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED', 'Accepted by physician')}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUpdateStatus(apt.id, 'REJECTED', 'Physician unavailable')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setCompleteModalApt(apt)}
                      >
                        Complete Session
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Appointments List */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAppointmentFilter(filter)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${
                    appointmentFilter === filter
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">{filteredAppointments.length} matching</span>
          </div>

          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No consultations match this filter"
              description="Switch filters to view all past and upcoming patient schedules."
            />
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => {
                const badge = getAppointmentStatusBadge(apt.status);
                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {apt.patientEmail} • {apt.patientPhone}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <strong>{formatDate(apt.date)}</strong> at <strong>{formatTime(apt.time)}</strong> ({apt.type})
                      </div>
                      {apt.notes && <div className="text-xs text-slate-600 italic mt-1">Patient Note: {apt.notes}</div>}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {apt.status === 'PENDING' && (
                        <>
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUpdateStatus(apt.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {apt.status === 'CONFIRMED' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setCompleteModalApt(apt)}
                          >
                            Mark Completed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(apt.id, 'CANCELLED', 'Doctor cancellation')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Availability Slots */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Consultation Slots</h2>
              <p className="text-xs text-slate-500">Configure date-specific appointment slots open for booking.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsAddSlotOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create New Slot
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Upcoming Generated Slots ({slots.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    slot.isBooked
                      ? 'bg-brand-50/50 border-brand-200 text-brand-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{formatDate(slot.date)}</span>
                    <Badge variant={slot.isBooked ? 'purple' : 'success'} size="sm">
                      {slot.isBooked ? 'Booked' : 'Open'}
                    </Badge>
                  </div>
                  <div className="text-slate-600">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({slot.type})
                  </div>
                  {!slot.isBooked && (
                    <button
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 pt-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove slot
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Profile Editor */}
      {activeTab === 'profile' && doctor && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
            Edit Doctor Profile
          </h2>

          <div className="space-y-4">
            <Input
              label="Standard Consultation Fee (₹)"
              type="number"
              value={editFee}
              onChange={(e) => setEditFee(Number(e.target.value))}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Professional Bio & Specialization Focus
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Input
              label="Clinic / Hospital Center Address"
              value={editClinicAddress}
              onChange={(e) => setEditClinicAddress(e.target.value)}
            />

            <Button variant="primary" size="lg" className="w-full" onClick={handleSaveProfile}>
              Save Profile Changes
            </Button>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal */}
      <Modal
        isOpen={!!completeModalApt}
        onClose={() => setCompleteModalApt(null)}
        title="Conclude Consultation Session"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-600">
            Patient: <strong>{completeModalApt?.patientName}</strong> • Date: {completeModalApt && formatDate(completeModalApt.date)}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clinical Summary / Consultation Notes
            </label>
            <textarea
              value={consultNotes}
              onChange={(e) => setConsultNotes(e.target.value)}
              placeholder="e.g. Vitals normal. Prescribed dietary sodium reduction and 3-month follow-up..."
              rows={4}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCompleteModalApt(null)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleCompleteAppointment}>
              Save & Mark Completed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Slot Modal */}
      <Modal
        isOpen={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        title="Add Open Consultation Slot"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={newSlotDate}
            min={todayStr}
            onChange={(e) => setNewSlotDate(e.target.value)}
          />

          <Input
            label="Start Time (30-min duration)"
            type="time"
            value={newSlotTime}
            onChange={(e) => setNewSlotTime(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewSlotType('CLINIC')}
                className={`p-2.5 rounded-lg border text-xs font-semibold ${
                  newSlotType === 'CLINIC' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200'
                }`}
              >
                In-Clinic
              </button>
              <button
                type="button"
                onClick={() => setNewSlotType('ONLINE')}
                className={`p-2.5 rounded-lg border text-xs font-semibold ${
                  newSlotType === 'ONLINE' ? 'bg-tealbrand-600 text-white border-tealbrand-600' : 'bg-white border-slate-200'
                }`}
              >
                Video Online
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddSlotOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleAddSlot}>
              Create Slot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function DoctorDashboardPage() {
  return (
    <RoleGuard allowedRoles={['DOCTOR']}>
      <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><div className="h-64 bg-slate-100 animate-pulse rounded-2xl" /></div>}>
        <DoctorDashboardContent />
      </Suspense>
    </RoleGuard>
  );
}
