'use client';

import React from 'react';

export interface StatusBadgeProps {
  status: string;
  type?: 'workflow' | 'payment' | 'auto';
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export default function StatusBadge({
  status,
  type = 'auto',
  className = '',
  size = 'xs',
}: StatusBadgeProps) {
  if (!status) return null;

  const normalized = status.trim().toLowerCase();

  let colorClasses = 'bg-neutral-50 border-neutral-200 text-neutral-600';

  if (
    normalized === 'approved' ||
    normalized === 'closed' ||
    normalized === 'paid' ||
    normalized === 'completed'
  ) {
    colorClasses = 'bg-emerald-50 border-emerald-100 text-emerald-700';
  } else if (normalized === 'in design') {
    colorClasses = 'bg-indigo-50 border-indigo-100 text-indigo-700';
  } else if (normalized === 'under review' || normalized === 'ready for client review') {
    colorClasses = 'bg-blue-50 border-blue-100 text-blue-700';
  } else if (
    normalized === 'submitted' ||
    normalized === 'payment pending' ||
    normalized === 'pending'
  ) {
    colorClasses = 'bg-amber-50 border-amber-100 text-amber-700';
  } else if (normalized === 'revision requested' || normalized === 'failed') {
    colorClasses = 'bg-rose-50 border-rose-100 text-rose-700';
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded border font-medium w-fit whitespace-nowrap ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      {status}
    </span>
  );
}
