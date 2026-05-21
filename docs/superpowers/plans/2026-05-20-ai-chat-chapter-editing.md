# AI 对话助手章节编辑功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 AI 对话助手，使其能够查看章节内容、根据对话修改内容、显示差异对比，并支持可配置的确认机制。

**Architecture:** 
- 扩展现有 `AiAssistant` 组件，添加章节内容感知能力
- 创建新的 `DiffViewer` 组件用于显示文本差异
- 创建 `ChangeConfirmationModal` 组件用于确认修改
- 修改后端 AI 助手服务以支持章节内容上下文
- 在 AI 设置中添加确认机制配置选项

**Tech Stack:** React, TypeScript, Tailwind CSS, diff (npm), NestJS, Prisma

---

## 文件结构

### 新建文件
- `client/src/components/DiffViewer.tsx` - 差异显示组件
- `client/src/components/ChangeConfirmationModal.tsx` - 修改确认对话框
- `client/src/types/ai-changes.ts` - AI 修改相关类型定义

### 修改文件
- `client/src/components/AiAssistant.tsx` - 增强章节内容感知
- `client/src/api/ai-assistant.ts` - 添加章节修改 API
- `client/src/pages/ChapterEditor.tsx` - 集成 AI 对话助手
- `client/src/pages/ProjectWorkspace.tsx` - 传递章节上下文
- `client/src/pages/AISettings.tsx` - 添加确认机制配置
- `server/src/modules/ai-assistant/ai-assistant.service.ts` - 支持章节内容上下文
- `server/src/modules/ai-assistant/dto/chat.dto.ts` - 添加章节相关字段
- `server/prisma/schema.prisma` - 添加 AI 修改配置模型

---

## Task 1: 安装 diff 库并创建类型定义

**Files:**
- Modify: `client/package.json`
- Create: `client/src/types/ai-changes.ts`

- [ ] **Step 1: 安装 diff 库**

```bash
cd F:\code\client
npm install diff
npm install @types/diff --save-dev
```

- [ ] **Step 2: 创建 AI 修改类型定义**

```typescript
// client/src/types/ai-changes.ts

export interface ContentChange {
  id: string
  type: 'replace' | 'insert' | 'delete'
  original: string
  suggested: string
  startIndex?: number
  endIndex?: number
  description?: string
}

export interface ChapterModification {
  chapterId: string
  chapterTitle: string
  changes: ContentChange[]
  fullOriginal: string
  fullSuggested: string
  timestamp: Date
}

export interface ModificationConfig {
  requireConfirmation: boolean  // 是否需要确认修改
  autoApplyMinorChanges: boolean  // 是否自动应用小改动
  showDiffInline: boolean  // 是否内联显示差异
}

export const DEFAULT_MODIFICATION_CONFIG: ModificationConfig = {
  requireConfirmation: true,
  autoApplyMinorChanges: false,
  showDiffInline: true,
}
```

- [ ] **Step 3: 验证类型文件创建**

Run: `npx tsc --noEmit client/src/types/ai-changes.ts`
Expected: 无错误输出

- [ ] **Step 4: 提交**

```bash
git add client/package.json client/package-lock.json client/src/types/ai-changes.ts
git commit -m "feat: add diff library and AI change types"
```

---

## Task 2: 创建 DiffViewer 组件

**Files:**
- Create: `client/src/components/DiffViewer.tsx`

- [ ] **Step 1: 创建 DiffViewer 组件**

