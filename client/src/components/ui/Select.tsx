import React from 'react';
import { cn } from '@/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg',
            'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]',
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
      </div>
    );
  }
);

Select.displayName = 'Select';
