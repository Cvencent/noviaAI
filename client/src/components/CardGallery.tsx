import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Loader2,
  Inbox,
  Sparkles,
  Users,
  MapPin,
  FileText,
  List,
  MessageSquare,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { conversationsApi, type CardWithMeta } from '@/api/conversations'
import { aiActionsApi } from '@/api/ai-actions'
import { outlinesApi } from '@/api/outlines'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { ConversationFocusTarget } from '@/types/conversation'

interface CardGalleryProps {
  projectId: string
  onNavigateToConversation?: (target: ConversationFocusTarget) => void
  onAutoSubmitPrompt?: (conversationId: string, prompt: string) => void
  onOpenRoute?: (path: string) => void
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  SUGGEST_PROMPT: '提问建议',
  AI_ACTION: 'AI 操作',
  CREATE_OUTLINE: '创建大纲',
  CREATE_CHARACTER: '创建角色',
  CREATE_WORLD_SETTING: '创建世界观',
  CREATE_CHAPTER: '创建章节',
  UPDATE_CHARACTER: '更新角色',
  UPDATE_WORLD_SETTING: '更新世界观',
}

const ACTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  SUGGEST_PROMPT: <MessageSquare className="w-3.5 h-3.5" />,
  AI_ACTION: <Sparkles className="w-3.5 h-3.5" />,
  CREATE_OUTLINE: <List className="w-3.5 h-3.5" />,
  CREATE_CHARACTER: <Users className="w-3.5 h-3.5" />,
  CREATE_WORLD_SETTING: <MapPin className="w-3.5 h-3.5" />,
  CREATE_CHAPTER: <FileText className="w-3.5 h-3.5" />,
  UPDATE_CHARACTER: <Users className="w-3.5 h-3.5" />,
  UPDATE_WORLD_SETTING: <MapPin className="w-3.5 h-3.5" />,
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  SUGGEST_PROMPT: 'text-blue-400 bg-blue-400/10',
  AI_ACTION: 'text-purple-400 bg-purple-400/10',
  CREATE_OUTLINE: 'text-orange-400 bg-orange-400/10',
  CREATE_CHARACTER: 'text-pink-400 bg-pink-400/10',
  CREATE_WORLD_SETTING: 'text-indigo-400 bg-indigo-400/10',
  CREATE_CHAPTER: 'text-green-400 bg-green-400/10',
  UPDATE_CHARACTER: 'text-pink-400 bg-pink-400/10',
  UPDATE_WORLD_SETTING: 'text-indigo-400 bg-indigo-400/10',
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

