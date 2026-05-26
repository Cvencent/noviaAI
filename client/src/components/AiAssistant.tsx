import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, Loader2, Users, MapPin, FileText, Sparkles, Brain, CheckCircle2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AssistantAction, ChapterModificationData } from '@/api/ai-assistant'
import { API_BASE_URL } from '@/api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '@/api/api-keys'
import { aiConfigApi } from '@/api/ai-config'
import { conversationsApi } from '@/api/conversations'
import { outlinesApi } from '@/api/outlines'
import { aiActionsApi } from '@/api/ai-actions'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/auth'
import type { ChoiceCard, Conversation } from '@/types/conversation'
import type { ContentChange } from '@/types/ai-changes'

interface Message {
  id: string
  conversationId?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: AssistantAction[]
  modificationData?: ChapterModificationData
  cards?: ChoiceCard[]
}

const parseStoredCards = (cardsJson: unknown): ChoiceCard[] | undefined => {
  if (!cardsJson) return undefined
  if (Array.isArray(cardsJson)) return cardsJson as ChoiceCard[]
  if (typeof cardsJson !== 'string') return undefined
  try {
    const parsed = JSON.parse(cardsJson)
    return Array.isArray(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

const toLocalMessage = (message: NonNullable<Conversation['messages']>[number]): Message => ({
  id: message.id,
  conversationId: message.conversationId,
  role: message.role === 'assistant' ? 'assistant' : 'user',
  content: message.content,
  timestamp: new Date(message.timestamp),
  cards: parseStoredCards(message.cardsJson),
})

const getSelectedCardIds = (messages: Message[]) =>
  new Set(
    messages
      .flatMap(message => message.cards || [])
      .filter(card => Boolean(card.selectedAt))
      .map(card => card.id),
  )

const buildConversationHistory = (messages: Message[]) =>
  messages
    .filter(message => message.id !== 'welcome' && message.content.trim())
    .slice(-8)
    .map(message => ({
      role: message.role,
      content: message.content.length > 2000 ? `${message.content.slice(0, 2000)}...` : message.content,
    }))

const stripMarkdown = (text: string) =>
  text.replace(/^[#>*\-\s]+/, '').replace(/\*\*/g, '').trim()

const createOutlineCard = (request: string, response: string): ChoiceCard | null => {
  if (!/大纲|故事结构|剧情结构|章节规划/.test(request)) return null

  const lines = response.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const titleLine = lines.find(line => /《.+》/.test(line)) || lines[0] || 'AI 生成大纲'
  const titleMatch = titleLine.match(/《([^》]+)》/)
  const title = titleMatch?.[1] ? `《${titleMatch[1]}》故事大纲` : stripMarkdown(titleLine).slice(0, 40)

  const headingPattern = /^(#{1,6}\s*)?(第[一二三四五六七八九十百\d]+[部分幕章节][：:\s].+|[一二三四五六七八九十百\d]+[、.]\s*.+)$/
  const headingIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => headingPattern.test(stripMarkdown(line)))

  const items = headingIndexes.map(({ line, index }, itemIndex) => {
    const nextIndex = headingIndexes[itemIndex + 1]?.index ?? lines.length
    const summary = lines
      .slice(index + 1, nextIndex)
      .filter(item => !/^核心主题|主题|结局分支/.test(stripMarkdown(item)))
      .join('\n')
      .slice(0, 800)

    return {
      title: stripMarkdown(line).replace(/[：:]$/, ''),
      summary,
      order: itemIndex,
    }
  }).filter(item => item.title.length > 0)

  if (items.length === 0) return null

  return {
    id: `outline-${Date.now()}`,
    title: '加入系统大纲',
    description: `创建「${title}」，并导入 ${items.length} 个大纲条目到大纲页面。`,
    actionType: 'CREATE_OUTLINE',
    content: {
      outline: {
        title,
        description: response.slice(0, 1200),
        structureType: 'FULL_BOOK',
        status: 'DRAFT',
      },
      items,
    },
  }
}

const createPromptCard = (id: string, title: string, description: string, prompt: string): ChoiceCard => ({
  id,
  title,
  description,
  actionType: 'SUGGEST_PROMPT',
  content: { prompt },
})

const getActionTargetQueryKey = (actionType: string) => {
  switch (actionType) {
    case 'CREATE_CHARACTER':
    case 'UPDATE_CHARACTER':
    case 'DELETE_CHARACTER':
    case 'ADD_RELATIONSHIP':
      return 'characters'
    case 'CREATE_WORLD_SETTING':
    case 'UPDATE_WORLD_SETTING':
    case 'DELETE_WORLD_SETTING':
      return 'worldSettings'
    case 'CREATE_CHAPTER':
    case 'UPDATE_CHAPTER':
    case 'DELETE_CHAPTER':
      return 'chapters'
    case 'CREATE_PLOT':
      return 'plots'
    case 'CREATE_OUTLINE':
      return 'outlines'
    case 'CREATE_SCENE':
      return 'scenes'
    case 'CREATE_TIMELINE_EVENT':
      return 'timeline'
    case 'CREATE_TURNING_POINT':
      return 'turning-points'
    case 'CREATE_CHEKHOVS_GUN':
      return 'chekhovs-guns'
    default:
      return undefined
  }
}

const createNextStepCards = (request: string, response: string, hasChapterContext: boolean): ChoiceCard[] => {
  if (!response.trim()) return []

  const lowerRequest = request.toLowerCase()
  const baseId = Date.now()

  if (/大纲|故事结构|剧情结构|章节规划/.test(request)) {
    return [
      createPromptCard(
        `next-${baseId}-characters`,
        '下一步：扩展主要角色',
        '把大纲里的核心人物拆成角色设定，方便进入角色管理。',
        '基于刚才的大纲，帮我生成主要角色设定，包括目标、弱点、人物弧光和彼此关系。',
      ),
      createPromptCard(
        `next-${baseId}-chapters`,
        '下一步：拆成章节',
        '把整体大纲拆成可执行的章节清单。',
        '把刚才的大纲拆成 12 个章节，每章给出标题、剧情目标、冲突和结尾钩子。',
      ),
      createPromptCard(
        `next-${baseId}-world`,
        '下一步：补世界观',
        '补齐故事发生的规则、势力和关键设定。',
        '基于刚才的大纲，帮我整理世界观设定，包括时代背景、核心规则、主要势力和隐藏真相。',
      ),
    ]
  }

  if (/角色|人物|主角|配角|反派/.test(request)) {
    return [
      createPromptCard(
        `next-${baseId}-arc`,
        '下一步：人物弧光',
        '继续细化角色在故事里的变化路径。',
        '继续帮我设计这个角色的人物弧光：起点、误区、关键选择、崩溃点和最终变化。',
      ),
      createPromptCard(
        `next-${baseId}-relation`,
        '下一步：关系网络',
        '把人物关系变成可放入关系网络的设定。',
        '围绕这个角色，帮我生成 5 条关键人物关系，每条说明关系类型、矛盾和剧情作用。',
      ),
      createPromptCard(
        `next-${baseId}-scene`,
        '下一步：出场场景',
        '为角色安排一个能立住人物的首次登场。',
        '帮我写一个这个角色的首次登场场景，重点表现性格、欲望和隐藏问题。',
      ),
    ]
  }

  if (/世界观|设定|势力|规则|地图/.test(request)) {
    return [
      createPromptCard(
        `next-${baseId}-conflict`,
        '下一步：设定冲突',
        '把静态设定转成能推动剧情的矛盾。',
        '基于刚才的世界观，帮我设计 6 个能推动主线的设定冲突。',
      ),
      createPromptCard(
        `next-${baseId}-factions`,
        '下一步：势力关系',
        '梳理势力目标、资源和互相牵制。',
        '帮我把这个世界观里的主要势力整理成关系表，包括目标、资源、敌友关系和秘密。',
      ),
      createPromptCard(
        `next-${baseId}-rules`,
        '下一步：规则漏洞',
        '找出设定里最适合制造反转的漏洞。',
        '帮我检查刚才的设定，列出可能的规则漏洞、代价和剧情反转用法。',
      ),
    ]
  }

  if (hasChapterContext || /章节|场景|段落|续写|润色/.test(request)) {
    return [
      createPromptCard(
        `next-${baseId}-polish`,
        '下一步：润色语气',
        '继续改善语言节奏和画面感。',
        '基于当前章节内容，帮我润色语言，让节奏更紧、画面更清晰，但不要改变剧情走向。',
      ),
      createPromptCard(
        `next-${baseId}-conflict`,
        '下一步：增强冲突',
        '让这一段更有推进力。',
        '帮我分析当前章节的冲突强度，并给出 3 个增强冲突但不崩人设的改法。',
      ),
      createPromptCard(
        `next-${baseId}-next`,
        '下一步：承接下一章',
        '从当前章节自然推进到后续剧情。',
        '根据当前章节结尾，帮我设计下一章开头的 3 个方案，每个说明悬念和情绪落点。',
      ),
    ]
  }

  if (lowerRequest.includes('summary') || /总结|摘要|梳理/.test(request)) {
    return [
      createPromptCard(
        `next-${baseId}-todo`,
        '下一步：转成任务',
        '把讨论结果变成可执行清单。',
        '把刚才的内容整理成下一步写作任务清单，按优先级排序。',
      ),
      createPromptCard(
        `next-${baseId}-system`,
        '下一步：沉淀资料',
        '判断哪些内容应该放进项目资料页。',
        '从刚才的内容里提取可以沉淀到项目资料的设定，并说明应该放到哪个页面。',
      ),
      createPromptCard(
        `next-${baseId}-risk`,
        '下一步：检查问题',
        '找出逻辑漏洞、重复和薄弱点。',
        '帮我检查刚才内容里可能存在的逻辑漏洞、重复信息和需要补强的地方。',
      ),
    ]
  }

  return [
    createPromptCard(
      `next-${baseId}-detail`,
      '下一步：继续细化',
      '把刚才的方向展开成更具体的创作材料。',
      '沿着刚才的方向继续细化，给我更具体、可直接用于写作的版本。',
    ),
    createPromptCard(
      `next-${baseId}-options`,
      '下一步：给我方案',
      '生成多个方向，方便比较后再决定。',
      '基于刚才的回答，给我 3 个不同处理方案，并说明各自的优缺点。',
    ),
    createPromptCard(
      `next-${baseId}-check`,
      '下一步：检查问题',
      '先找薄弱处，再继续推进。',
      '帮我检查刚才内容中最可能影响故事质量的问题，并给出修改建议。',
    ),
  ]
}

export const AiAssistant: React.FC<{
  projectId: string
  chapterId?: string
  chapterContent?: string
  chapterTitle?: string
  onApplyChanges?: (changes: ContentChange[]) => void
  onOpenAISettings?: () => void
  onOpenRoute?: (path: string) => void
  conversationId?: string
  onConversationCreated?: (conversationId: string) => void
}> = ({ projectId, chapterId, chapterContent, chapterTitle, onApplyChanges, onOpenAISettings, onOpenRoute, conversationId, onConversationCreated }) => {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingThinking, setStreamingThinking] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [pendingModification, setPendingModification] = useState<ChapterModificationData | undefined>(undefined)
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [runningCardId, setRunningCardId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.getAll,
  })

  const { data: aiConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: aiConfigApi.getConfigs,
  })

  const hasActiveApiKey = apiKeys && apiKeys.some(key => key.isActive)
  const hasActiveConfig = aiConfigs && Object.values(aiConfigs).some(config => config?.isActive)
  const hasValidSetup = hasActiveApiKey && hasActiveConfig
  const isDataLoaded = !isLoadingApiKeys && !isLoadingConfigs

  // 生成欢迎消息的函数
  const generateWelcomeMessage = (hasActiveKey: boolean, hasActiveCfg: boolean) => {
    const isValid = hasActiveKey && hasActiveCfg
    let welcomeMessage = isValid
      ? `你好！我是你的 AI 创作助手。我可以帮你：

• **创建角色** - 例如"帮我创建一个名叫张三的主角"
• **设置关系** - 例如"张三是李四的师兄"
• **创建世界观设定** - 例如"添加一个魔法体系设定"
• **讨论剧情** - 讨论故事发展、情节建议等`
      : `你好！我是你的 AI 创作助手。

⚠️ **检测到你还没有配置 API Key 或启用 AI 功能**

请先点击 [AI 设置页面](#ai-settings) 配置 API Key 并启用相关功能，然后就可以开始使用 AI 助手了。

配置完成后，我可以帮你：
• 创建角色、关系、世界观设定
• 讨论剧情、提供建议
• 续写章节、生成摘要`

    if (chapterId && chapterContent && isValid) {
      welcomeMessage += `

📄 **当前章节：${chapterTitle || '未命名'}**

我可以帮你：
• **分析章节** - 例如"分析一下这个章节的节奏"
• **修改内容** - 例如"把第一段写得更生动"
• **扩展场景** - 例如"扩展一下对话场景"
• **优化描写** - 例如"优化这段环境描写"`
    }

    if (isValid) {
      welcomeMessage += `

有什么我可以帮你的吗？`
    }

    return welcomeMessage
  }

  const { data: activeConversation, isFetching: isLoadingConversation } = useQuery({
    queryKey: ['conversation', projectId, conversationId],
    queryFn: () => conversationsApi.getById(projectId, conversationId as string),
    enabled: !!projectId && !!conversationId,
  })

  // 当对话切换时加载已保存消息
  useEffect(() => {
    setPendingModification(undefined)
    setStreamingThinking('')
    setStreamingContent('')

    if (conversationId) {
      if (activeConversation?.messages) {
        const localMessages = activeConversation.messages.map(toLocalMessage)
        setMessages(localMessages)
        setSelectedCardIds(getSelectedCardIds(localMessages))
      } else if (isLoadingConversation) {
        setMessages([])
        setSelectedCardIds(new Set())
      }
      return
    }

    setMessages([])
    setSelectedCardIds(new Set())
  }, [activeConversation, conversationId, projectId])

  // 当没有消息时显示欢迎消息
  useEffect(() => {
    if (!conversationId && messages.length === 0 && isDataLoaded && !isLoadingConversation) {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: generateWelcomeMessage(
          hasActiveApiKey || false,
          hasActiveConfig || false
        ),
        timestamp: new Date(),
      }
      setMessages([welcomeMsg])
    }
  }, [
    messages.length,
    isDataLoaded,
    apiKeys,
    aiConfigs,
    chapterId,
    chapterContent,
    chapterTitle,
    hasActiveApiKey,
    hasActiveConfig,
    isLoadingConversation,
    conversationId,
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const appendAssistantMessage = async (
    content: string,
    targetConversationId?: string,
    options: { persist?: boolean } = {},
  ) => {
    const shouldPersist = options.persist ?? true

    if (shouldPersist && projectId && targetConversationId) {
      const savedMessage = await conversationsApi.sendMessage(projectId, targetConversationId, {
        role: 'assistant',
        content,
      })
      const localMessage: Message = {
        id: savedMessage.id,
        conversationId: savedMessage.conversationId,
        role: 'assistant',
        content,
        timestamp: new Date(savedMessage.timestamp),
      }
      setMessages(prev => [...prev, localMessage])
      queryClient.invalidateQueries({ queryKey: ['conversation', projectId, targetConversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
      return localMessage
    }

    const localMessage: Message = {
      id: Date.now().toString(),
      conversationId: targetConversationId,
      role: 'assistant',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, localMessage])
    return localMessage
  }

  const handleConfirmChanges = (selectedChangeIds: string[]) => {
    if (!pendingModification || !onApplyChanges) return

    const selectedChanges = pendingModification.changes.filter(
      c => selectedChangeIds.includes(c.id)
    )
    onApplyChanges(selectedChanges)
    setPendingModification(undefined)

    appendAssistantMessage(`已应用 ${selectedChanges.length} 项修改。`, conversationId, { persist: Boolean(conversationId) })
  }

  const handleRejectChanges = () => {
    setPendingModification(undefined)

    appendAssistantMessage('已取消修改。', conversationId, { persist: Boolean(conversationId) })
  }

  const handleSend = async () => {
    if (!input.trim() || !projectId || isLoading) return

    const messageText = input.trim()
    let activeConversationId = conversationId
    const conversationHistory = buildConversationHistory(messages)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingThinking('')
    setStreamingContent('')

    try {
      if (!activeConversationId) {
        const title = messageText.length > 24 ? `${messageText.slice(0, 24)}...` : messageText
        const conversation = await conversationsApi.create(projectId, {
          title: title || '新对话',
          type: chapterId ? 'chapter' : 'general',
        })
        activeConversationId = conversation.id
        onConversationCreated?.(conversation.id)
        queryClient.setQueryData<Conversation[]>(['conversations', projectId], prev => {
          const conversations = prev || []
          return [conversation, ...conversations.filter(item => item.id !== conversation.id)]
        })
        queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
      }

      const savedUserMessage = await conversationsApi.sendMessage(projectId, activeConversationId, {
        role: 'user',
        content: messageText,
      })
      setMessages(prev => prev.map(message =>
        message.id === userMessage.id
          ? {
              ...message,
              id: savedUserMessage.id,
              conversationId: savedUserMessage.conversationId,
              timestamp: new Date(savedUserMessage.timestamp),
            }
          : message,
      ))

      const chapterContext = chapterId && chapterContent
        ? { chapterId, chapterContent, chapterTitle: chapterTitle || '' }
        : undefined

      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/ai-assistant/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          message: messageText,
          conversationHistory,
          ...chapterContext,
        }),
      })

      if (!response.ok) {
        throw new Error(`请求失败（${response.status}）`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应')
      }

      const decoder = new TextDecoder('utf-8')
      let thinkingContent = ''
      let content = ''
      let buffer = ''
      let actions: AssistantAction[] = []
      let actionCards: ChoiceCard[] = []
      let modificationData: ChapterModificationData | undefined = undefined
      let streamError: Error | null = null

      const handleStreamLine = (line: string) => {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) return

        const payload = trimmed.substring(6).trim()
        if (!payload || payload === '[DONE]') return

        try {
          const data = JSON.parse(payload)

          if (data.error) {
            streamError = new Error(data.error)
            return
          }

          if (data.type === 'thinking') {
            thinkingContent += data.content || ''
            setStreamingThinking(thinkingContent)
          } else if (data.type === 'content') {
            content += data.content || ''
            setStreamingContent(content)
          } else if (data.type === 'action' && data.action) {
            actions.push(data.action)
          } else if (data.type === 'action_cards' && Array.isArray(data.cards)) {
            actionCards = data.cards
          } else if (data.type === 'modification') {
            modificationData = data.data
          } else if (data.type === 'done') {
            actions = data.actions || actions
            const modifyAction = actions.find(action => action.type === 'modify_chapter')
            if (modifyAction?.data) {
              modificationData = modifyAction.data
            }
          }
        } catch (e) {
          console.error('解析错误:', e)
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          handleStreamLine(line)
        }

        if (streamError) break
      }

      if (buffer.trim()) {
        handleStreamLine(buffer)
      }

      if (streamError) {
        throw streamError
      }

      setStreamingThinking('')
      setStreamingContent('')

      const outlineCard = createOutlineCard(messageText, content)
      const nextStepCards = createNextStepCards(messageText, content, !!chapterId)
      const cards = [outlineCard, ...actionCards, ...nextStepCards].filter((card): card is ChoiceCard => Boolean(card))
      const savedAssistantMessage = await conversationsApi.sendMessage(projectId, activeConversationId, {
        role: 'assistant',
        content,
        actionsJson: actions.length > 0 ? JSON.stringify(actions) : undefined,
        cardsJson: cards.length > 0 ? JSON.stringify(cards) : undefined,
      })
      const assistantMessage: Message = {
        id: savedAssistantMessage.id,
        conversationId: savedAssistantMessage.conversationId,
        role: 'assistant',
        content,
        timestamp: new Date(savedAssistantMessage.timestamp),
        actions: actions.length > 0 ? actions : undefined,
        modificationData,
        cards: cards.length > 0 ? cards : undefined,
      }

      setMessages(prev => [...prev, assistantMessage])

      if (modificationData) {
        setPendingModification(modificationData)
      }

      queryClient.invalidateQueries({ queryKey: ['conversation', projectId, activeConversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
      queryClient.invalidateQueries({ queryKey: ['characters', projectId] })
      queryClient.invalidateQueries({ queryKey: ['worldSettings', projectId] })

    } catch (error) {
      console.error('发送消息失败:', error)
      const message = error instanceof Error ? error.message : '未知错误'
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `抱歉，处理请求时出现错误：${message}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectCard = async (card: ChoiceCard) => {
    if (card.actionType === 'SUGGEST_PROMPT') {
      const prompt = typeof card.content?.prompt === 'string' ? card.content.prompt : card.description
      setInput(prompt)
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }

    if (card.actionType === 'AI_ACTION') {
      if (!projectId || selectedCardIds.has(card.id)) return

      setRunningCardId(card.id)
      try {
        const actionType = String(card.content?.actionType || '')
        const parameters = card.content?.parameters || {}
        const result = await aiActionsApi.execute({
          projectId,
          actionType,
          parameters,
          confirm: true,
        })

        const ownerMessage = messages.find(message => message.cards?.some(item => item.id === card.id))
        const ownerConversationId = ownerMessage?.conversationId || conversationId
        const selectedAt = new Date().toISOString()
        const updatedCards = ownerMessage?.cards?.map(item =>
          item.id === card.id ? { ...item, selectedAt, content: { ...item.content, result } } : item,
        )

        setSelectedCardIds(prev => new Set(prev).add(card.id))
        if (ownerMessage?.id && ownerConversationId && updatedCards) {
          setMessages(prev => prev.map(message =>
            message.id === ownerMessage.id ? { ...message, cards: updatedCards } : message,
          ))
          await conversationsApi.updateMessageCards(projectId, ownerConversationId, ownerMessage.id, updatedCards)
          queryClient.invalidateQueries({ queryKey: ['conversation', projectId, ownerConversationId] })
        }

        const targetQueryKey = getActionTargetQueryKey(actionType)
        if (targetQueryKey) {
          queryClient.invalidateQueries({ queryKey: [targetQueryKey, projectId] })
        }
        queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
        window.dispatchEvent(new CustomEvent('projectTreeChanged', { detail: { actionType, result } }))

        await appendAssistantMessage(result.message || '操作已执行。', ownerConversationId)

        const targetRoute = typeof card.content?.targetRoute === 'string' ? card.content.targetRoute : undefined
        if (targetRoute) {
          onOpenRoute?.(targetRoute)
        }
      } catch (error) {
        console.error('执行动作卡片失败:', error)
        const message = error instanceof Error ? error.message : '未知错误'
        await appendAssistantMessage(`执行操作失败：${message}`, conversationId, { persist: Boolean(conversationId) })
      } finally {
        setRunningCardId(null)
      }
      return
    }

    if (card.actionType !== 'CREATE_OUTLINE' || !projectId || selectedCardIds.has(card.id)) return

    setRunningCardId(card.id)
    try {
      const outlineDraft = card.content?.outline
      const items = Array.isArray(card.content?.items) ? card.content.items : []
      const outline = await outlinesApi.create(projectId, {
        title: outlineDraft?.title || card.title,
        description: outlineDraft?.description || card.description,
        structureType: outlineDraft?.structureType || 'FULL_BOOK',
        status: outlineDraft?.status || 'DRAFT',
      })

      for (const [index, item] of items.entries()) {
        await outlinesApi.addItem(projectId, outline.id, {
          title: item.title || `大纲条目 ${index + 1}`,
          summary: item.summary || '',
          goal: item.goal || '',
          conflict: item.conflict || '',
          outcome: item.outcome || '',
          povCharacter: item.povCharacter || '',
          location: item.location || '',
          estimatedWords: item.estimatedWords,
          order: typeof item.order === 'number' ? item.order : index,
        })
      }

      const ownerMessage = messages.find(message => message.cards?.some(item => item.id === card.id))
      const ownerConversationId = ownerMessage?.conversationId || conversationId
      const selectedAt = new Date().toISOString()
      const updatedCards = ownerMessage?.cards?.map(item =>
        item.id === card.id ? { ...item, selectedAt } : item,
      )

      setSelectedCardIds(prev => new Set(prev).add(card.id))
      if (ownerMessage?.id && ownerConversationId && updatedCards) {
        setMessages(prev => prev.map(message =>
          message.id === ownerMessage.id ? { ...message, cards: updatedCards } : message,
        ))
        await conversationsApi.updateMessageCards(projectId, ownerConversationId, ownerMessage.id, updatedCards)
        queryClient.invalidateQueries({ queryKey: ['conversation', projectId, ownerConversationId] })
      }

      await appendAssistantMessage(`已加入系统大纲：「${outline.title}」。你可以在大纲页面继续编辑。`, ownerConversationId)
      queryClient.invalidateQueries({ queryKey: ['outlines', projectId] })
      window.dispatchEvent(new CustomEvent('outlineCreatedFromAssistant', { detail: { outlineId: outline.id } }))
      window.dispatchEvent(new CustomEvent('projectTreeChanged', { detail: { outlineId: outline.id } }))
      onOpenRoute?.('outlines')
    } catch (error) {
      console.error('执行卡片失败:', error)
      const message = error instanceof Error ? error.message : '未知错误'
      await appendAssistantMessage(`加入系统大纲失败：${message}`, conversationId, { persist: Boolean(conversationId) })
    } finally {
      setRunningCardId(null)
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_character':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'create_relationship':
        return <MapPin className="w-4 h-4 text-green-500" />
      case 'create_world_setting':
        return <FileText className="w-4 h-4 text-purple-500" />
      case 'modify_chapter':
        return <Sparkles className="w-4 h-4 text-yellow-500" />
      default:
        return <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
    }
  }

  const handleLinkClick = (href: string) => {
    if (href === '#ai-settings' && onOpenAISettings) {
      onOpenAISettings()
    } else {
      navigate(href)
    }
  }

  return (
    <Card className="h-full flex flex-col bg-[var(--bg-primary)] border-[var(--border-color)]">
      <CardHeader className="border-b border-[var(--border-color)] pb-3">
        <CardTitle className="text-sm text-[var(--text-primary)] flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--accent-color)]" />
          AI 创作助手
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-gray-600" />
              ) : (
                <Bot className="w-4 h-4 text-[var(--accent-color)]" />
              )}
            </div>
            <div
              className={cn(
                'rounded-lg p-3 max-w-[85%] leading-relaxed',
                message.role === 'user'
                  ? 'bg-[var(--accent-color)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              )}
            >
              {message.role === 'user' ? (
                <div className="whitespace-pre-wrap text-[var(--text-primary)] text-sm">{message.content}</div>
              ) : (
                <div className="text-[var(--text-primary)] text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ ...props }) => <h1 className="text-lg font-bold text-[var(--text-primary)] mb-2 mt-3" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-base font-bold text-[var(--text-primary)] mb-1.5 mt-2" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 mt-1.5" {...props} />,
                      h4: ({ ...props }) => <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 mt-1.5" {...props} />,
                      p: ({ ...props }) => <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2" {...props} />,
                      strong: ({ ...props }) => <strong className="font-semibold text-[var(--text-primary)]" {...props} />,
                      em: ({ ...props }) => <em className="italic text-[var(--text-secondary)]" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] mb-2 space-y-0.5" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal list-inside text-sm text-[var(--text-secondary)] mb-2 space-y-0.5" {...props} />,
                      li: ({ ...props }) => <li className="text-sm text-[var(--text-secondary)] leading-relaxed mb-0.5" {...props} />,
                      blockquote: ({ ...props }) => <blockquote className="border-l-3 border-[var(--accent-color)] pl-2 py-1 my-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)]/50 rounded-r" {...props} />,
                      code: ({ ...props }) => <code className="bg-[var(--bg-primary)] px-1 py-0.5 rounded text-sm text-[var(--accent-color)] font-mono" {...props} />,
                      pre: ({ ...props }) => <pre className="bg-[var(--bg-primary)] p-2 rounded-lg overflow-x-auto my-2 text-sm" {...props} />,
                      hr: ({ ...props }) => <hr className="my-3 border-[var(--border-color)]" {...props} />,
                      a: ({ ...props }) => (
                        <button
                          onClick={() => handleLinkClick((props as any).href || '')}
                          className="text-[var(--accent-color)] hover:underline cursor-pointer"
                        >
                          {(props as any).children}
                        </button>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-[var(--bg-secondary)]/50 rounded-lg p-2.5 text-[var(--text-primary)]"
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

              {message.cards && message.cards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.cards.map((card) => {
                    const isPromptSuggestion = card.actionType === 'SUGGEST_PROMPT'
                    const isAiAction = card.actionType === 'AI_ACTION'
                    const isSelected = !isPromptSuggestion && selectedCardIds.has(card.id)
                    const isRunning = runningCardId === card.id
                    const buttonText = isSelected
                      ? '已执行'
                      : isPromptSuggestion
                        ? '继续提问'
                        : isAiAction
                          ? '确认执行'
                          : '加入系统大纲'

                    return (
                      <div
                        key={card.id}
                        className={cn(
                          'rounded border p-3 bg-[var(--bg-primary)]',
                          isSelected ? 'border-green-500/60' : 'border-[var(--border-color)]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{card.title}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{card.description}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectCard(card)}
                            disabled={isSelected || isRunning}
                          >
                            {isRunning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              buttonText
                            )}
                          </Button>
                          {card.actionType === 'CREATE_OUTLINE' && onOpenRoute && (
                            <Button size="sm" variant="outline" onClick={() => onOpenRoute('outlines')}>
                              查看大纲
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {(streamingThinking || streamingContent) && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-[var(--accent-color)]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 max-w-[85%]">
              {streamingThinking && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-3">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span>{streamingThinking}</span>
                </div>
              )}
              {streamingContent && (
                <div className="text-[var(--text-primary)] text-sm leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ ...props }) => <h1 className="text-lg font-bold text-[var(--text-primary)] mb-2 mt-3" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-base font-bold text-[var(--text-primary)] mb-1.5 mt-2" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 mt-1.5" {...props} />,
                      p: ({ ...props }) => <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2" {...props} />,
                      strong: ({ ...props }) => <strong className="font-semibold text-[var(--text-primary)]" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] mb-2 space-y-0.5" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal list-inside text-sm text-[var(--text-secondary)] mb-2 space-y-0.5" {...props} />,
                      li: ({ ...props }) => <li className="text-sm text-[var(--text-secondary)] leading-relaxed mb-0.5" {...props} />,
                      a: ({ ...props }) => (
                        <button
                          onClick={() => handleLinkClick((props as any).href || '')}
                          className="text-[var(--accent-color)] hover:underline cursor-pointer"
                        >
                          {(props as any).children}
                        </button>
                      ),
                    }}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                  <span className="inline-block w-2 h-4 bg-[var(--text-muted)] animate-pulse ml-1" />
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {pendingModification && (
        <div className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-secondary)]">
          <div className="text-sm text-[var(--text-secondary)] mb-3">
            检测到章节修改建议，是否应用以下修改？
          </div>
          <div className="space-y-2 mb-4">
            {pendingModification.changes.map((change) => (
              <div
                key={change.id}
                className="bg-[var(--bg-primary)] rounded p-3 border border-[var(--border-color)]"
              >
                <div className="text-xs text-[var(--text-secondary)] mb-2">
                  {change.id === 'title' && '标题'}
                  {change.id === 'content' && '内容'}
                  {change.id === 'summary' && '摘要'}
                </div>
                <div className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-tertiary)] p-2 rounded">
                  {change.suggested.substring(0, 100)}
                  {change.suggested.length > 100 && '...'}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleConfirmChanges(pendingModification.changes.map(c => c.id))}
            >
              应用所有修改
            </Button>
            <Button size="sm" variant="outline" onClick={handleRejectChanges}>
              取消
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--border-color)] p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasValidSetup ? '输入消息... (Ctrl+Enter发送)' : '请先配置 API Key 并启用功能'}
            disabled={!hasValidSetup || isLoading}
            className="flex-1 resize-none px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] placeholder-[var(--text-muted)]"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading || !hasValidSetup}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
