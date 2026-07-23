'use client';

import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
}

export default function InputField({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  required,
  ...props
}: InputFieldProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-neutral-600 tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <i className={`${icon} absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm`} />
        )}
        <input
          id={inputId}
          required={required}
          className={`w-full ${icon ? 'pl-8' : 'px-3'} py-2 bg-neutral-50 border ${
            error ? 'border-rose-400 focus:border-rose-500' : 'border-neutral-200 focus:border-amber-500'
          } rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:bg-white transition-all font-medium text-neutral-800 ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-neutral-400">{helperText}</p>}
    </div>
  );
}
