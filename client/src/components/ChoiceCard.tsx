import React from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { cn } from '../utils/cn'
import { Button } from './ui/Button'
import type { ChoiceCard as ChoiceCardType } from '../types/conversation'

interface ChoiceCardProps {
  card: ChoiceCardType
  isSelected?: boolean
  isDisabled?: boolean
  onSelect?: (card: ChoiceCardType) => void
  onRetry?: () => void
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  card,
  isSelected,
  isDisabled,
  onSelect,
  onRetry,
}) => {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all cursor-pointer group",
        isSelected
          ? "border-[var(--accent-color)] bg-[var(--accent-color)]/30"
          : "border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-color)]/50",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isDisabled && onSelect?.(card)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">{card.title}</h4>
        {isSelected && <Check className="w-4 h-4 text-[var(--accent-color)]" />}
      </div>
      
      <p className="text-xs text-[var(--text-muted)] mb-3">{card.description}</p>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 text-xs h-7"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(card)
          }}
          disabled={isDisabled}
        >
          {isSelected ? '已选择' : '选择此方案'}
        </Button>
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={(e) => {
              e.stopPropagation()
              onRetry()
            }}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            重新提议
          </Button>
        )}
      </div>
    </div>
  )
}

interface ChoiceCardGroupProps {
  cards: ChoiceCardType[]
  selectedCardId?: string
  onSelectCard?: (card: ChoiceCardType) => void
  onRetry?: () => void
}

export const ChoiceCardGroup: React.FC<ChoiceCardGroupProps> = ({
  cards,
  selectedCardId,
  onSelectCard,
  onRetry,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)] mb-2">
        我为你提供了{cards.length}个方案，请选择：
      </p>
      <div className="grid gap-3">
        {cards.map((card) => (
          <ChoiceCard
            key={card.id}
            card={card}
            isSelected={selectedCardId === card.id}
            onSelect={onSelectCard}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  )
}
