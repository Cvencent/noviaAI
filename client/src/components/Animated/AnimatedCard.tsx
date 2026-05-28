import React, { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverScale?: number;
  hoverElevation?: number;
  className?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverScale = 1.02,
  hoverElevation = 20,
  className,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  }, []);

  const rotateX = isHovered ? (mousePosition.y - 0.5) * -10 : 0;
  const rotateY = isHovered ? (mousePosition.x - 0.5) * 10 : 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-[var(--bg-card)] border-[var(--border-color)]',
        'transition-all duration-300 ease-out',
        'will-change transform',
        className
      )}
      style={{
        transform: isHovered
          ? `scale(${hoverScale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
          : 'scale(1) rotateX(0) rotateY(0)',
        boxShadow: isHovered
          ? `0 ${hoverElevation}px ${hoverElevation * 2}px rgba(0,0,0,0.2), 0 0 40px rgba(var(--accent-color-rgb),0.1)`
          : '0 4px 6px rgba(0,0,0,0.1)',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(var(--accent-color-rgb),0.1) 0%, transparent 50%)`,
          }}
        />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
      
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(var(--accent-color-rgb),0.05) 0%, transparent 50%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
};