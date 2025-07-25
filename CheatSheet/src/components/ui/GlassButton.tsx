'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      default: 'glass-button rounded-2xl',
      primary: 'glass-button-primary rounded-2xl', 
      success: 'glass-button-success rounded-2xl',
      danger: 'glass-button-danger rounded-2xl',
      ghost: 'rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10'
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    const baseClasses = [
      variants[variant],
      sizes[size],
      'relative inline-flex items-center justify-center',
      'font-semibold transition-all duration-300 transform-gpu',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'text-shadow-sm letter-spacing-wide',
      loading && 'cursor-wait',
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';