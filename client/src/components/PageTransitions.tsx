import { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  type?: 'fade' | 'slide' | 'scale' | 'flip' | 'curtain';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  type = 'fade',
  direction = 'up',
  duration = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getAnimation = () => {
    const animations = {
      fade: isVisible ? 'animate-fade-in' : 'opacity-0',
      slide: {
        up: isVisible ? 'animate-slide-up' : 'translate-y-8 opacity-0',
        down: isVisible ? 'animate-slide-down' : '-translate-y-8 opacity-0',
        left: isVisible ? 'animate-slide-in-right' : 'translate-x-8 opacity-0',
        right: isVisible ? '' : '-translate-x-8 opacity-0',
      },
      scale: isVisible ? 'animate-scale-in' : 'scale-95 opacity-0',
      flip: isVisible ? 'animate-flip-in' : 'rotateY-90 opacity-0',
      curtain: isVisible ? 'animate-curtain' : 'scale-x-0 origin-left',
    };

    if (type === 'slide') {
      return animations.slide[direction];
    }

    return animations[type];
  };

  return (
    <div
      className={cn('transition-all', getAnimation(), className)}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className,
  delay = 0,
  direction = 'up',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getDirectionClass = () => {
    switch (direction) {
      case 'up':
        return isVisible ? 'animate-slide-up' : 'translate-y-12 opacity-0';
      case 'down':
        return isVisible ? 'animate-slide-down' : '-translate-y-12 opacity-0';
      case 'left':
        return isVisible ? 'animate-slide-in' : 'translate-x-12 opacity-0';
      case 'right':
        return isVisible ? 'animate-slide-in' : '-translate-x-12 opacity-0';
      default:
        return isVisible ? 'animate-fade-in' : 'opacity-0';
    }
  };

  return (
    <div
      ref={ref}
      className={cn('transition-all duration-500', getDirectionClass(), className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

import React from 'react';

interface MorphTransitionProps {
  isActive: boolean;
  children: ReactNode;
  className?: string;
}

export const MorphTransition: React.FC<MorphTransitionProps> = ({
  isActive,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out',
        isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ExpandOnClickProps {
  children: ReactNode;
  isExpanded: boolean;
  className?: string;
}

export const ExpandOnClick: React.FC<ExpandOnClickProps> = ({
  children,
  isExpanded,
  className,
}) => {
  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out overflow-hidden',
        isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const SlideDrawer: React.FC<SlideDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  className,
}) => {
  const getPositionClass = () => {
    switch (position) {
      case 'left':
        return isOpen ? 'translate-x-0' : '-translate-x-full';
      case 'right':
        return isOpen ? 'translate-x-0' : 'translate-x-full';
      case 'top':
        return isOpen ? 'translate-y-0' : '-translate-y-full';
      case 'bottom':
        return isOpen ? 'translate-y-0' : 'translate-y-full';
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'fixed z-50 bg-[var(--bg-secondary)] shadow-2xl transition-transform duration-300 ease-out',
          position === 'left' || position === 'right' ? 'top-0 bottom-0 w-80' : 'left-0 right-0 h-80',
          position === 'left' ? 'left-0' : position === 'right' ? 'right-0' : 'left-0 right-0',
          position === 'top' ? 'top-0' : position === 'bottom' ? 'bottom-0' : '',
          getPositionClass(),
          className
        )}
      >
        {children}
      </div>
    </>
  );
};

interface LoadingDotsProps {
  className?: string;
  color?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  className,
  color = 'var(--accent-color)',
}) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ backgroundColor: color, animationDelay: '0ms' }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ backgroundColor: color, animationDelay: '150ms' }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ backgroundColor: color, animationDelay: '300ms' }}
      />
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showLabel = false,
  animated = true,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] rounded-full',
            animated && 'transition-all duration-500'
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

interface NotificationToastProps {
  message: string;
  className?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  className,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500/90 border-green-400',
    error: 'bg-red-500/90 border-red-400',
    info: 'bg-blue-500/90 border-blue-400',
    warning: 'bg-yellow-500/90 border-yellow-400',
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl',
        'transition-all duration-300',
        typeStyles[type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
    >
      <div className="text-white text-sm font-medium">{message}</div>
    </div>
  );
};
