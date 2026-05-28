# 极致丝滑UI体验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打造极致丝滑的页面交互体验，包含弹性动画、流畅过渡、物理感运动效果

**Architecture:** 采用自定义缓动函数库 + 全局动画配置 + 组件级微交互的三层架构，使用GPU加速提升性能

**Tech Stack:** React 18 + TypeScript + Tailwind CSS 3 + Framer Motion (可选)

---

## 文件结构

```
src/
├── animations/
│   ├── easings.ts          # 自定义缓动函数库
│   ├── config.ts           # 全局动画配置
│   └── useAnimation.ts     # 动画hooks
├── components/
│   ├── ui/
│   │   ├── Button.tsx      # 丝滑按钮组件
│   │   ├── Input.tsx       # 弹性输入框
│   │   ├── Switch.tsx      # 平滑开关
│   │   └── Skeleton.tsx    # 3D骨架屏
│   ├── Animated/
│   │   ├── AnimatedList.tsx    # 交错动画列表
│   │   ├── AnimatedCard.tsx    # 弹性卡片
│   │   └── ParallaxSection.tsx # 视差滚动
│   └── transitions/
│       ├── PageTransition.tsx  # 页面过渡
│       └── FadeIn.tsx          # 淡入动画
└── hooks/
    └── useSpring.ts        # 弹簧动画hook
```

---

### Task 1: 创建自定义缓动函数库

**Files:**
- Create: `src/animations/easings.ts`

- [ ] **Step 1: 创建缓动函数文件**

```typescript
export type EasingFunction = (t: number) => number;

export const easings = {
  linear: (t: number): number => t,
  
  easeIn: (t: number): number => t * t,
  easeOut: (t: number): number => t * (2 - t),
  easeInOut: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  
  easeInQuint: (t: number): number => t * t * t * t * t,
  easeOutQuint: (t: number): number => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t: number): number => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  
  easeInExpo: (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  
  easeInCirc: (t: number): number => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number): number => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t: number): number => {
    if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
    return (Math.sqrt(1 - 4 * (--t) * t) + 1) / 2;
  },
  
  spring: (t: number, stiffness: number = 0.15, damping: number = 0.8): number => {
    const damped = Math.pow(damping, t);
    const spring = Math.sin(t * stiffness * Math.PI * 2);
    return damped * spring;
  },
  
  bounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  
  elastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  backIn: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  
  backOut: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  
  backInOut: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    
    if (t < 0.5) return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
    return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  
  smoothStep: (t: number): number => {
    return t * t * t * (t * (t * 6 - 15) + 10);
  },
  
  smootherStep: (t: number): number => {
    return t * t * t * t * t * (t * (t * (21 * t - 70) + 105) - 60) + 15;
  },
};

export type EasingName = keyof typeof easings;

export const getEasing = (name: EasingName): EasingFunction => {
  return easings[name];
};
```

- [ ] **Step 2: 导出模块**

```typescript
export { easings, getEasing };
export type { EasingFunction, EasingName };
```

---

### Task 2: 创建全局动画配置

**Files:**
- Create: `src/animations/config.ts`

- [ ] **Step 1: 创建配置文件**

```typescript
import { easings, EasingName } from './easings';

export interface AnimationConfig {
  duration: number;
  easing: EasingName;
  delay?: number;
}

export interface AnimationConfigs {
  micro: AnimationConfig;
  fast: AnimationConfig;
  normal: AnimationConfig;
  slow: AnimationConfig;
  entrance: AnimationConfig;
  exit: AnimationConfig;
}

export const animationConfigs: AnimationConfigs = {
  micro: { duration: 100, easing: 'easeOut', delay: 0 },
  fast: { duration: 150, easing: 'easeOut', delay: 0 },
  normal: { duration: 300, easing: 'easeOutCubic', delay: 0 },
  slow: { duration: 500, easing: 'easeOutCubic', delay: 0 },
  entrance: { duration: 500, easing: 'backOut', delay: 0 },
  exit: { duration: 300, easing: 'easeIn', delay: 0 },
};

export const springConfigs = {
  soft: { stiffness: 0.1, damping: 0.85 },
  medium: { stiffness: 0.15, damping: 0.8 },
  bouncy: { stiffness: 0.2, damping: 0.7 },
  rigid: { stiffness: 0.3, damping: 0.9 },
};

export const getAnimationStyle = (config: AnimationConfig, type: 'enter' | 'exit' | 'active') => {
  const easing = easings[config.easing];
  const duration = config.duration;
  
  return {
    transition: {
      duration: duration / 1000,
      ease: easing,
      delay: (config.delay || 0) / 1000,
    },
  };
};

export const getCSSAnimation = (config: AnimationConfig, keyframes: string) => {
  return {
    animation: `${keyframes} ${config.duration}ms ${config.easing}`,
    animationDelay: `${config.delay || 0}ms`,
    animationFillMode: 'both',
  };
};
```

