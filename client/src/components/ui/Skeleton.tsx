import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'default' | 'card' | 'text';
}

export const Skeleton = ({ className, width, height, variant = 'default', style, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-[var(--bg-tertiary)]',
        variant === 'text' && 'rounded',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
    </div>
  );
};

export const SkeletonText = ({ className, lines = 3, ...props }: SkeletonProps & { lines?: number }) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={cn(i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className, ...props }: SkeletonProps) => {
  return (
    <div className={cn('bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] shadow-sm p-6', className)} {...props}>
      <Skeleton height={200} className="w-full mb-4 rounded-xl" />
      <Skeleton height={24} className="w-3/4 mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
};

export const SkeletonAvatar = ({ className, size = 40, ...props }: SkeletonProps & { size?: number }) => {
  return (
    <Skeleton
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      {...props}
    />
  );
};

export const SkeletonButton = ({ className, ...props }: SkeletonProps) => {
  return (
    <Skeleton
      height={40}
      className={cn('rounded-lg min-w-[100px]', className)}
      {...props}
    />
  );
};
