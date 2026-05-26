import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = ({ className, hoverable, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm',
        'bg-[var(--bg-card)] border-[var(--border-color)]',
        hoverable && 'transition-all duration-200 hover:shadow-md hover:border-[var(--accent-color)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
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