---

### Task 3: 创建弹簧动画Hook

**Files:**
- Create: `src/hooks/useSpring.ts`

- [ ] **Step 1: 创建useSpring hook**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

interface UseSpringReturn<T> {
  value: T;
  setValue: (value: T) => void;
  animateTo: (target: T, config?: Partial<SpringConfig>) => void;
}

const defaultConfig: SpringConfig = {
  stiffness: 0.15,
  damping: 0.8,
  mass: 1,
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function lerpObject<T extends Record<string, number>>(
  start: T,
  end: T,
  t: number
): T {
  const result = {} as T;
  for (const key in start) {
    result[key] = lerp(start[key], end[key], t);
  }
  return result;
}

function lerpArray(start: number[], end: number[], t: number): number[] {
  return start.map((s, i) => lerp(s, end[i], t));
}

export function useSpring<T extends number | number[] | Record<string, number>>(
  initialValue: T,
  config?: Partial<SpringConfig>
): UseSpringReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const targetRef = useRef<T>(initialValue);
  const velocityRef = useRef<number | number[] | Record<string, number>>(
    typeof initialValue === 'number'
      ? 0
      : Array.isArray(initialValue)
      ? initialValue.map(() => 0)
      : Object.keys(initialValue).reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
  );
  const animationRef = useRef<number>();
  
  const springConfig = { ...defaultConfig, ...config };

  const animate = useCallback(() => {
    const current = value;
    const target = targetRef.current;
    const velocity = velocityRef.current;
    
    let newVelocity: number | number[] | Record<string, number>;
    let newValue: T;
    
    if (typeof current === 'number') {
      const springForce = springConfig.stiffness * (target - current);
      const dampingForce = springConfig.damping * velocity;
      newVelocity = velocity + (springForce - dampingForce) / springConfig.mass;
      newValue = (current + newVelocity) as T;
    } else if (Array.isArray(current)) {
      newVelocity = (target as number[]).map((t, i) => {
        const springForce = springConfig.stiffness * (t - current[i]);
        const dampingForce = springConfig.damping * (velocity as number[])[i];
        return (velocity as number[])[i] + (springForce - dampingForce) / springConfig.mass;
      });
      newValue = current.map((c, i) => c + (newVelocity as number[])[i]) as T;
    } else {
      newVelocity = {} as Record<string, number>;
      newValue = { ...current } as T;
      for (const key in current) {
        const springForce = springConfig.stiffness * ((target as Record<string, number>)[key] - current[key]);
        const dampingForce = springConfig.damping * (velocity as Record<string, number>)[key];
        newVelocity[key] = (velocity as Record<string, number>)[key] + (springForce - dampingForce) / springConfig.mass;
        (newValue as Record<string, number>)[key] = current[key] + newVelocity[key];
      }
    }
    
    velocityRef.current = newVelocity;
    
    const isAtRest = typeof newValue === 'number'
      ? Math.abs(newValue - target) < 0.001 && Math.abs(newVelocity as number) < 0.001
      : Array.isArray(newValue)
      ? newValue.every((v, i) => Math.abs(v - (target as number[])[i]) < 0.001) &&
        (newVelocity as number[]).every(v => Math.abs(v) < 0.001)
      : Object.keys(newValue).every(key => 
          Math.abs((newValue as Record<string, number>)[key] - (target as Record<string, number>)[key]) < 0.001
        );
    
    if (!isAtRest) {
      setValue(newValue);
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setValue(target);
    }
  }, [value, springConfig]);

  const animateTo = useCallback((target: T, customConfig?: Partial<SpringConfig>) => {
    if (customConfig) {
      Object.assign(springConfig, customConfig);
    }
    targetRef.current = target;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [animate, springConfig]);

  const setValueDirect = useCallback((newValue: T) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setValue(newValue);
    targetRef.current = newValue;
    if (typeof newValue === 'number') {
      velocityRef.current = 0;
    } else if (Array.isArray(newValue)) {
      velocityRef.current = newValue.map(() => 0);
    } else {
      velocityRef.current = Object.keys(newValue).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    }
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
```

---

### Task 4: 优化按钮组件（弹性点击效果）

**Files:**
- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: 更新Button组件**

```typescript
import React, { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  bouncy?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, bouncy = true, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 600);

      onClick?.(e);
    }, [disabled, isLoading, onClick]);

    const handleMouseDown = useCallback(() => {
      if (disabled || isLoading) return;
      setIsPressed(true);
    }, [disabled, isLoading]);

    const handleMouseUp = useCallback(() => {
      setIsPressed(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsPressed(false);
    }, []);

    const baseStyles = 'relative inline-flex items-center justify-center rounded-lg font-medium overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all';
    
    const variants = {
      primary: 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] shadow-md hover:shadow-lg focus:ring-[var(--accent-color)]',
      secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-sm hover:shadow-md focus:ring-[var(--accent-color)]',
      outline: 'border-2 border-[var(--border-color)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] hover:shadow-md focus:ring-[var(--accent-color)]',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:ring-[var(--accent-color)]',
      destructive: 'bg-[var(--danger-color)] text-white hover:opacity-90 shadow-md hover:shadow-lg focus:ring-[var(--danger-color)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          bouncy && [
            'transform transition-transform duration-150',
            isPressed ? 'scale-95' : 'hover:scale-105 active:scale-95'
          ],
          className
        )}
        {...props}
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
            }}
          />
        ))}
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              加载中...
            </>
          ) : children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

