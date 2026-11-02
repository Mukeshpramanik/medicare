import React from 'react';
import Link from 'next/link';
import { HeartPulse, ShieldAlert, CheckCircle, ExternalLink, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900 mt-auto">
      {/* Disclaimer strip */}
      <div className="bg-navy-900 border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Healthcare Demonstration Disclaimer:</strong> MediCare is a prototype web application designed for demonstration and educational purposes. Medical consultation scheduling, doctor availability, catalog pharmaceuticals, and checkout payments are simulated via browser storage. Do not use this application for emergency medical care, actual clinical decisions, or real financial transactions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-tealbrand-500 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">
                Medi<span className="text-tealbrand-400">Care</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated digital health platform uniting verified medical consultations, preventive diagnostics, and quality healthcare essentials in one trusted ecosystem.
            </p>
            <div className="flex items-center gap-2 text-xs text-tealbrand-400">
              <Activity className="w-4 h-4" />
              <span>Simulated Demo Sandbox Active</span>
            </div>
          </div>

          {/* Clinical Discovery */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Patient Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/doctors" className="hover:text-white transition">
                  Find Specialists & Doctors
                </Link>
              </li>
              <li>
                <Link href="/doctors?type=ONLINE" className="hover:text-white transition">
                  Video Teleconsultations
                </Link>
              </li>
              <li>
                <Link href="/doctors?type=CLINIC" className="hover:text-white transition">
                  In-Clinic Appointments
                </Link>
              </li>
              <li>
                <Link href="/dashboard/patient" className="hover:text-white transition">
                  Patient Health Records
                </Link>
              </li>
            </ul>
          </div>

          {/* Pharmacy & Devices */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Healthcare Store</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/products?category=wellness" className="hover:text-white transition">
                  Daily Wellness & Nutrition
                </Link>
              </li>
              <li>
                <Link href="/products?category=monitoring" className="hover:text-white transition">
                  Digital Health Monitors
                </Link>
              </li>
              <li>
                <Link href="/products?category=first-aid" className="hover:text-white transition">
                  First Aid & Wound Care
                </Link>
              </li>
              <li>
                <Link href="/products?category=prescription" className="hover:text-white transition">
                  Prescription Demo Flow
                </Link>
              </li>
            </ul>
          </div>

          {/* Demo Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Demo Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/dashboard/patient" className="hover:text-white transition flex items-center justify-between">
                  <span>Patient Dashboard</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Demo</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/doctor" className="hover:text-white transition flex items-center justify-between">
                  <span>Doctor Dashboard</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Demo</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/admin" className="hover:text-white transition flex items-center justify-between">
                  <span>Admin Dashboard</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Demo</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Demo Accounts & Credentials
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MediCare Health Platform. Simulated Interactive Prototype.</p>
          <div className="flex items-center gap-6">
            <span>Client-side LocalStorage Engine</span>
            <span>Zero Real Financial Gateway</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

