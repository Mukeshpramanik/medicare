'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, description }: { type?: ToastType; title: string; description?: string }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, type, title, description };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => toast({ type: 'success', title, description }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ type: 'error', title, description }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ type: 'info', title, description }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ type: 'warning', title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white transition-all transform animate-in slide-in-from-bottom-5',
              t.type === 'success' && 'border-emerald-200 text-emerald-950',
              t.type === 'error' && 'border-rose-200 text-rose-950',
              t.type === 'warning' && 'border-amber-200 text-amber-950',
              t.type === 'info' && 'border-blue-200 text-blue-950'
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-sm">
              <div className="font-semibold">{t.title}</div>
              {t.description && <div className="text-slate-600 text-xs mt-0.5">{t.description}</div>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
