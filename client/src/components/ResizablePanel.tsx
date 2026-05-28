import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ResizablePanelProps {
  title?: string;
  titleIcon?: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  title,
  titleIcon,
  defaultWidth = 224,
  minWidth = 48,
  maxWidth = 600,
  defaultCollapsed = false,
  children,
  className,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startXRef.current;
      let newWidth = startWidthRef.current + deltaX;
      
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, maxWidth]);

  const toggleCollapse = useCallback(() => {
    setIsAnimating(true);
    setIsCollapsed(prev => !prev);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  return (
    <div
      ref={panelRef}
      className={cn(
        'flex flex-col overflow-hidden bg-[var(--bg-secondary)]',
        isAnimating && 'transition-all duration-300 ease-out',
        className
      )}
      style={{ width: isCollapsed ? minWidth : width, transition: isAnimating ? 'width 300ms ease-out' : 'none' }}
    >
      {/* Header with title and collapse button */}
      {title && (
        <div className="h-8 border-b flex items-center px-3 text-xs bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]">
          {titleIcon && <span className="mr-2 transition-opacity duration-300">{titleIcon}</span>}
          <span className={cn(
            'truncate transition-all duration-300 overflow-hidden',
            isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'
          )}>{title}</span>
          <button
            onClick={toggleCollapse}
            className="ml-auto p-0.5 hover:bg-[var(--bg-hover)] rounded transition-all duration-200 hover:scale-110"
            title={isCollapsed ? '灞曞紑' : '鏀惰捣'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Content area with smooth collapse */}
      <div className={cn(
        'flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-out',
        isCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      )} style={{
        maxHeight: isCollapsed ? '0px' : '100%',
      }}>
        <div className="flex-1 min-h-0" style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 200ms ease-out 100ms' }}>
          {children}
        </div>
      </div>

      {/* Collapsed view - just icons with fade in */}
      {isCollapsed && title && (
        <div className="flex-1 flex flex-col items-center py-3 gap-2 animate-fade-in">
          <button
            onClick={toggleCollapse}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-all duration-200 hover:scale-110"
            title={title}
          >
            {titleIcon}
          </button>
        </div>
      )}

      {/* Resize handle - modern glassmorphism style */}
      <div
        className={cn(
          'w-6 flex-shrink-0 flex items-center justify-center cursor-col-resize',
          'transition-all duration-300 ease-out',
          'group relative',
          isDragging && 'bg-[var(--accent-color)]/20'
        )}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        title="拖动调整宽度"
      >
        {/* Glassmorphism track */}
        <div className={cn(
          'absolute inset-y-4 w-1 rounded-full',
          'transition-all duration-300 ease-out',
          isDragging 
            ? 'bg-[var(--accent-color)] shadow-lg shadow-[var(--accent-color)]/30' 
            : isHovering 
              ? 'bg-[var(--accent-color)]/60 shadow-md shadow-[var(--accent-color)]/20'
              : 'bg-[var(--border-color)]',
        )} />
        
        {/* Glow effect on hover */}
        <div className={cn(
          'absolute inset-y-0 w-full rounded-full',
          'transition-all duration-300 ease-out',
          isHovering && 'bg-[var(--accent-color)]/5',
          isDragging && 'bg-[var(--accent-color)]/10'
        )} />
        
        {/* Grip dots - modern design */}
        <div className="relative z-10 flex flex-col gap-1.5 p-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-300 ease-out',
                isDragging
                  ? 'bg-[var(--accent-color)] scale-125'
                  : isHovering
                    ? 'bg-[var(--text-primary)]'
                    : 'bg-[var(--text-muted)]',
                'animate-pulse-subtle'
              )}
            />
          ))}
        </div>
        
        {/* Active drag indicator */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-[var(--accent-color)]" />
        )}
      </div>
    </div>
  );
};
