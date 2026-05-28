import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  GitBranch,
  Clock,
  GripVertical,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import { plotsApi, Plot, PlotPoint, CreatePlotDto, CreatePlotPointDto } from '../api/plots'
import { buildAiGenerationPrompt } from '../utils/aiGenerationPrompts'

const PLOT_POINT_TYPES = [
  { value: 'exposition', label: '开端', color: 'bg-blue-900/30 text-blue-400' },
  { value: 'rising_action', label: '上升', color: 'bg-green-900/30 text-green-400' },
  { value: 'climax', label: '高潮', color: 'bg-red-900/30 text-red-400' },
  { value: 'falling_action', label: '下降', color: 'bg-yellow-900/30 text-yellow-400' },
  { value: 'resolution', label: '结局', color: 'bg-purple-900/30 text-purple-400' },
  { value: 'subplot', label: '副线', color: 'bg-gray-800 text-gray-400' },
]

const PLOT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ABANDONED', label: '已放弃' },
]

interface PlotManagementProps {
  onAskAI?: (prompt: string) => void
}

export function PlotManagement({ onAskAI }: PlotManagementProps = {}) {
  const { projectId } = useParams<{ projectId: string }>()

  const [plots, setPlots] = useState<Plot[]>([])
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false)
  const [isPointModalOpen, setIsPointModalOpen] = useState(false)
  const [isPointEditModalOpen, setIsPointEditModalOpen] = useState(false)
  const [plotModalMode, setPlotModalMode] = useState<'create' | 'edit'>('create')
  const [isLoading, setIsLoading] = useState(true)
  const [editingPoint, setEditingPoint] = useState<PlotPoint | null>(null)
  const [draggedPoint, setDraggedPoint] = useState<PlotPoint | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'plot' | 'point'; item: Plot | PlotPoint | null }>({ isOpen: false, type: 'plot', item: null })

  const [plotFormData, setPlotFormData] = useState<CreatePlotDto>({
    title: '',
    description: '',
    status: 'ACTIVE',
  })

  const [pointFormData, setPointFormData] = useState<CreatePlotPointDto>({
    title: '',
    type: 'exposition',
    description: '',
    order: 0,
  })

  useEffect(() => {
    loadPlots()
  }, [projectId])

  const loadPlots = async () => {
    if (!projectId) return
    try {
      const data = await plotsApi.getAll(projectId)
      setPlots(data)
    } catch (error) {
      console.error('加载情节线失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePlot = () => {
    setPlotModalMode('create')
    setPlotFormData({
      title: '',
      description: '',
      status: 'ACTIVE',
    })
    setIsPlotModalOpen(true)
  }

  const handleEditPlot = (plot: Plot) => {
    setPlotModalMode('edit')
    setSelectedPlot(plot)
    setPlotFormData({
      title: plot.title,
      description: plot.description || '',
      status: plot.status,
    })
    setIsPlotModalOpen(true)
  }

  const handleDeletePlot = async (plot: Plot) => {
    setDeleteModal({ isOpen: true, type: 'plot', item: plot })
  }

  const handleDeletePoint = async (point: PlotPoint) => {
    setDeleteModal({ isOpen: true, type: 'point', item: point })
  }

  const handleConfirmDelete = async () => {
    if (!projectId || !deleteModal.item) return
    try {
      if (deleteModal.type === 'plot' && deleteModal.item instanceof Object) {
        const plot = deleteModal.item as Plot
        await plotsApi.delete(projectId, plot.id)
        await loadPlots()
        if (selectedPlot?.id === plot.id) {
          setSelectedPlot(null)
        }
      } else if (deleteModal.type === 'point' && deleteModal.item instanceof Object && selectedPlot) {
        const point = deleteModal.item as PlotPoint
        await plotsApi.deletePlotPoint(projectId, selectedPlot.id, point.id)
        await loadPlots()
        const updatedPlot = await plotsApi.getById(projectId, selectedPlot.id)
        setSelectedPlot(updatedPlot)
      }
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleteModal({ isOpen: false, type: 'plot', item: null })
    }
  }

  const handleSubmitPlot = async () => {
    if (!projectId || !plotFormData.title.trim()) return

    try {
      if (plotModalMode === 'create') {
        await plotsApi.create(projectId, plotFormData)
      } else if (selectedPlot) {
        await plotsApi.update(projectId, selectedPlot.id, plotFormData)
      }
      setIsPlotModalOpen(false)
      await loadPlots()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleAddPoint = () => {
    setEditingPoint(null)
    setPointFormData({
      title: '',
      type: 'exposition',
      description: '',
      order: selectedPlot?.plotPoints.length ?? 0,
    })
    setIsPointModalOpen(true)
  }

  const handleEditPoint = (point: PlotPoint) => {
    setEditingPoint(point)
    setPointFormData({
      title: point.title,
      type: point.type,
      description: point.description || '',
      order: point.order,
    })
    setIsPointEditModalOpen(true)
  }

  

  const handleSubmitPoint = async () => {
    if (!projectId || !selectedPlot || !pointFormData.title.trim()) return

    try {
      if (editingPoint) {
        await plotsApi.updatePlotPoint(projectId, selectedPlot.id, editingPoint.id, pointFormData)
      } else {
        await plotsApi.addPlotPoint(projectId, selectedPlot.id, pointFormData)
      }
      setIsPointModalOpen(false)
      setIsPointEditModalOpen(false)
      const updatedPlot = await plotsApi.getById(projectId, selectedPlot.id)
      setSelectedPlot(updatedPlot)
    } catch (error) {
      console.error('保存情节点失败:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, point: PlotPoint) => {
    setDraggedPoint(point)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetPoint: PlotPoint) => {
    e.preventDefault()
    if (!projectId || !selectedPlot || !draggedPoint || draggedPoint.id === targetPoint.id) return

    const points = [...selectedPlot.plotPoints]
    const draggedIndex = points.findIndex(p => p.id === draggedPoint.id)
    const targetIndex = points.findIndex(p => p.id === targetPoint.id)

    points.splice(draggedIndex, 1)
    points.splice(targetIndex, 0, draggedPoint)

    const pointIds = points.map(p => p.id)
    try {
      await plotsApi.reorderPlotPoints(projectId, selectedPlot.id, pointIds)
      const updatedPlot = await plotsApi.getById(projectId, selectedPlot.id)
      setSelectedPlot(updatedPlot)
    } catch (error) {
      console.error('重排序失败:', error)
    } finally {
      setDraggedPoint(null)
    }
  }

  const getPointTypeInfo = (type: string) => {
    return PLOT_POINT_TYPES.find(t => t.value === type) || PLOT_POINT_TYPES[0]
  }

  if (isLoading) {
    return (
      <div className="h-full bg-[var(--bg-primary)] p-4 flex items-center justify-center overflow-y-auto">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">情节线管理</h1>
            <p className="text-[var(--text-muted)] mt-1">规划和管理故事的情节发展线</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onAskAI?.(buildAiGenerationPrompt('plots'))}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 生成
            </Button>
            <Button onClick={handleCreatePlot}>
            <Plus className="w-4 h-4 mr-2" />
            创建情节线
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-0">
              <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <h2 className="font-semibold text-[var(--text-primary)]">情节线列表</h2>
              </div>
              <div className="divide-y divide-[var(--border-color)] max-h-[600px] overflow-y-auto">
                {plots.length > 0 ? (
                  plots.map(plot => (
                    <div
                      key={plot.id}
                      onClick={() => setSelectedPlot(plot)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-[var(--bg-hover)] ${
                        selectedPlot?.id === plot.id ? 'bg-[var(--accent-color)]/10 border-l-4 border-[var(--accent-color)]' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[var(--text-primary)] truncate">{plot.title}</h3>
                          {plot.description && (
                            <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{plot.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              plot.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' :
                              plot.status === 'COMPLETED' ? 'bg-[var(--accent-color)]/20 text-[var(--accent-color)]' :
                              'bg-gray-800 text-[var(--text-muted)]'
                            }`}>
                              {plot.status === 'ACTIVE' ? '进行中' : plot.status === 'COMPLETED' ? '已完成' : '已放弃'}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {plot.plotPoints.length} 个情节点
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditPlot(plot)
                            }}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-color)]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePlot(plot)
                            }}
                            className="p-1 text-[var(--text-muted)] hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <GitBranch className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">还没有情节线</h3>
                    <p className="text-[var(--text-muted)] mb-4">开始创建你的第一个情节线吧</p>
                    <Button onClick={handleCreatePlot} size="sm">创建情节线</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedPlot ? (
              <Card className="p-0">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-lg text-[var(--text-primary)]">{selectedPlot.title}</h2>
                    {selectedPlot.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{selectedPlot.description}</p>
                    )}
                  </div>
                  <Button onClick={handleAddPoint}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加情节点
                  </Button>
                </div>

                <div className="p-6">
                  {selectedPlot.plotPoints.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--accent-color)] via-purple-500 to-red-500" />

                      <div className="space-y-4">
                        {selectedPlot.plotPoints.map((point, index) => {
                          const typeInfo = getPointTypeInfo(point.type)
                          return (
                            <div
                              key={point.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, point)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, point)}
                              className={`relative pl-16 group cursor-move ${
                                draggedPoint?.id === point.id ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="absolute left-4 top-4 w-4 h-4 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--accent-color)] flex items-center justify-center">
                                <span className="text-xs font-medium text-[var(--accent-color)]">{index + 1}</span>
                              </div>

                              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <GripVertical className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <h4 className="font-medium text-[var(--text-primary)]">{point.title}</h4>
                                      <span className={`text-xs px-2 py-0.5 rounded ${typeInfo.color}`}>
                                        {typeInfo.label}
                                      </span>
                                    </div>
                                    {point.description && (
                                      <p className="text-sm text-[var(--text-secondary)] mt-2">{point.description}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditPoint(point)}
                                      className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-color)]"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePoint(point)}
                                      className="p-1 text-[var(--text-muted)] hover:text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">还没有情节点</h3>
                      <p className="text-[var(--text-muted)] mb-4">为此情节线添加情节点来规划故事发展</p>
                      <Button onClick={handleAddPoint}>添加情节点</Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <GitBranch className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">选择一条情节线</h3>
                <p className="text-[var(--text-muted)]">从左侧列表选择一条情节线进行编辑，或创建新的情节线</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPlotModalOpen}
        onClose={() => setIsPlotModalOpen(false)}
        title={plotModalMode === 'create' ? '创建情节线' : '编辑情节线'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">标题 *</label>
            <Input
              value={plotFormData.title}
              onChange={(e) => setPlotFormData({ ...plotFormData, title: e.target.value })}
              placeholder="情节线标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">描述</label>
            <Textarea
              value={plotFormData.description}
              onChange={(e) => setPlotFormData({ ...plotFormData, description: e.target.value })}
              placeholder="描述这条情节线的主要内容..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">状态</label>
            <Select
              value={plotFormData.status}
              onChange={(e) => setPlotFormData({ ...plotFormData, status: e.target.value })}
              className="w-full"
            >
              {PLOT_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-4">
          <Button variant="outline" onClick={() => setIsPlotModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmitPlot} disabled={!plotFormData.title.trim()}>
            {plotModalMode === 'create' ? '创建' : '保存'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isPointModalOpen}
        onClose={() => setIsPointModalOpen(false)}
        title="添加情节点"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">标题 *</label>
            <Input
              value={pointFormData.title}
              onChange={(e) => setPointFormData({ ...pointFormData, title: e.target.value })}
              placeholder="情节点标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">类型</label>
            <Select
              value={pointFormData.type}
              onChange={(e) => setPointFormData({ ...pointFormData, type: e.target.value })}
              className="w-full"
            >
              {PLOT_POINT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">描述</label>
            <Textarea
              value={pointFormData.description}
              onChange={(e) => setPointFormData({ ...pointFormData, description: e.target.value })}
              placeholder="描述这个情节点的详细内容..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-4">
          <Button variant="outline" onClick={() => setIsPointModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmitPoint} disabled={!pointFormData.title.trim()}>
            添加
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isPointEditModalOpen}
        onClose={() => setIsPointEditModalOpen(false)}
        title="编辑情节点"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">标题 *</label>
            <Input
              value={pointFormData.title}
              onChange={(e) => setPointFormData({ ...pointFormData, title: e.target.value })}
              placeholder="情节点标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">类型</label>
            <Select
              value={pointFormData.type}
              onChange={(e) => setPointFormData({ ...pointFormData, type: e.target.value })}
              className="w-full"
            >
              {PLOT_POINT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">描述</label>
            <Textarea
              value={pointFormData.description}
              onChange={(e) => setPointFormData({ ...pointFormData, description: e.target.value })}
              placeholder="描述这个情节点的详细内容..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-4">
          <Button variant="outline" onClick={() => setIsPointEditModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmitPoint} disabled={!pointFormData.title.trim()}>
            保存
          </Button>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: 'plot', item: null })}
        onConfirm={handleConfirmDelete}
        title={`确定要删除${deleteModal.type === 'plot' ? '情节线' : '情节点'}「${(deleteModal.item as any)?.title || ''}」吗？`}
        message="删除后将无法恢复，请谨慎操作"
      />
    </div>
  )
}
