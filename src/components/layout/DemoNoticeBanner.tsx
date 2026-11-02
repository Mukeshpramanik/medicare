'use client';

import React, { useState } from 'react';
import { AlertCircle, RotateCcw, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { resetDemoData } from '@/data/seed';
import { useAuth } from '@/features/auth/auth.context';
import { DEMO_CREDENTIALS } from '@/data/seed/seed-data';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export const DemoNoticeBanner: React.FC = () => {
  const { currentUser, login, logout } = useAuth();
  const { success } = useToast();
  const router = useRouter();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    resetDemoData();
    logout();
    setIsResetting(false);
    setIsResetConfirmOpen(false);
    success('Demo data restored to initial factory state.');
    router.push('/');
  };

  const handleQuickSwitch = async (role: 'patient' | 'doctor' | 'admin') => {
    const creds = DEMO_CREDENTIALS[role];
    const res = await login({ email: creds.email, password: creds.password });
    if (res.success) {
      success(`Switched to demo ${role} account!`);
      if (role === 'patient') router.push('/dashboard/patient');
      else if (role === 'doctor') router.push('/dashboard/doctor');
      else if (role === 'admin') router.push('/dashboard/admin');
    }
  };

  return (
    <>
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="font-semibold text-white tracking-wide uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Simulation Sandbox
            </span>
            <span className="hidden sm:inline text-slate-300">
              Demo environment with browser-persisted mock data. No real medical or payment transactions.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 hidden md:inline">Quick Demo:</span>
              <button
                onClick={() => handleQuickSwitch('patient')}
                className={`px-2 py-0.5 rounded transition ${
                  currentUser?.role === 'PATIENT'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Log in as Patient (Ananya Verma)"
              >
                Patient
              </button>
              <button
                onClick={() => handleQuickSwitch('doctor')}
                className={`px-2 py-0.5 rounded transition ${
                  currentUser?.role === 'DOCTOR'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Log in as Doctor (Dr. Rajesh Sharma)"
              >
                Doctor
              </button>
              <button
                onClick={() => handleQuickSwitch('admin')}
                className={`px-2 py-0.5 rounded transition ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Log in as Admin (Dr. Sarah Mitchell)"
              >
                Admin
              </button>
            </div>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 transition border border-teal-500/30 hover:border-teal-400/60 px-2 py-0.5 rounded bg-teal-950/40"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reset All Demo Data?"
        message="This will reset all doctors, slots, appointments, catalog items, orders, and demo accounts back to default initial values. All local browser changes will be reverted."
        confirmText="Reset Now"
        isDestructive={true}
        isLoading={isResetting}
      />
    </>
  );
};

