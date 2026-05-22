import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  GripVertical,
  ChevronRight,
  CheckCircle,
  Clock,
  Eye,
  Download,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { chaptersApi, Chapter } from '../api/chapters'
import { FullBookAiReview, FullBookReview, PublishChecklist, PublishingAssets, storySystemApi } from '../api/story-system'

const STATUS_CONFIG = {
  draft: { label: '草稿', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  writing: { label: '写作中', icon: Edit2, color: 'text-blue-600 bg-blue-50' },
  completed: { label: '已完成', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  review: { label: '待审核', icon: Eye, color: 'text-purple-600 bg-purple-50' },
}

export function ChapterManagement() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [fullBookReview, setFullBookReview] = useState<FullBookReview | null>(null)
  const [fullBookAiReview, setFullBookAiReview] = useState<FullBookAiReview | null>(null)
  const [publishChecklist, setPublishChecklist] = useState<PublishChecklist | null>(null)
  const [publishingAssets, setPublishingAssets] = useState<PublishingAssets | null>(null)
  const [isStoryActionBusy, setIsStoryActionBusy] = useState(false)

  useEffect(() => {
    loadChapters()
  }, [projectId])

  const loadChapters = async () => {
    if (!projectId) return
    try {
      const data = await chaptersApi.getAll(projectId)
      setChapters(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('加载章节失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChapter = async () => {
    if (!projectId || !newChapterTitle.trim()) return

    try {
      const newChapter = await chaptersApi.create(projectId, {
        title: newChapterTitle,
        order: chapters.length,
        status: 'draft',
      })
      setChapters([...chapters, newChapter])
      setShowCreateModal(false)
      setNewChapterTitle('')
      navigate(`/projects/${projectId}/chapters/${newChapter.id}`)
    } catch (error) {
      console.error('创建章节失败:', error)
    }
  }

  const handleEditChapter = async () => {
    if (!projectId || !editingChapter || !newChapterTitle.trim()) return

    try {
      const updated = await chaptersApi.update(projectId, editingChapter.id, {
        title: newChapterTitle,
      })
      setChapters(chapters.map(c => c.id === updated.id ? updated : c))
      setShowEditModal(false)
      setEditingChapter(null)
      setNewChapterTitle('')
    } catch (error) {
      console.error('更新章节失败:', error)
    }
  }

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!projectId || !confirm(`确定要删除「${chapter.title}」吗？`)) return

    try {
      await chaptersApi.delete(projectId, chapter.id)
      setChapters(chapters.filter(c => c.id !== chapter.id))
    } catch (error) {
      console.error('删除章节失败:', error)
    }
  }

  const handleUpdateStatus = async (chapter: Chapter, status: string) => {
    if (!projectId) return

    try {
      const updated = await chaptersApi.update(projectId, chapter.id, { status })
      setChapters(chapters.map(c => c.id === updated.id ? updated : c))
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newChapters = [...chapters]
    const draggedItem = newChapters[draggedIndex]
    newChapters.splice(draggedIndex, 1)
    newChapters.splice(index, 0, draggedItem)
    setChapters(newChapters)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (!projectId) return
    setDraggedIndex(null)

    try {
      const chapterIds = chapters.map(c => c.id)
      await chaptersApi.reorder(projectId, { chapterIds })
    } catch (error) {
      console.error('排序失败:', error)
      loadChapters()
    }
  }

  const openEditModal = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setNewChapterTitle(chapter.title)
    setShowEditModal(true)
  }

  const handleFullBookReview = async () => {
    if (!projectId) return
    setIsStoryActionBusy(true)
    try {
      setFullBookReview(await storySystemApi.reviewFullBook(projectId))
    } catch (error) {
      console.error('全书审查失败:', error)
    } finally {
      setIsStoryActionBusy(false)
    }
  }

  const handleFullBookAiReview = async () => {
    if (!projectId) return
    setIsStoryActionBusy(true)
    try {
      setFullBookAiReview(await storySystemApi.reviewFullBookWithAi(projectId, { focus: 'ALL' }))
    } catch (error) {
      console.error('AI 全书审查失败:', error)
    } finally {
      setIsStoryActionBusy(false)
    }
  }

  const handlePublishChecklist = async () => {
    if (!projectId) return
    setIsStoryActionBusy(true)
    try {
      setPublishChecklist(await storySystemApi.getPublishChecklist(projectId))
    } catch (error) {
      console.error('发布前检查失败:', error)
    } finally {
      setIsStoryActionBusy(false)
    }
  }

  const downloadExport = (exported: { content?: string; contentBase64?: string; mimeType?: string; fileName: string }) => {
    const payload = exported.contentBase64
      ? Uint8Array.from(atob(exported.contentBase64), (char) => char.charCodeAt(0))
      : exported.content || ''
    const blob = new Blob([payload], { type: exported.mimeType || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exported.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadCoverSvg = () => {
    if (!publishingAssets?.coverSvg) return
    downloadExport({
      content: publishingAssets.coverSvg,
      mimeType: 'image/svg+xml',
      fileName: `${publishingAssets.title || 'cover'}-cover.svg`,
    })
  }

  const handleExportBook = async (format: 'MARKDOWN' | 'EPUB' | 'PDF') => {
    if (!projectId) return
    setIsStoryActionBusy(true)
    try {
      const exported = await storySystemApi.exportBook(projectId, { format })
      downloadExport(exported)
    } catch (error) {
      console.error(`${format} 导出失败:`, error)
    } finally {
      setIsStoryActionBusy(false)
    }
  }

  const handleGeneratePublishingAssets = async () => {
    if (!projectId) return
    setIsStoryActionBusy(true)
    try {
      setPublishingAssets(await storySystemApi.generatePublishingAssets(projectId))
    } catch (error) {
      console.error('出版素材生成失败:', error)
    } finally {
      setIsStoryActionBusy(false)
    }
  }

  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = !searchQuery ||
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !filterStatus || chapter.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">章节管理</h1>
            <p className="text-gray-600 mt-1">
              共 {chapters.length} 章 | 总字数 {totalWords.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleFullBookReview} isLoading={isStoryActionBusy}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              全书审查
            </Button>
            <Button variant="outline" onClick={handleFullBookAiReview} isLoading={isStoryActionBusy}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 审查
            </Button>
            <Button variant="outline" onClick={handlePublishChecklist} isLoading={isStoryActionBusy}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              发布检查
            </Button>
            <Button variant="outline" onClick={() => handleExportBook('MARKDOWN')} isLoading={isStoryActionBusy}>
              <Download className="w-4 h-4 mr-2" />
              导出 Markdown
            </Button>
            <Button variant="outline" onClick={() => handleExportBook('EPUB')} isLoading={isStoryActionBusy}>
              <Download className="w-4 h-4 mr-2" />
              EPUB
            </Button>
            <Button variant="outline" onClick={() => handleExportBook('PDF')} isLoading={isStoryActionBusy}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleGeneratePublishingAssets} isLoading={isStoryActionBusy}>
              <Sparkles className="w-4 h-4 mr-2" />
              出版素材
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建章节
            </Button>
          </div>
        </div>

        {fullBookReview && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900">全书审查 · {fullBookReview.status}</div>
                <div className="mt-1 text-xs text-gray-500">
                  accepted {fullBookReview.summary.acceptedChapters}/{fullBookReview.summary.totalChapters}
                  {' · '}阻塞报告 {fullBookReview.summary.blockingReports}
                  {' · '}未回收伏笔 {fullBookReview.summary.openLoops}
                  {' · '}投影失败 {fullBookReview.summary.projectionFailures}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFullBookReview(null)}>
                收起
              </Button>
            </div>
            {fullBookReview.issues.length > 0 && (
              <div className="mt-3 space-y-2">
                {fullBookReview.issues.slice(0, 6).map((issue, index) => (
                  <div key={`${issue.category}-${issue.sourceId || issue.chapterId || index}`} className="text-xs text-gray-700">
                    <span className={issue.severity === 'CRITICAL' ? 'font-medium text-red-700' : 'font-medium text-yellow-700'}>
                      [{issue.category}/{issue.severity}]
                    </span>{' '}
                    {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {fullBookAiReview && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900">AI 全书审查 · {fullBookAiReview.status}</div>
                <div className="mt-1 text-xs text-gray-500">
                  结构 {fullBookAiReview.structureIssues.length}
                  {' · '}风格 {fullBookAiReview.styleIssues.length}
                  {' · '}节奏 {fullBookAiReview.pacingIssues.length}
                  {' · '}人物弧线 {fullBookAiReview.characterArcIssues.length}
                  {' · '}伏笔 {fullBookAiReview.openLoopIssues.length}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFullBookAiReview(null)}>
                收起
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-700">{fullBookAiReview.summary}</p>
            {fullBookAiReview.recommendations.length > 0 && (
              <div className="mt-3 space-y-1">
                {fullBookAiReview.recommendations.slice(0, 5).map((item) => (
                  <div key={item} className="text-xs text-gray-700">- {item}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {publishChecklist && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900">发布前检查 · {publishChecklist.status}</div>
                <div className="mt-1 text-xs text-gray-500">{publishChecklist.checks.length} 项检查</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPublishChecklist(null)}>
                收起
              </Button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {publishChecklist.checks.map((check) => (
                <div key={check.key} className="rounded border border-gray-100 bg-gray-50 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800">{check.label}</span>
                    <span className={check.status === 'PASS' ? 'text-green-700' : check.status === 'BLOCKED' ? 'text-red-700' : 'text-yellow-700'}>
                      {check.status}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-700">{check.message}</div>
                  <div className="mt-1 text-gray-500">{check.action}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {publishingAssets && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900">出版素材 · {publishingAssets.title}</div>
                <div className="mt-1 text-xs text-gray-500">
                  accepted {publishingAssets.sourceStats.acceptedChapters}/{publishingAssets.sourceStats.chapters}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPublishingAssets(null)}>
                收起
              </Button>
            </div>
            <div className="mt-3 grid gap-4 lg:grid-cols-[180px_1fr]">
              {publishingAssets.coverSvg && (
                <div className="space-y-2">
                  <div
                    className="aspect-[2/3] overflow-hidden rounded border border-gray-200 bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: publishingAssets.coverSvg }}
                  />
                  <Button variant="outline" size="sm" onClick={downloadCoverSvg} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    下载封面 SVG
                  </Button>
                </div>
              )}
              <div className="space-y-3 text-sm text-gray-700">
                <p className="leading-6">{publishingAssets.synopsis}</p>
                {publishingAssets.sellingPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {publishingAssets.sellingPoints.map((point) => (
                      <span key={point} className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700">
                        {point}
                      </span>
                    ))}
                  </div>
                )}
                <div className="rounded border border-gray-100 bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                  {publishingAssets.coverPrompt}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索章节..."
              className="w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="writing">写作中</option>
            <option value="completed">已完成</option>
            <option value="review">待审核</option>
          </select>
        </div>

        <Card>
          {filteredChapters.length > 0 ? (
            <div className="divide-y">
              {filteredChapters.map((chapter, index) => {
                const statusConfig = STATUS_CONFIG[chapter.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={chapter.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                    onClick={() => navigate(`/projects/${projectId}/chapters/${chapter.id}`)}
                  >
                    <div className="text-gray-400 cursor-grab hover:text-gray-600">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="w-8 text-center text-gray-500 font-medium">
                      {chapter.order + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{chapter.wordCount?.toLocaleString() || 0} 字</span>
                        <span>更新于 {new Date(chapter.updatedAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={chapter.status}
                          onChange={(e) => handleUpdateStatus(chapter, e.target.value)}
                          className="appearance-none px-2 py-1 pr-6 text-xs border rounded hover:bg-gray-100 cursor-pointer"
                        >
                          <option value="draft">草稿</option>
                          <option value="writing">写作中</option>
                          <option value="completed">已完成</option>
                          <option value="review">待审核</option>
                        </select>
                        <ChevronRight className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(chapter)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChapter(chapter)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterStatus ? '没有找到匹配的章节' : '还没有章节'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus
                  ? '尝试调整搜索条件'
                  : '开始创建你的第一章吧'}
              </p>
              {!searchQuery && !filterStatus && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建章节
                </Button>
              )}
            </div>
          )}
        </Card>

        {chapters.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            提示：拖动章节可以调整顺序
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setNewChapterTitle('')
        }}
        title="创建新章节"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              章节标题
            </label>
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="例如：第一章 觉醒"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChapter()}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            取消
          </Button>
          <Button onClick={handleCreateChapter} disabled={!newChapterTitle.trim()}>
            创建
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingChapter(null)
          setNewChapterTitle('')
        }}
        title="编辑章节"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              章节标题
            </label>
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditChapter()}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            取消
          </Button>
          <Button onClick={handleEditChapter} disabled={!newChapterTitle.trim()}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
