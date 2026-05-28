import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  Zap,
  TrendingUp,
  AlertTriangle,
  Heart,
  Target,
  Flame,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import {
  turningPointsApi,
  TurningPoint,
  CreateTurningPointDto,
} from '../api/turning-points'
import { buildAiGenerationPrompt } from '../utils/aiGenerationPrompts'

const TURNING_POINT_TYPES = [
  { value: 'INCITING_INCIDENT', label: '激励事件', color: 'bg-blue-900/30 text-blue-400', icon: Zap },
  { value: 'RISING_ESCALATION', label: '升级递进', color: 'bg-green-900/30 text-green-400', icon: TrendingUp },
  { value: 'CRISIS', label: '危机', color: 'bg-orange-900/30 text-orange-400', icon: AlertTriangle },
  { value: 'CLIMAX', label: '高潮', color: 'bg-red-900/30 text-red-400', icon: Flame },
  { value: 'RESOLUTION', label: '结局', color: 'bg-purple-900/30 text-purple-400', icon: Heart },
  { value: 'MIDPOINT_REVERSAL', label: '中点反转', color: 'bg-yellow-900/30 text-yellow-400', icon: Target },
]

interface TurningPointManagementProps {
  onAskAI?: (prompt: string) => void
}

export function TurningPointManagement({ onAskAI }: TurningPointManagementProps = {}) {
  const { projectId } = useParams<{ projectId: string }>()

  const [turningPoints, setTurningPoints] = useState<TurningPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingPoint, setEditingPoint] = useState<TurningPoint | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; point: TurningPoint | null }>({ isOpen: false, point: null })

  const [formData, setFormData] = useState<CreateTurningPointDto>({
    title: '',
    type: 'INCITING_INCIDENT',
    description: '',
    impact: '',
    emotionalShift: '',
    position: '',
  })

  useEffect(() => {
    loadTurningPoints()
  }, [projectId])

  const loadTurningPoints = async () => {
    if (!projectId) return
    try {
      const data = await turningPointsApi.getAll(projectId)
      setTurningPoints(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('加载转折点失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setEditingPoint(null)
    setFormData({
      title: '',
      type: 'INCITING_INCIDENT',
      description: '',
      impact: '',
      emotionalShift: '',
      position: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (point: TurningPoint) => {
    setModalMode('edit')
    setEditingPoint(point)
    setFormData({
      title: point.title,
      type: point.type,
      description: point.description || '',
      impact: point.impact || '',
      emotionalShift: point.emotionalShift || '',
      position: point.position || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (point: TurningPoint) => {
    setDeleteModal({ isOpen: true, point })
  }

  const handleConfirmDelete = async () => {
    if (!projectId || !deleteModal.point) return
    try {
      await turningPointsApi.delete(projectId, deleteModal.point.id)
      await loadTurningPoints()
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleteModal({ isOpen: false, point: null })
    }
  }

  const handleSubmit = async () => {
    if (!projectId || !formData.title.trim()) return

    try {
      if (modalMode === 'create') {
        await turningPointsApi.create(projectId, {
          ...formData,
          order: turningPoints.length,
        })
      } else if (editingPoint) {
        await turningPointsApi.update(projectId, editingPoint.id, formData)
      }
      setIsModalOpen(false)
      await loadTurningPoints()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // Group turning points by type
  const groupedPoints = TURNING_POINT_TYPES.reduce<Record<string, TurningPoint[]>>((acc, type) => {
    const points = turningPoints.filter(p => p.type === type.value)
    if (points.length > 0) {
      acc[type.value] = points
    }
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="h-full bg-[var(--bg-primary)] p-4 flex items-center justify-center overflow-y-auto">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">转折点管理</h1>
            <p className="text-[var(--text-muted)] mt-1">标记和管理故事中的关键转折点</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onAskAI?.(buildAiGenerationPrompt('turning-points'))}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 生成
            </Button>
            <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            添加转折点
            </Button>
          </div>
        </div>

        {turningPoints.length > 0 ? (
          <div className="space-y-8">
            {TURNING_POINT_TYPES.map(type => {
              const points = groupedPoints[type.value]
              if (!points) return null
              const TypeIcon = type.icon

              return (
                <div key={type.value}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`p-1.5 rounded-lg ${type.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{type.label}</h2>
                    <span className="text-xs text-[var(--text-muted)]">({points.length})</span>
                  </div>

                  <div className="space-y-3">
                    {points.map((point, index) => (
                      <Card key={point.id} className="p-4 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-[var(--text-muted)]">#{index + 1}</span>
                              <h3 className="font-medium text-[var(--text-primary)]">{point.title}</h3>
                              {point.position && (
                                <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                                  {point.position}
                                </span>
                              )}
                            </div>
                            {point.description && (
                              <p className="text-sm text-[var(--text-secondary)] mt-1">{point.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2">
                              {point.impact && (
                                <div className="text-xs text-[var(--text-muted)]">
                                  <span className="font-medium">影响:</span> {point.impact}
                                </div>
                              )}
                              {point.emotionalShift && (
                                <div className="text-xs text-[var(--text-muted)]">
                                  <span className="font-medium">情感变化:</span> {point.emotionalShift}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                            <button
                              onClick={() => handleEdit(point)}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-color)]"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(point)}
                              className="p-1 text-[var(--text-muted)] hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Zap className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">还没有转折点</h3>
            <p className="text-[var(--text-muted)] mb-4">添加故事的关键转折点来规划情节发展</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              添加转折点
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '添加转折点' : '编辑转折点'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">标题 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="转折点标题"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                转折点类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
              >
                {TURNING_POINT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="例如：第三章结尾"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个转折点的详细内容..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">备注</label>
            <Textarea
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              placeholder="这个转折点对故事的影响..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">情感变化</label>
            <Input
              value={formData.emotionalShift}
              onChange={(e) => setFormData({ ...formData, emotionalShift: e.target.value })}
              placeholder="例如：从希望到绝望"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {modalMode === 'create' ? '添加' : '保存'}
          </Button>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, point: null })}
        onConfirm={handleConfirmDelete}
        title={`确定要删除转折点「${deleteModal.point?.title || ''}」吗？`}
        message="删除后将无法恢复，请谨慎操作"
      />
    </div>
  )
}
