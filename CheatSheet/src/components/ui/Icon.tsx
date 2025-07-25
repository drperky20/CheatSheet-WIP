/**
 * Icon wrapper component to prevent hydration mismatches
 * caused by browser extensions like Dark Reader
 */

import React from 'react';

interface IconProps {
  children: React.ReactNode;
  className?: string;
}

export function Icon({ children, className }: IconProps) {
  return (
    <div suppressHydrationWarning className={className}>
      {children}
    </div>
  );
}