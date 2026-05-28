import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, leftIcon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            'block text-sm font-medium mb-2 transition-colors duration-200',
            isFocused ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'
          )}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200',
              isFocused ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)]'
            )}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full px-4 py-2.5 border rounded-lg',
              'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]',
              'placeholder-[var(--text-muted)]',
              'focus:outline-none focus:ring-0',
              'transition-all duration-300 ease-out',
              'hover:border-[var(--accent-color)]/50',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              isFocused && [
                'border-[var(--accent-color)]',
                'shadow-[0_0_0_4px_rgba(var(--accent-color-rgb),0.1)]',
                'bg-[var(--bg-secondary)]',
              ],
              error && [
                'border-[var(--danger-color)]',
                'hover:border-[var(--danger-color)]',
                isFocused && 'shadow-[0_0_0_4px_rgba(239,68,68,0.1)]',
              ],
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
          {isFocused && !error && (
            <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent w-3/4 animate-pulse" />
          )}
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--danger-color)] animate-shake">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}
        {helpText && !error && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
