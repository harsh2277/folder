'use client';

import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'error'
  | 'info'
  | 'indigo'
  | 'purple'
  | 'cyan'
  | 'emerald'
  | 'rose'
  | 'amber'
  // Gadget / Device status preset variants
  | 'online'
  | 'offline'
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'charging'
  | 'low-battery'
  | 'connected'
  | 'disconnected';

export type BadgeStyle = 'soft' | 'solid' | 'outline' | 'ghost';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeShape = 'rounded' | 'pill' | 'square';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  styleType?: BadgeStyle;
  size?: BadgeSize;
  shape?: BadgeShape;
  showDot?: boolean;
  dotPulse?: boolean;
  icon?: string | React.ReactNode;
  count?: number | string;
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Universal Badge component supporting multiple visual styles, sizes, shapes, status dots, icons, and gadget presets.
 */
export default function Badge({
  variant = 'default',
  styleType = 'soft',
  size = 'md',
  shape = 'rounded',
  showDot = false,
  dotPulse = false,
  icon,
  count,
  onClose,
  className = '',
  children,
  ...props
}: BadgeProps) {
  // Color configuration map based on variant and styleType
  const getVariantStyles = (): { classes: string; dotColor: string } => {
    switch (variant) {
      case 'success':
      case 'emerald':
      case 'online':
      case 'active':
      case 'connected':
        if (styleType === 'solid') return { classes: 'bg-emerald-600 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-emerald-700 border-emerald-300', dotColor: 'bg-emerald-500' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-emerald-700 border-transparent', dotColor: 'bg-emerald-500' };
        return { classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dotColor: 'bg-emerald-500' };

      case 'danger':
      case 'error':
      case 'rose':
      case 'offline':
      case 'disconnected':
        if (styleType === 'solid') return { classes: 'bg-rose-600 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-rose-700 border-rose-300', dotColor: 'bg-rose-500' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-rose-700 border-transparent', dotColor: 'bg-rose-500' };
        return { classes: 'bg-rose-50 text-rose-700 border-rose-200/80', dotColor: 'bg-rose-500' };

      case 'warning':
      case 'amber':
      case 'low-battery':
      case 'maintenance':
        if (styleType === 'solid') return { classes: 'bg-amber-500 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-amber-700 border-amber-300', dotColor: 'bg-amber-500' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-amber-700 border-transparent', dotColor: 'bg-amber-500' };
        return { classes: 'bg-amber-50 text-amber-700 border-amber-200/80', dotColor: 'bg-amber-500' };

      case 'info':
      case 'primary':
      case 'charging':
        if (styleType === 'solid') return { classes: 'bg-blue-600 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-blue-700 border-blue-300', dotColor: 'bg-blue-500' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-blue-700 border-transparent', dotColor: 'bg-blue-500' };
        return { classes: 'bg-blue-50 text-blue-700 border-blue-200/80', dotColor: 'bg-blue-500' };

      case 'indigo':
      case 'purple':
        if (styleType === 'solid') return { classes: 'bg-indigo-600 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-indigo-700 border-indigo-300', dotColor: 'bg-indigo-500' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-indigo-700 border-transparent', dotColor: 'bg-indigo-500' };
        return { classes: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', dotColor: 'bg-indigo-500' };

      case 'cyan':
        if (styleType === 'solid') return { classes: 'bg-cyan-600 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-cyan-700 border-cyan-300', dotColor: 'bg-cyan-500' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-cyan-700 border-transparent', dotColor: 'bg-cyan-500' };
        return { classes: 'bg-cyan-50 text-cyan-700 border-cyan-200/80', dotColor: 'bg-cyan-500' };

      case 'inactive':
      case 'neutral':
      case 'default':
      default:
        if (styleType === 'solid') return { classes: 'bg-neutral-700 text-white border-transparent', dotColor: 'bg-white' };
        if (styleType === 'outline') return { classes: 'bg-transparent text-neutral-600 border-neutral-300', dotColor: 'bg-neutral-400' };
        if (styleType === 'ghost') return { classes: 'bg-transparent text-neutral-600 border-transparent', dotColor: 'bg-neutral-400' };
        return { classes: 'bg-neutral-100 text-neutral-700 border-neutral-200', dotColor: 'bg-neutral-400' };
    }
  };

  const { classes: variantClasses, dotColor } = getVariantStyles();

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-base gap-2',
  };

  const shapeClasses = {
    rounded: 'rounded-xs',
    pill: 'rounded-full',
    square: 'rounded-none',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <i className={`${icon} text-[1.1em] leading-none`} />;
    }
    return <span className="inline-flex items-center leading-none">{icon}</span>;
  };

  const getPresetIcon = () => {
    if (icon) return renderIcon();
    switch (variant) {
      case 'charging':
        return <i className="bx bx-bolt text-[1.1em] leading-none" />;
      case 'low-battery':
        return <i className="bx bx-battery text-[1.1em] leading-none" />;
      case 'online':
      case 'connected':
        return <i className="bx bx-wifi text-[1.1em] leading-none" />;
      case 'offline':
      case 'disconnected':
        return <i className="bx bx-wifi-off text-[1.1em] leading-none" />;
      case 'maintenance':
        return <i className="bx bx-wrench text-[1.1em] leading-none" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium border transition-colors whitespace-nowrap select-none ${shapeClasses[shape]} ${sizeClasses[size]} ${variantClasses} ${className}`}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 items-center justify-center">
          {dotPulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
        </span>
      )}

      {getPresetIcon()}

      {children && <span>{children}</span>}

      {count !== undefined && count !== null && (
        <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
          {count}
        </span>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-0.5 -mr-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors focus:outline-none"
          aria-label="Remove badge"
        >
          <i className="bx bx-x text-xs" />
        </button>
      )}
    </span>
  );
}

/**
 * Gadget & Hardware Status Badge
 */
export function GadgetBadge({
  gadgetType,
  status,
  label,
  batteryLevel,
  ...props
}: {
  gadgetType?: string;
  status?: BadgeVariant;
  label?: string;
  batteryLevel?: number;
} & BadgeProps) {
  let displayVariant: BadgeVariant = status || props.variant || 'default';
  let displayLabel = label || (typeof props.children === 'string' ? props.children : undefined) || gadgetType || status || 'Gadget';

  if (batteryLevel !== undefined) {
    if (batteryLevel <= 20) {
      displayVariant = 'low-battery';
      displayLabel = label || `${batteryLevel}% Low`;
    } else {
      displayLabel = label || `${batteryLevel}%`;
    }
  }

  return (
    <Badge variant={displayVariant} showDot={props.showDot ?? true} {...props}>
      {displayLabel}
    </Badge>
  );
}

/**
 * StatusBadge (Consolidated)
 */
export interface StatusBadgeProps {
  status: string;
  type?: 'workflow' | 'payment' | 'auto';
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  showDot?: boolean;
}

export function StatusBadge({
  status,
  className = '',
  size = 'md',
  showDot = false,
}: StatusBadgeProps) {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();

  let variant: BadgeVariant = 'neutral';

  if (
    normalized === 'approved' ||
    normalized === 'closed' ||
    normalized === 'paid' ||
    normalized === 'completed' ||
    normalized === 'active'
  ) {
    variant = 'success';
  } else if (normalized === 'in design') {
    variant = 'indigo';
  } else if (normalized === 'under review' || normalized === 'ready for client review') {
    variant = 'info';
  } else if (
    normalized === 'submitted' ||
    normalized === 'payment pending' ||
    normalized === 'pending' ||
    normalized === 'pending approval'
  ) {
    variant = 'warning';
  } else if (
    normalized === 'revision requested' ||
    normalized === 'failed' ||
    normalized === 'rejected'
  ) {
    variant = 'danger';
  }

  return (
    <Badge variant={variant} size={size} showDot={showDot} className={className}>
      {status}
    </Badge>
  );
}

/**
 * RoleBadge (Consolidated)
 */
export interface RoleBadgeProps {
  role: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function RoleBadge({ role, className = '', size = 'md' }: RoleBadgeProps) {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();

  let variant: BadgeVariant = 'info';
  if (normalized === 'admin') variant = 'danger';
  else if (normalized === 'designer') variant = 'success';
  else if (normalized === 'architect' || normalized === 'client') variant = 'info';

  return (
    <Badge variant={variant} size={size} className={`capitalize ${className}`}>
      {role}
    </Badge>
  );
}

/**
 * DeadlineBadge (Consolidated)
 */
export interface DeadlineBadgeProps {
  deadline: string | null | undefined;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function DeadlineBadge({ deadline, className = '', size = 'md' }: DeadlineBadgeProps) {
  if (!deadline) return null;

  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);

  let label = `${daysLeft}d left`;
  let variant: BadgeVariant = 'success';
  let pulse = false;

  if (daysLeft < 0) {
    label = `${Math.abs(daysLeft)}d overdue`;
    variant = 'danger';
  } else if (daysLeft === 0) {
    label = 'Due today';
    variant = 'danger';
    pulse = true;
  } else if (daysLeft <= 3) {
    label = `${daysLeft}d left`;
    variant = 'danger';
    pulse = true;
  } else if (daysLeft <= 7) {
    label = `${daysLeft}d left`;
    variant = 'warning';
  }

  return (
    <Badge
      variant={variant}
      size={size}
      icon="bx bx-time-five"
      className={`${pulse ? 'animate-pulse' : ''} font-bold ${className}`}
    >
      {label}
    </Badge>
  );
}

/**
 * PaymentBadge (Consolidated)
 */
export interface PaymentBadgeProps {
  status: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function PaymentBadge({ status, className = '', size = 'md' }: PaymentBadgeProps) {
  if (!status) return null;

  const normalized = status.trim().toLowerCase();
  let variant: BadgeVariant = 'neutral';
  let formattedStatus = status;

  if (normalized === 'paid' || normalized === 'completed' || normalized === 'free') {
    variant = 'success';
    formattedStatus = normalized === 'free' ? 'Free' : 'Paid';
  } else if (normalized === 'failed' || normalized === 'rejected' || normalized === 'overdue') {
    variant = 'danger';
    formattedStatus = normalized === 'failed' ? 'Failed' : normalized === 'overdue' ? 'Overdue' : 'Rejected';
  } else if (normalized === 'pending' || normalized === 'payment pending' || normalized === 'unpaid') {
    variant = 'warning';
    formattedStatus = 'Pending';
  }

  return (
    <Badge variant={variant} size={size} className={className}>
      {formattedStatus}
    </Badge>
  );
}
