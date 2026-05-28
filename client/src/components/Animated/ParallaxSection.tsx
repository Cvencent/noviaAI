import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  background?: string;
  depth?: 'shallow' | 'medium' | 'deep';
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  speed = 0.5,
  className,
  background,
  depth = 'medium',
}) => {
  const [offset, setOffset] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const depthMultiplier = {
    shallow: 0.3,
    medium: 0.5,
    deep: 0.7,
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
      setOffset(scrollProgress * 100 * speed * depthMultiplier[depth]);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed, depth]);

  return (
    <section
      ref={sectionRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        background,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${offset}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
    </section>
  );
};

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 1,
  className,
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * speed * 0.05);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{
        transform: `translateY(${-offset}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};