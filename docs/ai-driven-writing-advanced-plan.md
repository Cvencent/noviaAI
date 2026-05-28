# AI驱动的智能写作系统 - 高级功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现AI通过对话直接修改项目数据的能力，包括创建角色、添加世界观设定、修改章节内容等。

**Architecture:** 
- 前端：AI对话系统解析用户意图，调用API执行操作，提供卡片选择界面
- 后端：提供智能API，接收结构化请求，执行数据库操作
- 数据模型：扩展对话系统，支持操作历史记录和卡片选择

**Tech Stack:** React 18 + TypeScript + NestJS + Prisma + OpenAI/Claude API

---

## 阶段一：后端智能API系统

### Task 1: 创建AI操作识别和执行系统

**Files:**
- Create: `server/src/modules/ai-actions/ai-actions.service.ts`
- Create: `server/src/modules/ai-actions/ai-actions.controller.ts`
- Create: `server/src/modules/ai-actions/ai-actions.module.ts`
- Create: `server/src/modules/ai-actions/dto/ai-action.dto.ts`
- Modify: `server/src/modules/ai/ai.service.ts`

#### 1.1 创建AI操作DTO

```typescript
export enum AIActionType {
  CREATE_CHARACTER = 'create_character',
  UPDATE_CHARACTER = 'update_character',
  DELETE_CHARACTER = 'delete_character',
  CREATE_WORLD_SETTING = 'create_world_setting',
  UPDATE_WORLD_SETTING = 'update_world_setting',
  DELETE_WORLD_SETTING = 'delete_world_setting',
  CREATE_CHAPTER = 'create_chapter',
  UPDATE_CHAPTER = 'update_chapter',
  DELETE_CHAPTER = 'delete_chapter',
  CREATE_PLOT = 'create_plot',
  CREATE_OUTLINE = 'create_outline',
  ADD_RELATIONSHIP = 'add_relationship',
}

export interface ActionParameter {
  name: string
  value: any
  description?: string
}

export interface AIActionRequest {
  projectId: string
  actionType: AIActionType
  parameters: ActionParameter[]
  confirm?: boolean
}

export interface AIActionResponse {
  success: boolean
  actionType: AIActionType
  result?: any
  message: string
  requiresConfirmation?: boolean
  suggestion?: string
}

export interface ActionSuggestion {
  title: string
  description: string
  actionType: AIActionType
  parameters: ActionParameter[]
}
```

#### 1.2 创建AI操作服务

```typescript
@Injectable()
export class AIActionsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async executeAction(
    userId: string,
    request: AIActionRequest,
  ): Promise<AIActionResponse> {
    switch (request.actionType) {
      case AIActionType.CREATE_CHARACTER:
        return await this.createCharacter(userId, request)
      case AIActionType.UPDATE_CHARACTER:
        return await this.updateCharacter(userId, request)
      case AIActionType.CREATE_WORLD_SETTING:
        return await this.createWorldSetting(userId, request)
      case AIActionType.UPDATE_CHAPTER:
        return await this.updateChapter(userId, request)
      // ... 其他操作
      default:
        throw new BadRequestException('未知操作类型')
    }
  }

  private async createCharacter(
    userId: string,
    request: AIActionRequest,
  ): Promise<AIActionResponse> {
    // 解析参数
    const name = this.getParameter(request.parameters, 'name')
    const role = this.getParameter(request.parameters, 'role') || '配角'
    const appearance = this.getParameter(request.parameters, 'appearance')
    const personality = this.getParameter(request.parameters, 'personality')
    const background = this.getParameter(request.parameters, 'background')

    // 验证项目权限
    const project = await this.prisma.project.findFirst({
      where: { id: request.projectId, userId },
    })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    // 创建角色
    const character = await this.prisma.character.create({
      data: {
        projectId: request.projectId,
        name,
        role,
        appearance,
        personality,
        background,
      },
    })

    return {
      success: true,
      actionType: request.actionType,
      result: character,
      message: `成功创建角色「${name}」`,
    }
  }

  private async createWorldSetting(
    userId: string,
    request: AIActionRequest,
  ): Promise<AIActionResponse> {
    // 实现类似的创建世界观设定逻辑
  }

  private async updateChapter(
    userId: string,
    request: AIActionRequest,
  ): Promise<AIActionResponse> {
    // 实现更新章节内容逻辑
  }

  // AI解析用户意图，生成操作建议
  async analyzeAndSuggestActions(
    userId: string,
    projectId: string,
    userMessage: string,
  ): Promise<ActionSuggestion[]> {
    // 先获取项目上下文
    const context = await this.getContextForAI(projectId)
    
    // 调用AI分析用户意图
    const suggestions = await this.aiService.analyzeUserIntent(
      userId,
      userMessage,
      context,
    )
    
    return suggestions
  }

  private getParameter(params: ActionParameter[], name: string): any {
    return params.find(p => p.name === name)?.value
  }

  private async getContextForAI(projectId: string) {
    // 构建AI分析所需的上下文
    return {
      characters: await this.prisma.character.findMany({ where: { projectId } }),
      worldSettings: await this.prisma.worldSetting.findMany({ where: { projectId } }),
      chapters: await this.prisma.chapter.findMany({ where: { projectId } }),
    }
  }
}
```

