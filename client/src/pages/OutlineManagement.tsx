import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Plus,
  Edit2,
  Trash2,
  List,
  Clock,
  GripVertical,
  Sparkles,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import {
  outlinesApi,
  Outline,
  OutlineAiJob,
  OutlineItem,
  CreateOutlineDto,
  CreateOutlineItemDto,
  GenerateOutlineDto,
  StructureHealthReport,
} from '../api/outlines'

const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ ...props }) => <h1 className="text-lg font-bold text-[var(--text-primary)] mb-2 mt-3" {...props} />,
      h2: ({ ...props }) => <h2 className="text-base font-bold text-[var(--text-primary)] mb-1.5 mt-2" {...props} />,
      h3: ({ ...props }) => <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 mt-1.5" {...props} />,
      p: ({ ...props }) => <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-1.5" {...props} />,
      strong: ({ ...props }) => <strong className="font-semibold text-[var(--text-primary)]" {...props} />,
      em: ({ ...props }) => <em className="italic text-[var(--text-secondary)]" {...props} />,
      ul: ({ ...props }) => <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] mb-1.5 space-y-0.5" {...props} />,
      ol: ({ ...props }) => <ol className="list-decimal list-inside text-sm text-[var(--text-secondary)] mb-1.5 space-y-0.5" {...props} />,
      li: ({ ...props }) => <li className="text-sm text-[var(--text-secondary)] leading-relaxed mb-0.5" {...props} />,
      blockquote: ({ ...props }) => <blockquote className="border-l-3 border-[var(--accent-color)] pl-2 py-1 my-1.5 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/50 rounded-r" {...props} />,
      code: ({ ...props }) => <code className="bg-[var(--bg-tertiary)] px-1 py-0.5 rounded text-sm text-[var(--accent-color)] font-mono" {...props} />,
      hr: ({ ...props }) => <hr className="my-3 border-[var(--border-color)]" {...props} />,
    }}
  >
    {content}
  </ReactMarkdown>
)

function parseOutlineJobResult(job?: OutlineAiJob | null): { outline?: Outline } | null {
  if (!job?.result) return null
  try {
    return JSON.parse(job.result) as { outline?: Outline }
  } catch {
    return null
  }
}

const STRUCTURE_TYPES = [
  { value: 'FULL_BOOK', label: '全书大纲' },
  { value: 'VOLUME', label: '卷大纲' },
  { value: 'ARC', label: '篇章大纲' },
]

const AI_STRUCTURE_TEMPLATES = [
  { value: 'THREE_ACT', label: '三幕式' },
  { value: 'HERO_JOURNEY', label: '英雄之旅' },
  { value: 'KISHOTENKETSU', label: '起承转合' },
  { value: 'SAVE_THE_CAT', label: 'Save the Cat 15 节拍' },
  { value: 'SEVEN_POINT', label: '七点故事结构' },
]

const OUTLINE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
]

interface OutlineManagementProps {
  projectId?: string
  outlineId?: string
}

