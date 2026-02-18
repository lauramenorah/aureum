'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
}

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
}: CardProps) {
  return (
    <div
      className={[
        'bg-[#13152A] border border-[rgba(255,255,255,0.06)] rounded-2xl',
        padding,
        hover
          ? 'hover:shadow-[0_0_40px_rgba(123,94,167,0.15)] hover:border-[#7B5EA7]/20 transition-all duration-300 hover:scale-[1.01]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
