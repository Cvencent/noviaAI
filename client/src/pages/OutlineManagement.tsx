import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  List,
  Clock,
  GripVertical,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import {
  outlinesApi,
  Outline,
  OutlineItem,
  CreateOutlineDto,
  CreateOutlineItemDto,
} from '../api/outlines'

const STRUCTURE_TYPES = [
  { value: 'FULL_BOOK', label: '全书大纲' },
  { value: 'VOLUME', label: '卷大纲' },
  { value: 'ARC', label: '篇章大纲' },
]

const OUTLINE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
]

export function OutlineManagement() {
  const { projectId } = useParams<{ projectId: string }>()

  const [outlines, setOutlines] = useState<Outline[]>([])
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null)
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isItemEditModalOpen, setIsItemEditModalOpen] = useState(false)
  const [outlineModalMode, setOutlineModalMode] = useState<'create' | 'edit'>('create')
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<OutlineItem | null>(null)
  const [draggedItem, setDraggedItem] = useState<OutlineItem | null>(null)

  const [outlineFormData, setOutlineFormData] = useState<CreateOutlineDto>({
    title: '',
    description: '',
    structureType: 'FULL_BOOK',
    status: 'DRAFT',
  })

  const [itemFormData, setItemFormData] = useState<CreateOutlineItemDto>({
    title: '',
    summary: '',
    goal: '',
    conflict: '',
    outcome: '',
    povCharacter: '',
    location: '',
    estimatedWords: undefined,
  })

  useEffect(() => {
    loadOutlines()
  }, [projectId])

  const loadOutlines = async () => {
    if (!projectId) return
    try {
      const data = await outlinesApi.getAll(projectId)
      setOutlines(data)
    } catch (error) {
      console.error('加载大纲失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOutline = () => {
    setOutlineModalMode('create')
    setOutlineFormData({
      title: '',
      description: '',
      structureType: 'FULL_BOOK',
      status: 'DRAFT',
    })
    setIsOutlineModalOpen(true)
  }

  const handleEditOutline = (outline: Outline) => {
    setOutlineModalMode('edit')
    setSelectedOutline(outline)
    setOutlineFormData({
      title: outline.title,
      description: outline.description || '',
      structureType: outline.structureType,
      status: outline.status,
    })
    setIsOutlineModalOpen(true)
  }

  const handleDeleteOutline = async (outline: Outline) => {
    if (!projectId || !confirm(`确定要删除大纲「${outline.title}」吗？`)) return
    try {
      await outlinesApi.delete(projectId, outline.id)
      await loadOutlines()
      if (selectedOutline?.id === outline.id) {
        setSelectedOutline(null)
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmitOutline = async () => {
    if (!projectId || !outlineFormData.title.trim()) return

    try {
      if (outlineModalMode === 'create') {
        await outlinesApi.create(projectId, outlineFormData)
      } else if (selectedOutline) {
        await outlinesApi.update(projectId, selectedOutline.id, outlineFormData)
      }
      setIsOutlineModalOpen(false)
      await loadOutlines()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setItemFormData({
      title: '',
      summary: '',
      goal: '',
      conflict: '',
      outcome: '',
      povCharacter: '',
      location: '',
      estimatedWords: undefined,
    })
    setIsItemModalOpen(true)
  }

  const handleEditItem = (item: OutlineItem) => {
    setEditingItem(item)
    setItemFormData({
      title: item.title,
      summary: item.summary || '',
      goal: item.goal || '',
      conflict: item.conflict || '',
      outcome: item.outcome || '',
      povCharacter: item.povCharacter || '',
      location: item.location || '',
      estimatedWords: item.estimatedWords,
    })
    setIsItemEditModalOpen(true)
  }

  const handleDeleteItem = async (item: OutlineItem) => {
    if (!projectId || !selectedOutline || !confirm(`确定要删除条目「${item.title}」吗？`)) return
    try {
      await outlinesApi.deleteItem(projectId, selectedOutline.id, item.id)
      await loadOutlines()
      const updatedOutline = await outlinesApi.getById(projectId, selectedOutline.id)
      setSelectedOutline(updatedOutline)
    } catch (error) {
      console.error('删除条目失败:', error)
    }
  }

  const handleSubmitItem = async () => {
    if (!projectId || !selectedOutline || !itemFormData.title.trim()) return

    try {
      if (editingItem) {
        await outlinesApi.updateItem(projectId, selectedOutline.id, editingItem.id, itemFormData)
      } else {
        await outlinesApi.addItem(projectId, selectedOutline.id, itemFormData)
      }
      setIsItemModalOpen(false)
      setIsItemEditModalOpen(false)
      const updatedOutline = await outlinesApi.getById(projectId, selectedOutline.id)
      setSelectedOutline(updatedOutline)
    } catch (error) {
      console.error('保存条目失败:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, item: OutlineItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetItem: OutlineItem) => {
    e.preventDefault()
    if (!projectId || !selectedOutline || !draggedItem || draggedItem.id === targetItem.id) return

    const items = [...selectedOutline.items]
    const draggedIndex = items.findIndex(i => i.id === draggedItem.id)
    const targetIndex = items.findIndex(i => i.id === targetItem.id)

    items.splice(draggedIndex, 1)
    items.splice(targetIndex, 0, draggedItem)

    const itemIds = items.map(i => i.id)
    try {
      await outlinesApi.reorderItems(projectId, selectedOutline.id, itemIds)
      const updatedOutline = await outlinesApi.getById(projectId, selectedOutline.id)
      setSelectedOutline(updatedOutline)
    } catch (error) {
      console.error('重排序失败:', error)
    } finally {
      setDraggedItem(null)
    }
  }

  const getStructureTypeLabel = (type: string) => {
    return STRUCTURE_TYPES.find(t => t.value === type)?.label || type
  }

  const getStatusLabel = (status: string) => {
    return OUTLINE_STATUS_OPTIONS.find(s => s.value === status)?.label || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700'
      case 'COMPLETED': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const renderItemForm = (formData: CreateOutlineItemDto, setter: (d: CreateOutlineItemDto) => void) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
        <Input
          value={formData.title}
          onChange={(e) => setter({ ...formData, title: e.target.value })}
          placeholder="大纲条目标题"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
        <Textarea
          value={formData.summary}
          onChange={(e) => setter({ ...formData, summary: e.target.value })}
          placeholder="本节内容概要..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">目标</label>
          <Textarea
            value={formData.goal}
            onChange={(e) => setter({ ...formData, goal: e.target.value })}
            placeholder="本节叙事目标..."
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">冲突</label>
          <Textarea
            value={formData.conflict}
            onChange={(e) => setter({ ...formData, conflict: e.target.value })}
            placeholder="核心矛盾冲突..."
            rows={2}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">结局</label>
        <Textarea
          value={formData.outcome}
          onChange={(e) => setter({ ...formData, outcome: e.target.value })}
          placeholder="本节结局走向..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">视角人物</label>
          <Input
            value={formData.povCharacter}
            onChange={(e) => setter({ ...formData, povCharacter: e.target.value })}
            placeholder="视角人物"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
          <Input
            value={formData.location}
            onChange={(e) => setter({ ...formData, location: e.target.value })}
            placeholder="场景地点"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">预估字数</label>
          <Input
            type="number"
            value={formData.estimatedWords ?? ''}
            onChange={(e) => setter({ ...formData, estimatedWords: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">大纲管理</h1>
            <p className="text-gray-600 mt-1">规划和管理故事的整体结构大纲</p>
          </div>
          <Button onClick={handleCreateOutline}>
            <Plus className="w-4 h-4 mr-2" />
            创建大纲
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-0">
              <div className="p-4 border-b bg-white">
                <h2 className="font-semibold text-gray-900">大纲列表</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {outlines.length > 0 ? (
                  outlines.map(outline => (
                    <div
                      key={outline.id}
                      onClick={() => setSelectedOutline(outline)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedOutline?.id === outline.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{outline.title}</h3>
                          {outline.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{outline.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(outline.status)}`}>
                              {getStatusLabel(outline.status)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {getStructureTypeLabel(outline.structureType)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {outline.items.length} 个条目
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditOutline(outline)
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteOutline(outline)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <List className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">还没有大纲</h3>
                    <p className="text-gray-500 mb-4">开始创建你的第一个大纲吧</p>
                    <Button onClick={handleCreateOutline} size="sm">创建大纲</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedOutline ? (
              <Card className="p-0">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">{selectedOutline.title}</h2>
                    {selectedOutline.description && (
                      <p className="text-sm text-gray-500 mt-1">{selectedOutline.description}</p>
                    )}
                  </div>
                  <Button onClick={handleAddItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加条目
                  </Button>
                </div>

                <div className="p-6">
                  {selectedOutline.items.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />

                      <div className="space-y-4">
                        {selectedOutline.items.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, item)}
                            className={`relative pl-16 group cursor-move ${
                              draggedItem?.id === item.id ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="absolute left-4 top-4 w-4 h-4 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                            </div>

                            <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                                  </div>
                                  {item.summary && (
                                    <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {item.povCharacter && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                                        视角: {item.povCharacter}
                                      </span>
                                    )}
                                    {item.location && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">
                                        地点: {item.location}
                                      </span>
                                    )}
                                    {item.estimatedWords && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                        ~{item.estimatedWords.toLocaleString()} 字
                                      </span>
                                    )}
                                  </div>
                                  {(item.goal || item.conflict || item.outcome) && (
                                    <div className="mt-2 space-y-1">
                                      {item.goal && (
                                        <p className="text-xs text-gray-500"><span className="font-medium">目标:</span> {item.goal}</p>
                                      )}
                                      {item.conflict && (
                                        <p className="text-xs text-gray-500"><span className="font-medium">冲突:</span> {item.conflict}</p>
                                      )}
                                      {item.outcome && (
                                        <p className="text-xs text-gray-500"><span className="font-medium">结局:</span> {item.outcome}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">还没有大纲条目</h3>
                      <p className="text-gray-500 mb-4">为此大纲添加条目来规划故事结构</p>
                      <Button onClick={handleAddItem}>添加条目</Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <List className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择一个大纲</h3>
                <p className="text-gray-500">从左侧列表选择一个大纲进行编辑，或创建新的大纲</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOutlineModalOpen}
        onClose={() => setIsOutlineModalOpen(false)}
        title={outlineModalMode === 'create' ? '创建大纲' : '编辑大纲'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <Input
              value={outlineFormData.title}
              onChange={(e) => setOutlineFormData({ ...outlineFormData, title: e.target.value })}
              placeholder="大纲标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <Textarea
              value={outlineFormData.description}
              onChange={(e) => setOutlineFormData({ ...outlineFormData, description: e.target.value })}
              placeholder="描述这个大纲的主要内容..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结构类型</label>
              <Select
                value={outlineFormData.structureType}
                onChange={(e) => setOutlineFormData({ ...outlineFormData, structureType: e.target.value })}
                className="w-full"
              >
                {STRUCTURE_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <Select
                value={outlineFormData.status}
                onChange={(e) => setOutlineFormData({ ...outlineFormData, status: e.target.value })}
                className="w-full"
              >
                {OUTLINE_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsOutlineModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmitOutline} disabled={!outlineFormData.title.trim()}>
            {outlineModalMode === 'create' ? '创建' : '保存'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="添加大纲条目"
      >
        {renderItemForm(itemFormData, setItemFormData)}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsItemModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmitItem} disabled={!itemFormData.title.trim()}>
            添加
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isItemEditModalOpen}
        onClose={() => setIsItemEditModalOpen(false)}
        title="编辑大纲条目"
      >
        {renderItemForm(itemFormData, setItemFormData)}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsItemEditModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmitItem} disabled={!itemFormData.title.trim()}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
