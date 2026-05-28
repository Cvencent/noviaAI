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
      <div className={`w-full min-h-screen ${getAnimationClass()}`}>
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