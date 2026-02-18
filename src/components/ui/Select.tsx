'use client';

import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder,
  name,
  required = false,
  disabled = false,
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm text-[#8892B0] mb-1.5 font-medium"
        >
          {label}
          {required && <span className="text-[#FF5B5B] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={[
            'bg-[#1B1E36] border rounded-xl px-4 py-3 text-white appearance-none',
            'focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none',
            'transition-all w-full pr-10 cursor-pointer',
            error
              ? 'border-[#FF5B5B]'
              : 'border-[rgba(255,255,255,0.06)]',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            !value && placeholder ? 'text-[#4A5568]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron down icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8892B0]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-[#FF5B5B]">{error}</p>
      )}
    </div>
  );
}
