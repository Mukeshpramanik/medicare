'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Stethoscope,
  Calendar,
  Package,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  FileText,
  Activity,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { RoleGuard } from '@/app/route-guards/RoleGuard';
import { useAuth } from '@/features/auth/auth.context';
import { DoctorService } from '@/features/doctors/doctor.service';
import { ProductService } from '@/features/products/product.service';
import { AppointmentService } from '@/features/appointments/appointment.service';
import { OrderService } from '@/features/orders/order.service';
import { PrescriptionService } from '@/features/prescriptions/prescription.service';
import { PaymentService } from '@/features/payments/payment.service';
import { getAdminStats, getAnalyticsData, getActivityLogs } from '@/features/admin/admin.service';
import { resetDemoData } from '@/data/seed';
import { Doctor, Product, Appointment, Order, PrescriptionRequest, Payment, ActivityLog, ProductCategory, OrderStatus, AppointmentStatus } from '@/types';
import { formatCurrency, formatDate, formatTime, getOrderStatusBadge, getAppointmentStatusBadge, getPrescriptionStatusBadge } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type AdminTab =
  | 'overview'
  | 'analytics'
  | 'doctors'
  | 'products'
  | 'appointments'
  | 'orders'
  | 'prescriptions'
  | 'payments'
  | 'activity'
  | 'settings';

