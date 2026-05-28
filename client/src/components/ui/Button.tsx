import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 600);

      onClick?.(e);
    };

    const baseStyles = 'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden';
    
    const variants = {
      primary: 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] shadow-md hover:shadow-lg active:scale-95 hover:scale-105 click-ripple',
      secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-sm hover:shadow-md active:scale-95',
      outline: 'border-2 border-[var(--border-color)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:shadow-md active:scale-95',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-95',
      destructive: 'bg-[var(--danger-color)] text-white hover:opacity-90 shadow-md hover:shadow-lg active:scale-95 click-ripple'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        onClick={handleClick}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
            }}
          />
        ))}
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              加载中...
            </>
          ) : children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
