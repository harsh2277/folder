'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Portal from './Portal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  toasts: Toast[];
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((msg: string, dur?: number) => add('success', msg, dur), [add]);
  const error   = useCallback((msg: string, dur?: number) => add('error',   msg, dur), [add]);
  const info    = useCallback((msg: string, dur?: number) => add('info',    msg, dur), [add]);
  const warning = useCallback((msg: string, dur?: number) => add('warning', msg, dur), [add]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, info, warning, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <Portal>
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} dismiss={dismiss} />
        ))}
      </div>
    </Portal>
  );
}

// ─── Individual Toast Item ─────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: 'bx-check-circle',
  error:   'bx-error-circle',
  info:    'bx-info-circle',
  warning: 'bx-error',
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-white border-emerald-200 text-emerald-800',
  error:   'bg-white border-rose-200 text-rose-800',
  info:    'bg-white border-blue-200 text-blue-800',
  warning: 'bg-white border-amber-200 text-amber-800',
};

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error:   'text-rose-500',
  info:    'text-blue-500',
  warning: 'text-amber-500',
};

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Trigger enter animation
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    timerRef.current = setTimeout(() => dismiss(toast.id), 200);
  };

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md border shadow-md
        font-sans text-sm font-medium
        transition-all duration-200 ease-out
        ${STYLES[toast.type]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <i className={`bx ${ICONS[toast.type]} text-lg flex-shrink-0 mt-0.5 ${ICON_STYLES[toast.type]}`} />
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors -mr-1 -mt-0.5 p-0.5 rounded"
      >
        <i className="bx bx-x text-lg" />
      </button>
    </div>
  );
}
