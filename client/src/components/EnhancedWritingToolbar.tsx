import { useState } from 'react'
import { Sparkles, Palette, MessageSquare, Zap, BookOpen, Check, X, Copy, RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Card } from './ui/Card'
import { Textarea } from './ui/Textarea'
import { Select } from './ui/Select'
import { enhancedWritingApi } from '../api/enhanced-writing'

type ToolType = 'showDontTell' | 'enhanceDescription' | 'rewrite' | 'brainstorm' | 'dialogue' | null

interface EnhancedWritingToolbarProps {
  selectedText: string
  onInsertText: (text: string) => void
}

export function EnhancedWritingToolbar({ selectedText, onInsertText }: EnhancedWritingToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)

  // 工具配置
  const tools = [
    {
      id: 'showDontTell' as ToolType,
      icon: <BookOpen className="w-4 h-4" />,
      label: "Show, Don't Tell",
      description: '把叙述变成生动的描写',
      hasSelection: true
    },
    {
      id: 'enhanceDescription' as ToolType,
      icon: <Palette className="w-4 h-4" />,
      label: '描写增强',
      description: '扩展和润色描写',
      hasSelection: true
    },
    {
      id: 'rewrite' as ToolType,
      icon: <RotateCcw className="w-4 h-4" />,
      label: '风格重写',
      description: '用不同风格重写',
      hasSelection: true
    },
    {
      id: 'brainstorm' as ToolType,
      icon: <Zap className="w-4 h-4" />,
      label: '头脑风暴',
      description: '激发创意灵感',
      hasSelection: false
    },
    {
      id: 'dialogue' as ToolType,
      icon: <MessageSquare className="w-4 h-4" />,
      label: '对话生成',
      description: '生成符合人物的对话',
      hasSelection: true
    },
  ]

  const handleToolClick = (tool: ToolType) => {
    if (tool && tools.find(t => t.id === tool)?.hasSelection && !selectedText) {
      alert('请先选择一段文字')
      return
    }
    setActiveTool(tool)
  }

  const handleShowDontTell = async () => {
    if (!selectedText) return
    setIsLoading(true)
    try {
      const result = await enhancedWritingApi.showDontTell(selectedText, { provider: 'mimo' })
      setResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('Show, Don\'t Tell 失败:', error)
      alert('处理失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhanceDescription = async (focus: string, detailLevel: string) => {
    if (!selectedText) return
    setIsLoading(true)
    try {
      const result = await enhancedWritingApi.enhanceDescription(selectedText, {
        provider: 'mimo',
        focus: focus as any,
        detailLevel: detailLevel as any,
      })
      setResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('描写增强失败:', error)
      alert('处理失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRewrite = async (style: string) => {
    if (!selectedText) return
    setIsLoading(true)
    try {
      const result = await enhancedWritingApi.rewrite(selectedText, {
        provider: 'mimo',
        style: style as any,
      })
      setResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('重写失败:', error)
      alert('处理失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBrainstorm = async (prompt: string, type: string, count: number) => {
    setIsLoading(true)
    try {
      const result = await enhancedWritingApi.brainstorm(prompt, {
        provider: 'mimo',
        type: type as any,
        count,
      })
      setResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('头脑风暴失败:', error)
      alert('处理失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogue = async (context: string, characterNames: string) => {
    setIsLoading(true)
    try {
      const result = await enhancedWritingApi.generateDialogue(
        context || selectedText,
        characterNames.split(',').map(n => n.trim()).filter(n => n),
        { provider: 'mimo' }
      )
      setResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('对话生成失败:', error)
      alert('处理失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyResult = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleUseResult = (text: string) => {
    onInsertText(text)
    setShowResult(false)
    setActiveTool(null)
  }

  return (
    <div className="relative">
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
          <Sparkles className="w-4 h-4" />
          <span>增强写作</span>
        </div>
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => handleToolClick(tool.id)}
            disabled={isLoading}
            className={activeTool === tool.id ? 'bg-blue-100 text-blue-700' : ''}
            title={tool.description}
          >
            {tool.icon}
            <span className="ml-1 hidden sm:inline">{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* Show, Don't Tell 工具面板 */}
      {activeTool === 'showDontTell' && (
        <ShowDontTellPanel
          selectedText={selectedText}
          onProcess={handleShowDontTell}
          onClose={() => setActiveTool(null)}
          isLoading={isLoading}
        />
      )}

      {/* 描写增强工具面板 */}
      {activeTool === 'enhanceDescription' && (
        <EnhanceDescriptionPanel
          selectedText={selectedText}
          onProcess={handleEnhanceDescription}
          onClose={() => setActiveTool(null)}
          isLoading={isLoading}
        />
      )}

      {/* 风格重写工具面板 */}
      {activeTool === 'rewrite' && (
        <RewritePanel
          selectedText={selectedText}
          onProcess={handleRewrite}
          onClose={() => setActiveTool(null)}
          isLoading={isLoading}
        />
      )}

      {/* 头脑风暴工具面板 */}
      {activeTool === 'brainstorm' && (
        <BrainstormPanel
          selectedText={selectedText}
          onProcess={handleBrainstorm}
          onClose={() => setActiveTool(null)}
          isLoading={isLoading}
        />
      )}

      {/* 对话生成工具面板 */}
      {activeTool === 'dialogue' && (
        <DialoguePanel
          selectedText={selectedText}
          onProcess={handleDialogue}
          onClose={() => setActiveTool(null)}
          isLoading={isLoading}
        />
      )}

      {/* 结果展示弹窗 */}
      <ResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        result={result}
        onCopy={handleCopyResult}
        onUse={handleUseResult}
      />
    </div>
  )
}

// ==================== 子组件 ====================

function ShowDontTellPanel({ selectedText, onProcess, onClose, isLoading }: {
  selectedText: string
  onProcess: () => void
  onClose: () => void
  isLoading: boolean
}) {
  return (
    <Card className="mt-2 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Show, Don't Tell（展示而非告知）</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        将叙述性文字（"他很生气"）转换为生动的描写（"他的拳头攥得咯咯作响"）
      </p>
      {selectedText && (
        <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
          <p className="text-gray-500 mb-1">选中的文字：</p>
          <p>{selectedText}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={onProcess} disabled={isLoading || !selectedText}>
          {isLoading ? '处理中...' : '转换'}
        </Button>
      </div>
    </Card>
  )
}

function EnhanceDescriptionPanel({ selectedText, onProcess, onClose, isLoading }: {
  selectedText: string
  onProcess: (focus: string, detailLevel: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [focus, setFocus] = useState('sensory')
  const [detailLevel, setDetailLevel] = useState('medium')

  return (
    <Card className="mt-2 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">描写增强</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium block mb-1">描写重点</label>
          <Select value={focus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFocus(e.target.value)}>
            <option value="visual">视觉</option>
            <option value="sensory">五感（默认）</option>
            <option value="emotional">情感</option>
            <option value="atmosphere">氛围</option>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">详略程度</label>
          <Select value={detailLevel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDetailLevel(e.target.value)}>
            <option value="light">简洁</option>
            <option value="medium">适中（默认）</option>
            <option value="rich">详细</option>
          </Select>
        </div>
      </div>
      {selectedText && (
        <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
          <p className="text-gray-500 mb-1">选中的文字：</p>
          <p>{selectedText}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={() => onProcess(focus, detailLevel)} disabled={isLoading || !selectedText}>
          {isLoading ? '处理中...' : '增强描写'}
        </Button>
      </div>
    </Card>
  )
}

function RewritePanel({ selectedText, onProcess, onClose, isLoading }: {
  selectedText: string
  onProcess: (style: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [style, setStyle] = useState('vivid')

  const styles = [
    { value: 'vivid', label: '生动形象' },
    { value: 'literary', label: '文学性强' },
    { value: 'concise', label: '简洁有力' },
    { value: 'dramatic', label: '戏剧性强' },
    { value: 'poetic', label: '诗意化' },
  ]

  return (
    <Card className="mt-2 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">风格重写</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium block mb-2">选择风格</label>
        <div className="grid grid-cols-3 gap-2">
          {styles.map((s) => (
            <Button
              key={s.value}
              variant={style === s.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStyle(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
      {selectedText && (
        <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
          <p className="text-gray-500 mb-1">选中的文字：</p>
          <p>{selectedText}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={() => onProcess(style)} disabled={isLoading || !selectedText}>
          {isLoading ? '处理中...' : '重写'}
        </Button>
      </div>
    </Card>
  )
}

function BrainstormPanel({ selectedText, onProcess, onClose, isLoading }: {
  selectedText: string
  onProcess: (prompt: string, type: string, count: number) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [prompt, setPrompt] = useState(selectedText || '')
  const [type, setType] = useState('plot')
  const [count, setCount] = useState(5)

  const types = [
    { value: 'plot', label: '情节' },
    { value: 'character', label: '人物' },
    { value: 'dialogue', label: '对话' },
    { value: 'worldbuilding', label: '世界观' },
    { value: 'conflict', label: '冲突' },
  ]

  return (
    <Card className="mt-2 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">头脑风暴</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="mb-3">
        <label className="text-sm font-medium block mb-1"> brainstorm 主题</label>
        <Textarea
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
          placeholder="输入你想 brainstorm 的主题或想法..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium block mb-1">类型</label>
          <Select value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}>
            {types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">创意数量</label>
          <Select value={count.toString()} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCount(parseInt(e.target.value))}>
            <option value="3">3个</option>
            <option value="5">5个</option>
            <option value="8">8个</option>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onProcess(prompt, type, count)} disabled={isLoading || !prompt}>
          {isLoading ? '生成中...' : '开始 brainstorm'}
        </Button>
      </div>
    </Card>
  )
}

function DialoguePanel({ selectedText, onProcess, onClose, isLoading }: {
  selectedText: string
  onProcess: (context: string, characterNames: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [context, setContext] = useState(selectedText || '')
  const [characterNames, setCharacterNames] = useState('')

  return (
    <Card className="mt-2 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">对话生成</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="mb-3">
        <label className="text-sm font-medium block mb-1">上下文/场景描述</label>
        <Textarea
          value={context}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
          placeholder="描述对话发生的场景、人物状态等..."
          rows={3}
        />
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">参与对话的人物（逗号分隔）</label>
        <input
          type="text"
          value={characterNames}
          onChange={(e) => setCharacterNames(e.target.value)}
          placeholder="例如：张三, 李四"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onProcess(context, characterNames)} disabled={isLoading || !context || !characterNames}>
          {isLoading ? '生成中...' : '生成对话'}
        </Button>
      </div>
    </Card>
  )
}

function ResultModal({ isOpen, onClose, result, onCopy, onUse }: {
  isOpen: boolean
  onClose: () => void
  result: any
  onCopy: (text: string) => void
  onUse: (text: string) => void
}) {
  if (!isOpen || !result) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="结果" size="xl">
      <div className="space-y-4">
        {/* Show, Don't Tell 结果 */}
        {'rewritten' in result && (
          <div>
            <h4 className="font-medium mb-2">原文</h4>
            <p className="p-3 bg-gray-50 rounded text-sm mb-3">{result.original}</p>
            <h4 className="font-medium mb-2">改写后</h4>
            <p className="p-3 bg-blue-50 rounded text-sm mb-3">{result.rewritten}</p>
            {result.explanation && (
              <div>
                <h4 className="font-medium mb-2">说明</h4>
                <p className="text-sm text-gray-600">{result.explanation}</p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={() => onCopy(result.rewritten)}>
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
              <Button onClick={() => onUse(result.rewritten)}>
                <Check className="w-4 h-4 mr-1" />
                应用
              </Button>
            </div>
          </div>
        )}

        {/* 描写增强结果 */}
        {'enhanced' in result && (
          <div>
            <h4 className="font-medium mb-2">原文</h4>
            <p className="p-3 bg-gray-50 rounded text-sm mb-3">{result.original}</p>
            <h4 className="font-medium mb-2">增强后</h4>
            <p className="p-3 bg-blue-50 rounded text-sm mb-3">{result.enhanced}</p>
            {result.suggestions?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">改进建议</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {result.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={() => onCopy(result.enhanced)}>
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
              <Button onClick={() => onUse(result.enhanced)}>
                <Check className="w-4 h-4 mr-1" />
                应用
              </Button>
            </div>
          </div>
        )}

        {/* 重写结果 */}
        {'versions' in result && (
          <div>
            <h4 className="font-medium mb-2">原文</h4>
            <p className="p-3 bg-gray-50 rounded text-sm mb-3">{result.original}</p>
            <h4 className="font-medium mb-2">改写版本</h4>
            {result.versions?.map((v: any, i: number) => (
              <div key={i} className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">版本 {i + 1} ({v.style})</p>
                <p className="p-3 bg-blue-50 rounded text-sm">{v.content}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => onCopy(v.content)}>
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </Button>
                  <Button size="sm" onClick={() => onUse(v.content)}>
                    <Check className="w-3 h-3 mr-1" />
                    应用
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 头脑风暴结果 */}
        {'ideas' in result && (
          <div>
            <h4 className="font-medium mb-3">创意想法</h4>
            <div className="space-y-3">
              {result.ideas?.map((idea: any, i: number) => (
                <Card key={i} className="p-4">
                  <h5 className="font-medium mb-2">{idea.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{idea.description}</p>
                  {idea.potential && (
                    <p className="text-sm text-blue-600">潜力：{idea.potential}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 对话生成结果 */}
        {'dialogue' in result && (
          <div>
            <h4 className="font-medium mb-2">生成的对话</h4>
            <div className="p-3 bg-blue-50 rounded whitespace-pre-wrap text-sm mb-3">
              {result.dialogue}
            </div>
            {result.suggestions?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">建议</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {result.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={() => onCopy(result.dialogue)}>
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
              <Button onClick={() => onUse(result.dialogue)}>
                <Check className="w-4 h-4 mr-1" />
                应用
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
