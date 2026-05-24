import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Shield, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { ProjectStyleSelector } from '../components/ProjectStyleSelector'
import { WebNovelTemplateSwitcher } from '../components/WebNovelTemplateSwitcher'
import { projectsApi } from '../api/projects'
import { useToast } from '../contexts/ToastContext'
import type { Project, UpdateProjectDto } from '../types/project'

const GENRE_OPTIONS = [
  { value: 'fantasy', label: '奇幻' },
  { value: 'romance', label: '言情' },
  { value: 'scifi', label: '科幻' },
  { value: 'mystery', label: '悬疑' },
  { value: 'urban', label: '都市' },
  { value: 'historical', label: '历史' },
  { value: 'wuxia', label: '武侠' },
  { value: 'xianxia', label: '仙侠' },
  { value: 'other', label: '其他' },
]

const STATUS_OPTIONS = [
  { value: 'IDEATION', label: '构思中' },
  { value: 'PLANNING', label: '规划中' },
  { value: 'WRITING', label: '写作中' },
  { value: 'REVISION', label: '修改中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'PUBLISHED', label: '已发布' },
]

export function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>()
  const { success, error } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState<UpdateProjectDto>({
    title: '',
    subtitle: '',
    synopsis: '',
    genre: 'fantasy',
    tags: '',
    status: 'IDEATION',
  })

  const [projectTemplateId, setProjectTemplateId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const data = await projectsApi.getById(projectId)
      setProject(data)
      setFormData({
        title: data.title || '',
        subtitle: data.subtitle || '',
        synopsis: data.synopsis || '',
        genre: data.genre || 'fantasy',
        tags: data.tags || '',
        status: data.status || 'IDEATION',
      })
      setProjectTemplateId(data.webNovelTemplateId || null)
    } catch (err) {
      error('加载项目失败，请刷新页面重试')
      console.error('加载项目失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UpdateProjectDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleProjectTemplateChange = (templateId: string | null) => {
    setProjectTemplateId(templateId)
    setFormData(prev => ({ ...prev, webNovelTemplateId: templateId }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!projectId || !formData.title) {
      error('请填写项目标题')
      return
    }

    setIsSaving(true)
    try {
      const updateData: UpdateProjectDto = {
        ...formData,
        webNovelTemplateId: projectTemplateId,
      }
      await projectsApi.update(projectId, updateData)
      setHasChanges(false)
      success('项目设置保存成功')
    } catch (err) {
      error('保存失败，请重试')
      console.error('保存项目失败:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (project) {
      setFormData({
        title: project.title || '',
        subtitle: project.subtitle || '',
        synopsis: project.synopsis || '',
        genre: project.genre || 'fantasy',
        tags: project.tags || '',
        status: project.status || 'IDEATION',
      })
      setProjectTemplateId(project.webNovelTemplateId || null)
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-gray-500">项目不存在</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-gray-600" />
          <h1 className="text-2xl font-bold">项目设置</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* 网文模板 */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              网文模板
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              选择适合你作品类型的模板，Story System 会遵循模板的节奏和规则进行写作
            </p>
          </div>
          <WebNovelTemplateSwitcher
            projectTemplateId={projectTemplateId}
            chapterTemplateId={null}
            onProjectTemplateChange={handleProjectTemplateChange}
            onChapterTemplateChange={() => {}}
          />
        </Card>

        {/* 写作风格 */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">写作风格</h2>
            <p className="text-sm text-gray-600 mt-1">
              选择适合你故事的写作风格，AI 会遵循这个风格进行续写
            </p>
          </div>
          {projectId && <ProjectStyleSelector projectId={projectId} />}
        </Card>

        {/* 基础信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            基本信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目标题 *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="我的小说"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                副标题
              </label>
              <Input
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="（可选）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题材 *
              </label>
              <Select
                value={formData.genre}
                onChange={(e) => handleInputChange('genre', e.target.value)}
              >
                {GENRE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="标签1, 标签2, 标签3"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                简介
              </label>
              <textarea
                value={formData.synopsis}
                onChange={(e) => handleInputChange('synopsis', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="这是一个关于..."
              />
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3">
          {hasChanges && (
            <Button variant="outline" onClick={handleCancel}>
              取消修改
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || !formData.title}
            isLoading={isSaving}
          >
            保存设置
          </Button>
        </div>
      </div>
    </div>
  )
}
