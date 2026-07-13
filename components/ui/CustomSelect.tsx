import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 focus:outline-none focus:border-amber-500 transition-colors flex items-center justify-between cursor-pointer select-none space-x-2"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <i className={`bx bx-chevron-down text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-full min-w-[180px] bg-white border border-neutral-200 rounded-md py-1 z-30 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between cursor-pointer select-none ${ value === opt.value ? 'bg-amber-50 text-amber-700 font-medium' : 'text-neutral-700 hover:bg-neutral-50' }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <i className="bx bx-check text-sm" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