#### 1.3 创建AI操作控制器

```typescript
@Controller('ai-actions')
export class AIActionsController {
  constructor(private aiActionsService: AIActionsService) {}

  @Post('analyze')
  async analyze(
    @Request() req,
    @Body() body: { projectId: string; message: string },
  ) {
    return this.aiActionsService.analyzeAndSuggestActions(
      req.user.id,
      body.projectId,
      body.message,
    )
  }

  @Post('execute')
  async execute(
    @Request() req,
    @Body() body: AIActionRequest,
  ) {
    return this.aiActionsService.executeAction(req.user.id, body)
  }
}
```

### Task 2: 扩展AI服务，添加意图分析功能

**Files:**
- Modify: `server/src/modules/ai/ai.service.ts`
- Create: `server/src/modules/ai/intent-analysis.service.ts`

```typescript
@Injectable()
export class IntentAnalysisService {
  constructor(
    private prisma: PrismaService,
    private aiProvider: OpenaiProvider, // 或基类
  ) {}

  async analyzeUserIntent(
    userId: string,
    userMessage: string,
    context: any,
  ): Promise<ActionSuggestion[]> {
    const systemPrompt = this.buildSystemPrompt(context)
    
    // 构建分析提示词
    const prompt = `用户消息：${userMessage}

请分析用户意图，返回最多3个可能的操作建议。使用JSON格式返回：

{
  "suggestions": [
    {
      "title": "创建角色",
      "description": "根据描述创建新角色",
      "actionType": "create_character",
      "parameters": [
        {"name": "name", "value": "...", "description": "角色名"},
        ...
      ]
    }
  ]
}`

    // 调用AI
    const response = await this.aiProvider.chat({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    })

    // 解析并返回建议
    return this.parseSuggestions(response)
  }

  private buildSystemPrompt(context: any) {
    return `你是一位专业的小说创作助手。你的任务是分析用户的意图，并建议具体的操作。

当前项目信息：
${JSON.stringify(context, null, 2)}

你可以执行的操作类型：
- create_character: 创建新角色
- update_character: 更新角色信息
- create_world_setting: 创建世界观设定
- update_chapter: 更新章节内容
- add_relationship: 添加角色关系
- create_plot: 创建情节线

请根据用户的输入，提供1-3个最可能的操作建议。`
  }

  private parseSuggestions(response: string): ActionSuggestion[] {
    try {
      const json = JSON.parse(response)
      return json.suggestions || []
    } catch {
      // 如果解析失败，尝试更灵活的处理
      return []
    }
  }
}
```

---

## 阶段二：前端操作卡片系统

### Task 3: 创建AI操作卡片组件

**Files:**
- Create: `client/src/components/AIActionCard.tsx`
- Create: `client/src/components/AIActionCardGroup.tsx`

#### 3.1 创建操作卡片组件

