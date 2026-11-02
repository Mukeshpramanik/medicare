'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Star,
  Building2,
  Video,
  Languages,
  Calendar,
  RotateCcw,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { DoctorService, DoctorFilters } from '@/features/doctors/doctor.service';
import { Doctor, ConsultationType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

function DoctorDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get('specialization') || 'ALL');
  const [consultType, setConsultType] = useState<ConsultationType | 'ALL'>(
    (searchParams.get('type') as ConsultationType) || 'ALL'
  );
  const [maxFee, setMaxFee] = useState<number>(1500);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<DoctorFilters['sortBy']>('recommended');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setSpecializations(DoctorService.getSpecializations());
  }, []);

  useEffect(() => {
    const list = DoctorService.filterDoctors({
      search,
      specialization: selectedSpec,
      consultationType: consultType,
      maxFee,
      minRating,
      sortBy,
    });
    setDoctors(list);
  }, [search, selectedSpec, consultType, maxFee, minRating, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSpec('ALL');
    setConsultType('ALL');
    setMaxFee(1500);
    setMinRating(0);
    setSortBy('recommended');
    router.push('/doctors');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Find Doctors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find & Book Doctor Consultations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select from {DoctorService.getActiveDoctors().length} verified medical specialists. Real-time availability for in-clinic and video consultations.
        </p>
      </div>

      {/* Main Grid: Sidebar Filters + Doctor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters {selectedSpec !== 'ALL' || consultType !== 'ALL' || minRating > 0 ? '(Active)' : ''}
          </Button>
          <span className="text-xs text-slate-500">{doctors.length} doctors found</span>
        </div>

        {/* Filters Sidebar */}
        <aside
          className={`lg:block ${
            showMobileFilters ? 'block' : 'hidden'
          } space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Filter className="w-4 h-4 text-brand-600" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Doctor name or keyword..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Specialization Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialization</label>
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['ALL', 'CLINIC', 'ONLINE'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConsultType(mode)}
                  className={`text-xs py-1.5 px-2 rounded-lg font-medium border text-center transition ${
                    consultType === mode
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mode === 'ALL' ? 'Any' : mode === 'CLINIC' ? 'In-Clinic' : 'Video'}
                </button>
              ))}
            </div>
          </div>

          {/* Max Consultation Fee */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Max Fee</span>
              <span className="font-bold text-slate-900">{formatCurrency(maxFee)}</span>
            </div>
            <input
              type="range"
              min="500"
              max="1500"
              step="50"
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹500</span>
              <span>₹1,500</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Minimum Rating</label>
            <div className="flex items-center gap-1">
              {[0, 4.5, 4.8].map((val) => (
                <button
                  key={val}
                  onClick={() => setMinRating(val)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition ${
                    minRating === val
                      ? 'bg-amber-500 text-white border-amber-500 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {val === 0 ? 'All' : `${val}+ ★`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Doctor Listings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-medium text-slate-600">
              Showing <strong className="text-slate-900">{doctors.length}</strong> available doctors
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-doctors" className="text-xs text-slate-500 whitespace-nowrap">Sort by:</label>
              <select
                id="sort-doctors"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as DoctorFilters['sortBy'])}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Highest Rating</option>
                <option value="fee-asc">Fee: Low to High</option>
                <option value="fee-desc">Fee: High to Low</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
          </div>

          {/* Doctor Cards */}
          {doctors.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No doctors match your criteria"
              description="Try adjusting your specialization, consultation type, or price filters to see more results."
              actionText="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="space-y-4">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                >
                  {/* Doctor Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/doctors/${doc.id}`}>
                          <h3 className="font-bold text-slate-900 text-base hover:text-brand-600 transition">
                            {doc.name}
                          </h3>
                        </Link>
                        <Badge variant="teal" size="sm">
                          Verified
                        </Badge>
                      </div>

                      <div className="text-xs font-semibold text-tealbrand-700">
                        {doc.specialization}
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">{doc.qualification}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <span className="font-medium">{doc.experienceYears} Years Experience</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <strong className="text-slate-800">{doc.rating}</strong>
                          <span className="text-slate-400">({doc.reviewCount})</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Languages className="w-3.5 h-3.5" />
                          <span>{doc.languages.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {doc.availableTypes.includes('CLINIC') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Building2 className="w-3 h-3 text-slate-500" /> In-Clinic: {doc.clinicAddress.split(',')[0]}
                          </span>
                        )}
                        {doc.availableTypes.includes('ONLINE') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-tealbrand-700 bg-tealbrand-50 px-2 py-0.5 rounded-md">
                            <Video className="w-3 h-3 text-tealbrand-600" /> Video Teleconsultation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fee & Booking CTA */}
                  <div className="w-full md:w-auto md:min-w-[180px] flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Consultation Fee</div>
                      <div className="text-lg font-extrabold text-slate-900">{formatCurrency(doc.consultationFee)}</div>
                    </div>
                    <Link href={`/doctors/${doc.id}`} className="w-auto md:w-full">
                      <Button variant="primary" size="md" className="w-full">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Select Slot
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorDirectoryPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><div className="h-64 bg-slate-100 animate-pulse rounded-2xl" /></div>}>
      <DoctorDirectoryContent />
    </Suspense>
  );
}

