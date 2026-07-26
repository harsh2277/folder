'use client';

import React, { useState } from 'react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: boolean;
  id: string;
}

export default function PasswordInput({
  label,
  helperText,
  error = false,
  id,
  className = '',
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-600">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`
            w-full px-3 py-2 pr-10 bg-neutral-50 border rounded-md text-sm
            focus:outline-none focus:bg-white transition-colors font-medium
            ${error ? 'border-rose-300 focus:border-rose-400' : 'border-neutral-200 focus:border-amber-500'}
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-0.5 rounded"
        >
          <i className={`bx ${show ? 'bx-hide' : 'bx-show'} text-base`} />
        </button>
      </div>
      {helperText && (
        <p id={`${id}-hint`} className="text-xs text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
