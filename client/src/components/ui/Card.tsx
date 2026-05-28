import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  gradient?: boolean;
}

export const Card = ({ className, hoverable, gradient, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm',
        'bg-[var(--bg-card)] border-[var(--border-color)]',
        hoverable && [
          'relative overflow-hidden',
          'transition-all duration-500 ease-out',
          'hover:shadow-xl hover:shadow-[var(--accent-color)]/10',
          'hover:-translate-y-1',
          'hover:border-[var(--accent-color)]/30',
          'group cursor-pointer',
        ],
        className
      )}
      {...props}
    >
      {hoverable && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[var(--accent-color)]/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700 pointer-events-none" />
        </>
      )}
      <div className={cn('relative flex flex-col flex-1 min-h-0', hoverable && 'z-10')}>
        {props.children}
      </div>
    </div>
  );
};

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('px-6 py-4 border-b border-[var(--border-color)]', className)} {...props} />;
};

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return <h3 className={cn('text-lg font-semibold text-[var(--text-primary)]', className)} {...props} />;
};

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return <p className={cn('text-sm text-[var(--text-muted)] mt-1', className)} {...props} />;
};

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('px-6 py-4', className)} {...props} />;
};

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn('px-6 py-4 border-t border-[var(--border-color)]', className)} {...props} />;
};
