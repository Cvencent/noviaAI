import { ChevronDown, ChevronRight, Eye, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { ContextPreview, ContextPreviewSection } from '@/types/ai-context'
import { Button } from './ui/Button'

interface ContextViewerProps {
  preview: ContextPreview | null
  isLoading?: boolean
  onRefresh?: () => void
}

const priorityLabels: Record<ContextPreviewSection['priority'], string> = {
  critical: '关键',
  high: '高',
  medium: '中',
  low: '低',
}

const priorityClassNames: Record<ContextPreviewSection['priority'], string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-700',
}

export function ContextViewer({ preview, isLoading, onRefresh }: ContextViewerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }))
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-gray-900">当前 AI 视野</h3>
            <p className="text-xs text-gray-500">展示本次生成可能读取的上下文</p>
          </div>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} aria-label="刷新 AI 上下文预览">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {!preview && !isLoading && (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          暂无上下文预览。点击刷新后查看 AI 会读取的设定、角色、剧情和风格信息。
        </div>
      )}

      {isLoading && !preview && (
        <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">
          正在加载上下文预览...
        </div>
      )}

      {preview && (
        <>
          <div className="text-xs text-gray-500">
            预估上下文：{preview.totalTokenEstimate.toLocaleString()} tokens
          </div>

          {preview.warnings.length > 0 && (
            <div className="bg-yellow-50 text-yellow-800 text-sm rounded-lg p-3 space-y-1">
              {preview.warnings.map((warning) => (
                <div key={warning}>• {warning}</div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {preview.sections.map((section) => {
              const isOpen = openSections[section.id] ?? true
              const Icon = isOpen ? ChevronDown : ChevronRight

              return (
                <div key={section.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-900">{section.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityClassNames[section.priority]}`}>
                        {priorityLabels[section.priority]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{section.tokenEstimate} tokens</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 py-2 space-y-2">
                      <div className="text-xs text-gray-400">来源：{section.source}</div>
                      {section.items.length > 0 ? (
                        <ul className="space-y-1 text-sm text-gray-700">
                          {section.items.map((item, index) => (
                            <li key={`${section.id}-${item}-${index}`} className="leading-relaxed">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-400">暂无命中的上下文</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