export const CardGallery: React.FC<CardGalleryProps> = ({
  projectId,
  onNavigateToConversation,
  onAutoSubmitPrompt,
  onOpenRoute,
}) => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [runningCardId, setRunningCardId] = useState<string | null>(null)
  const [executedCardIds, setExecutedCardIds] = useState<Set<string>>(new Set())

  const { data: cardsWithMeta = [], isLoading } = useQuery({
    queryKey: ['all-cards', projectId],
    queryFn: () => conversationsApi.getAllCards(projectId),
    enabled: !!projectId,
  })

  const filteredCards = useMemo(() => {
    let filtered = cardsWithMeta

    if (selectedType) {
      filtered = filtered.filter((item) => item.card.actionType === selectedType)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.card.title.toLowerCase().includes(query) ||
          item.card.description.toLowerCase().includes(query) ||
          item.conversationTitle.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [cardsWithMeta, selectedType, searchQuery])

  const uniqueTypes = useMemo(() => {
    const types = new Set(cardsWithMeta.map((item) => item.card.actionType))
    return Array.from(types)
  }, [cardsWithMeta])

  // 点击卡片 - 跳转到关联对话并输入提示词
  const handleCardClick = (item: CardWithMeta) => {
    onNavigateToConversation?.({
      conversationId: item.conversationId,
      messageId: item.messageId,
      cardId: item.card.id,
      nonce: Date.now(),
    })
  }

  // 应用按钮 - 直接执行操作
  const handleApplyCard = async (e: React.MouseEvent, item: CardWithMeta) => {
    e.stopPropagation() // 阻止冒泡到卡片点击
    const { card } = item
    if (executedCardIds.has(card.id) || runningCardId === card.id) return

    setRunningCardId(card.id)
    try {
      if (card.actionType === 'SUGGEST_PROMPT') {
        // SUGGEST_PROMPT 类型 - 直接发送 prompt 给 AI 执行
        const prompt = typeof card.content?.prompt === 'string' ? card.content.prompt : card.description
        onAutoSubmitPrompt?.(item.conversationId, prompt)
        setExecutedCardIds((prev) => new Set(prev).add(card.id))
      } else if (card.actionType === 'AI_ACTION') {
        const actionType = String(card.content?.actionType || '')
        const parameters = card.content?.parameters || {}
        await aiActionsApi.execute({
          projectId,
          actionType,
          parameters,
          confirm: true,
        })

        setExecutedCardIds((prev) => new Set(prev).add(card.id))
      } else if (card.actionType === 'CREATE_OUTLINE') {
        const outlineDraft = card.content?.outline
        const items = Array.isArray(card.content?.items) ? card.content.items : []
        const outline = await outlinesApi.create(projectId, {
          title: outlineDraft?.title || card.title,
          description: outlineDraft?.description || card.description,
          structureType: outlineDraft?.structureType || 'FULL_BOOK',
          status: outlineDraft?.status || 'DRAFT',
        })

        for (const [index, item] of items.entries()) {
          await outlinesApi.addItem(projectId, outline.id, {
            title: item.title || `大纲条目 ${index + 1}`,
            summary: item.summary || '',
            goal: item.goal || '',
            conflict: item.conflict || '',
            outcome: item.outcome || '',
            povCharacter: item.povCharacter || '',
            location: item.location || '',
            estimatedWords: item.estimatedWords,
            order: typeof item.order === 'number' ? item.order : index,
          })
        }

        setExecutedCardIds((prev) => new Set(prev).add(card.id))
        onOpenRoute?.('outlines')
      }

      const targetQueryKey = getActionTargetQueryKey(card.actionType)
      if (targetQueryKey) {
        queryClient.invalidateQueries({ queryKey: [targetQueryKey, projectId] })
      }
      window.dispatchEvent(new CustomEvent('projectTreeChanged', { detail: { actionType: card.actionType } }))
    } catch (error) {
      console.error('执行卡片失败:', error)
    } finally {
      setRunningCardId(null)
    }
  }

  const getActionTargetQueryKey = (actionType: string) => {
    switch (actionType) {
      case 'CREATE_CHARACTER':
      case 'UPDATE_CHARACTER':
      case 'DELETE_CHARACTER':
      case 'ADD_RELATIONSHIP':
        return 'characters'
      case 'CREATE_WORLD_SETTING':
      case 'UPDATE_WORLD_SETTING':
      case 'DELETE_WORLD_SETTING':
        return 'worldSettings'
      case 'CREATE_CHAPTER':
      case 'UPDATE_CHAPTER':
      case 'DELETE_CHAPTER':
        return 'chapters'
      case 'CREATE_PLOT':
        return 'plots'
      case 'CREATE_OUTLINE':
        return 'outlines'
      default:
        return undefined
    }
  }

  const getApplyButtonText = (item: CardWithMeta) => {
    const { card } = item
    if (executedCardIds.has(card.id) || card.selectedAt) return '已应用'
    return '应用'
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">卡片库</span>
          <span className="text-[10px] text-[var(--text-muted)] ml-auto">
            {cardsWithMeta.length} 张卡片
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索卡片..."
            className="h-7 pl-7 text-xs"
          />
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] transition-colors',
              !selectedType
                ? 'bg-[var(--accent-color)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            全部
          </button>
          {uniqueTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] transition-colors',
                selectedType === type
                  ? 'bg-[var(--accent-color)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {ACTION_TYPE_LABELS[type] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
              {searchQuery || selectedType ? '没有匹配的卡片' : '暂无卡片'}
            </p>
          </div>
        ) : (
          filteredCards.map((item) => {
            const { card, conversationTitle, messageTimestamp } = item
            const isExecuted = executedCardIds.has(card.id) || Boolean(card.selectedAt)
            const isRunning = runningCardId === card.id
            const typeColor = ACTION_TYPE_COLORS[card.actionType] || 'text-gray-400 bg-gray-400/10'
            const typeIcon = ACTION_TYPE_ICONS[card.actionType] || <Sparkles className="w-3.5 h-3.5" />

            return (
              <div
                key={`${item.messageId}-${card.id}`}
                onClick={() => handleCardClick(item)}
                className={cn(
                  'rounded-lg border p-3 transition-all cursor-pointer',
                  isExecuted
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn('p-1.5 rounded flex-shrink-0', typeColor)}>
                    {typeIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
                          {card.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed line-clamp-2">
                          {card.description}
                        </div>
                      </div>
                      {isExecuted && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                    </div>

                    {/* Source info */}
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{conversationTitle}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(messageTimestamp)}
                      </span>
                    </div>

                    <div className="mt-2">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2.5"
                        disabled={isExecuted || isRunning}
                        onClick={(e) => handleApplyCard(e, item)}
                      >
                        {isRunning ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          getApplyButtonText(item)
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
