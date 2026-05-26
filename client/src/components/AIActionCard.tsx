import React from 'react'
import { Check, RotateCcw, Play, Edit, Sparkles, Trash2, Plus, Copy, Wand2, BookOpen, Users, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './ui/Button'

export type ActionType = 
  | 'generate' 
  | 'edit' 
  | 'improve' 
  | 'delete' 
  | 'add' 
  | 'copy' 
  | 'rewrite' 
  | 'character' 
  | 'plot' 
  | 'setting'
  | 'custom'

interface ActionParam {
  key: string
  value: string
}

export interface AIActionCardProps {
  id: string
  title: string
  description: string
  actionType: ActionType
  params?: ActionParam[]
  isSelected?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  onSelect?: (id: string) => void
  onExecute?: (id: string) => void
  onRetry?: () => void
}

const ActionIcon = ({ type, className }: { type: ActionType; className?: string }) => {
  const iconProps = { className: cn('w-5 h-5', className) }
  
  switch (type) {
    case 'generate':
      return <Sparkles {...iconProps} />
    case 'edit':
      return <Edit {...iconProps} />
    case 'improve':
      return <Wand2 {...iconProps} />
    case 'delete':
      return <Trash2 {...iconProps} />
    case 'add':
      return <Plus {...iconProps} />
    case 'copy':
      return <Copy {...iconProps} />
    case 'rewrite':
      return <Wand2 {...iconProps} />
    case 'character':
      return <Users {...iconProps} />
    case 'plot':
      return <BookOpen {...iconProps} />
    case 'setting':
      return <Settings {...iconProps} />
    default:
      return <Sparkles {...iconProps} />
  }
}

const getActionTypeColor = (type: ActionType) => {
  switch (type) {
    case 'generate':
      return 'text-purple-400 bg-purple-400/10'
    case 'edit':
      return 'text-blue-400 bg-blue-400/10'
    case 'improve':
      return 'text-green-400 bg-green-400/10'
    case 'delete':
      return 'text-red-400 bg-red-400/10'
    case 'add':
      return 'text-emerald-400 bg-emerald-400/10'
    case 'copy':
      return 'text-yellow-400 bg-yellow-400/10'
    case 'rewrite':
      return 'text-orange-400 bg-orange-400/10'
    case 'character':
      return 'text-pink-400 bg-pink-400/10'
    case 'plot':
      return 'text-cyan-400 bg-cyan-400/10'
    case 'setting':
      return 'text-indigo-400 bg-indigo-400/10'
    default:
      return 'text-gray-400 bg-gray-400/10'
  }
}

export const AIActionCard: React.FC<AIActionCardProps> = ({
  id,
  title,
  description,
  actionType,
  params = [],
  isSelected,
  isDisabled,
  isLoading,
  onSelect,
  onExecute,
  onRetry,
}) => {
  return (
    <div
      className={cn(
        "border rounded-xl p-5 transition-all duration-200 cursor-pointer group",
        isSelected
          ? "border-[var(--accent-color)] bg-[var(--accent-color)]/20 ring-1 ring-[var(--accent-color)]/30"
          : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-color)]/60 hover:bg-[var(--bg-tertiary)]",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isDisabled && !isLoading && onSelect?.(id)}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg flex-shrink-0",
          getActionTypeColor(actionType)
        )}>
          <ActionIcon type={actionType} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-base font-medium text-[var(--text-primary)] leading-tight">{title}</h4>
            {isSelected && <Check className="w-5 h-5 text-[var(--accent-color)] flex-shrink-0 ml-2" />}
          </div>
          
          <p className="text-sm text-[var(--text-muted)] mb-4">{description}</p>
          
          {params.length > 0 && (
            <div className="space-y-2 mb-4">
              {params.map((param, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-[var(--text-muted)] font-medium whitespace-nowrap">{param.key}:</span>
                  <span className="text-[var(--text-muted)] truncate">{param.value}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={(e) => {
                e.stopPropagation()
                onExecute?.(id)
              }}
              disabled={isDisabled || isLoading}
              isLoading={isLoading}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {isSelected ? '执行' : '选择并执行'}
            </Button>
            
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry()
                }}
                disabled={isLoading}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                重新建议
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