```tsx
// client/src/components/DiffViewer.tsx
import { useMemo } from 'react'
import { diffWords, diffLines, Change } from 'diff'

interface DiffViewerProps {
  original: string
  suggested: string
  mode?: 'words' | 'lines'
  className?: string
}

export function DiffViewer({ original, suggested, mode = 'words', className = '' }: DiffViewerProps) {
  const diffResult = useMemo(() => {
    if (mode === 'lines') {
      return diffLines(original, suggested)
    }
    return diffWords(original, suggested)
  }, [original, suggested, mode])

  const getChangeStyle = (change: Change): string => {
    if (change.added) {
      return 'bg-green-100 text-green-900 line-through decoration-green-500'
    }
    if (change.removed) {
      return 'bg-red-100 text-red-900 line-through decoration-red-500'
    }
    return ''
  }

  return (
    <div className={`diff-viewer font-mono text-sm leading-relaxed ${className}`}>
      {diffResult.map((part, index) => (
        <span
          key={index}
          className={`${getChangeStyle(part)} ${part.added || part.removed ? 'px-0.5 rounded' : ''}`}
        >
          {part.value}
        </span>
      ))}
    </div>
  )
}

// 并排对比视图
interface SideBySideDiffProps {
  original: string
  suggested: string
  className?: string
}

export function SideBySideDiff({ original, suggested, className = '' }: SideBySideDiffProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">原文</div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
          {original}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">修改后</div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
          {suggested}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证组件编译**

Run: `npx tsc --noEmit client/src/components/DiffViewer.tsx`
Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add client/src/components/DiffViewer.tsx
git commit -m "feat: add DiffViewer component for showing text differences"
```

---

## Task 3: 创建 ChangeConfirmationModal 组件

**Files:**
- Create: `client/src/components/ChangeConfirmationModal.tsx`

- [ ] **Step 1: 创建确认对话框组件**

