import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg',
            'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]',
            'placeholder-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent',
            'transition-all duration-200',
            error && 'border-[var(--danger-color)] focus:ring-[var(--danger-color)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--danger-color)]">{error}</p>
        )}
        {helpText && !error && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
