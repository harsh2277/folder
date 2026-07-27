'use client';

import React, { useEffect, useRef } from 'react';
import Portal from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width class for the dialog panel. Defaults to a medium modal. */
  maxWidthClassName?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Set false to disable closing on backdrop click (e.g. mid-submit). */
  closeOnBackdrop?: boolean;
}

/**
 * Generic modal shell providing the Escape-to-close + backdrop-click-to-close
 * + focus-on-open behavior that ConfirmModal already implements, so ad-hoc
 * modals across the app can share one accessible base instead of
 * hand-rolling their own backdrop/dialog markup.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidthClassName = 'max-w-md',
  labelledBy,
  describedBy,
  closeOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          ref={panelRef}
          className={`bg-white border border-neutral-200 rounded-md w-full shadow-lg pointer-events-auto ${maxWidthClassName}`}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}
