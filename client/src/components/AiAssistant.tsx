import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Send, Bot, User, Loader2, Plus, Users, MapPin, Search, FileText, Sparkles, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AssistantAction, ChapterModificationData } from '@/api/ai-assistant'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '@/api/api-keys'
import { chaptersApi } from '@/api/chapters'
import { worldSettingsApi } from '@/api/world-settings'
import { charactersApi } from '@/api/characters'
import { ChangeConfirmationModal } from './ChangeConfirmationModal'
import { ContentChange, ModificationConfig, DEFAULT_MODIFICATION_CONFIG } from '@/types/ai-changes'
import { useChatStream } from '@/hooks/useChatStream'
import { AxiosError } from 'axios'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  actions?: AssistantAction[]
  timestamp: Date
}

interface ApiErrorResponse {
  message?: string | string[]
  error?: string
}

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    if (Array.isArray(data?.message)) {
      return data.message.join('；')
    }
    if (data?.message) {
      return data.message
    }
    if (data?.error) {
      return data.error
    }
  }

  return '抱歉，处理你的请求时出现了错误，请稍后再试。'
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'mimo', label: 'MiMo' },
  { value: 'claude', label: 'Claude' },
]

interface AiAssistantProps {
  chapterId?: string
  chapterContent?: string
  chapterTitle?: string
  onApplyChanges?: (changes: ContentChange[]) => void
}