```typescript
import React from 'react'
import { Button } from './ui/Button'
import { Check, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ActionSuggestion {
  title: string
  description: string
  actionType: string
  parameters: { name: string; value: any; description?: string }[]
}

interface AIActionCardProps {
  suggestion: ActionSuggestion
  isSelected?: boolean
  isDisabled?: boolean
  onSelect?: (suggestion: ActionSuggestion) => void
  onRegenerate?: () => void
}

export const AIActionCard: React.FC<AIActionCardProps> = ({
  suggestion,
  isSelected,
  isDisabled,
  onSelect,
  onRegenerate,
}) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_character': return '👤'
      case 'update_character': return '✏️'
      case 'create_world_setting': return '🌍'
      case 'update_chapter': return '📄'
      case 'add_relationship': return '🔗'
      default: return '⚡'
    }
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-all cursor-pointer group',
        isSelected
          ? 'border-[#007acc] bg-[#0e4770]/30'
          : 'border-[#555] bg-[#2d2d2d] hover:border-[#007acc]/50',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !isDisabled && onSelect?.(suggestion)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getActionIcon(suggestion.actionType)}</span>
          <div>
            <h4 className="text-sm font-medium text-gray-200">{suggestion.title}</h4>
            <p className="text-xs text-gray-400">{suggestion.description}</p>
          </div>
        </div>
        {isSelected && <Check className="w-4 h-4 text-[#007acc]" />}
      </div>

      <div className="mb-3">
        <h5 className="text-xs text-gray-500 mb-2">参数预览：</h5>
        <div className="space-y-1">
          {suggestion.parameters.map((param, idx) => (
            <div key={idx} className="text-xs">
              <span className="text-gray-400">{param.description || param.name}：</span>
              <span className="text-gray-200">{String(param.value).slice(0, 50)}{String(param.value).length > 50 ? '...' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 text-xs h-7"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(suggestion)
          }}
          disabled={isDisabled}
        >
          {isSelected ? '已选择' : '执行此操作'}
        </Button>

        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={(e) => {
              e.stopPropagation()
              onRegenerate()
            }}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            重新建议
          </Button>
        )}
      </div>
    </div>
  )
}
```

#### 3.2 创建操作卡片组组件

```typescript
import React from 'react'
import { AIActionCard, ActionSuggestion } from './AIActionCard'
import { Sparkles } from 'lucide-react'

interface AIActionCardGroupProps {
  suggestions: ActionSuggestion[]
  selectedIndex?: number
  onSelect?: (suggestion: ActionSuggestion) => void
  onRegenerate?: () => void
  isLoading?: boolean
}

export const AIActionCardGroup: React.FC<AIActionCardGroupProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onRegenerate,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 border border-[#555] rounded-lg bg-[#2d2d2d]">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          AI正在分析您的意图...
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 border border-[#555] rounded-lg bg-[#2d2d2d]">
        <p className="text-gray-400 text-sm">未能识别具体操作，请重新描述。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        AI为您提供了 {suggestions.length} 个操作建议，请选择：
      </p>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <AIActionCard
            key={index}
            suggestion={suggestion}
            isSelected={selectedIndex === index}
            onSelect={() => onSelect?.(suggestion)}
            onRegenerate={index === 0 ? onRegenerate : undefined}
          />
        ))}
      </div>
    </div>
  )
}
```

### Task 4: 创建AI操作API

**Files:**
- Create: `client/src/api/ai-actions.ts`

```typescript
import { client } from './client'

export interface ActionParameter {
  name: string
  value: any
  description?: string
}

export interface ActionSuggestion {
  title: string
  description: string
  actionType: string
  parameters: ActionParameter[]
}

export interface AIActionRequest {
  projectId: string
  actionType: string
  parameters: ActionParameter[]
  confirm?: boolean
}

export interface AIActionResponse {
  success: boolean
  actionType: string
  result?: any
  message: string
  requiresConfirmation?: boolean
  suggestion?: string
}

export const aiActionsApi = {
  async analyze(
    projectId: string,
    message: string,
  ): Promise<{ suggestions: ActionSuggestion[] }> {
    const response = await client.post('/ai-actions/analyze', {
      projectId,
      message,
    })
    return response.data
  },

  async execute(request: AIActionRequest): Promise<AIActionResponse> {
    const response = await client.post('/ai-actions/execute', request)
    return response.data
  },
}
```

---

## 阶段三：整合到AI对话系统

### Task 5: 升级AI助手组件

**Files:**
- Modify: `client/src/components/AiAssistant.tsx`

#### 5.1 添加状态和逻辑

