import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative rounded-xl shadow-2xl w-full animate-in fade-in zoom-in-95 duration-200',
        'bg-[var(--bg-secondary)] border border-[var(--border-color)]',
        sizes[size]
      )}>
        <div className={cn('flex items-center justify-between px-6 py-4 border-b', 'border-[var(--border-color)]')}>
          {title && <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
          <button onClick={onClose} className={cn('p-1 rounded-lg transition-colors', 'hover:bg-[var(--bg-hover)]')}>
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto text-[var(--text-primary)]">
          {children}
        </div>
        {footer && <div className={cn('px-6 py-4 border-t', 'border-[var(--border-color)]')}>{footer}</div>}
      </div>
    </div>
  );
};