export const AiAssistant = ({
  chapterId,
  chapterContent,
  chapterTitle,
  onApplyChanges,
}: AiAssistantProps = {}) => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearchingProject, setIsSearchingProject] = useState(false)
  const [provider, setProvider] = useState('')
  const [streamingThinking, setStreamingThinking] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [pendingModification, setPendingModification] = useState<ChapterModificationData | null>(null)
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [modificationConfig] = useState<ModificationConfig>(() => {
    const saved = localStorage.getItem('modificationConfig')
    return saved ? JSON.parse(saved) : DEFAULT_MODIFICATION_CONFIG
  })

  const { startStream } = useChatStream({
    onThinking: (content) => {
      setStreamingThinking(content)
      setStreamingContent('')
    },
    onContent: (content) => {
      setStreamingThinking('')
      setStreamingContent(content)
    },
    onDone: (actions) => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: streamingContent,
        actions,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setStreamingThinking('')
      setStreamingContent('')
      setIsLoading(false)

      const modifyAction = actions.find(a => a.type === 'modify_chapter')
      if (modifyAction && modifyAction.data) {
        const modificationData = modifyAction.data as ChapterModificationData
        if (modificationConfig.requireConfirmation && modificationData.changes.length > 0) {
          setPendingModification(modificationData)
          setShowChangeModal(true)
        } else if (onApplyChanges && modificationData.changes.length > 0) {
          onApplyChanges(modificationData.changes)
        }
      }

      if (actions.some(a => a.type === 'create_character')) {
        queryClient.invalidateQueries({ queryKey: ['characters', projectId] })
      }
      if (actions.some(a => a.type === 'create_world_setting')) {
        queryClient.invalidateQueries({ queryKey: ['worldSettings', projectId] })
      }
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getApiErrorMessage(error),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingThinking('')
      setStreamingContent('')
      setIsLoading(false)
    },
  })

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.getAll(),
  })

  useEffect(() => {
    if (apiKeys && apiKeys.length > 0 && !provider) {
      const deepseekKey = apiKeys.find((k: any) => k.provider === 'deepseek' && k.isActive)
      const openaiKey = apiKeys.find((k: any) => k.provider === 'openai' && k.isActive)
      const firstKey = deepseekKey || openaiKey || apiKeys[0]
      if (firstKey) {
        setProvider(firstKey.provider)
      }
    }
  }, [apiKeys, provider])

  useEffect(() => {
    if (messages.length === 0) {
      const hasApiKey = apiKeys && apiKeys.length > 0
      let welcomeMessage = hasApiKey
        ? `你好！我是你的 AI 创作助手。我可以帮你：

• **创建角色** - 例如"帮我创建一个名叫张三的主角"
• **设置关系** - 例如"张三是李四的师兄"
• **创建世界观设定** - 例如"添加一个魔法体系设定"
• **讨论剧情** - 讨论故事发展、情节建议等`
        : `你好！我是你的 AI 创作助手。

⚠️ **检测到你还没有配置 API Key**

请先前往 [AI 设置页面](/ai-settings) 配置 API Key，然后就可以开始使用 AI 助手了。

配置完成后，我可以帮你：
• 创建角色、关系、世界观设定
• 讨论剧情、提供建议
• 续写章节、生成摘要`

      if (chapterId && chapterContent && hasApiKey) {
        welcomeMessage += `

📄 **当前章节：${chapterTitle || '未命名'}**

我可以帮你：
• **分析章节** - 例如"分析一下这个章节的节奏"
• **修改内容** - 例如"把第一段写得更生动"
• **扩展场景** - 例如"扩展一下对话场景"
• **优化描写** - 例如"优化这段环境描写"`
      }

      if (hasApiKey) {
        welcomeMessage += `

当前使用：**${PROVIDERS.find(p => p.value === provider)?.label || provider}**

有什么我可以帮你的吗？`
      }

      setMessages([{
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }])
    }
  }, [apiKeys, provider, messages.length, chapterId, chapterContent, chapterTitle])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingThinking, streamingContent])

  const handleSend = async () => {
    if (!input.trim() || !projectId || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingThinking('')
    setStreamingContent('')

    try {
      const chapterContext = chapterId && chapterContent
        ? { chapterId, chapterContent, chapterTitle: chapterTitle || '' }
        : undefined

      await startStream({
        projectId,
        message: input,
        provider,
        ...chapterContext,
      })
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getApiErrorMessage(error),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const handleConfirmChanges = (selectedChangeIds: string[]) => {
    if (!pendingModification || !onApplyChanges) return

    const selectedChanges = pendingModification.changes.filter(
      c => selectedChangeIds.includes(c.id)
    )
    onApplyChanges(selectedChanges)
    setPendingModification(null)

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `已应用 ${selectedChanges.length} 项修改。`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleRejectChanges = () => {
    setPendingModification(null)

    const rejectMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '已取消修改。',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, rejectMessage])
  }

  const handleProjectSearch = async () => {
    if (!input.trim() || !projectId || isLoading || isSearchingProject) return

    const query = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsSearchingProject(true)

    try {
      const [chapters, characters, worldSettings] = await Promise.all([
        chaptersApi.getAll(projectId),
        charactersApi.getAll(projectId),
        worldSettingsApi.getAll(projectId),
      ])

      const normalizedQuery = query.toLowerCase()
      const matchedChapters = chapters.filter(chapter => {
        return chapter.title.toLowerCase().includes(normalizedQuery) ||
          chapter.summary?.toLowerCase().includes(normalizedQuery) ||
          query.includes(chapter.title)
      }).slice(0, 3)
      const matchedCharacters = characters.filter(character => {
        return character.name.toLowerCase().includes(normalizedQuery) ||
          character.role?.toLowerCase().includes(normalizedQuery) ||
          character.background?.toLowerCase().includes(normalizedQuery) ||
          character.personality?.toLowerCase().includes(normalizedQuery) ||
          character.notes?.toLowerCase().includes(normalizedQuery) ||
          query.includes(character.name)
      }).slice(0, 3)
      const matchedWorldSettings = worldSettings.filter(setting => {
        return setting.name.toLowerCase().includes(normalizedQuery) ||
          setting.category.toLowerCase().includes(normalizedQuery) ||
          setting.description?.toLowerCase().includes(normalizedQuery) ||
          setting.items?.some(item =>
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.description?.toLowerCase().includes(normalizedQuery)
          ) ||
          query.includes(setting.name)
      }).slice(0, 3)

      const lines = [
        `我找到了 ${matchedChapters.length + matchedCharacters.length + matchedWorldSettings.length} 个相关位置：`,
        ...matchedChapters.map(chapter => `• 章节：《${chapter.title}》`),
        ...matchedCharacters.map(character => `• 角色：${character.name}${character.role ? `（${character.role}）` : ''}`),
        ...matchedWorldSettings.map(setting => `• 世界观：${setting.name}${setting.category ? `（${setting.category}）` : ''}`),
      ]

      const content = matchedChapters.length + matchedCharacters.length + matchedWorldSettings.length > 0
        ? lines.join('\n')
        : '没有找到明确匹配。你可以换个角色名、章节名或设定关键词再试。'

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      if (matchedChapters[0]) {
        navigate(`/projects/${projectId}/chapters/${matchedChapters[0].id}`)
      } else if (matchedCharacters.length > 0) {
        navigate(`/projects/${projectId}/characters`)
      } else if (matchedWorldSettings.length > 0) {
        navigate(`/projects/${projectId}/world`)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '项目查找失败，请稍后再试。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSearchingProject(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_character':
        return <Users className="w-4 h-4" />
      case 'create_relationship':
        return <Users className="w-4 h-4" />
      case 'create_world_setting':
        return <MapPin className="w-4 h-4" />
      case 'modify_chapter':
        return <FileText className="w-4 h-4" />
      default:
        return <Plus className="w-4 h-4" />
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            AI 创作助手
            {chapterId && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                章节模式
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.actions.map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm bg-white/10 rounded p-2"
                        >
                          {getActionIcon(action.type)}
                          <span>
                            {action.type === 'create_character' && '角色已创建'}
                            {action.type === 'create_relationship' && '关系已创建'}
                            {action.type === 'create_world_setting' && '世界观设定已创建'}
                            {action.type === 'modify_chapter' && '章节修改建议'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {(streamingThinking || streamingContent) && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  {streamingThinking && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span>{streamingThinking}</span>
                    </div>
                  )}
                  {streamingContent && (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingContent}
                      </ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {!streamingThinking && !streamingContent && isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">正在连接...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('找一下当前项目最需要处理的章节')}
                disabled={isLoading || isSearchingProject}
              >
                <Search className="w-3 h-3 mr-1" />
                项目查找
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('跳到最近更新的章节')}
                disabled={isLoading || isSearchingProject}
              >
                <FileText className="w-3 h-3 mr-1" />
                找章节
              </Button>
              {chapterId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput('分析一下当前章节')}
                    disabled={isLoading || !provider}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    分析章节
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput('帮我优化这段描写')}
                    disabled={isLoading || !provider || !chapterContent}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    优化描写
                  </Button>
                </>
              )}
              {!chapterId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput('帮我创建一个主角')}
                    disabled={isLoading || isSearchingProject || !provider}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    创建主角
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput('帮我创建一个反派角色')}
                    disabled={isLoading || isSearchingProject || !provider}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    创建反派
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput('帮我创建一个世界观设定')}
                    disabled={isLoading || isSearchingProject || !provider}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    创建设定
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput('帮我构思一下接下来的剧情')}
                    disabled={isLoading || isSearchingProject || !provider}
                  >
                    <Bot className="w-3 h-3 mr-1" />
                    剧情建议
                  </Button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  chapterId
                    ? provider
                      ? "输入消息... 例如：帮我优化这段描写"
                      : "请先配置 API Key"
                    : provider
                      ? "输入消息... 例如：帮我创建一个名叫张三的主角"
                      : "请先配置 API Key"
                }
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={2}
                disabled={isLoading || !provider}
              />
              {!chapterId && (
                <Button
                  variant="outline"
                  onClick={handleProjectSearch}
                  disabled={!input.trim() || isLoading || isSearchingProject}
                  className="self-end"
                >
                  {isSearchingProject ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isSearchingProject || !provider}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </div>
      </CardContent>

      {pendingModification && (
        <ChangeConfirmationModal
          isOpen={showChangeModal}
          onClose={() => {
            setShowChangeModal(false)
            setPendingModification(null)
          }}
          changes={pendingModification.changes}
          onConfirm={handleConfirmChanges}
          onReject={handleRejectChanges}
          title="AI 建议的修改"
        />
      )}
    </Card>
  )
}
