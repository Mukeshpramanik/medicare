'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HeartPulse,
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth.context';
import { DEMO_CREDENTIALS } from '@/data/seed/seed-data';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const res = await login({ email, password });
    setIsLoading(false);

    if (res.success && res.user) {
      success(`Welcome back, ${res.user.name}!`);
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        switch (res.user.role) {
          case 'DOCTOR':
            router.push('/dashboard/doctor');
            break;
          case 'ADMIN':
            router.push('/dashboard/admin');
            break;
          case 'PATIENT':
          default:
            router.push('/dashboard/patient');
            break;
        }
      }
    } else {
      setFormError(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleFillDemo = async (roleKey: 'patient' | 'doctor' | 'admin') => {
    const creds = DEMO_CREDENTIALS[roleKey];
    setEmail(creds.email);
    setPassword(creds.password);
    setFormError(null);

    setIsLoading(true);
    const res = await login({ email: creds.email, password: creds.password });
    setIsLoading(false);

    if (res.success && res.user) {
      success(`Logged in as demo ${res.user.role.toLowerCase()}: ${res.user.name}`);
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        if (roleKey === 'patient') router.push('/dashboard/patient');
        else if (roleKey === 'doctor') router.push('/dashboard/doctor');
        else if (roleKey === 'admin') router.push('/dashboard/admin');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-tealbrand-500 flex items-center justify-center text-white mx-auto shadow-md">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to MediCare
          </h2>
          <p className="text-xs text-slate-500">
            Access patient appointments, doctor schedules, and clinical administration.
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
              <Sparkles className="w-4 h-4" />
              <span>One-Click Demo Accounts</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              Instant Sign-in
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleFillDemo('patient')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-brand-900/60 border border-slate-700 hover:border-brand-500 text-left transition group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-brand-300">
                  Patient Demo (Ananya Verma)
                </div>
                <div className="text-[11px] text-slate-400 font-mono">patient@medicare.demo</div>
              </div>
              <span className="text-xs text-brand-400 font-semibold group-hover:translate-x-0.5 transition">
                Sign in →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('doctor')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-teal-950/60 border border-slate-700 hover:border-teal-500 text-left transition group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-teal-300">
                  Doctor Demo (Dr. Rajesh Sharma)
                </div>
                <div className="text-[11px] text-slate-400 font-mono">doctor@medicare.demo</div>
              </div>
              <span className="text-xs text-teal-400 font-semibold group-hover:translate-x-0.5 transition">
                Sign in →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500 text-left transition group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">
                  Admin Demo (Dr. Sarah Mitchell)
                </div>
                <div className="text-[11px] text-slate-400 font-mono">admin@medicare.demo</div>
              </div>
              <span className="text-xs text-purple-400 font-semibold group-hover:translate-x-0.5 transition">
                Sign in →
              </span>
            </button>
          </div>
        </div>

        {/* Custom Login Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patient@medicare.demo"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In to Account
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Don’t have an account?{' '}
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-800">
              Register as Patient
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-8"><div className="h-64 bg-slate-100 animate-pulse rounded-2xl" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

