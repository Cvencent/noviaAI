import { useState } from 'react'
import { WritingStylePreset, WRITING_STYLE_PRESETS } from '../types/writing-styles'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { Sparkles, Eye, RefreshCw } from 'lucide-react'

interface StylePreviewProps {
  onRewriteRequest?: (text: string, style: WritingStylePreset) => void
  rewrittenTexts?: { [styleId: string]: string }
}

export function StylePreview({ 
  onRewriteRequest, 
  rewrittenTexts = {},
}: StylePreviewProps) {
  const [inputText, setInputText] = useState('')
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([])
  const [currentPreviewId, setCurrentPreviewId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleStyleToggle = (styleId: string) => {
    setSelectedStyleIds(prev => 
      prev.includes(styleId) 
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    )
  }

  const handleGeneratePreviews = async () => {
    if (!inputText.trim() || selectedStyleIds.length === 0) return

    setIsGenerating(true)
    if (onRewriteRequest) {
      selectedStyleIds.forEach(styleId => {
        const style = WRITING_STYLE_PRESETS.find(s => s.id === styleId)
        if (style) {
          onRewriteRequest(inputText, style)
        }
      })
    }
    setIsGenerating(false)
  }

  const currentPreviewStyle = currentPreviewId 
    ? WRITING_STYLE_PRESETS.find(s => s.id === currentPreviewId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Eye className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-bold">实时风格预览</h3>
          <p className="text-sm text-gray-600">输入文字，即时预览不同风格的重写效果</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入要重写的文本
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入一段文字，我将用不同的写作风格重写它..."
            rows={4}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择要预览的风格（可多选）
          </label>
          <div className="flex flex-wrap gap-2">
            {WRITING_STYLE_PRESETS.slice(0, 10).map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleToggle(style.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedStyleIds.includes(style.id)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {style.icon} {style.name}
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleGeneratePreviews}
          disabled={!inputText.trim() || selectedStyleIds.length === 0 || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              生成预览
            </>
          )}
        </Button>
      </div>

      {selectedStyleIds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-800">快速切换查看</h4>
            <span className="text-xs text-gray-500">
              ({selectedStyleIds.length} 个风格)
            </span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {selectedStyleIds.map((styleId) => {
              const style = WRITING_STYLE_PRESETS.find(s => s.id === styleId)
              if (!style) return null
              
              const rewritten = rewrittenTexts[styleId]
              const isActive = currentPreviewId === styleId
              
              return (
                <button
                  key={styleId}
                  onClick={() => setCurrentPreviewId(styleId)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  } ${rewritten ? '' : 'opacity-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{style.icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-sm">{style.name}</div>
                      {rewritten && (
                        <div className="text-xs text-gray-500">
                          {rewritten.length} 字
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {currentPreviewStyle && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentPreviewStyle.icon}</span>
                <div>
                  <h4 className="font-bold text-lg">{currentPreviewStyle.name}</h4>
                  <p className="text-sm text-gray-600">{currentPreviewStyle.description}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">原文</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                    {inputText}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">重写结果</div>
                  {rewrittenTexts[currentPreviewId || ''] ? (
                    <div className="text-sm text-gray-700 bg-blue-50 rounded p-3 whitespace-pre-wrap">
                      {rewrittenTexts[currentPreviewId || '']}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">
                      暂无重写结果，请点击"生成预览"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  应用此风格
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  复制文本
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {Object.keys(rewrittenTexts).length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-800 mb-3">所有重写结果对比</h4>
          <div className="space-y-3">
            {Object.entries(rewrittenTexts).map(([styleId, text]) => {
              const style = WRITING_STYLE_PRESETS.find(s => s.id === styleId)
              if (!style) return null
              
              return (
                <div
                  key={styleId}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{style.icon}</span>
                    <span className="font-medium">{style.name}</span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {text}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
