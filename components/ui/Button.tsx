'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };

  const variantStyles = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
    dark: 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm',
    secondary: 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700',
    outline: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200',
    ghost: 'hover:bg-neutral-100 text-neutral-600',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <i className={`${icon} ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`} />}
      <span>{children}</span>
    </button>
  );
}
