import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = toast.duration ?? 4000
    const newToast: Toast = {
      ...toast,
      id,
      duration,
    }
    
    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        startHideToast(id)
      }, duration - 300)
    }
  }, [])

  const [hidingToasts, setHidingToasts] = useState<Set<string>>(new Set())

  const startHideToast = useCallback((id: string) => {
    setHidingToasts(prev => new Set(prev).add(id))
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
      setHidingToasts(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }, [])

  const hideToast = useCallback((id: string) => {
    startHideToast(id)
  }, [startHideToast])

  const success = useCallback((message: string, duration?: number) => {
    showToast({ type: 'success', message, duration })
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    showToast({ type: 'error', message, duration })
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ type: 'warning', message, duration })
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    showToast({ type: 'info', message, duration })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} hidingToasts={hidingToasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC<{
  toasts: Toast[]
  hidingToasts: Set<string>
  onClose: (id: string) => void
}> = ({ toasts, hidingToasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          isHiding={hidingToasts.has(toast.id)}
          onClose={onClose} 
        />
      ))}
    </div>
  )
}

const ToastItem: React.FC<{
  toast: Toast
  isHiding: boolean
  onClose: (id: string) => void
}> = ({ toast, isHiding, onClose }) => {
  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          accentBg: 'bg-green-500/20'
        }
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          accentBg: 'bg-red-500/20'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          accentBg: 'bg-yellow-500/20'
        }
      case 'info':
        return {
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          accentBg: 'bg-blue-500/20'
        }
    }
  }

  const config = getConfig()

  return (
    <div className={cn(
      "relative min-w-[320px] max-w-[420px] p-4 rounded-xl border backdrop-blur-xl shadow-xl",
      "bg-[var(--bg-card)] border-[var(--border-color)]",
      "flex items-start gap-3",
      "transition-all duration-300 ease-out",
      isHiding
        ? "opacity-0 translate-x-full scale-95"
        : "opacity-100 translate-x-0 scale-100",
      "hover:shadow-2xl hover:border-[var(--accent-color)]/30 hover:-translate-x-1"
    )}>
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
        config.bgColor,
        config.borderColor,
        "border"
      )}>
        <span className={config.iconColor}>
          {config.icon}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {toast.message}
        </p>
      </div>
      
      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-lg transition-all duration-200",
          "hover:bg-[var(--bg-hover)]",
          "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          "hover:rotate-90"
        )}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-[var(--accent-color)] to-transparent opacity-50" />
    </div>
  )
}
