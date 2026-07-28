'use client';

import React from 'react';
import Link from 'next/link';

export interface StatsCardTrend {
  value: number;
  direction: 'up' | 'down';
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeClass?: string;
  trend?: StatsCardTrend;
  icon?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  className?: string;
  href?: string;
}

export default function StatsCard({
  title,
  value,
  subtext,
  badgeText,
  badgeClass = 'text-emerald-600',
  trend,
  icon = 'bx-trending-up',
  iconBgClass = 'bg-amber-50 border-amber-100',
  iconColorClass = 'text-amber-600',
  className = '',
  href,
}: StatsCardProps) {
  const resolvedBadgeText = badgeText ?? (trend ? `${trend.direction === 'up' ? '+' : '-'}${Math.abs(trend.value)}%` : undefined);
  const resolvedBadgeClass = badgeText
    ? badgeClass
    : trend
      ? trend.direction === 'up'
        ? 'text-emerald-600'
        : 'text-rose-600'
      : badgeClass;

  const content = (
    <div
      className={`bg-white border border-neutral-200 rounded-md p-3 sm:p-4 xl:p-5 flex items-center justify-between shadow-xs ${className}`}
    >
      <div className="space-y-0.5 min-w-0">
        <span className="text-xs font-medium text-neutral-400 block leading-snug">{title}</span>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-lg sm:text-xl xl:text-2xl font-bold text-neutral-900 font-sans tracking-tight">
            {value}
          </span>
          {resolvedBadgeText && (
            <span className={`text-xs font-semibold whitespace-nowrap ${resolvedBadgeClass}`}>
              {trend && <i className={`bx ${trend.direction === 'up' ? 'bx-caret-up' : 'bx-caret-down'} mr-0.5`}></i>}
              {resolvedBadgeText}
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

  return href ? <Link href={href}>{content}</Link> : content;
}
