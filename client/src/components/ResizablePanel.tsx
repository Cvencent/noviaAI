import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
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
    setIsCollapsed(prev => !prev);
  }, []);

  return (
    <div
      ref={panelRef}
      className={cn(
        'flex flex-col overflow-hidden bg-[var(--bg-secondary)]',
        className
      )}
      style={{ width: isCollapsed ? minWidth : width }}
    >
      {/* Header with title and collapse button */}
      {title && (
        <div className="h-8 border-b flex items-center px-3 text-xs bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]">
          {titleIcon && <span className="mr-2">{titleIcon}</span>}
          {!isCollapsed && <span className="truncate">{title}</span>}
          <button
            onClick={toggleCollapse}
            className="ml-auto p-0.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
            title={isCollapsed ? '展开' : '收起'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Content area */}
      <div className={cn('flex-1 overflow-hidden', isCollapsed && 'hidden')}>
        {children}
      </div>

      {/* Collapsed view - just icons */}
      {isCollapsed && title && (
        <div className="flex-1 flex flex-col items-center py-3 gap-2">
          <button
            onClick={toggleCollapse}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            title={title}
          >
            {titleIcon}
          </button>
        </div>
      )}

      {/* Resize handle - more visible and draggable */}
      <div
        className={cn(
          'w-3 flex-shrink-0 flex items-center justify-center cursor-col-resize',
          'hover:bg-[var(--accent-color)]/20 transition-all duration-150',
          'group relative',
          isDragging && 'bg-[var(--accent-color)]/30 w-4'
        )}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        title="拖动调整宽度"
      >
        {/* Main divider line */}
        <div className={cn(
          'absolute inset-y-0 w-px bg-[var(--border-color)]',
          isHovering && 'bg-[var(--accent-color)]',
          isDragging && 'bg-[var(--accent-color)] w-0.5'
        )} />
        
        {/* Grip icon - visible on hover */}
        <div className={cn(
          'absolute transition-all duration-150',
          isHovering || isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        )}>
          <GripVertical className={cn(
            'w-3 h-3',
            isDragging ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)]'
          )} />
        </div>
      </div>
    </div>
  );
};
