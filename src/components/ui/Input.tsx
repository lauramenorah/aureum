'use client';

import React from 'react';

interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Input({
  label,
  error,
  hint,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  className = '',
}: InputProps) {
  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
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
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]">
            {icon}
          </div>
        )}

        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={[
            'bg-[#1B1E36] border rounded-xl px-4 py-3 text-white placeholder-[#4A5568]',
            'focus:border-[#7B5EA7] focus:ring-1 focus:ring-[#7B5EA7] outline-none',
            'transition-all w-full',
            icon ? 'pl-10' : '',
            error
              ? 'border-[#FF5B5B]'
              : 'border-[rgba(255,255,255,0.06)]',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-[#FF5B5B]">{error}</p>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-sm text-[#4A5568]">{hint}</p>
      )}
    </div>
  );
}
