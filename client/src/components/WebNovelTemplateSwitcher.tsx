import { useMemo } from 'react'
import { BookOpen, Layers3 } from 'lucide-react'
import { Select } from './ui/Select'
import { Card } from './ui/Card'
import { getWebNovelTemplate, getWebNovelTemplates, type WebNovelTemplate } from '@/types/web-novel-templates'

interface WebNovelTemplateSwitcherProps {
  projectTemplateId: string | null
  chapterTemplateId: string | null
  onProjectTemplateChange: (templateId: string | null) => void
  onChapterTemplateChange: (templateId: string | null) => void
}

function renderPreview(template?: WebNovelTemplate) {
  if (!template) return '未启用模板，Story System 将只使用项目上下文和写作风格。'
  return `${template.description} · ${template.chapterGoals[0] || '保持节奏和章节钩子'}`
}

export function WebNovelTemplateSwitcher({
  projectTemplateId,
  chapterTemplateId,
  onProjectTemplateChange,
  onChapterTemplateChange,
}: WebNovelTemplateSwitcherProps) {
  const templates = useMemo(() => getWebNovelTemplates(), [])
  const activeTemplate = getWebNovelTemplate(chapterTemplateId || projectTemplateId || '')

  return (
    <Card className="border border-gray-200 bg-white p-3 rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            网文模板
            {chapterTemplateId && (
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">章节覆盖</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {renderPreview(activeTemplate)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
          <Layers3 className="w-3.5 h-3.5" />
          {activeTemplate ? activeTemplate.name : '未选择'}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="项目默认"
          value={projectTemplateId || ''}
          onChange={(event) => onProjectTemplateChange(event.target.value || null)}
        >
          <option value="">不启用</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </Select>
        <Select
          label="当前章节覆盖"
          value={chapterTemplateId || ''}
          onChange={(event) => onChapterTemplateChange(event.target.value || null)}
        >
          <option value="">沿用项目默认</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </Select>
      </div>

      {activeTemplate && (
        <div className="mt-3 grid gap-1 text-xs text-gray-600">
          <div>开场钩子：{activeTemplate.hooks.slice(0, 3).join('、')}</div>
          <div>节奏要求：{activeTemplate.pacingRules[0]}</div>
          <div>提示词注入：{activeTemplate.promptBlocks.chapter}</div>
        </div>
      )}
    </Card>
  )
}
