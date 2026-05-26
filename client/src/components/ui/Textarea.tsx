import React from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg resize-y',
            'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]',
            'placeholder-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent',
            'transition-all duration-200',
            error && 'border-[var(--danger-color)] focus:ring-[var(--danger-color)]',
            className
          )}
          rows={4}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--danger-color)]">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
