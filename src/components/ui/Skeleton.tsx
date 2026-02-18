'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'rounded-lg',
}: SkeletonProps) {
  return (
    <div
      className={[
        'bg-[#1B1E36] animate-pulse',
        rounded,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
    />
  );
}
