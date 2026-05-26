import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Loader2, Trash, AlertTriangle } from 'lucide-react'
import { conversationsApi } from '../api/conversations'
import { cn } from '../utils/cn'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

interface ConversationListProps {
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onCreateConversation: () => void | Promise<void>
}

const formatTime = (dateString: string | Date): string => {
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
    day: 'numeric' 
  })
}

export const ConversationList: React.FC<ConversationListProps> = ({
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
}) => {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    type: 'single' | 'all'
    conversationId?: string
    conversationTitle?: string
  }>({
    isOpen: false,
    type: 'single',
  })

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => (projectId ? conversationsApi.getAll(projectId) : []),
    enabled: !!projectId,
  })

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      type: 'single',
      conversationId: id,
      conversationTitle: title,
    })
  }

  const handleDeleteAll = () => {
    setDeleteModal({
      isOpen: true,
      type: 'all',
    })
  }

  const confirmDelete = async () => {
    if (!projectId) return
    
    try {
      if (deleteModal.type === 'single' && deleteModal.conversationId) {
        await conversationsApi.delete(projectId, deleteModal.conversationId)
        if (deleteModal.conversationId === currentConversationId) {
          await onCreateConversation()
        }
      } else if (deleteModal.type === 'all') {
        for (const conversation of conversations) {
          await conversationsApi.delete(projectId, conversation.id)
        }
        await onCreateConversation()
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
    } finally {
      setDeleteModal({ isOpen: false, type: 'single' })
    }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await onCreateConversation()
    } finally {
      setIsCreating(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character': return '👥'
      case 'plot': return '📊'
      case 'world': return '🌍'
      case 'chapter': return '📄'
      case 'outline': return '📋'
      default: return '💬'
    }
  }

  return (
    <>
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">对话</span>
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreate}
            className="h-7 w-7 p-0"
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full p-4">
            <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-4xl mb-3">💭</div>
            <p className="text-xs text-[var(--text-muted)] text-center mb-2">
              还没有对话，开始你的创作之旅吧！
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreate}
              className="mt-3 text-xs"
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  创建新对话
                </>
              )}
            </Button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-2 text-left transition-colors group",
                currentConversationId === conversation.id
                  ? "bg-[var(--accent-color)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              )}
            >
              <span className="text-sm">{getTypeIcon(conversation.type)}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs truncate block">
                  {conversation.title}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                  {formatTime(conversation.updatedAt)}
                </span>
              </div>
              <button
                onClick={(e) => handleDelete(e, conversation.id, conversation.title)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>

    <Modal
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ isOpen: false, type: 'single' })}
      title="确认删除"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ isOpen: false, type: 'single' })}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
          >
            <Trash className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        {deleteModal.type === 'single' ? (
          <>
            <p className="text-[var(--text-primary)] font-medium mb-2">
              确定要删除对话「{deleteModal.conversationTitle}」吗？
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              此操作无法撤销。
            </p>
          </>
        ) : (
          <>
            <p className="text-[var(--text-primary)] font-medium mb-2">
              确定要删除所有 {conversations.length} 个对话吗？
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              此操作无法撤销，所有对话将被永久删除。
            </p>
          </>
        )}
      </div>
    </Modal>
    </>
  )
}
