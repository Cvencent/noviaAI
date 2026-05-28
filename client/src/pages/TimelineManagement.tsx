import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import {
  timelineApi,
  TimelineEvent,
  CreateTimelineEventDto,
} from '../api/timeline'
import { buildAiGenerationPrompt } from '../utils/aiGenerationPrompts'

const IMPORTANCE_OPTIONS = [
  { value: 'MINOR', label: '次要', color: 'bg-gray-800 text-gray-400' },
  { value: 'NORMAL', label: '一般', color: 'bg-blue-900/30 text-blue-400' },
  { value: 'MAJOR', label: '重要', color: 'bg-orange-900/30 text-orange-400' },
  { value: 'CRITICAL', label: '关键', color: 'bg-red-900/30 text-red-400' },
]

interface TimelineManagementProps {
  onAskAI?: (prompt: string) => void
}

export function TimelineManagement({ onAskAI }: TimelineManagementProps = {}) {
  const { projectId } = useParams<{ projectId: string }>()

  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)

  const [formData, setFormData] = useState<CreateTimelineEventDto>({
    title: '',
    eventDate: '',
    timeLabel: '',
    description: '',
    location: '',
    characters: '',
    importance: 'NORMAL',
  })

  useEffect(() => {
    loadEvents()
  }, [projectId])

  const loadEvents = async () => {
    if (!projectId) return
    try {
      const data = await timelineApi.getAll(projectId)
      setEvents(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('加载时间线失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setEditingEvent(null)
    setFormData({
      title: '',
      eventDate: '',
      timeLabel: '',
      description: '',
      location: '',
      characters: '',
      importance: 'NORMAL',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (event: TimelineEvent) => {
    setModalMode('edit')
    setEditingEvent(event)
    setFormData({
      title: event.title,
      eventDate: event.eventDate || '',
      timeLabel: event.timeLabel || '',
      description: event.description || '',
      location: event.location || '',
      characters: event.characters || '',
      importance: event.importance,
    })
    setIsModalOpen(true)
  }

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    event: null as TimelineEvent | null
  })

  const handleDelete = (event: TimelineEvent) => {
    setDeleteModal({ isOpen: true, event })
  }

  const confirmDelete = async () => {
    if (!projectId || !deleteModal.event) return
    try {
      await timelineApi.delete(projectId, deleteModal.event.id)
      await loadEvents()
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleteModal({ isOpen: false, event: null })
    }
  }

  const handleSubmit = async () => {
    if (!projectId || !formData.title.trim()) return

    try {
      if (modalMode === 'create') {
        await timelineApi.create(projectId, {
          ...formData,
          order: events.length,
        })
      } else if (editingEvent) {
        await timelineApi.update(projectId, editingEvent.id, formData)
      }
      setIsModalOpen(false)
      await loadEvents()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const getImportanceInfo = (importance: string) => {
    return IMPORTANCE_OPTIONS.find(i => i.value === importance) || IMPORTANCE_OPTIONS[1]
  }

  if (isLoading) {
    return (
      <div className="h-full bg-[var(--bg-primary)] p-4 flex items-center justify-center overflow-y-auto">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">时间线管理</h1>
            <p className="text-[var(--text-muted)] mt-1">规划和管理故事世界的时间线事件</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onAskAI?.(buildAiGenerationPrompt('timeline'))}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 生成
            </Button>
            <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            添加事件
            </Button>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />

            <div className="space-y-6">
              {events.map((event, index) => {
                const importanceInfo = getImportanceInfo(event.importance)

                return (
                  <div key={event.id} className="relative pl-20 group">
                    <div className="absolute left-5 top-4 w-6 h-6 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--accent-color)] flex items-center justify-center z-10">
                      <span className="text-xs font-bold text-[var(--accent-color)]">{index + 1}</span>
                    </div>

                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-[var(--text-primary)]">{event.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded ${importanceInfo.color}`}>
                              {importanceInfo.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mb-2">
                            {event.timeLabel && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{event.timeLabel}</span>
                              </div>
                            )}
                            {event.eventDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{event.eventDate}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.characters && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{event.characters}</span>
                              </div>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-sm text-gray-600">{event.description}</p>
                          )}
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有时间线事件</h3>
            <p className="text-gray-500 mb-4">添加故事世界的时间线事件来梳理故事脉络</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              添加事件
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '添加时间线事件' : '编辑时间线事件'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="事件标题"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间标签</label>
              <Input
                value={formData.timeLabel}
                onChange={(e) => setFormData({ ...formData, timeLabel: e.target.value })}
                placeholder="例如：黎明、黄昏"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <Input
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                placeholder="例如：第一天、元年春"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个事件的详细内容..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="事件发生地点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">相关人物</label>
              <Input
                value={formData.characters}
                onChange={(e) => setFormData({ ...formData, characters: e.target.value })}
                placeholder="用逗号分隔多个人物"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重要程度</label>
            <Select
              value={formData.importance}
              onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
              className="w-full"
            >
              {IMPORTANCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {modalMode === 'create' ? '添加' : '保存'}
          </Button>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={confirmDelete}
        title={deleteModal.event?.title || '删除时间线事件'}
        message={`确定要删除事件「${deleteModal.event?.title || ''}」吗？此操作无法撤销。`}
      />
    </div>
  )
}
