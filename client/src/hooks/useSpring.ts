import { useState, useEffect, useRef, useCallback } from 'react';

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

interface UseSpringReturn {
  value: number;
  setValue: (value: number) => void;
  animateTo: (target: number, config?: Partial<SpringConfig>) => void;
}

const defaultConfig: SpringConfig = {
  stiffness: 0.15,
  damping: 0.8,
  mass: 1,
};

export function useSpring(initialValue: number, config?: Partial<SpringConfig>): UseSpringReturn {
  const [value, setValue] = useState<number>(initialValue);
  const targetRef = useRef<number>(initialValue);
  const velocityRef = useRef<number>(0);
  const animationRef = useRef<number>();
  
  const springConfig = { ...defaultConfig, ...config };

  const animate = useCallback(() => {
    const current = value;
    const target = targetRef.current;
    const velocity = velocityRef.current;
    
    const springForce = springConfig.stiffness * (target - current);
    const dampingForce = springConfig.damping * velocity;
    const newVelocity = velocity + (springForce - dampingForce) / springConfig.mass;
    const newValue = current + newVelocity;
    
    velocityRef.current = newVelocity;
    
    const isAtRest = Math.abs(newValue - target) < 0.001 && Math.abs(newVelocity) < 0.001;
    
    if (!isAtRest) {
      setValue(newValue);
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setValue(target);
    }
  }, [value, springConfig]);

  const animateTo = useCallback((target: number, customConfig?: Partial<SpringConfig>) => {
    if (customConfig) {
      Object.assign(springConfig, customConfig);
    }
    targetRef.current = target;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [animate, springConfig]);

  const setValueDirect = useCallback((newValue: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setValue(newValue);
    targetRef.current = newValue;
    velocityRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue: setValueDirect,
    animateTo,
  };
}