'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HeartPulse,
  Search,
  Stethoscope,
  ShoppingBag,
  Home,
  ArrowLeft,
  Calendar,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/doctors?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Visual 404 Badge & Graphic */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-50 to-tealbrand-100 border border-tealbrand-200/80 flex items-center justify-center text-tealbrand-600 shadow-inner">
            <Compass className="w-12 h-12 text-tealbrand-600 animate-spin-slow" />
          </div>
          <span className="absolute -bottom-2.5 bg-slate-900 text-white text-[11px] font-mono uppercase tracking-widest px-3 py-0.5 rounded-full border border-slate-700 shadow">
            Error 404
          </span>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            The page or clinical resource you are trying to reach does not exist, has been relocated, or is temporarily unavailable in this demo environment.
          </p>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition">
          <div className="flex items-center gap-2 flex-1 px-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specialists, clinics, or products..."
              className="w-full text-xs sm:text-sm outline-none bg-transparent placeholder:text-slate-400"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        {/* Navigation Shortcut Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto pt-2">
          <Link
            href="/doctors"
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-brand-500 hover:shadow-md transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-2.5 group-hover:bg-brand-600 group-hover:text-white transition">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900 group-hover:text-brand-600 transition">
              Find Doctors
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Consult 8+ verified specialists
            </div>
          </Link>

          <Link
            href="/products"
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-tealbrand-500 hover:shadow-md transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-tealbrand-50 text-tealbrand-700 flex items-center justify-center mb-2.5 group-hover:bg-tealbrand-600 group-hover:text-white transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900 group-hover:text-tealbrand-600 transition">
              Healthcare Store
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Shop monitors & wellness
            </div>
          </Link>

          <Link
            href="/dashboard/patient"
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">
              Patient Portal
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              View your appointments
            </div>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button variant="outline" size="md" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Go Back
          </Button>
          <Link href="/">
            <Button variant="primary" size="md">
              <Home className="w-4 h-4 mr-1.5" /> Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
