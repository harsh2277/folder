'use client';

import React from 'react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeClass?: string;
  icon?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtext,
  badgeText,
  badgeClass = 'text-emerald-600',
  icon = 'bx-trending-up',
  iconBgClass = 'bg-amber-50 border-amber-100',
  iconColorClass = 'text-amber-600',
  className = '',
}: StatsCardProps) {
  return (
    <div
      className={`bg-white border border-neutral-200 rounded-md p-3 sm:p-4 xl:p-5 flex items-center justify-between shadow-xs ${className}`}
    >
      <div className="space-y-0.5 min-w-0">
        <span className="text-xs font-medium text-neutral-400 block truncate">{title}</span>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-lg sm:text-xl xl:text-2xl font-bold text-neutral-900 font-sans tracking-tight">
            {value}
          </span>
          {badgeText && (
            <span className={`text-xs font-semibold whitespace-nowrap ${badgeClass}`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtext && (
          <span className="text-xs text-neutral-400 block hidden sm:block truncate">{subtext}</span>
        )}
      </div>
      {icon && (
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 rounded-md flex items-center justify-center border shrink-0 ${iconBgClass} ${iconColorClass}`}
        >
          <i className={`bx ${icon} text-base xl:text-xl`} />
        </div>
      )}
    </div>
  );
}