const PIE_COLORS = ['#0284c7', '#0d9488', '#6366f1', '#f59e0b', '#ec4899'];

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { success, error, warning } = useToast();

  const tabParam = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam);

  const [stats, setStats] = useState(getAdminStats());
  const [analytics, setAnalytics] = useState(getAnalyticsData());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Search queries for admin tables
  const [searchDoc, setSearchDoc] = useState('');
  const [searchProd, setSearchProd] = useState('');
  const [searchOrder, setSearchOrder] = useState('');

  // Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
  const [reviewRxModalItem, setReviewRxModalItem] = useState<PrescriptionRequest | null>(null);
  const [rxReviewNotes, setRxReviewNotes] = useState('');

  // Forms
  const [newDocData, setNewDocData] = useState({
    name: '',
    specialization: 'General Physician & Diabetology',
    qualification: 'MBBS, MD',
    experienceYears: 10,
    consultationFee: 700,
    languages: 'English, Hindi',
    bio: 'Dedicated medical practitioner.',
    clinicAddress: 'MediCare Clinical Center, Bengaluru',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
  });

  const [newProdData, setNewProdData] = useState({
    name: '',
    category: 'wellness' as ProductCategory,
    description: '',
    usageInfo: 'Follow physician guidance or pack instructions.',
    packSize: 'Pack of 30',
    price: 350,
    stock: 50,
    sku: 'MED-NEW-001',
    requiresPrescription: false,
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300',
    tags: 'wellness, new',
  });

  const refreshAll = () => {
    setStats(getAdminStats());
    setAnalytics(getAnalyticsData());
    setDoctors(DoctorService.getDoctors());
    setProducts(ProductService.getProducts());
    setAppointments(AppointmentService.getAppointments());
    setOrders(OrderService.getOrders());
    setPrescriptions(PrescriptionService.getPrescriptions());
    setPayments(PaymentService.getPayments());
    setActivities(getActivityLogs());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/admin?tab=${tab}`);
  };

  // Factory reset
  const handleFactoryReset = () => {
    resetDemoData();
    setIsResetConfirmOpen(false);
    success('Platform demo state fully restored to default seeds!');
    refreshAll();
  };

  // Doctor CRUD
  const handleCreateDoctor = () => {
    if (!newDocData.name) {
      error('Please enter doctor name.');
      return;
    }
    const res = DoctorService.createDoctor({
      userId: `usr_doc_${Date.now()}`,
      name: newDocData.name,
      specialization: newDocData.specialization,
      qualification: newDocData.qualification,
      experienceYears: Number(newDocData.experienceYears),
      languages: newDocData.languages.split(',').map((s) => s.trim()),
      consultationFee: Number(newDocData.consultationFee),
      bio: newDocData.bio,
      clinicAddress: newDocData.clinicAddress,
      avatar: newDocData.avatar,
      availableTypes: ['CLINIC', 'ONLINE'],
      weeklyAvailability: [],
      isActive: true,
    });
    if (res.success) {
      success(`Added Dr. ${newDocData.name} to directory.`);
      setIsNewDocModalOpen(false);
      refreshAll();
    } else {
      error(res.error || 'Failed to create doctor.');
    }
  };

  const handleToggleDoctorActive = (docId: string) => {
    const res = DoctorService.toggleDoctorActive(docId);
    if (res.success) {
      success(`Doctor status toggled.`);
      refreshAll();
    }
  };

  // Product CRUD
  const handleCreateProduct = () => {
    if (!newProdData.name) {
      error('Please enter product name.');
      return;
    }
    const res = ProductService.createProduct({
      name: newProdData.name,
      category: newProdData.category,
      description: newProdData.description,
      usageInfo: newProdData.usageInfo,
      packSize: newProdData.packSize,
      price: Number(newProdData.price),
      stock: Number(newProdData.stock),
      sku: newProdData.sku,
      isActive: true,
      requiresPrescription: newProdData.requiresPrescription,
      imageUrl: newProdData.imageUrl,
      tags: newProdData.tags.split(',').map((t) => t.trim()),
    });
    if (res.success) {
      success(`Added product ${newProdData.name}.`);
      setIsNewProdModalOpen(false);
      refreshAll();
    } else {
      error(res.error || 'Failed to create product.');
    }
  };

  const handleUpdateStock = (prodId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    const res = ProductService.updateProductStock(prodId, nextStock);
    if (res.success) {
      refreshAll();
    }
  };

  const handleToggleProductActive = (prodId: string) => {
    const res = ProductService.toggleProductActive(prodId);
    if (res.success) {
      success('Product status updated.');
      refreshAll();
    }
  };

  // Order status transition
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    if (!currentUser) return;
    const res = OrderService.updateOrderStatus(orderId, nextStatus, currentUser.name, `Updated by Admin`);
    if (res.success) {
      success(`Order status moved to ${nextStatus}.`);
      refreshAll();
    } else {
      error(res.error || 'Invalid order status transition.');
    }
  };

  // Appointment status transition
  const handleUpdateAppointmentStatus = (aptId: string, status: AppointmentStatus) => {
    if (!currentUser) return;
    const res = AppointmentService.updateAppointmentStatus(aptId, status, currentUser.id, 'Admin updated status');
    if (res.success) {
      success(`Appointment marked as ${status}.`);
      refreshAll();
    } else {
      error(res.error || 'Invalid transition.');
    }
  };

  // Prescription review
  const handleReviewPrescription = (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewRxModalItem || !currentUser) return;
    const res = PrescriptionService.reviewPrescription(
      reviewRxModalItem.id,
      status,
      currentUser.name,
      rxReviewNotes
    );
    if (res.success) {
      success(`Prescription ${status}.`);
      setReviewRxModalItem(null);
      setRxReviewNotes('');
      refreshAll();
    } else {
      error(res.error || 'Failed to review prescription.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple" size="sm">Admin Console</Badge>
            <span className="text-xs text-slate-400 font-mono">Platform v1.0.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">MediCare Administration</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete platform management: doctors, catalog, appointments, orders, and simulated payment ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-teal-400" /> Reset Demo Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2 sm:gap-6 overflow-x-auto text-sm font-medium scrollbar-thin">
        {[
          { key: 'overview', label: 'Overview & KPI' },
          { key: 'analytics', label: 'Charts & Analytics' },
          { key: 'doctors', label: `Doctors (${doctors.length})` },
          { key: 'products', label: `Products (${products.length})` },
          { key: 'appointments', label: `Appointments (${appointments.length})` },
          { key: 'orders', label: `Orders (${orders.length})` },
          { key: 'prescriptions', label: `Prescriptions (${prescriptions.filter((p) => p.status === 'PENDING_REVIEW').length} Pending)` },
          { key: 'payments', label: `Payments (${payments.length})` },
          { key: 'activity', label: 'Activity Log' },
          { key: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as AdminTab)}
              className={`pb-3 pt-1 px-1 border-b-2 font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-600'
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
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{stats.totalPatients}</div>
                <div className="text-xs text-slate-500">Registered Patients</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tealbrand-50 text-tealbrand-600 flex items-center justify-center font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{stats.activeDoctors}</div>
                <div className="text-xs text-slate-500">Active Doctors</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{stats.totalOrders}</div>
                <div className="text-xs text-slate-500">Total Orders Placed</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.simulatedRevenue)}</div>
                <div className="text-xs text-slate-500">Simulated Gross Revenue</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Recent Customer Orders</h3>
                <button onClick={() => handleTabChange('orders')} className="text-xs text-brand-600 font-semibold hover:underline">
                  View All ({orders.length})
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {orders.slice(0, 5).map((order) => {
                  const badge = getOrderStatusBadge(order.status);
                  return (
                    <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{order.patientName}</div>
                        <div className="text-slate-400 font-mono">#{order.id} • {order.items.length} items</div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prescription Review Queue Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Prescription Verification Queue</h3>
                <button onClick={() => handleTabChange('prescriptions')} className="text-xs text-brand-600 font-semibold hover:underline">
                  View Queue
                </button>
              </div>

              {prescriptions.filter((p) => p.status === 'PENDING_REVIEW').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No pending prescriptions awaiting verification.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {prescriptions
                    .filter((p) => p.status === 'PENDING_REVIEW')
                    .slice(0, 4)
                    .map((rx) => (
                      <div key={rx.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{rx.patientName}</div>
                          <div className="text-slate-500">{rx.fileName}</div>
                        </div>
                        <Button
                          variant="teal"
                          size="sm"
                          onClick={() => {
                            setReviewRxModalItem(rx);
                            setRxReviewNotes('Verified patient credentials.');
                          }}
                        >
                          Review & Verify
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Analytics & Charts */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue / Orders Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">7-Day Simulated Revenue Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenueTimeline}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Category Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Catalog Category Distribution</h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Doctors Management */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                placeholder="Search doctors..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsNewDocModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Doctor
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Experience</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors
                  .filter((d) => d.name.toLowerCase().includes(searchDoc.toLowerCase()))
                  .map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-3 flex items-center gap-3">
                        <img src={doc.avatar} alt={doc.name} className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.name}</span>
                          <span className="text-[11px] text-slate-400">{doc.qualification}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-tealbrand-700">{doc.specialization}</td>
                      <td className="p-3 text-slate-600">{doc.experienceYears} Years</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(doc.consultationFee)}</td>
                      <td className="p-3 text-amber-500 font-bold">★ {doc.rating}</td>
                      <td className="p-3">
                        <Badge variant={doc.isActive ? 'success' : 'error'} size="sm">
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleDoctorActive(doc.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                            doc.isActive
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {doc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Products Management */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchProd}
                onChange={(e) => setSearchProd(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsNewProdModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Product
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock Units</th>
                  <th className="p-3">Rx Req.</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Stock Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter((p) => p.name.toLowerCase().includes(searchProd.toLowerCase()) || p.sku.toLowerCase().includes(searchProd.toLowerCase()))
                  .map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="p-3 flex items-center gap-3">
                        <img src={prod.imageUrl} alt={prod.name} className="w-9 h-9 rounded-lg object-cover" />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs">{prod.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{prod.sku}</span>
                        </div>
                      </td>
                      <td className="p-3 capitalize font-medium text-slate-700">{prod.category}</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(prod.price)}</td>
                      <td className="p-3">
                        <span className={`font-bold ${prod.stock < 15 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {prod.stock}
                        </span>
                      </td>
                      <td className="p-3">
                        {prod.requiresPrescription ? <Badge variant="warning" size="sm">Rx</Badge> : <Badge variant="default" size="sm">OTC</Badge>}
                      </td>
                      <td className="p-3">
                        <Badge variant={prod.isActive ? 'success' : 'error'} size="sm">
                          {prod.isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStock(prod.id, prod.stock, -5)}
                            className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 font-bold"
                            title="Decrease 5"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleUpdateStock(prod.id, prod.stock, 10)}
                            className="px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 font-bold"
                            title="Increase 10"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleToggleProductActive(prod.id)}
                            className="ml-2 text-slate-500 hover:text-slate-800 text-[11px] underline"
                          >
                            {prod.isActive ? 'Archive' : 'Restore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Appointments Management */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            Global Consultations Master List ({appointments.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Set Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const badge = getAppointmentStatusBadge(apt.status);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">#{apt.id}</td>
                      <td className="p-3 font-bold text-slate-900">{apt.patientName}</td>
                      <td className="p-3 text-slate-700">{apt.doctorName}</td>
                      <td className="p-3 text-slate-600">
                        {formatDate(apt.date)} at {formatTime(apt.time)}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(apt.fee)}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={apt.status}
                          onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                          className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Orders Management */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">
              Orders Fulfillment Pipeline ({orders.length})
            </h3>
            <span className="text-xs text-slate-500">Controlled state transitions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Advance Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const badge = getOrderStatusBadge(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">#{ord.id}</td>
                      <td className="p-3 font-semibold text-slate-800">{ord.patientName}</td>
                      <td className="p-3 text-slate-600">{ord.items.length} items</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(ord.total)}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {ord.status === 'PLACED' && (
                          <Button variant="outline" size="sm" onClick={() => handleUpdateOrderStatus(ord.id, 'CONFIRMED')}>
                            Confirm
                          </Button>
                        )}
                        {ord.status === 'CONFIRMED' && (
                          <Button variant="outline" size="sm" onClick={() => handleUpdateOrderStatus(ord.id, 'PROCESSING')}>
                            Process
                          </Button>
                        )}
                        {ord.status === 'PROCESSING' && (
                          <Button variant="outline" size="sm" onClick={() => handleUpdateOrderStatus(ord.id, 'PACKED')}>
                            Pack
                          </Button>
                        )}
                        {ord.status === 'PACKED' && (
                          <Button variant="outline" size="sm" onClick={() => handleUpdateOrderStatus(ord.id, 'SHIPPED')}>
                            Ship
                          </Button>
                        )}
                        {ord.status === 'SHIPPED' && (
                          <Button variant="teal" size="sm" onClick={() => handleUpdateOrderStatus(ord.id, 'OUT_FOR_DELIVERY')}>
                            Dispatch
                          </Button>
                        )}
                        {ord.status === 'OUT_FOR_DELIVERY' && (
                          <Button variant="primary" size="sm" onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}>
                            Deliver
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Prescriptions Review Queue */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            Prescriptions Review Queue ({prescriptions.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Doctor / Notes</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((rx) => {
                  const badge = getPrescriptionStatusBadge(rx.status);
                  return (
                    <tr key={rx.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{rx.patientName}</td>
                      <td className="p-3 font-mono text-slate-600">{rx.fileName}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{rx.doctorNotes || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewRxModalItem(rx);
                            setRxReviewNotes(rx.reviewerNotes || 'Verified active doctor prescription registration.');
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Simulated Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            Simulated Payments & Transactions Ledger ({payments.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Txn Ref</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{pay.transactionRef}</td>
                    <td className="p-3 text-slate-600">{pay.purpose}</td>
                    <td className="p-3 text-slate-600">{pay.paymentMethod}</td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(pay.amount)}</td>
                    <td className="p-3">
                      <Badge variant={pay.status === 'SUCCESS' ? 'success' : pay.status === 'REFUNDED' ? 'purple' : 'error'} size="sm">
                        {pay.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400">{formatDate(pay.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Activity Logs */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            System Audit Trail & Activity Feed ({activities.length})
          </h3>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-start gap-4 text-xs">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 flex-shrink-0">
                  <Activity className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{act.userName}</span>
                    <Badge variant="default" size="sm">{act.action}</Badge>
                  </div>
                  <p className="text-slate-600">{act.details}</p>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDate(act.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-xl space-y-6">
          <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
            Platform Settings & Diagnostics
          </h3>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Demo Sandbox Environment Active
            </div>
            <p>
              Data is stored in browser LocalStorage under keys starting with <code>medicare.*</code>.
            </p>
          </div>

          <div className="pt-2">
            <Button variant="danger" size="md" onClick={() => setIsResetConfirmOpen(true)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Platform to Factory Seed State
            </Button>
          </div>
        </div>
      )}

      {/* New Doctor Modal */}
      <Modal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        title="Add New Doctor Profile"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Doctor Full Name"
            value={newDocData.name}
            onChange={(e) => setNewDocData({ ...newDocData, name: e.target.value })}
            placeholder="Dr. Jane Doe"
          />
          <Input
            label="Specialization"
            value={newDocData.specialization}
            onChange={(e) => setNewDocData({ ...newDocData, specialization: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Experience (Years)"
              type="number"
              value={newDocData.experienceYears}
              onChange={(e) => setNewDocData({ ...newDocData, experienceYears: Number(e.target.value) })}
            />
            <Input
              label="Consultation Fee (₹)"
              type="number"
              value={newDocData.consultationFee}
              onChange={(e) => setNewDocData({ ...newDocData, consultationFee: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Clinic Address"
            value={newDocData.clinicAddress}
            onChange={(e) => setNewDocData({ ...newDocData, clinicAddress: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsNewDocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleCreateDoctor}>
              Save Doctor
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Product Modal */}
      <Modal
        isOpen={isNewProdModalOpen}
        onClose={() => setIsNewProdModalOpen(false)}
        title="Add Catalog Product"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Product Name"
            value={newProdData.name}
            onChange={(e) => setNewProdData({ ...newProdData, name: e.target.value })}
            placeholder="e.g. Zincovit Daily Tablets"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
              <select
                value={newProdData.category}
                onChange={(e) => setNewProdData({ ...newProdData, category: e.target.value as ProductCategory })}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="wellness">Wellness</option>
                <option value="first-aid">First Aid</option>
                <option value="monitoring">Monitoring</option>
                <option value="hygiene">Hygiene</option>
                <option value="prescription">Prescription</option>
              </select>
            </div>
            <Input
              label="SKU Code"
              value={newProdData.sku}
              onChange={(e) => setNewProdData({ ...newProdData, sku: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (₹)"
              type="number"
              value={newProdData.price}
              onChange={(e) => setNewProdData({ ...newProdData, price: Number(e.target.value) })}
            />
            <Input
              label="Initial Stock Units"
              type="number"
              value={newProdData.stock}
              onChange={(e) => setNewProdData({ ...newProdData, stock: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Description"
            value={newProdData.description}
            onChange={(e) => setNewProdData({ ...newProdData, description: e.target.value })}
          />

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={newProdData.requiresPrescription}
              onChange={(e) => setNewProdData({ ...newProdData, requiresPrescription: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600"
            />
            Requires Doctor Prescription
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsNewProdModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleCreateProduct}>
              Save Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Prescription Modal */}
      <Modal
        isOpen={!!reviewRxModalItem}
        onClose={() => setReviewRxModalItem(null)}
        title="Review Demo Prescription"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 text-xs space-y-1">
            <div>Patient: <strong>{reviewRxModalItem?.patientName}</strong></div>
            <div>Document: <strong>{reviewRxModalItem?.fileName}</strong></div>
            <div>Notes: {reviewRxModalItem?.doctorNotes || 'None'}</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verification Notes
            </label>
            <textarea
              value={rxReviewNotes}
              onChange={(e) => setRxReviewNotes(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="danger" className="flex-1" onClick={() => handleReviewPrescription('REJECTED')}>
              Reject
            </Button>
            <Button variant="teal" className="flex-1" onClick={() => handleReviewPrescription('APPROVED')}>
              Approve Prescription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Factory Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleFactoryReset}
        title="Reset All MediCare Data?"
        message="This will re-initialize all default seed accounts, 8 doctors, 20+ products, appointments, and orders. Any local browser edits will be lost."
        confirmText="Confirm Reset"
        isDestructive={true}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><div className="h-64 bg-slate-100 animate-pulse rounded-2xl" /></div>}>
        <AdminDashboardContent />
      </Suspense>
    </RoleGuard>
  );
}