```typescript
// 在AiAssistant组件中添加
import { AIActionCardGroup, ActionSuggestion } from './AIActionCardGroup'
import { aiActionsApi, AIActionRequest } from '@/api/ai-actions'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  cardsJson?: ActionSuggestion[]
  actionsJson?: any[]
  isError?: boolean
}

// 在组件中添加状态
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [currentSuggestions, setCurrentSuggestions] = useState<ActionSuggestion[]>([])
const [selectedSuggestion, setSelectedSuggestion] = useState<ActionSuggestion | null>(null)
const [isExecuting, setIsExecuting] = useState(false)

// 添加分析用户意图的函数
const handleAnalyzeIntent = async (userMessage: string) => {
  if (!projectId) return
  
  setIsAnalyzing(true)
  try {
    const response = await aiActionsApi.analyze(projectId, userMessage)
    setCurrentSuggestions(response.suggestions)
  } catch (error) {
    console.error('分析意图失败:', error)
  } finally {
    setIsAnalyzing(false)
  }
}

// 添加执行操作的函数
const handleExecuteAction = async (suggestion: ActionSuggestion) => {
  if (!projectId) return
  
  setIsExecuting(true)
  setSelectedSuggestion(suggestion)
  
  try {
    const request: AIActionRequest = {
      projectId,
      actionType: suggestion.actionType,
      parameters: suggestion.parameters,
      confirm: true,
    }
    
    const response = await aiActionsApi.execute(request)
    
    // 显示结果
    const resultMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, resultMessage])
    
    // 清除建议
    setCurrentSuggestions([])
    setSelectedSuggestion(null)
    
    // 刷新相关缓存
    await queryClient.invalidateQueries(['characters', projectId])
    await queryClient.invalidateQueries(['worldSettings', projectId])
    await queryClient.invalidateQueries(['chapters', projectId])
    
  } catch (error) {
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '操作执行失败，请稍后再试。',
      timestamp: new Date(),
      isError: true,
    }
    setMessages(prev => [...prev, errorMessage])
  } finally {
    setIsExecuting(false)
  }
}
```

#### 5.2 修改消息发送逻辑

```typescript
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
  
  // 1. 先尝试分析用户意图，看是否需要执行操作
  await handleAnalyzeIntent(input)
  
  // 2. 如果有建议，就不调用普通对话了
  if (currentSuggestions.length > 0) {
    setIsLoading(false)
    return
  }
  
  // 3. 否则继续普通对话
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
    // 错误处理...
  }
}
```

#### 5.3 在消息渲染中添加操作卡片

```typescript
// 在MessageItem组件或消息渲染部分
if (message.cardsJson && message.cardsJson.length > 0) {
  return (
    <div className="mt-3">
      <AIActionCardGroup
        suggestions={message.cardsJson}
        onSelect={handleExecuteAction}
        onRegenerate={() => handleAnalyzeIntent(message.content)}
      />
    </div>
  )
}
```

### Task 6: 更新对话消息模型

**Files:**
- Modify: `client/src/types/conversation.ts`
- Modify: `server/prisma/schema.prisma` (更新Message模型以支持操作卡片)

#### 6.1 更新类型定义

```typescript
// 在conversation.ts中添加
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionsJson?: any[]
  cardsJson?: ActionSuggestion[]  // 添加卡片支持
}
```

#### 6.2 保存建议到对话历史

```typescript
// 在AiAssistant.tsx中
const handleAnalyzeIntent = async (userMessage: string) => {
  // ... 现有代码 ...
  
  try {
    const response = await aiActionsApi.analyze(projectId, userMessage)
    setCurrentSuggestions(response.suggestions)
    
    // 创建包含建议的AI消息
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '我分析了您的请求，提供以下建议：',
      timestamp: new Date(),
      cardsJson: response.suggestions,
    }
    setMessages(prev => [...prev, assistantMessage])
    
    // 保存到对话历史
    if (conversationId && projectId) {
      await conversationsApi.sendMessage(projectId, conversationId, {
        content: '我分析了您的请求，提供以下建议：',
        role: 'assistant',
        cardsJson: response.suggestions,
      })
    }
  } catch (error) {
    // ... 错误处理
  }
}
```

---

## 阶段四：完善和测试

### Task 7: 添加更多操作类型

**Files:**
- Modify: `server/src/modules/ai-actions/ai-actions.service.ts`

实现更多的操作类型：
- `update_character`: 更新角色信息
- `delete_character`: 删除角色
- `add_relationship`: 添加角色关系
- `create_world_setting`: 创建世界观设定
- `update_world_setting`: 更新世界观设定
- `create_chapter`: 创建新章节
- `update_chapter`: 更新章节内容
- `create_plot`: 创建情节线
- `create_outline`: 创建大纲

### Task 8: 添加操作确认对话框

**Files:**
- Create: `client/src/components/AIActionConfirmDialog.tsx`

在执行重要操作前显示确认对话框：
- 显示将要执行的操作详情
- 显示会被修改的数据预览
- 确认后再执行

---

## 执行步骤总结

| 阶段 | 任务 | 说明 |
|-----|------|------|
| 一 | Task 1-2 | 后端智能API系统 |
| 二 | Task 3-4 | 前端操作卡片系统 |
| 三 | Task 5-6 | 整合到AI对话系统 |
| 四 | Task 7-8 | 完善功能和测试 |

所有功能实现后，用户就可以通过自然语言对话直接创建角色、添加世界观设定、修改章节内容了！
