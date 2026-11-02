'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { resetDemoData } from '@/data/seed';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for diagnostics
    console.error('[MediCare Runtime Error]:', error);
  }, [error]);

  const handleResetData = () => {
    resetDemoData();
    window.location.href = '/';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Unexpected System Error
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We encountered an unexpected error while rendering this page. You can attempt to retry the operation or restore initial demo data.
          </p>
          {error.digest && (
            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Digest Code: {error.digest}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button variant="primary" size="md" className="w-full" onClick={() => reset()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>

          <Link href="/" className="w-full">
            <Button variant="outline" size="md" className="w-full">
              <Home className="w-4 h-4 mr-2" /> Return to Homepage
            </Button>
          </Link>

          <button
            onClick={handleResetData}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold pt-2 flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore Default Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}

