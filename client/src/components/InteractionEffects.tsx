import { useState, useRef, ReactNode, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    onClick?.();
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white',
    secondary: 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)]',
    ghost: 'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
        'active:scale-95 transform',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
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
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className,
  speed = 0.5,
}) => {
  const [offset, setOffset] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const elementTop = rect.top + scrollY;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;

      if (scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight) {
        const newOffset = (scrollY - elementTop + windowHeight) * speed;
        setOffset(newOffset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={sectionRef} className={className} style={{ overflow: 'hidden' }}>
      <div
        style={{
          transform: `translateY(${offset * 0.1}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltIntensity?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  tiltIntensity = 10,
}) => {
  const [transform, setTransform] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
    const rotateY = ((x - centerX) / centerX) * tiltIntensity;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('transition-transform duration-200 ease-out', className)}
      style={{ transform }}
    >
      {children}
    </div>
  );
};

interface HoverScaleProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  className,
  scale = 1.05,
}) => {
  return (
    <div
      className={cn('transition-transform duration-200 hover:scale-105 active:scale-95', className)}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
};

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className,
  onClick,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.2, y: y * 0.2 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:shadow-[var(--accent-color)]/20',
        isHovered && 'scale-105',
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {children}
    </div>
  );
};

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'text',
  animation = 'wave',
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'shimmer-effect',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-[var(--bg-tertiary)]',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  );
};

interface TypingEffectProps {
  text: string;
  className?: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  className,
  speed = 50,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <div className={className}>{displayText}<span className="animate-blink">|</span></div>;
};

interface GlowEffectProps {
  children: ReactNode;
  className?: string;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  className,
  color = 'var(--accent-color)',
  intensity = 'medium',
}) => {
  const intensityValues = {
    low: '0 0 5px',
    medium: '0 0 20px',
    high: '0 0 40px',
  };

  return (
    <div
      className={cn('relative', className)}
      style={{
        boxShadow: `${intensityValues[intensity]} ${color}`,
      }}
    >
      <div
        className="absolute inset-0 blur-xl opacity-50"
        style={{ backgroundColor: color }}
      />
      <div className="relative">{children}</div>
    </div>
  );
};

interface NoiseOverlayProps {
  className?: string;
  opacity?: number;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({
  className,
  opacity = 0.03,
}) => {
  return (
    <div
      className={cn('fixed inset-0 pointer-events-none z-50', className)}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        opacity,
      }}
    />
  );
};
