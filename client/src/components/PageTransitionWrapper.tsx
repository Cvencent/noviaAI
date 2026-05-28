import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

/** 提取顶级路由路径，用于判断是否需要过渡动画 */
const getTopLevelPath = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  // /projects/xxx/... → /projects
  // /login → /login
  return segments[0] ? `/${segments[0]}` : '/';
};

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [fadeIn, setFadeIn] = useState(true);
  const prevTopPathRef = useRef<string>(getTopLevelPath(location.pathname));

  useEffect(() => {
    const currentTopPath = getTopLevelPath(location.pathname);
    
    // 只在顶级路由变化时播放过渡动画（如 /login → /projects）
    // 同一顶级路由下的子路径变化不播放动画（如 /projects/1 → /projects/1/world）
    if (currentTopPath !== prevTopPathRef.current) {
      setFadeIn(false);
      const timer = setTimeout(() => setFadeIn(true), 50);
      prevTopPathRef.current = currentTopPath;
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        animation: fadeIn ? 'pageFadeIn 300ms ease-out forwards' : 'none',
      }}
    >
      {children}
      
      <style>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
