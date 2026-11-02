'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth.context';
import { UserRole } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          This portal requires a <strong>{allowedRoles.join(' or ')}</strong> role. Your current account role is{' '}
          <strong>{currentUser.role}</strong>.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => {
              if (currentUser.role === 'PATIENT') router.push('/dashboard/patient');
              else if (currentUser.role === 'DOCTOR') router.push('/dashboard/doctor');
              else if (currentUser.role === 'ADMIN') router.push('/dashboard/admin');
              else router.push('/');
            }}
          >
            Go to Your Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