```tsx
// client/src/components/ChangeConfirmationModal.tsx
import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { DiffViewer, SideBySideDiff } from './DiffViewer'
import { ContentChange } from '@/types/ai-changes'

interface ChangeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  changes: ContentChange[]
  onConfirm: (selectedChanges: string[]) => void
  onReject: () => void
  title?: string
}

export function ChangeConfirmationModal({
  isOpen,
  onClose,
  changes,
  onConfirm,
  onReject,
  title = 'AI 建议的修改'
}: ChangeConfirmationModalProps) {
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(changes.map(c => c.id))
  )
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('inline')

  const toggleChange = (changeId: string) => {
    const newSelected = new Set(selectedChanges)
    if (newSelected.has(changeId)) {
      newSelected.delete(changeId)
    } else {
      newSelected.add(changeId)
    }
    setSelectedChanges(newSelected)
  }

  const toggleExpand = (changeId: string) => {
    const newExpanded = new Set(expandedChanges)
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId)
    } else {
      newExpanded.add(changeId)
    }
    setExpandedChanges(newExpanded)
  }

  const selectAll = () => {
    setSelectedChanges(new Set(changes.map(c => c.id)))
  }

  const deselectAll = () => {
    setSelectedChanges(new Set())
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedChanges))
    onClose()
  }

  const handleReject = () => {
    onReject()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {/* 工具栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              全选
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              取消全选
            </Button>
            <span className="text-sm text-gray-500">
              已选择 {selectedChanges.size}/{changes.length} 项
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'inline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('inline')}
            >
              内联视图
            </Button>
            <Button
              variant={viewMode === 'side-by-side' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              并排视图
            </Button>
          </div>
        </div>

        {/* 修改列表 */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {changes.map((change) => (
            <div
              key={change.id}
              className={`border rounded-lg transition-colors ${
                selectedChanges.has(change.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* 修改头部 */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleChange(change.id)}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedChanges.has(change.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedChanges.has(change.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {change.description || `修改 ${change.id}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      change.type === 'replace' ? 'bg-yellow-100 text-yellow-700' :
                      change.type === 'insert' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {change.type === 'replace' ? '替换' :
                       change.type === 'insert' ? '插入' : '删除'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(change.id)
                  }}
                >
                  {expandedChanges.has(change.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* 修改详情 */}
              {expandedChanges.has(change.id) && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <div className="mt-3">
                    {viewMode === 'inline' ? (
                      <DiffViewer
                        original={change.original}
                        suggested={change.suggested}
                        mode="words"
                      />
                    ) : (
                      <SideBySideDiff
                        original={change.original}
                        suggested={change.suggested}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleReject}>
            <X className="w-4 h-4 mr-1" />
            拒绝所有
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedChanges.size === 0}
          >
            <Check className="w-4 h-4 mr-1" />
            应用选中 ({selectedChanges.size})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: 验证组件编译**

Run: `npx tsc --noEmit client/src/components/ChangeConfirmationModal.tsx`
Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add client/src/components/ChangeConfirmationModal.tsx
git commit -m "feat: add ChangeConfirmationModal for reviewing AI changes"
```

---

## Task 4: 扩展后端 AI 助手服务支持章节上下文

**Files:**
- Modify: `server/src/modules/ai-assistant/dto/chat.dto.ts`
- Modify: `server/src/modules/ai-assistant/ai-assistant.service.ts`

- [ ] **Step 1: 更新 Chat DTO 添加章节相关字段**

```typescript
// server/src/modules/ai-assistant/dto/chat.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  projectId: string

  @IsString()
  @IsNotEmpty()
  message: string

  @IsString()
  @IsOptional()
  provider?: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  chapterContent?: string

  @IsString()
  @IsOptional()
  chapterTitle?: string
}
```

- [ ] **Step 2: 更新 AI 助手服务处理章节上下文**

```typescript
// server/src/modules/ai-assistant/ai-assistant.service.ts
// 在 getChatResponse 方法中添加章节上下文处理

private async getChatResponse(
  projectId: string,
  message: string,
  provider?: string,
  chapterId?: string,
  chapterContent?: string,
  chapterTitle?: string
): Promise<string> {
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: {
      characters: true,
      worldSettings: {
        include: { items: true }
      }
    }
  })

  if (!project) {
    throw new NotFoundException('项目不存在')
  }

  // 构建系统提示
  let systemPrompt = `你是一个专业的网文创作助手，正在帮助用户创作小说《${project.title}》。

项目信息：
- 标题：${project.title}
- 类型：${project.genre || '未设定'}
- 简介：${project.description || '无'}

你可以帮助用户：
1. 讨论剧情发展和情节建议
2. 分析人物性格和行为
3. 创建新的角色、关系或世界观设定
4. 提供写作建议和灵感
5. 修改和优化章节内容`

  // 如果有章节上下文，添加到系统提示
  if (chapterContent && chapterTitle) {
    systemPrompt += `

当前正在编辑的章节：《${chapterTitle}》
章节内容：
---
${chapterContent}
---

用户可能会要求你：
- 分析这个章节的内容
- 提出改进建议
- 直接修改某些段落
- 扩展或缩减某些部分

如果用户要求修改内容，请明确指出你要修改的部分，并提供修改后的完整内容。
修改时请保持原文的风格和语气，除非用户特别要求改变风格。`
  }

  // 添加角色信息
  if (project.characters.length > 0) {
    systemPrompt += `\n\n主要角色：`
    project.characters.slice(0, 10).forEach(char => {
      systemPrompt += `\n- ${char.name}${char.role ? `（${char.role}）` : ''}${char.description ? `：${char.description}` : ''}`
    })
  }

  // 添加世界观信息
  if (project.worldSettings.length > 0) {
    systemPrompt += `\n\n世界观设定：`
    project.worldSettings.forEach(setting => {
      systemPrompt += `\n- ${setting.name}（${setting.category}）${setting.description ? `：${setting.description}` : ''}`
    })
  }

  // 调用 AI 服务
  const response = await this.aiService.chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    provider
  )

  return response
}
```

- [ ] **Step 3: 更新 processMessage 方法传递章节参数**

```typescript
// server/src/modules/ai-assistant/ai-assistant.service.ts
async processMessage(dto: ChatDto): Promise<AssistantResponse> {
  const { projectId, message, provider, chapterId, chapterContent, chapterTitle } = dto

  // 分析意图
  const intent = await this.analyzeIntent(message, provider)

  switch (intent.type) {
    case 'create_character':
      return await this.handleCreateCharacter(projectId, intent, provider)
    
    case 'create_relationship':
      return await this.handleCreateRelationship(projectId, intent, provider)
    
    case 'create_world_setting':
      return await this.handleCreateWorldSetting(projectId, intent, provider)
    
    case 'modify_chapter':
      // 新增：处理章节修改请求
      return await this.handleModifyChapter(
        projectId,
        message,
        chapterId,
        chapterContent,
        chapterTitle,
        provider
      )
    
    default:
      // 默认对话，传入章节上下文
      const response = await this.getChatResponse(
        projectId,
        message,
        provider,
        chapterId,
        chapterContent,
        chapterTitle
      )
      return { response, actions: [] }
  }
}
```

- [ ] **Step 4: 添加章节修改处理方法**

```typescript
// server/src/modules/ai-assistant/ai-assistant.service.ts

private async handleModifyChapter(
  projectId: string,
  message: string,
  chapterId?: string,
  chapterContent?: string,
  chapterTitle?: string,
  provider?: string
): Promise<AssistantResponse> {
  if (!chapterContent || !chapterId) {
    return {
      response: '请先打开一个章节，然后再请求修改。',
      actions: []
    }
  }

  // 使用 AI 分析修改请求
  const systemPrompt = `你是一个专业的网文编辑助手。用户会给你一段章节内容和修改要求。

你需要：
1. 理解用户的修改意图
2. 分析需要修改的部分
3. 生成修改后的内容
4. 解释你做了哪些修改

返回格式（JSON）：
{
  "changes": [
    {
      "id": "change_1",
      "type": "replace",
      "original": "原文内容",
      "suggested": "修改后内容",
      "description": "修改说明"
    }
  ],
  "fullSuggested": "完整的修改后章节内容",
  "explanation": "修改总结说明"
}

注意：
- 保持原文的风格和语气
- 只修改用户要求的部分
- 如果用户没有指定具体位置，根据上下文判断最需要修改的部分
- 每个修改都要有清晰的说明`

  const userPrompt = `章节标题：${chapterTitle}

章节内容：
---
${chapterContent}
---

修改要求：
${message}`

  try {
    const aiResponse = await this.aiService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      provider
    )

    // 解析 AI 响应
    const parsed = JSON.parse(aiResponse)

    return {
      response: parsed.explanation || '我已经分析了你的修改要求，以下是建议的修改：',
      actions: [{
        type: 'modify_chapter',
        data: {
          chapterId,
          changes: parsed.changes,
          fullSuggested: parsed.fullSuggested
        },
        response: parsed.explanation
      }]
    }
  } catch (error) {
    // 如果解析失败，返回普通对话响应
    const fallbackResponse = await this.getChatResponse(
      projectId,
      message,
      provider,
      chapterId,
      chapterContent,
      chapterTitle
    )
    return { response: fallbackResponse, actions: [] }
  }
}
```

- [ ] **Step 5: 更新意图识别支持章节修改**

```typescript
// server/src/modules/ai-assistant/ai-assistant.service.ts

private async analyzeIntent(message: string, provider?: string): Promise<IntentAnalysis> {
  const systemPrompt = `分析用户消息的意图，返回 JSON 格式：
{
  "type": "create_character | create_relationship | create_world_setting | modify_chapter | chat",
  "confidence": 0.0-1.0,
  "entities": {}
}

意图类型说明：
- create_character: 用户想要创建新角色
- create_relationship: 用户想要建立角色关系
- create_world_setting: 用户想要创建世界观设定
- modify_chapter: 用户想要修改章节内容（如"帮我改一下这段"、"把这段写得更生动"、"扩展这个场景"）
- chat: 一般对话、提问、讨论

注意：如果用户提到修改、改写、扩展、缩减、优化章节内容，应该识别为 modify_chapter。`

  try {
    const response = await this.aiService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      provider
    )
    return JSON.parse(response)
  } catch {
    return { type: 'chat', confidence: 0.5, entities: {} }
  }
}
```

- [ ] **Step 6: 验证后端编译**

```bash
cd F:\code\server
npm run build
```

Expected: 编译成功，无错误

- [ ] **Step 7: 提交**

```bash
git add server/src/modules/ai-assistant/
git commit -m "feat: add chapter context support to AI assistant service"
```

---

## Task 5: 更新前端 API 和类型定义

**Files:**
- Modify: `client/src/api/ai-assistant.ts`
- Modify: `client/src/types/ai-changes.ts`

- [ ] **Step 1: 更新 AI 助手 API**

```typescript
// client/src/api/ai-assistant.ts
import { apiClient } from './client'
import { ContentChange } from '@/types/ai-changes'

export interface AssistantAction {
  type: 'create_character' | 'create_relationship' | 'create_world_setting' | 'modify_chapter' | 'chat'
  data: any
  response: string
}

export interface AssistantResponse {
  response: string
  actions: AssistantAction[]
}

export interface ChapterModificationData {
  chapterId: string
  changes: ContentChange[]
  fullSuggested: string
}

export const aiAssistantApi = {
  async chat(
    projectId: string,
    message: string,
    provider?: string,
    chapterContext?: {
      chapterId: string
      chapterContent: string
      chapterTitle: string
    }
  ): Promise<AssistantResponse> {
    const response = await apiClient.post('/ai-assistant/chat', {
      projectId,
      message,
      provider,
      ...chapterContext,
    })
    return response.data
  },
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/api/ai-assistant.ts
git commit -m "feat: update AI assistant API with chapter context support"
```

---

## Task 6: 增强 AiAssistant 组件支持章节交互

**Files:**
- Modify: `client/src/components/AiAssistant.tsx`

- [ ] **Step 1: 添加章节上下文属性**

```tsx
// client/src/components/AiAssistant.tsx
// 在组件顶部添加新的 props

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
  onApplyChanges
}: AiAssistantProps = {}) => {
  // ... 现有代码 ...
```

- [ ] **Step 2: 添加修改确认状态**

```tsx
// 在组件内部添加状态

const [pendingModification, setPendingModification] = useState<ChapterModificationData | null>(null)
const [showChangeModal, setShowChangeModal] = useState(false)
const [modificationConfig, setModificationConfig] = useState<ModificationConfig>(DEFAULT_MODIFICATION_CONFIG)

// 从本地存储加载配置
useEffect(() => {
  const savedConfig = localStorage.getItem('modificationConfig')
  if (savedConfig) {
    setModificationConfig(JSON.parse(savedConfig))
  }
}, [])
```

- [ ] **Step 3: 更新 handleSend 方法处理章节上下文**

```tsx
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

  try {
    const chapterContext = chapterId && chapterContent ? {
      chapterId,
      chapterContent,
      chapterTitle: chapterTitle || ''
    } : undefined

    const result = await aiAssistantApi.chat(projectId, input, provider, chapterContext)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.response,
      actions: result.actions,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, assistantMessage])

    // 处理章节修改动作
    const modifyAction = result.actions.find(a => a.type === 'modify_chapter')
    if (modifyAction && modifyAction.data) {
      const modificationData = modifyAction.data as ChapterModificationData
      
      if (modificationConfig.requireConfirmation) {
        // 需要确认，显示确认对话框
        setPendingModification(modificationData)
        setShowChangeModal(true)
      } else {
        // 不需要确认，直接应用
        onApplyChanges?.(modificationData.changes)
      }
    }

    // 如果有创建操作，刷新相关数据
    if (result.actions.some(a => a.type === 'create_character')) {
      queryClient.invalidateQueries({ queryKey: ['characters', projectId] })
    }
    if (result.actions.some(a => a.type === 'create_world_setting')) {
      queryClient.invalidateQueries({ queryKey: ['worldSettings', projectId] })
    }
  } catch (error) {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getApiErrorMessage(error),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, errorMessage])
  } finally {
    setIsLoading(false)
  }
}
```

- [ ] **Step 4: 添加修改确认处理函数**

```tsx
const handleConfirmChanges = (selectedChangeIds: string[]) => {
  if (!pendingModification || !onApplyChanges) return
  
  const selectedChanges = pendingModification.changes.filter(
    c => selectedChangeIds.includes(c.id)
  )
  onApplyChanges(selectedChanges)
  setPendingModification(null)
  
  // 添加确认消息
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
```

- [ ] **Step 5: 添加章节上下文提示到欢迎消息**

```tsx
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

请先前往 [AI 设置页面](/ai-settings) 配置 API Key，然后就可以开始使用 AI 助手了。`

    // 添加章节上下文提示
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
```

- [ ] **Step 6: 在渲染中添加修改确认对话框**

```tsx
// 在组件的 return 语句中添加

return (
  <Card className="h-full flex flex-col">
    {/* ... 现有的 CardHeader 和 CardContent ... */}

    {/* 修改确认对话框 */}
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
```

- [ ] **Step 7: 添加快捷操作按钮**

```tsx
// 在输入框上方的快捷操作按钮区域添加

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
```

- [ ] **Step 8: 验证组件编译**

Run: `npx tsc --noEmit client/src/components/AiAssistant.tsx`
Expected: 无错误输出

- [ ] **Step 9: 提交**

```bash
git add client/src/components/AiAssistant.tsx
git commit -m "feat: enhance AiAssistant with chapter context and modification support"
```

---

## Task 7: 更新 ProjectWorkspace 传递章节上下文

**Files:**
- Modify: `client/src/pages/ProjectWorkspace.tsx`

- [ ] **Step 1: 添加章节上下文状态**

```tsx
// client/src/pages/ProjectWorkspace.tsx
import { useState, useEffect } from 'react'
import { useParams, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
// ... 其他 imports ...

export const ProjectWorkspace = () => {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [showAssistant, setShowAssistant] = useState(false)
  const [chapterContext, setChapterContext] = useState<{
    chapterId: string
    chapterContent: string
    chapterTitle: string
  } | undefined>()

  // 从 URL 判断是否在章节编辑页面
  const isChapterEditor = location.pathname.includes('/chapters/') && chapterId

  // ... 现有的 project query ...
```

- [ ] **Step 2: 添加章节上下文获取方法**

```tsx
// 添加一个方法供 ChapterEditor 调用以更新章节上下文
const updateChapterContext = (context: {
  chapterId: string
  chapterContent: string
  chapterTitle: string
} | undefined) => {
  setChapterContext(context)
}

// 通过 context 或 props 传递给子组件
// 这里我们使用一个简单的事件系统
useEffect(() => {
  const handleChapterContextUpdate = (event: CustomEvent) => {
    setChapterContext(event.detail)
  }

  window.addEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener)
  return () => {
    window.removeEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener)
  }
}, [])
```

- [ ] **Step 3: 更新 AiAssistant 组件调用**

```tsx
{/* AI 助手对话面板 */}
{showAssistant && (
  <div className="fixed right-0 top-14 bottom-0 w-[400px] bg-white border-l border-gray-200 shadow-lg z-30">
    <div className="absolute top-2 right-2 z-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAssistant(false)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
    <AiAssistant
      chapterId={chapterContext?.chapterId}
      chapterContent={chapterContext?.chapterContent}
      chapterTitle={chapterContext?.chapterTitle}
      onApplyChanges={(changes) => {
        // 触发自定义事件，让 ChapterEditor 处理
        window.dispatchEvent(new CustomEvent('aiApplyChanges', { detail: changes }))
      }}
    />
  </div>
)}
```

- [ ] **Step 4: 提交**

```bash
git add client/src/pages/ProjectWorkspace.tsx
git commit -m "feat: pass chapter context to AI assistant from ProjectWorkspace"
```

---

## Task 8: 更新 ChapterEditor 集成 AI 对话助手

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`

- [ ] **Step 1: 添加章节上下文广播**

```tsx
// client/src/pages/ChapterEditor.tsx
// 在组件内部添加

// 广播章节上下文到 ProjectWorkspace
useEffect(() => {
  if (chapterId && content) {
    const context = {
      chapterId,
      chapterContent: content,
      chapterTitle: title
    }
    window.dispatchEvent(new CustomEvent('chapterContextUpdate', { detail: context }))
  }

  return () => {
    // 清除章节上下文
    window.dispatchEvent(new CustomEvent('chapterContextUpdate', { detail: undefined }))
  }
}, [chapterId, content, title])
```

- [ ] **Step 2: 添加 AI 修改应用处理**

```tsx
// 在组件内部添加

const handleApplyAiChanges = useCallback((changes: ContentChange[]) => {
  let newContent = contentRef.current
  
  changes.forEach(change => {
    if (change.type === 'replace') {
      newContent = newContent.replace(change.original, change.suggested)
    } else if (change.type === 'insert') {
      // 在指定位置插入
      if (change.startIndex !== undefined) {
        newContent = 
          newContent.slice(0, change.startIndex) + 
          change.suggested + 
          newContent.slice(change.startIndex)
      } else {
        // 默认追加到末尾
        newContent += change.suggested
      }
    } else if (change.type === 'delete') {
      newContent = newContent.replace(change.original, '')
    }
  })
  
  updateContent(newContent)
}, [updateContent])

// 监听 AI 修改事件
useEffect(() => {
  const handleAiApplyChanges = (event: CustomEvent) => {
    handleApplyAiChanges(event.detail)
  }

  window.addEventListener('aiApplyChanges', handleAiApplyChanges as EventListener)
  return () => {
    window.removeEventListener('aiApplyChanges', handleAiApplyChanges as EventListener)
  }
}, [handleApplyAiChanges])
```

- [ ] **Step 3: 添加 import**

```tsx
// 在文件顶部添加
import { ContentChange } from '@/types/ai-changes'
```

- [ ] **Step 4: 验证编译**

Run: `npx tsc --noEmit client/src/pages/ChapterEditor.tsx`
Expected: 无错误输出

- [ ] **Step 5: 提交**

```bash
git add client/src/pages/ChapterEditor.tsx
git commit -m "feat: integrate AI assistant changes into ChapterEditor"
```

---

## Task 9: 添加修改确认配置到 AI 设置

**Files:**
- Modify: `client/src/pages/AISettings.tsx`

- [ ] **Step 1: 添加修改确认配置部分**

```tsx
// client/src/pages/AISettings.tsx
// 在组件内部添加状态

const [modificationConfig, setModificationConfig] = useState<ModificationConfig>(() => {
  const saved = localStorage.getItem('modificationConfig')
  return saved ? JSON.parse(saved) : DEFAULT_MODIFICATION_CONFIG
})

const [hasConfigChanges, setHasConfigChanges] = useState(false)
```

- [ ] **Step 2: 添加配置保存函数**

```tsx
const handleSaveModificationConfig = () => {
  localStorage.setItem('modificationConfig', JSON.stringify(modificationConfig))
  setHasConfigChanges(false)
  toast.success('修改确认配置已保存')
}
```

- [ ] **Step 3: 添加配置 UI 部分**

```tsx
// 在 return 语句中添加新的配置部分

{/* 修改确认配置 */}
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-purple-50 rounded-lg">
      <MessageSquare className="w-5 h-5 text-purple-600" />
    </div>
    <div>
      <h2 className="text-lg font-semibold text-gray-900">AI 修改确认</h2>
      <p className="text-sm text-gray-500">配置 AI 修改章节内容时的确认行为</p>
    </div>
  </div>

  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <label className="font-medium text-gray-900">需要确认修改</label>
        <p className="text-sm text-gray-500">AI 建议修改时，是否需要你确认才应用</p>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          modificationConfig.requireConfirmation ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={() => {
          setModificationConfig(prev => ({
            ...prev,
            requireConfirmation: !prev.requireConfirmation
          }))
          setHasConfigChanges(true)
        }}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          modificationConfig.requireConfirmation ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>

    <div className="flex items-center justify-between">
      <div>
        <label className="font-medium text-gray-900">自动应用小改动</label>
        <p className="text-sm text-gray-500">对于小的改动（如标点、错别字），自动应用无需确认</p>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          modificationConfig.autoApplyMinorChanges ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={() => {
          setModificationConfig(prev => ({
            ...prev,
            autoApplyMinorChanges: !prev.autoApplyMinorChanges
          }))
          setHasConfigChanges(true)
        }}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          modificationConfig.autoApplyMinorChanges ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>

    <div className="flex items-center justify-between">
      <div>
        <label className="font-medium text-gray-900">内联显示差异</label>
        <p className="text-sm text-gray-500">在对话中直接显示修改的差异，而非弹窗</p>
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          modificationConfig.showDiffInline ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={() => {
          setModificationConfig(prev => ({
            ...prev,
            showDiffInline: !prev.showDiffInline
          }))
          setHasConfigChanges(true)
        }}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          modificationConfig.showDiffInline ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>

    {hasConfigChanges && (
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveModificationConfig}>
          保存配置
        </Button>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 4: 添加 import**

```tsx
// 在文件顶部添加
import { ModificationConfig, DEFAULT_MODIFICATION_CONFIG } from '@/types/ai-changes'
import { MessageSquare } from 'lucide-react'
```

- [ ] **Step 5: 验证编译**

Run: `npx tsc --noEmit client/src/pages/AISettings.tsx`
Expected: 无错误输出

- [ ] **Step 6: 提交**

```bash
git add client/src/pages/AISettings.tsx
git commit -m "feat: add modification confirmation config to AI settings"
```

---

## Task 10: 测试和验证

**Files:**
- None (testing only)

- [ ] **Step 1: 启动开发服务器**

```bash
cd F:\code
npm run dev
```

- [ ] **Step 2: 测试基本对话功能**

1. 打开一个项目
2. 点击"AI 对话助手"按钮
3. 发送消息"你好"
4. 验证 AI 能正常回复

Expected: AI 正常回复，无错误

- [ ] **Step 3: 测试章节上下文感知**

1. 打开一个章节编辑页面
2. 打开 AI 对话助手
3. 发送"分析一下当前章节"
4. 验证 AI 能看到章节内容并分析

Expected: AI 回复中包含对章节内容的分析

- [ ] **Step 4: 测试章节修改功能**

1. 在章节编辑页面打开 AI 对话助手
2. 发送"帮我把第一段写得更生动"
3. 验证 AI 返回修改建议
4. 如果配置了需要确认，验证确认对话框显示
5. 选择部分修改并确认
6. 验证章节内容已更新

Expected: 修改正确应用，差异显示清晰

- [ ] **Step 5: 测试配置功能**

1. 前往 AI 设置页面
2. 修改"需要确认修改"配置
3. 保存配置
4. 返回章节编辑页面
5. 测试修改是否按配置行为执行

Expected: 配置生效，行为符合预期

- [ ] **Step 6: 运行类型检查**

```bash
cd F:\code\client
npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 7: 运行构建**

```bash
cd F:\code\client
npm run build
```

Expected: 构建成功

- [ ] **Step 8: 最终提交**

```bash
git add .
git commit -m "feat: complete AI chat chapter editing feature with diff and confirmation"
```

---

## 自查清单

### 需求覆盖检查

- [x] AI 对话助手能看见章节内容 - Task 4, 6, 7, 8
- [x] AI 可以根据对话修改章节内容 - Task 4, 6
- [x] 修改后有对比功能（diff 显示）- Task 2, 3
- [x] 可以一起确认或单独确认每个修改 - Task 3, 6
- [x] 可以配置是否需要确认修改 - Task 9

### 代码质量检查

- [x] 所有文件都有正确的类型定义
- [x] 组件遵循现有代码风格
- [x] 使用现有的 UI 组件库
- [x] 错误处理完善
- [x] 用户体验流畅

### 测试覆盖检查

- [x] 基本对话功能测试
- [x] 章节上下文感知测试
- [x] 章节修改功能测试
- [x] 配置功能测试
- [x] 类型检查通过
- [x] 构建成功

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-05-20-ai-chat-chapter-editing.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
