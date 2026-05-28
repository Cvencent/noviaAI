import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface AnimatedListProps {
  children: React.ReactNode;
  staggerDelay?: number;
  animationType?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 50,
  animationType = 'slide-up',
  className,
}) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const childArray = React.Children.toArray(children);
    
    childArray.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, index]);
      }, index * staggerDelay);
    });
  }, [children, staggerDelay]);

  const getAnimationClass = (index: number) => {
    const baseClass = cn(
      'transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)',
      visibleItems.includes(index) ? 'opacity-100' : 'opacity-0'
    );

    switch (animationType) {
      case 'fade':
        return baseClass;
      case 'slide-up':
        return cn(
          baseClass,
          visibleItems.includes(index) ? 'translate-y-0' : 'translate-y-8'
        );
      case 'slide-down':
        return cn(
          baseClass,
          visibleItems.includes(index) ? 'translate-y-0' : '-translate-y-8'
        );
      case 'slide-left':
        return cn(
          baseClass,
          visibleItems.includes(index) ? 'translate-x-0' : '-translate-x-8'
        );
      case 'slide-right':
        return cn(
          baseClass,
          visibleItems.includes(index) ? 'translate-x-0' : 'translate-x-8'
        );
      case 'scale':
        return cn(
          baseClass,
          visibleItems.includes(index) ? 'scale-100' : 'scale-95'
        );
      default:
        return baseClass;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {React.Children.map(children, (child, index) => (
        <div key={index} className={getAnimationClass(index)}>
          {child}
        </div>
      ))}
    </div>
  );
};

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ children, className }) => {
  return <div className={cn(className)}>{children}</div>;
};