### Task 5: 优化输入框组件（弹性焦点动画）

**Files:**
- Modify: `src/components/ui/Input.tsx`

- [ ] **Step 1: 更新Input组件**

```typescript
import React, { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  floatingLabel?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, leftIcon, rightIcon, floatingLabel = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    }, [props.onChange]);

    return (
      <div className="w-full relative">
        {label && floatingLabel ? (
          <label
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out',
              isFocused || hasValue
                ? 'top-2 left-3 text-xs font-medium'
                : 'text-base',
              isFocused
                ? 'text-[var(--accent-color)]'
                : 'text-[var(--text-muted)]',
              isAnimating && isFocused && 'scale-95'
            )}
          >
            {label}
          </label>
        ) : label ? (
          <label className={cn(
            'block text-sm font-medium mb-2 transition-colors duration-200',
            isFocused ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'
          )}>
            {label}
          </label>
        ) : null}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300',
              isFocused ? 'text-[var(--accent-color)] scale-110' : 'text-[var(--text-muted)]',
              floatingLabel && (isFocused || hasValue) && 'top-5'
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              'w-full px-4 py-3 border rounded-xl',
              'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]',
              'placeholder-[var(--text-muted)]',
              'focus:outline-none focus:ring-0',
              'transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)',
              'hover:border-[var(--accent-color)]/50',
              leftIcon && !floatingLabel && 'pl-11',
              rightIcon && 'pr-11',
              floatingLabel && 'pt-4',
              isFocused && [
                'border-[var(--accent-color)]',
                'shadow-[0_0_20px_rgba(var(--accent-color-rgb),0.2)]',
                'bg-[var(--bg-secondary)]',
                'scale-[1.01]',
              ],
              error && [
                'border-[var(--danger-color)]',
                'hover:border-[var(--danger-color)]',
                isFocused && 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
              ],
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
          
          {isFocused && !error && (
            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-[3px] bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent w-1/2 animate-pulse" />
          )}
        </div>
        
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--danger-color)] animate-shake">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}
        
        {helpText && !error && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

### Task 6: 创建丝滑页面过渡组件

**Files:**
- Create: `src/components/transitions/PageTransition.tsx`

- [ ] **Step 1: 创建PageTransition组件**

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'slide' | 'fade' | 'scale' | 'flip' | 'cube';
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, mode = 'slide' }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');
  const [isAnimating, setIsAnimating] = useState(false);
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    const currentKey = location.pathname + location.search;
    
    if (currentKey !== prevKeyRef.current) {
      setTransitionStage('fadeOut');
      setIsAnimating(true);
      
      setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 200);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
    
    prevKeyRef.current = currentKey;
  }, [location]);

  const getAnimationClass = () => {
    switch (mode) {
      case 'slide':
        return transitionStage === 'fadeIn' ? 'animate-slide-up' : 'animate-slide-down';
      case 'fade':
        return transitionStage === 'fadeIn' ? 'animate-fade-scale-in' : 'animate-fade-scale-out';
      case 'scale':
        return transitionStage === 'fadeIn' ? 'animate-scale-bounce-in' : 'animate-scale-out';
      case 'flip':
        return transitionStage === 'fadeIn' ? 'animate-flip-in' : 'animate-flip-out';
      case 'cube':
        return transitionStage === 'fadeIn' ? 'animate-cube-in' : 'animate-cube-out';
      default:
        return transitionStage === 'fadeIn' ? 'animate-slide-up' : 'animate-slide-down';
    }
  };

  return (
    <div
      className={`relative w-full min-h-screen transition-all duration-300 ${isAnimating ? 'overflow-hidden' : ''}`}
    >
      <div className={cn(
        'w-full min-h-screen',
        getAnimationClass()
      )}>
        {displayLocation.pathname === location.pathname && children}
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        
        @keyframes fade-scale-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fade-scale-out {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.98);
          }
        }
        
        @keyframes scale-bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes scale-out {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        @keyframes flip-in {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateY(-90deg);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateY(0);
          }
        }
        
        @keyframes flip-out {
          from {
            opacity: 1;
            transform: perspective(1000px) rotateY(0);
          }
          to {
            opacity: 0;
            transform: perspective(1000px) rotateY(90deg);
          }
        }
        
        @keyframes cube-in {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateX(-20deg) translateY(50px);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateX(0) translateY(0);
          }
        }
        
        @keyframes cube-out {
          from {
            opacity: 1;
            transform: perspective(1000px) rotateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: perspective(1000px) rotateX(20deg) translateY(-50px);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-slide-down {
          animation: slide-down 0.2s ease-in forwards;
        }
        
        .animate-fade-scale-in {
          animation: fade-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-fade-scale-out {
          animation: fade-scale-out 0.2s ease-in forwards;
        }
        
        .animate-scale-bounce-in {
          animation: scale-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-scale-out {
          animation: scale-out 0.2s ease-in forwards;
        }
        
        .animate-flip-in {
          animation: flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-flip-out {
          animation: flip-out 0.2s ease-in forwards;
        }
        
        .animate-cube-in {
          animation: cube-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-cube-out {
          animation: cube-out 0.2s ease-in forwards;
        }
      `}</style>
    </div>
  );
};
```

---

### Task 7: 创建弹性列表组件（交错动画）

**Files:**
- Create: `src/components/Animated/AnimatedList.tsx`

- [ ] **Step 1: 创建AnimatedList组件**

```typescript
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
```

---

### Task 8: 创建视差滚动组件

**Files:**
- Create: `src/components/Animated/ParallaxSection.tsx`

- [ ] **Step 1: 创建ParallaxSection组件**

```typescript
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
```

---

### Task 9: 更新全局CSS添加更多动画

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 添加新的动画样式**

```css
@keyframes ripple-effect {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px var(--accent-color), 0 0 10px var(--accent-color);
  }
  50% {
    box-shadow: 0 0 20px var(--accent-color), 0 0 40px var(--accent-color);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes rotate-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  0%, 50%, 100% {
    opacity: 1;
  }
  25%, 75% {
    opacity: 0.5;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scale-out {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}

@keyframes scale-bounce-in {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes flip-in {
  from {
    transform: perspective(1000px) rotateY(-90deg);
    opacity: 0;
  }
  to {
    transform: perspective(1000px) rotateY(0);
    opacity: 1;
  }
}

@keyframes flip-out {
  from {
    transform: perspective(1000px) rotateY(0);
    opacity: 1;
  }
  to {
    transform: perspective(1000px) rotateY(90deg);
    opacity: 0;
  }
}

@keyframes cube-in {
  from {
    transform: perspective(1000px) rotateX(-20deg) translateY(50px);
    opacity: 0;
  }
  to {
    transform: perspective(1000px) rotateX(0) translateY(0);
    opacity: 1;
  }
}

@keyframes cube-out {
  from {
    transform: perspective(1000px) rotateX(0) translateY(0);
    opacity: 1;
  }
  to {
    transform: perspective(1000px) rotateX(20deg) translateY(-50px);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple-effect 0.6s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-gradient-shift {
  animation: gradient-shift 3s ease infinite;
  background-size: 200% 200%;
}

.animate-shimmer {
  animation: shimmer 2s linear infinite;
  background-size: 200% 100%;
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

.animate-rotate-slow {
  animation: rotate-slow 20s linear infinite;
}

.animate-spin-slow {
  animation: spin-slow 10s linear infinite;
}

.animate-blink {
  animation: blink 1s ease-in-out infinite;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.animate-slide-out-right {
  animation: slide-out-right 0.3s ease-in;
}

.animate-slide-up {
  animation: slide-up 0.4s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.4s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-fade-out {
  animation: fade-out 0.3s ease-in;
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}

.animate-scale-out {
  animation: scale-out 0.3s ease-in;
}

.animate-scale-bounce-in {
  animation: scale-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-flip-in {
  animation: flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-flip-out {
  animation: flip-out 0.2s ease-in;
}

.animate-cube-in {
  animation: cube-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-cube-out {
  animation: cube-out 0.2s ease-in;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--accent-color);
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-tertiary);
}

.smooth-scroll {
  scroll-behavior: smooth;
}
```

---

### Task 10: 创建弹性卡片组件

**Files:**
- Create: `src/components/Animated/AnimatedCard.tsx`

- [ ] **Step 1: 创建AnimatedCard组件**

```typescript
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
```

---

## 执行计划

**Plan complete and saved to `docs/superpowers/plans/2026-05-26-ultra-smooth-ui.md`.**

**Execution Options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session, batch execution with checkpoints

**Which approach would you prefer?**
