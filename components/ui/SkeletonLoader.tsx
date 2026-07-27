'use client';

import React from 'react';

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-100 rounded animate-pulse ${className}`} />;
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-3 xl:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-md p-4 xl:p-5 flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-16" />
            <Bone className="h-2.5 w-28" />
          </div>
          <Bone className="w-10 h-10 rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const colWidths = ['w-40', 'w-32', 'w-24', 'w-20', 'w-16'];
  return (
    <div className="border border-neutral-200 rounded-md bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className={`h-3 ${colWidths[i % colWidths.length]}`} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="px-5 py-4 flex gap-6 items-center">
            {Array.from({ length: cols }).map((_, ci) => (
              <Bone
                key={ci}
                className={`h-3.5 ${colWidths[ci % colWidths.length]} ${ci === 0 ? 'opacity-80' : 'opacity-50'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card Grid ────────────────────────────────────────────────────────────────

export function SkeletonCard({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(cols, 3)} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-md p-5 space-y-4">
          <div className="flex justify-between">
            <Bone className="h-3 w-20" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-1/2" />
          <div className="border-t border-neutral-100 pt-3 space-y-2">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-2/3" />
          </div>
          <div className="flex gap-2 pt-1">
            <Bone className="h-8 flex-1 rounded-md" />
            <Bone className="h-8 flex-1 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page-specific skeletons ──────────────────────────────────────────────────

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Hero Banner */}
      <Bone className="h-20 w-full rounded-md" />
      {/* KPI Cards */}
      <SkeletonStats count={4} />
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Bone className="lg:col-span-2 h-80 rounded-md" />
        <Bone className="h-80 rounded-md" />
      </div>
      {/* Workload + Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Bone className="h-64 rounded-md" />
        <Bone className="h-64 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonUsersPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2"><Bone className="h-6 w-40" /><Bone className="h-4 w-72" /></div>
        <Bone className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Bone className="h-24 rounded-md" /><Bone className="h-24 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Bone className="h-9 w-64 rounded-md" /><Bone className="h-9 w-36 rounded-md" />
      </div>
      <SkeletonTable rows={6} cols={6} />
    </div>
  );
}

export function SkeletonPaymentsPage() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2"><Bone className="h-6 w-36" /><Bone className="h-4 w-80" /></div>
      </div>
      <SkeletonStats count={3} />
      <div className="flex gap-3">
        <Bone className="h-9 w-64 rounded-md" /><Bone className="h-9 w-36 rounded-md" /><Bone className="h-9 w-36 rounded-md" />
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-neutral-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-start gap-3">
          <Bone className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProjectsList() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2"><Bone className="h-6 w-44" /><Bone className="h-4 w-72" /></div>
        <Bone className="h-9 w-32 rounded-md" />
      </div>
      <SkeletonStats count={4} />
      <div className="flex gap-3">
        <Bone className="h-9 w-64 rounded-md" /><Bone className="h-9 w-36 rounded-md" /><Bone className="h-9 w-36 rounded-md" />
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}

export function SkeletonProjectDetail() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Bone className="h-6 w-56" /><Bone className="h-3.5 w-40" /></div>
        <Bone className="h-9 w-28 rounded-md" />
      </div>
      {/* Stepper */}
      <Bone className="h-16 w-full rounded-md" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-6 border-b border-neutral-100 pb-3">
            <Bone className="h-4 w-16" /><Bone className="h-4 w-24" /><Bone className="h-4 w-20" /><Bone className="h-4 w-16" />
          </div>
          <Bone className="h-48 rounded-md" />
          <Bone className="h-32 rounded-md" />
        </div>
        {/* Sidebar */}
        <div className="space-y-4">
          <Bone className="h-40 rounded-md" />
          <Bone className="h-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Bone className="w-16 h-16 rounded-full" />
        <div className="space-y-2"><Bone className="h-5 w-40" /><Bone className="h-3.5 w-56" /></div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Bone className="h-10 rounded-md" /><Bone className="h-10 rounded-md" />
          <Bone className="h-10 rounded-md" /><Bone className="h-10 rounded-md" />
        </div>
        <Bone className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonPricingPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
        <div className="space-y-2"><Bone className="h-6 w-44" /><Bone className="h-4 w-64" /></div>
        <Bone className="h-9 w-28 rounded-md" />
      </div>
      <SkeletonCard count={4} cols={4} />
      <Bone className="h-40 rounded-md" />
    </div>
  );
}