export function OutlineManagement({ projectId: projectIdProp, outlineId: outlineIdProp }: OutlineManagementProps = {}) {
  const { projectId: routeProjectId, outlineId: routeOutlineId } = useParams<{ projectId: string; outlineId?: string }>()
  const projectId = projectIdProp || routeProjectId

  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null)
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isItemEditModalOpen, setIsItemEditModalOpen] = useState(false)
  const [outlineModalMode, setOutlineModalMode] = useState<'create' | 'edit'>('create')
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [isAnalyzingStructure, setIsAnalyzingStructure] = useState(false)
  const [outlineAiJobs, setOutlineAiJobs] = useState<OutlineAiJob[]>([])
  const [editingItem, setEditingItem] = useState<OutlineItem | null>(null)
  const [draggedItem, setDraggedItem] = useState<OutlineItem | null>(null)
  const [structureReport, setStructureReport] = useState<StructureHealthReport | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'outline' | 'item'; item: Outline | OutlineItem | null }>({ isOpen: false, type: 'outline', item: null })
  const selectedOutlineId = outlineIdProp || routeOutlineId

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

  const [aiFormData, setAiFormData] = useState<GenerateOutlineDto>({
    premise: '',
    structureTemplate: 'THREE_ACT',
    chapterCount: 12,
    targetWords: 80000,
  })

  useEffect(() => {
    loadOutlines()
  }, [projectId, selectedOutlineId])

  useEffect(() => {
    const handleAssistantOutlineCreated = () => {
      loadOutlines()
    }

    window.addEventListener('outlineCreatedFromAssistant', handleAssistantOutlineCreated)
    return () => window.removeEventListener('outlineCreatedFromAssistant', handleAssistantOutlineCreated)
  }, [projectId])

  useEffect(() => {
    refreshOutlineAiJobs().catch((error) => {
      console.error('加载大纲 AI 任务失败:', error)
    })
  }, [projectId])

  useEffect(() => {
    if (!outlineAiJobs.some((job) => ['PENDING', 'RUNNING'].includes(job.status))) return
    const timer = window.setInterval(() => {
      refreshOutlineAiJobs().catch((error) => {
        console.error('刷新大纲 AI 任务失败:', error)
      })
    }, 2500)
    return () => window.clearInterval(timer)
  }, [outlineAiJobs, projectId])

  const latestOutlineAiJob = outlineAiJobs[0] || null
  const isOutlineAiJobRunning = !!latestOutlineAiJob && ['PENDING', 'RUNNING'].includes(latestOutlineAiJob.status)

  const notifyOutlineTreeChanged = (outlineId?: string) => {
    window.dispatchEvent(new CustomEvent('outlineCreatedFromAssistant', { detail: { outlineId } }))
  }

  const loadOutlines = async () => {
    if (!projectId) return
    try {
      const data = await outlinesApi.getAll(projectId)
      const nextSelected = selectedOutlineId
        ? data.find(outline => outline.id === selectedOutlineId) || null
        : selectedOutline && data.some(outline => outline.id === selectedOutline.id)
          ? data.find(outline => outline.id === selectedOutline.id) || null
          : data[0] || null
      setSelectedOutline(nextSelected)
      setStructureReport(null)
    } catch (error) {
      console.error('加载大纲失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshOutlineAiJobs = async () => {
    if (!projectId) return
    const jobs = await outlinesApi.listAiJobs(projectId)
    setOutlineAiJobs(jobs)

    const latestDoneJob = jobs.find((job) => job.status === 'DONE')
    const result = parseOutlineJobResult(latestDoneJob)
    if (result?.outline) {
      setSelectedOutline(result.outline)
      setStructureReport(null)
      notifyOutlineTreeChanged(result.outline.id)
      await loadOutlines()
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

  const handleGenerateOutline = async () => {
    if (!projectId) return

    setIsGeneratingOutline(true)
    try {
      const job = await outlinesApi.createAiJob(projectId, aiFormData)
      setOutlineAiJobs((jobs) => [job, ...jobs.filter((item) => item.id !== job.id)])
      setStructureReport(null)
      setIsAiModalOpen(false)
    } catch (error) {
      console.error('AI 生成大纲失败:', error)
      alert('AI 生成大纲失败，请检查 AI 设置或稍后重试')
    } finally {
      setIsGeneratingOutline(false)
    }
  }

  const handleAnalyzeStructure = async () => {
    if (!projectId || !selectedOutline) return

    setIsAnalyzingStructure(true)
    try {
      const report = await outlinesApi.analyzeStructure(projectId, selectedOutline.id)
      setStructureReport(report)
    } catch (error) {
      console.error('结构分析失败:', error)
      alert('结构分析失败，请稍后重试')
    } finally {
      setIsAnalyzingStructure(false)
    }
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
    setDeleteModal({ isOpen: true, type: 'outline', item: outline })
  }

  const handleDeleteItem = async (item: OutlineItem) => {
    setDeleteModal({ isOpen: true, type: 'item', item })
  }

  const handleConfirmDelete = async () => {
    if (!projectId || !deleteModal.item) return
    try {
      if (deleteModal.type === 'outline' && deleteModal.item instanceof Object) {
        const outline = deleteModal.item as Outline
        await outlinesApi.delete(projectId, outline.id)
        await loadOutlines()
        notifyOutlineTreeChanged(outline.id)
        if (selectedOutline?.id === outline.id) {
          setSelectedOutline(null)
        }
      } else if (deleteModal.type === 'item' && deleteModal.item instanceof Object && selectedOutline) {
        const item = deleteModal.item as OutlineItem
        await outlinesApi.deleteItem(projectId, selectedOutline.id, item.id)
        await loadOutlines()
        const updatedOutline = await outlinesApi.getById(projectId, selectedOutline.id)
        setSelectedOutline(updatedOutline)
      }
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleteModal({ isOpen: false, type: 'outline', item: null })
    }
  }

  const handleSubmitOutline = async () => {
    if (!projectId || !outlineFormData.title.trim()) return

    try {
      let savedOutline: Outline | null = null
      if (outlineModalMode === 'create') {
        savedOutline = await outlinesApi.create(projectId, outlineFormData)
      } else if (selectedOutline) {
        savedOutline = await outlinesApi.update(projectId, selectedOutline.id, outlineFormData)
      }
      setIsOutlineModalOpen(false)
      if (savedOutline) {
        setSelectedOutline(savedOutline)
        notifyOutlineTreeChanged(savedOutline.id)
      }
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

  const renderItemForm = (formData: CreateOutlineItemDto, setter: (d: CreateOutlineItemDto) => void) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">标题 *</label>
        <Input
          value={formData.title}
          onChange={(e) => setter({ ...formData, title: e.target.value })}
          placeholder="大纲条目标题"
          className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">摘要</label>
        <Textarea
          value={formData.summary}
          onChange={(e) => setter({ ...formData, summary: e.target.value })}
          placeholder="本节内容概要..."
          rows={3}
          className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">目标</label>
          <Textarea
            value={formData.goal}
            onChange={(e) => setter({ ...formData, goal: e.target.value })}
            placeholder="本节叙事目标..."
            rows={2}
            className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">冲突</label>
          <Textarea
            value={formData.conflict}
            onChange={(e) => setter({ ...formData, conflict: e.target.value })}
            placeholder="核心矛盾冲突..."
            rows={2}
            className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">结局</label>
        <Textarea
          value={formData.outcome}
          onChange={(e) => setter({ ...formData, outcome: e.target.value })}
          placeholder="本节结局走向..."
          rows={2}
          className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">视角人物</label>
          <Input
            value={formData.povCharacter}
            onChange={(e) => setter({ ...formData, povCharacter: e.target.value })}
            placeholder="视角人物"
            className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">地点</label>
          <Input
            value={formData.location}
            onChange={(e) => setter({ ...formData, location: e.target.value })}
            placeholder="场景地点"
            className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">预估字数</label>
          <Input
            type="number"
            value={formData.estimatedWords ?? ''}
            onChange={(e) => setter({ ...formData, estimatedWords: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="h-full bg-[var(--bg-primary)] p-4 flex items-center justify-center overflow-y-auto">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    )
  }

  const deleteModalTitle = deleteModal.type === 'outline'
    ? '确定要删除大纲吗？'
    : `确定要删除条目 [${deleteModal.item?.title || ''}] 吗？`

  return (
    <div className="h-full bg-[var(--bg-primary)] overflow-hidden flex flex-col">
      {/* 顶部操作栏 */}
      <div className="flex-shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">大纲管理</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">规划和管理故事的整体结构大纲</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedOutline && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleEditOutline(selectedOutline)}
                  size="sm"
                  className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-color)]"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAnalyzeStructure}
                  isLoading={isAnalyzingStructure}
                  size="sm"
                  className="border-[var(--accent-color)]/50 text-[var(--text-secondary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  分析
                </Button>
                <Button
                  onClick={handleAddItem}
                  size="sm"
                  className="bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  添加条目
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setIsAiModalOpen(true)}
              isLoading={isOutlineAiJobRunning}
              size="sm"
              className="border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI 生成
            </Button>
            <Button onClick={handleCreateOutline} size="sm" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              新建大纲
            </Button>
            {selectedOutline && (
              <Button
                variant="outline"
                onClick={() => handleDeleteOutline(selectedOutline)}
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                删除
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 状态提示 */}
      {(isOutlineAiJobRunning || latestOutlineAiJob?.status === 'FAILED') && (
        <div className="flex-shrink-0 border-b border-[var(--border-color)] bg-[var(--accent-color)]/10 px-5 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {isOutlineAiJobRunning ? 'AI 正在后台生成大纲' : 'AI 生成失败'}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              {isOutlineAiJobRunning ? '您可以刷新或离开页面；生成完成后大纲会自动出现。' : latestOutlineAiJob?.error}
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden flex">
        <div className="h-full max-w-7xl mx-auto flex w-full">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {selectedOutline ? (
              <div className="p-5 max-w-4xl mx-auto">
                {/* 大纲标题栏 */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center gap-3 mb-5 pb-4 border-b border-[var(--border-color)]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[var(--text-primary)] truncate">{selectedOutline.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]`}>
                        {getStructureTypeLabel(selectedOutline.structureType)}
                      </span>
                    </div>
                    {selectedOutline.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{selectedOutline.description}</p>
                    )}
                  </div>
                </div>

                {/* 结构分析报告 */}
                {structureReport && (
                  <div className="mb-5 rounded-lg border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                      <div>
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[var(--accent-color)]" />
                          结构健康度
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          模板：{AI_STRUCTURE_TEMPLATES.find(t => t.value === structureReport.templateId)?.label || structureReport.templateId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-md bg-[var(--bg-secondary)] px-3 py-1 text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-color)]">
                          覆盖 {structureReport.coverageScore}
                        </span>
                        <span className="rounded-md bg-[var(--bg-secondary)] px-3 py-1 text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-color)]">
                          节奏 {structureReport.pacingScore}
                        </span>
                      </div>
                    </div>
                    {(structureReport.missingBeats.length > 0 || structureReport.overloadedBeats.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {structureReport.missingBeats.length > 0 && (
                          <div className="rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-color)]">
                            <p className="font-semibold text-[var(--text-primary)] mb-1.5 text-xs">⚠️ 缺失节拍</p>
                            <p className="text-xs text-[var(--text-secondary)]">{structureReport.missingBeats.join('、')}</p>
                          </div>
                        )}
                        {structureReport.overloadedBeats.length > 0 && (
                          <div className="rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-color)]">
                            <p className="font-semibold text-[var(--text-primary)] mb-1.5 text-xs">⚡ 过重章节</p>
                            <p className="text-xs text-[var(--text-secondary)]">{structureReport.overloadedBeats.join('、')}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {structureReport.suggestions.length > 0 && (
                      <div className="space-y-2">
                        {structureReport.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex gap-2 text-[var(--text-primary)]">
                            <AlertCircle className="w-4 h-4 text-[var(--accent-color)] mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 大纲条目列表 */}
                {selectedOutline.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOutline.items.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item)}
                      className="group"
                    >
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 hover:border-[var(--accent-color)]/40 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start gap-3">
                          {/* 左侧：条目内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-[var(--accent-color)] flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-white">{index + 1}</span>
                              </div>
                              <GripVertical className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                              <h4 className="font-semibold text-sm text-[var(--text-primary)] flex-1 truncate">{item.title}</h4>
                            </div>

                            {/* 标签 */}
                            <div className="flex flex-wrap gap-1.5 mb-2 ml-7">
                              {item.povCharacter && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-color)]/20 text-[var(--accent-color)]">
                                  视角: {item.povCharacter}
                                </span>
                              )}
                              {item.location && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                  地点: {item.location}
                                </span>
                              )}
                              {item.estimatedWords && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                                  ~{item.estimatedWords.toLocaleString()} 字
                                </span>
                              )}
                            </div>

                            {/* 摘要 */}
                            {item.summary && (
                              <div className="ml-7 mt-2">
                                <div className="text-xs text-[var(--text-secondary)]">
                                  <MarkdownRenderer content={item.summary} />
                                </div>
                              </div>
                            )}

                            {/* 目标/冲突/结局 */}
                            {(item.goal || item.conflict || item.outcome) && (
                              <div className="ml-7 mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                                {item.goal && (
                                  <div className="p-2.5 bg-[var(--bg-tertiary)]/40 rounded border border-[var(--border-color)]">
                                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">🎯 目标</p>
                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                      <MarkdownRenderer content={item.goal} />
                                    </div>
                                  </div>
                                )}
                                {item.conflict && (
                                  <div className="p-2.5 bg-[var(--bg-tertiary)]/40 rounded border border-[var(--border-color)]">
                                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">⚡ 冲突</p>
                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                      <MarkdownRenderer content={item.conflict} />
                                    </div>
                                  </div>
                                )}
                                {item.outcome && (
                                  <div className="p-2.5 bg-[var(--bg-tertiary)]/40 rounded border border-[var(--border-color)]">
                                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">📝 结局</p>
                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                      <MarkdownRenderer content={item.outcome} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 右侧：操作按钮 */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-1">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-all"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Clock className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
                    <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1.5">还没有大纲条目</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-3">添加条目来规划故事</p>
                    <Button onClick={handleAddItem} size="sm" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      添加条目
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <List className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1.5">选择或创建大纲</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">从左侧选择一个大纲，或创建新的</p>
                  <Button onClick={handleCreateOutline} size="sm" className="bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    新建大纲
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI 生成大纲"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">结构模板</label>
            <Select
              value={aiFormData.structureTemplate}
              onChange={(e) => setAiFormData({
                ...aiFormData,
                structureTemplate: e.target.value as GenerateOutlineDto['structureTemplate'],
              })}
              className="w-full bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
            >
              {AI_STRUCTURE_TEMPLATES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">章节数量</label>
              <Input
                type="number"
                min={1}
                max={80}
                value={aiFormData.chapterCount ?? ''}
                onChange={(e) => setAiFormData({
                  ...aiFormData,
                  chapterCount: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">目标总字数</label>
              <Input
                type="number"
                min={500}
                value={aiFormData.targetWords ?? ''}
                onChange={(e) => setAiFormData({
                  ...aiFormData,
                  targetWords: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">补充设想</label>
            <Textarea
              value={aiFormData.premise || ''}
              onChange={(e) => setAiFormData({ ...aiFormData, premise: e.target.value })}
              placeholder="可以补充主线、角色、冲突、结尾方向；不填则使用项目简介。"
              rows={4}
              className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {isOutlineAiJobRunning && (
          <div className="mt-4 rounded border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 p-3 text-sm text-[var(--text-primary)]">
            正在生成中...
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-4">
          <Button variant="outline" onClick={() => setIsAiModalOpen(false)} className="border-[var(--border-color)] text-[var(--text-secondary)]">取消</Button>
          <Button onClick={handleGenerateOutline} isLoading={isGeneratingOutline || isOutlineAiJobRunning} className="bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90">
            <Sparkles className="w-4 h-4 mr-2" />
            生成并保存
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isOutlineModalOpen}
        onClose={() => setIsOutlineModalOpen(false)}
        title={outlineModalMode === 'create' ? '创建大纲' : '编辑大纲'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">标题 *</label>
            <Input
              value={outlineFormData.title}
              onChange={(e) => setOutlineFormData({ ...outlineFormData, title: e.target.value })}
              placeholder="大纲标题"
              className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">描述</label>
            <Textarea
              value={outlineFormData.description}
              onChange={(e) => setOutlineFormData({ ...outlineFormData, description: e.target.value })}
              placeholder="描述这个大纲的主要内容..."
              rows={2}
              className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">结构类型</label>
              <Select
                value={outlineFormData.structureType}
                onChange={(e) => setOutlineFormData({ ...outlineFormData, structureType: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
              >
                {STRUCTURE_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">状态</label>
              <Select
                value={outlineFormData.status}
                onChange={(e) => setOutlineFormData({ ...outlineFormData, status: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
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

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: 'outline', item: null })}
        onConfirm={handleConfirmDelete}
        title={deleteModalTitle}
        message="删除后将无法恢复，请谨慎操作"
      />
    </div>
  )
}
