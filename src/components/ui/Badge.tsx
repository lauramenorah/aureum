'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, string> = {
  success: 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20',
  warning: 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20',
  error: 'bg-[#FF5B5B]/10 text-[#FF5B5B] border border-[#FF5B5B]/20',
  info: 'bg-[#7B5EA7]/10 text-[#9B59F5] border border-[#7B5EA7]/20',
  neutral:
    'bg-[#1B1E36] text-[#8892B0] border border-[rgba(255,255,255,0.06)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({
  variant = 'neutral',
  children,
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
