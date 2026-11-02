'use client';

import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Application Error
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A critical layout error occurred in the MediCare platform. Please reload or return to the main portal.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => reset()}
              className="w-full inline-flex items-center justify-center font-medium h-10 px-4 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reload Application
            </button>
            <a
              href="/"
              className="w-full inline-flex items-center justify-center font-medium h-10 px-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              <Home className="w-4 h-4 mr-2" /> Return to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

