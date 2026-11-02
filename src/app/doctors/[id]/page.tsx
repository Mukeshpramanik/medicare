'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Building2,
  Video,
  Languages,
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Lock,
} from 'lucide-react';
import { DoctorService } from '@/features/doctors/doctor.service';
import { AppointmentService } from '@/features/appointments/appointment.service';
import { useAuth } from '@/features/auth/auth.context';
import { Doctor, DoctorSlot, ConsultationType } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();

  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('CLINIC');
  const [patientNotes, setPatientNotes] = useState('');

  // Booking modal and payment simulation
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [paymentAction, setPaymentAction] = useState<'SUCCESS' | 'FAIL' | 'CANCEL'>('SUCCESS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    const doc = DoctorService.getDoctorById(doctorId);
    if (doc) {
      setDoctor(doc);
      if (doc.availableTypes.includes('CLINIC')) {
        setConsultationType('CLINIC');
      } else if (doc.availableTypes.includes('ONLINE')) {
        setConsultationType('ONLINE');
      }

      const allDoctorSlots = DoctorService.getDoctorSlots(doctorId, false);
      setSlots(allDoctorSlots);

      // Default selected date to first available slot date
      if (allDoctorSlots.length > 0) {
        setSelectedDate(allDoctorSlots[0].date);
      }
    }
  }, [doctorId]);

  // Unique sorted dates available for this doctor
  const availableDates = Array.from(new Set(slots.map((s) => s.date))).sort();

  // Slots for the selected date matching chosen type
  const daySlots = slots.filter((s) => s.date === selectedDate && !s.isBooked && (s.type === consultationType || true));

  const handleStartBooking = () => {
    if (!isAuthenticated || !currentUser) {
      warning('Please sign in as a patient to book an appointment.');
      router.push(`/login?redirect=/doctors/${doctorId}`);
      return;
    }

    if (currentUser.role !== 'PATIENT') {
      warning(`You are logged in as a ${currentUser.role}. Please log in as a Patient to book.`);
      return;
    }

    if (!selectedSlot) {
      warning('Please select an appointment time slot.');
      return;
    }

    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!currentUser || !selectedSlot || !doctor) return;

    if (paymentAction === 'CANCEL') {
      setIsBookingModalOpen(false);
      warning('Payment cancelled. Slot was not booked.');
      return;
    }

    if (paymentAction === 'FAIL') {
      error('Simulated payment failed (simulated bank decline). Please try again.');
      return;
    }

    setIsSubmitting(true);

    // Execute booking in service layer
    const res = AppointmentService.bookAppointment({
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientEmail: currentUser.email,
      patientPhone: currentUser.phone || '+91 98000 00000',
      doctorId: doctor.id,
      slotId: selectedSlot.id,
      type: selectedSlot.type,
      notes: patientNotes,
      paymentId: `pay_sim_${Date.now()}`,
    });

    setIsSubmitting(false);

    if (res.success) {
      setBookingConfirmed(true);
      success('Appointment successfully scheduled and confirmed!');
      // Refresh slots
      const refreshedSlots = DoctorService.getDoctorSlots(doctorId, false);
      setSlots(refreshedSlots);
      setSelectedSlot(null);
    } else {
      error(res.error || 'Failed to book slot.');
    }
  };

  if (!doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Doctor not found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested doctor profile does not exist or has been removed.</p>
        <Link href="/doctors" className="mt-4 inline-block">
          <Button variant="primary">Return to Doctor Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/doctors" className="hover:text-slate-800">Doctors</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-medium">{doctor.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Doctor Profile */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-28 h-28 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{doctor.name}</h1>
                  <Badge variant="teal" size="sm">Verified Medical Specialist</Badge>
                </div>
                <div className="text-sm font-semibold text-tealbrand-700">{doctor.specialization}</div>
                <div className="text-xs text-slate-600">{doctor.qualification}</div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <strong className="text-slate-900 font-bold">{doctor.rating}</strong>
                    <span className="text-slate-400">({doctor.reviewCount} reviews)</span>
                  </div>
                  <span>•</span>
                  <span>{doctor.experienceYears} Years Clinical Experience</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  About Dr. {doctor.name.split(' ').pop()}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{doctor.bio}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Languages Spoken</span>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-slate-500" />
                    {doctor.languages.join(', ')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Standard Consultation Fee</span>
                  <div className="text-sm font-bold text-slate-900">
                    {formatCurrency(doctor.consultationFee)}
                    <span className="text-[11px] font-normal text-slate-500"> / session</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Clinic Location</div>
                  <div className="text-blue-700 mt-0.5">{doctor.clinicAddress}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Policy note */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-tealbrand-600" /> Cancellation & Rescheduling Policy
            </div>
            <p>
              Appointments can be rescheduled or cancelled anytime up to 2 hours prior to scheduled consultation time with automatic demo fee refund.
            </p>
          </div>
        </div>

        {/* Right 5 Columns: Booking & Slot Selection Widget */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Book Consultation</h2>
              <span className="text-sm font-extrabold text-brand-700">
                {formatCurrency(doctor.consultationFee)}
              </span>
            </div>

            {/* Select Consultation Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Select Consultation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {doctor.availableTypes.includes('CLINIC') && (
                  <button
                    onClick={() => setConsultationType('CLINIC')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      consultationType === 'CLINIC'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="text-xs font-bold">In-Clinic Visit</div>
                      <div className="text-[10px] text-slate-500">Visit medical center</div>
                    </div>
                  </button>
                )}

                {doctor.availableTypes.includes('ONLINE') && (
                  <button
                    onClick={() => setConsultationType('ONLINE')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      consultationType === 'ONLINE'
                        ? 'border-tealbrand-600 bg-tealbrand-50/50 text-tealbrand-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Video className="w-4 h-4 text-tealbrand-600" />
                    <div>
                      <div className="text-xs font-bold">Video Consult</div>
                      <div className="text-[10px] text-slate-500">Secure HD call</div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Select Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>2. Select Date</span>
                <span className="text-[10px] text-slate-400 font-normal">Next 14 Days</span>
              </label>
              {availableDates.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
                  No slots available for this doctor.
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.slice(0, 10).map((dateStr) => {
                    const isSelected = selectedDate === dateStr;
                    const d = new Date(dateStr);
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = d.getDate();
                    const monthName = d.toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`flex-shrink-0 py-2.5 px-3.5 rounded-xl border text-center transition ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold opacity-80">{dayName}</div>
                        <div className="text-sm font-bold">{dayNum}</div>
                        <div className="text-[10px] opacity-80">{monthName}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Select Slot */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>3. Select Time Slot</span>
                <span className="text-[10px] text-tealbrand-700 font-semibold">{daySlots.length} Open Slots</span>
              </label>

              {daySlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
                  All slots on this date are currently booked. Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {daySlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-brand-700 text-white border-brand-700 font-bold'
                            : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Patient Symptoms/Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reason / Symptoms (Optional)
              </label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="e.g. Follow-up consultation, chest tightness check, lab review..."
                rows={2}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Proceed CTA */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!selectedSlot}
              onClick={handleStartBooking}
            >
              {selectedSlot
                ? `Proceed to Payment • ${formatCurrency(doctor.consultationFee)}`
                : 'Select a Slot to Continue'}
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal & Simulated Payment */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsBookingModalOpen(false);
            setBookingConfirmed(false);
          }
        }}
        maxWidth="md"
        title={bookingConfirmed ? 'Booking Confirmed!' : 'Confirm Consultation & Simulated Payment'}
      >
        {bookingConfirmed ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Appointment is Booked!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Consultation with <strong>{doctor.name}</strong> on{' '}
                <strong>{selectedSlot && formatDate(selectedSlot.date)}</strong> at{' '}
                <strong>{selectedSlot && formatTime(selectedSlot.startTime)}</strong>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className="font-bold text-slate-800">{consultationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Paid (Demo):</span>
                <span className="font-bold text-emerald-700">{formatCurrency(doctor.consultationFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-medium text-slate-800">{currentUser?.name}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => router.push('/dashboard/patient?tab=appointments')}
              >
                Go to My Appointments
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setBookingConfirmed(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Appointment Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-900">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialization:</span>
                <span className="font-medium text-slate-800">{doctor.specialization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">
                  {selectedSlot && formatDate(selectedSlot.date)} at {selectedSlot && formatTime(selectedSlot.startTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Type:</span>
                <Badge variant={consultationType === 'ONLINE' ? 'teal' : 'default'} size="sm">
                  {consultationType}
                </Badge>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-700">Total Consultation Fee:</span>
                <span className="font-extrabold text-brand-700">{formatCurrency(doctor.consultationFee)}</span>
              </div>
            </div>

            {/* Demo Payment Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Simulated Checkout:</strong> Demo payment — no real money will be charged. Choose the simulated outcome below to test the workflow.
              </div>
            </div>

            {/* Deterministic Simulation Action Choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Simulation Outcome
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAction('SUCCESS')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                    paymentAction === 'SUCCESS'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ✓ Simulate Success
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAction('FAIL')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                    paymentAction === 'FAIL'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 font-bold ring-2 ring-rose-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ✕ Simulate Failure
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAction('CANCEL')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                    paymentAction === 'CANCEL'
                      ? 'border-slate-600 bg-slate-100 text-slate-900 font-bold ring-2 ring-slate-400'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  ⊘ Cancel Action
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsBookingModalOpen(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmBooking}
                isLoading={isSubmitting}
              >
                Pay & Confirm Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
