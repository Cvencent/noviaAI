import React from 'react'
import { Sparkles, Inbox } from 'lucide-react'
import { AIActionCard, type AIActionCardProps } from './AIActionCard'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { cn } from '@/utils/cn'

export interface AIActionCardGroupProps {
  actions: AIActionCardProps[]
  selectedActionId?: string
  loadingActionId?: string
  isLoading?: boolean
  onSelectAction?: (id: string) => void
  onExecuteAction?: (id: string) => void
  onRetry?: () => void
  emptyMessage?: string
  loadingMessage?: string
  headerText?: string
  className?: string
}

export const AIActionCardGroup: React.FC<AIActionCardGroupProps> = ({
  actions,
  selectedActionId,
  loadingActionId,
  isLoading = false,
  onSelectAction,
  onExecuteAction,
  onRetry,
  emptyMessage = '暂无可用的 AI 操作建议',
  loadingMessage = 'AI 正在思考中...',
  headerText = 'AI 为你推荐了以下操作方案：',
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn("py-12", className)}>
        <div className="flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-[var(--text-muted)] text-sm">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  if (actions.length === 0) {
    return (
      <div className={cn("py-12", className)}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-muted)] text-sm">{emptyMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 text-[var(--accent-color)] text-sm hover:underline flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              重新生成建议
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {headerText && (
        <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
          {headerText}
        </p>
      )}
      <div className="grid gap-4">
        {actions.map((action) => (
          <AIActionCard
            key={action.id}
            {...action}
            isSelected={selectedActionId === action.id}
            isLoading={loadingActionId === action.id}
            onSelect={onSelectAction}
            onExecute={onExecuteAction}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  )
}
