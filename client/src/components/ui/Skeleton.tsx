import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({ className, width, height, style, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export const SkeletonText = ({ className, lines = 3, ...props }: SkeletonProps & { lines?: number }) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className, ...props }: SkeletonProps) => {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-6', className)} {...props}>
      <Skeleton height={200} className="w-full mb-4" />
      <Skeleton height={24} className="w-3/4 mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
};
