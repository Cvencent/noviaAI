import { ReactNode, useState, useEffect } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  type?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in' | 'slide-in-right';
  delay?: number;
  duration?: number;
  stagger?: boolean;
  staggerDelay?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className = '',
  type = 'fade-in',
  delay = 0,
  duration = 300,
  stagger = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationClass = () => {
    switch (type) {
      case 'fade-in':
        return 'animate-fade-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'slide-down':
        return 'animate-slide-down';
      case 'scale-in':
        return 'animate-scale-in';
      case 'slide-in-right':
        return 'animate-slide-in-right';
      default:
        return 'animate-fade-in';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${getAnimationClass()} ${stagger ? 'stagger-animation' : ''} ${className}`}
      style={{
        animationDelay: stagger ? 'var(--stagger-delay)' : `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
};

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
};

interface SlideUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 400,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`animate-slide-up ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
};

interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
  baseDelay?: number;
  staggerDelay?: number;
  type?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in';
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  className = '',
  baseDelay = 0,
  staggerDelay = 100,
  type = 'fade-in',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, baseDelay);
    return () => clearTimeout(timer);
  }, [baseDelay]);

  if (!isVisible) {
    return null;
  }

  const getAnimationClass = () => {
    switch (type) {
      case 'fade-in':
        return 'animate-fade-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'slide-down':
        return 'animate-slide-down';
      case 'scale-in':
        return 'animate-scale-in';
      default:
        return 'animate-fade-in';
    }
  };

  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <div className={`${className}`}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={getAnimationClass()}
          style={{
            animationDelay: `${baseDelay + index * staggerDelay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

interface FloatProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export const Float: React.FC<FloatProps> = ({
  children,
  className = '',
  duration = 3000,
}) => {
  return (
    <div
      className={`animate-float ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

interface PulseGlowProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export const PulseGlow: React.FC<PulseGlowProps> = ({
  children,
  className = '',
  duration = 2000,
}) => {
  return (
    <div
      className={`animate-pulse-glow ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

interface GradientShiftProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export const GradientShift: React.FC<GradientShiftProps> = ({
  children,
  className = '',
  duration = 3000,
}) => {
  return (
    <div
      className={`animate-gradient-shift ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};
