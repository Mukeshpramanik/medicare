'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  Stethoscope,
  Clock,
  Star,
  ArrowRight,
  Heart,
  Activity,
  CheckCircle2,
  Video,
  Building2,
  Sparkles,
} from 'lucide-react';
import { DoctorService } from '@/features/doctors/doctor.service';
import { ProductService } from '@/features/products/product.service';
import { Doctor, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/features/cart/cart.context';
import { useToast } from '@/components/ui/Toast';

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { success, error } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setDoctors(DoctorService.getActiveDoctors().slice(0, 4));
    setProducts(ProductService.getActiveProducts().slice(0, 4));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/doctors?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault();
    const res = addToCart(prod.id, 1);
    if (res.success) {
      success(`Added ${prod.name} to cart.`);
    } else {
      error(res.error || 'Could not add to cart.');
    }
  };

  const specializations = [
    { name: 'Cardiology', count: '1 specialist', icon: Heart },
    { name: 'Dermatology & Cosmetology', count: '1 specialist', icon: Sparkles },
    { name: 'Pediatrics', count: '1 specialist', icon: Activity },
    { name: 'Neurology', count: '1 specialist', icon: Stethoscope },
  ];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 border-b border-slate-200/60 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tealbrand-50 border border-tealbrand-200 text-tealbrand-800 text-xs font-semibold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-tealbrand-600" />
                Trusted Healthcare Platform • Verified Specialists & Essentials
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Compassionate healthcare, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-tealbrand-600">
                  seamlessly connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Schedule verified doctor consultations in clinics or via teleconsultation, and shop clinical essentials, monitoring devices, and daily wellness items with simulated fast delivery.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-300 shadow-md">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctors, specializations, clinics..."
                    className="w-full text-sm outline-none bg-transparent placeholder:text-slate-400"
                  />
                </div>
                <Button type="submit" variant="primary" size="md">
                  Search
                </Button>
              </form>

              {/* Quick Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/doctors">
                  <Button variant="primary" size="lg" className="shadow-lg shadow-brand-500/20">
                    <Calendar className="w-5 h-5 mr-2" />
                    Find a Doctor
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" size="lg">
                    <ShoppingBag className="w-5 h-5 mr-2 text-tealbrand-600" />
                    Shop Essentials
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-tealbrand-600" />
                  <span>Verified Medical Specialists</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-tealbrand-600" />
                  <span>Real-time Slot Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-tealbrand-600" />
                  <span>Simulated Delivery Tracking</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-tealbrand-100 text-tealbrand-700 flex items-center justify-center font-bold">
                      MC
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">MediCare Concierge</div>
                      <div className="text-xs text-slate-500">Live Scheduling Ready</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Available</Badge>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">Specialist Consultation</div>
                      <div className="text-[11px] text-slate-500">8 Specialties • Clinic & Telehealth</div>
                    </div>
                    <Link href="/doctors" className="text-xs font-bold text-brand-600 hover:text-brand-800">
                      Book →
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tealbrand-100 text-tealbrand-700 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">Pharmacy & Devices</div>
                      <div className="text-[11px] text-slate-500">20+ Curated catalog items</div>
                    </div>
                    <Link href="/products" className="text-xs font-bold text-tealbrand-600 hover:text-tealbrand-800">
                      Browse →
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-100 text-xs text-brand-900 flex items-center justify-between">
                  <div>
                    <div className="font-bold">Next Open Appointment</div>
                    <div className="text-brand-700 text-[11px]">Today at 09:30 AM • Dr. Rajesh Sharma</div>
                  </div>
                  <Link href="/doctors/doc_1">
                    <Button variant="primary" size="sm">View Slot</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Specialties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Top Medical Specialties
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Connect with leading certified practitioners across key clinical departments.
            </p>
          </div>
          <Link href="/doctors" className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-800">
            View all doctors <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specializations.map((spec) => {
            const Icon = spec.icon;
            return (
              <Link
                key={spec.name}
                href={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
                className="group p-6 rounded-2xl border border-slate-200 bg-white hover:border-brand-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition">
                  {spec.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{spec.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Consult Our Top Specialists
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select an available appointment slot for in-clinic visit or video consultation.
            </p>
          </div>
          <Link href="/doctors">
            <Button variant="outline" size="sm">
              Explore All 8 Doctors
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{doc.name}</h3>
                    <p className="text-xs text-tealbrand-700 font-medium">{doc.specialization}</p>
                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800">{doc.rating}</span>
                      <span className="text-slate-400">({doc.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{doc.bio}</p>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-medium text-slate-800">{doc.experienceYears}+ years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(doc.consultationFee)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {doc.availableTypes.includes('CLINIC') && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      <Building2 className="w-3 h-3 text-slate-500" /> Clinic
                    </span>
                  )}
                  {doc.availableTypes.includes('ONLINE') && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-tealbrand-700 bg-tealbrand-50 px-2 py-0.5 rounded">
                      <Video className="w-3 h-3 text-tealbrand-600" /> Video
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <Link href={`/doctors/${doc.id}`} className="w-full block">
                  <Button variant="primary" size="sm" className="w-full">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured Healthcare Essentials
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Clinically tested monitors, home diagnostics, and everyday wellness nutrition.
            </p>
          </div>
          <Link href="/products">
            <Button variant="outline" size="sm">
              View All 20+ Products
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {prod.requiresPrescription && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="warning" size="sm">Rx Required</Badge>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-800">
                  ★ {prod.rating}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {prod.category}
                </span>
                <Link href={`/products/${prod.id}`}>
                  <h3 className="font-bold text-slate-900 text-sm hover:text-brand-600 transition line-clamp-1 mb-1">
                    {prod.name}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{prod.description}</p>

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-slate-900">{formatCurrency(prod.price)}</span>
                    <span className="text-[10px] text-slate-400 block">{prod.packSize}</span>
                  </div>
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={(e) => handleAddToCart(e, prod)}
                    disabled={prod.stock === 0}
                  >
                    {prod.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How MediCare Works</h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed with patient comfort in mind, empowering quick access to medical care and delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-lg mx-auto">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Find & Consult</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter doctors by specialization, consultation type, language, and fee. View live future slots and lock your appointment.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-tealbrand-50 text-tealbrand-700 flex items-center justify-center font-bold text-lg mx-auto">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Shop Essentials & Order</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add health devices, wellness vitamins, and first aid supplies to cart with automated stock checks and demo prescription validation.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg mx-auto">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Track In Real-Time</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage appointment statuses, reschedule slots atomically, and view realistic order fulfillment timelines on your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
