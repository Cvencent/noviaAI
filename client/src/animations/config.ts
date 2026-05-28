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

export const getAnimationStyle = (config: AnimationConfig) => {
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
    animationFillMode: 'both' as const,
  };
};