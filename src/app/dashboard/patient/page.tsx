'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Package,
  FileText,
  User,
  Bell,
  Clock,
  Building2,
  Video,
  Star,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  CreditCard,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { RoleGuard } from '@/app/route-guards/RoleGuard';
import { useAuth } from '@/features/auth/auth.context';
import { AppointmentService } from '@/features/appointments/appointment.service';
import { OrderService } from '@/features/orders/order.service';
import { PrescriptionService } from '@/features/prescriptions/prescription.service';
import { NotificationService } from '@/features/notifications/notification.service';
import { DoctorService } from '@/features/doctors/doctor.service';
import { AuthService } from '@/features/auth/auth.service';
import { Appointment, Order, PrescriptionRequest, Notification, DoctorSlot, Address } from '@/types';
import { formatCurrency, formatDate, formatTime, getAppointmentStatusBadge, getOrderStatusBadge, getPrescriptionStatusBadge, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type PatientTab = 'overview' | 'appointments' | 'orders' | 'prescriptions' | 'profile' | 'notifications';

function PatientDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, refreshUser } = useAuth();
  const { success, error, warning } = useToast();

  const tabParam = (searchParams.get('tab') as PatientTab) || 'overview';
  const [activeTab, setActiveTab] = useState<PatientTab>(tabParam);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Cancellation & Rescheduling modals
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleModalApt, setRescheduleModalApt] = useState<Appointment | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<DoctorSlot[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<DoctorSlot | null>(null);

  // Upload prescription modal
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxFileName, setRxFileName] = useState('prescription_consultation_scan.pdf');
  const [rxNotes, setRxNotes] = useState('');

  // Address edit modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: currentUser?.name || '',
    phone: currentUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    isDefault: false,
  });

  const loadData = () => {
    if (currentUser) {
      setAppointments(AppointmentService.getAppointmentsByPatient(currentUser.id));
      setOrders(OrderService.getOrdersByPatient(currentUser.id));
      setPrescriptions(PrescriptionService.getPrescriptionsByPatient(currentUser.id));
      setNotifications(NotificationService.getNotificationsByUser(currentUser.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: PatientTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/patient?tab=${tab}`);
  };

  // Appointment actions
  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleModalApt(apt);
    const availableSlots = DoctorService.getDoctorSlots(apt.doctorId, false);
    setRescheduleSlots(availableSlots);
    setSelectedRescheduleSlot(null);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleModalApt || !selectedRescheduleSlot || !currentUser) return;
    const res = AppointmentService.rescheduleAppointment(
      rescheduleModalApt.id,
      selectedRescheduleSlot.id,
      currentUser.id
    );
    if (res.success) {
      success('Appointment rescheduled successfully!');
      setRescheduleModalApt(null);
      loadData();
    } else {
      error(res.error || 'Failed to reschedule appointment.');
    }
  };

  const handleConfirmCancelAppointment = () => {
    if (!cancelModalApt || !currentUser) return;
    const res = AppointmentService.cancelAppointment(
      cancelModalApt.id,
      currentUser.id,
      cancelReason || 'Cancelled by patient'
    );
    if (res.success) {
      success('Appointment cancelled. Doctor slot has been released.');
      setCancelModalApt(null);
      setCancelReason('');
      loadData();
    } else {
      error(res.error || 'Failed to cancel appointment.');
    }
  };

  // Prescription Upload
  const handleUploadRx = () => {
    if (!currentUser) return;
    const res = PrescriptionService.uploadPrescription(
      currentUser.id,
      currentUser.name,
      rxFileName || 'patient_prescription.pdf',
      rxNotes
    );
    if (res.success) {
      success('Prescription uploaded for clinical verification.');
      setIsRxModalOpen(false);
      setRxNotes('');
      loadData();
    } else {
      error(res.error || 'Failed to upload prescription.');
    }
  };

  // Profile Address addition
  const handleSaveAddress = () => {
    if (!currentUser) return;
    if (!newAddress.addressLine1 || !newAddress.postalCode) {
      error('Please fill in required address fields.');
      return;
    }

    const currentProfile = currentUser.patientProfile || { addresses: [] };
    const addressToSave: Address = {
      ...newAddress,
      id: generateId('addr'),
    };

    const updatedAddresses = [...(currentProfile.addresses || []), addressToSave];
    const res = AuthService.updateUserProfile(currentUser.id, {
      patientProfile: {
        ...currentProfile,
        addresses: updatedAddresses,
      },
    });

    if (res.success) {
      success('New delivery address saved.');
      setIsAddressModalOpen(false);
      refreshUser();
    } else {
      error('Failed to save address.');
    }
  };

  const nextAppointment = appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING');
  const recentOrder = orders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Patient Welcome Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
            alt={currentUser?.name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{currentUser?.name}</h1>
              <Badge variant="info" size="sm">Patient Portal</Badge>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{currentUser?.email} • {currentUser?.phone || '+91 98222 33445'}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/doctors">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Book Consultation
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="sm">
              Pharmacy Store
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 sm:gap-6 overflow-x-auto text-sm font-medium scrollbar-thin">
        {[
          { key: 'overview', label: 'Overview', icon: HeartPulseIcon },
          { key: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
          { key: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: FileText },
          { key: 'profile', label: 'Profile & Addresses', icon: User },
          { key: 'notifications', label: `Notifications (${notifications.filter((n) => !n.isRead).length})`, icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as PatientTab)}
              className={`pb-3 pt-1 px-1 flex items-center gap-2 border-b-2 font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
                <div className="text-xs text-slate-500">Total Consultations</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tealbrand-50 text-tealbrand-600 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{orders.length}</div>
                <div className="text-xs text-slate-500">Products Ordered</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {prescriptions.filter((p) => p.status === 'APPROVED').length}
                </div>
                <div className="text-xs text-slate-500">Approved Prescriptions</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Next Upcoming Appointment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Next Upcoming Consultation</h3>
                <Link href="/dashboard/patient?tab=appointments" className="text-xs text-brand-600 font-semibold hover:underline">
                  View All
                </Link>
              </div>

              {nextAppointment ? (
                <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100 space-y-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={nextAppointment.doctorAvatar}
                      alt={nextAppointment.doctorName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{nextAppointment.doctorName}</h4>
                      <p className="text-xs text-tealbrand-700 font-medium">{nextAppointment.doctorSpecialization}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(nextAppointment.date)} at {formatTime(nextAppointment.time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-100/60 text-xs">
                    <Badge variant={nextAppointment.type === 'ONLINE' ? 'teal' : 'default'} size="sm">
                      {nextAppointment.type}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenReschedule(nextAppointment)}>
                        Reschedule
                      </Button>
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => setCancelModalApt(nextAppointment)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 space-y-3">
                  <p>You have no pending or upcoming consultations.</p>
                  <Link href="/doctors">
                    <Button variant="primary" size="sm">Book a Consultation</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Product Order */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Latest Order Status</h3>
                <Link href="/dashboard/patient?tab=orders" className="text-xs text-brand-600 font-semibold hover:underline">
                  View All Orders
                </Link>
              </div>

              {recentOrder ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">#{recentOrder.id}</span>
                    {(() => {
                      const badge = getOrderStatusBadge(recentOrder.status);
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="text-xs text-slate-700">
                    <strong>{recentOrder.items.length} items</strong> (Total: {formatCurrency(recentOrder.total)})
                  </div>

                  <p className="text-xs text-slate-500">
                    Est. Delivery: <strong>{formatDate(recentOrder.estimatedDeliveryDate)}</strong>
                  </p>

                  <div className="pt-2 border-t border-slate-200">
                    <Link href="/dashboard/patient?tab=orders">
                      <Button variant="outline" size="sm" className="w-full">
                        View Tracking Timeline
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 space-y-3">
                  <p>No product orders found.</p>
                  <Link href="/products">
                    <Button variant="primary" size="sm">Explore Catalog</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Appointments & Schedule</h2>
            <Link href="/doctors">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Book New Consultation
              </Button>
            </Link>
          </div>

          {appointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No appointments scheduled"
              description="Browse our specialists and book an in-clinic or video consultation."
              actionText="Find a Doctor"
              onAction={() => router.push('/doctors')}
            />
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => {
                const badge = getAppointmentStatusBadge(apt.status);
                const canModify = apt.status === 'CONFIRMED' || apt.status === 'PENDING';

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={apt.doctorAvatar}
                        alt={apt.doctorName}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{apt.doctorName}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-xs text-tealbrand-700 font-medium">{apt.doctorSpecialization}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(apt.date)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3.5 h-3.5" /> {formatTime(apt.time)}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{apt.type}</span>
                        </div>
                        {apt.notes && <div className="text-xs text-slate-500 italic mt-1">Note: {apt.notes}</div>}
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-slate-400">Consultation Fee</div>
                        <div className="text-base font-bold text-slate-900">{formatCurrency(apt.fee)}</div>
                      </div>

                      {canModify && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenReschedule(apt)}>
                            Reschedule
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => setCancelModalApt(apt)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Orders & Deliveries</h2>
            <Link href="/products">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Order Healthcare Essentials
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders placed yet"
              description="Explore our curated catalog of health monitors, first aid kits, and daily wellness items."
              actionText="Visit Store"
              onAction={() => router.push('/products')}
            />
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const badge = getOrderStatusBadge(order.status);
                const canCancel = order.status === 'PLACED' || order.status === 'CONFIRMED' || order.status === 'PROCESSING';

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="text-xs text-slate-400 font-mono">ORDER #{order.id}</div>
                        <div className="text-xs text-slate-500">Placed on {formatDate(order.createdAt)}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Total</div>
                          <div className="text-sm font-extrabold text-brand-700">{formatCurrency(order.total)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="text-xs flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{item.productName}</div>
                            <div className="text-slate-500">Qty: {item.quantity} • {formatCurrency(item.priceSnapshot)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Fulfillment Timeline (Simulated)
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {order.statusHistory.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-brand-600" />
                            <span className="font-bold text-slate-800">{step.status}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({formatDate(step.changedAt)})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {canCancel && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (confirm('Cancel this order? Stock will be restored and demo payment refunded.')) {
                              const res = OrderService.cancelOrder(order.id, currentUser!.id);
                              if (res.success) {
                                success('Order cancelled successfully.');
                                loadData();
                              } else {
                                error(res.error || 'Failed to cancel order.');
                              }
                            }
                          }}
                        >
                          Cancel Order
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Prescription Verification (Demo)</h2>
              <p className="text-xs text-slate-500">
                Uploaded mock prescriptions allow checkout for prescription-only catalog items.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsRxModalOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" /> Upload Prescription
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
            <strong>Demo Safety Notice:</strong> Never upload real personal medical records or confidential health documents. This demo accepts simulated files only.
          </div>

          {prescriptions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No prescriptions uploaded"
              description="Submit a fictional prescription document to unlock prescription-restricted medications in the catalog."
              actionText="Upload Mock Prescription"
              onAction={() => setIsRxModalOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => {
                const badge = getPrescriptionStatusBadge(rx.status);
                return (
                  <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          PDF
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{rx.fileName}</div>
                          <div className="text-xs text-slate-400">
                            Uploaded {formatDate(rx.createdAt)} • Size: {rx.fileSize}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </div>

                    {rx.doctorNotes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong>Patient Note:</strong> {rx.doctorNotes}
                      </p>
                    )}

                    {rx.reviewerNotes && (
                      <p className="text-xs text-slate-700 bg-tealbrand-50/50 p-2.5 rounded-lg border border-tealbrand-100">
                        <strong>Pharmacist Review ({rx.reviewedBy}):</strong> {rx.reviewerNotes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile & Addresses */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Personal Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">{currentUser?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email Address</span>
                <span className="font-medium text-slate-800">{currentUser?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-800">{currentUser?.phone || '+91 98222 33445'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Blood Group</span>
                <span className="font-medium text-slate-800">
                  {currentUser?.patientProfile?.bloodGroup || 'B+'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Known Allergies</span>
                <span className="font-medium text-slate-800">
                  {currentUser?.patientProfile?.allergies?.join(', ') || 'Penicillin'}
                </span>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Delivery Addresses</h3>
              <Button variant="outline" size="sm" onClick={() => setIsAddressModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
              </Button>
            </div>

            <div className="space-y-3">
              {(currentUser?.patientProfile?.addresses || []).map((addr) => (
                <div key={addr.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{addr.fullName}</span>
                    {addr.isDefault && <Badge variant="teal" size="sm">Default</Badge>}
                  </div>
                  <div className="text-slate-600">{addr.addressLine1} {addr.addressLine2}</div>
                  <div className="text-slate-600">{addr.city}, {addr.state} - {addr.postalCode}</div>
                  <div className="text-slate-400">Phone: {addr.phone}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Notification Feed</h3>
            <button
              onClick={() => {
                if (currentUser) {
                  NotificationService.markAllAsRead(currentUser.id);
                  loadData();
                  success('All notifications marked as read.');
                }
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Mark All as Read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No notifications.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-3.5 px-2 flex items-start justify-between gap-4 transition ${
                    !n.isRead ? 'bg-brand-50/40 rounded-xl' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">{n.title}</div>
                    <p className="text-xs text-slate-600">{n.message}</p>
                    <div className="text-[10px] text-slate-400">{formatDate(n.createdAt)}</div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => {
                        NotificationService.markAsRead(n.id);
                        loadData();
                      }}
                      className="text-xs text-brand-600 hover:underline flex-shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleModalApt}
        onClose={() => setRescheduleModalApt(null)}
        title="Reschedule Appointment"
        description="Select a new available date and time slot with your doctor."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-700">
            Current: <strong>{rescheduleModalApt && formatDate(rescheduleModalApt.date)}</strong> at{' '}
            <strong>{rescheduleModalApt && formatTime(rescheduleModalApt.time)}</strong>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Available Open Slots ({rescheduleSlots.length})
            </label>
            <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2 pr-1">
              {rescheduleSlots.map((slot) => {
                const isSelected = selectedRescheduleSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedRescheduleSlot(slot)}
                    className={`p-2.5 rounded-xl border text-xs text-left transition ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{formatDate(slot.date)}</div>
                    <div className="font-bold text-brand-700">{formatTime(slot.startTime)} ({slot.type})</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setRescheduleModalApt(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={!selectedRescheduleSlot}
              onClick={handleConfirmReschedule}
            >
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={!!cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this consultation?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-600">
            Consultation with <strong>{cancelModalApt?.doctorName}</strong> on{' '}
            <strong>{cancelModalApt && formatDate(cancelModalApt.date)}</strong> at{' '}
            <strong>{cancelModalApt && formatTime(cancelModalApt.time)}</strong>.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cancellation Reason (Optional)
            </label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Scheduling conflict, symptom resolved..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelModalApt(null)}>
              Back
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleConfirmCancelAppointment}>
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Prescription Modal */}
      <Modal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        title="Submit Demo Prescription"
        description="Upload a mock prescription document for catalog fulfillment testing."
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Document Filename"
            value={rxFileName}
            onChange={(e) => setRxFileName(e.target.value)}
            placeholder="prescription_sample.pdf"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Doctor / Patient Notes</label>
            <textarea
              value={rxNotes}
              onChange={(e) => setRxNotes(e.target.value)}
              placeholder="e.g. Prescribed for seasonal bronchitis management..."
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsRxModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleUploadRx}>
              Submit Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Delivery Address"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Recipient Full Name"
            value={newAddress.fullName}
            onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
          />
          <Input
            label="Contact Phone"
            value={newAddress.phone}
            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
          />
          <Input
            label="Address Line 1"
            value={newAddress.addressLine1}
            onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
            placeholder="Flat / House No / Road"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
            />
            <Input
              label="Postal Code"
              value={newAddress.postalCode}
              onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveAddress}>
              Save Address
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function HeartPulseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

export default function PatientDashboardPage() {
  return (
    <RoleGuard allowedRoles={['PATIENT']}>
      <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><div className="h-64 bg-slate-100 animate-pulse rounded-2xl" /></div>}>
        <PatientDashboardContent />
      </Suspense>
    </RoleGuard>
  );
}

