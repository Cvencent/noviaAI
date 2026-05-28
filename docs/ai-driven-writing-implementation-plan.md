# AI 驱动的写作系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构现有系统，让所有功能都通过AI对话完成，添加对话历史管理和对话卡片选择功能

**Architecture:** 
- 左侧栏：对话列表 + 文件浏览器
- 中间栏：AI对话核心界面
- 右侧栏：内容预览和编辑区
- 数据：对话与项目关联存储

**Tech Stack:** React 18 + TypeScript + Vite + NestJS + SQLite

---

## 文件结构

| 文件 | 操作 | 描述 |
|------|------|------|
| `client/src/types/conversation.ts` | 创建 | 对话类型定义 |
| `client/src/api/conversations.ts` | 创建 | 对话API |
| `client/src/components/ConversationList.tsx` | 创建 | 对话列表组件 |
| `client/src/components/ChoiceCard.tsx` | 创建 | 对话卡片组件 |
| `client/src/components/ProjectExplorer.tsx` | 修改 | 整合对话列表 |
| `client/src/components/AiAssistant.tsx` | 修改 | 升级为支持卡片和对话管理 |
| `client/src/pages/ProjectWorkspace.tsx` | 修改 | 整合所有新组件 |
| `server/src/modules/conversations/` | 创建 | 后端对话模块 |
| `server/prisma/schema.prisma` | 修改 | 添加对话表定义 |

---

## 阶段一：数据模型和API基础

### Task 1: 添加对话数据模型到Prisma

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: 编辑 Prisma 模式，添加Conversation和Message表**

```prisma
// 在文件末尾添加
model Conversation {
  id        String   @id @default(cuid())
  projectId String
  title     String
  type      String   @default("general") // general, character, plot, world, chapter, outline
  messages  Message[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // user, assistant
  content        String
  timestamp      DateTime @default(now())
  actionsJson    Json?    // 序列化的AssistantAction[]
  cardsJson      Json?    // 序列化的ChoiceCard[]
  
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@index([conversationId])
}
```

- [ ] **Step 2: 生成数据库迁移**

```bash
cd server
npm run prisma:migrate --name add_conversations
```

- [ ] **Step 3: 生成Prisma客户端**

```bash
npm run prisma:generate
```

### Task 2: 创建前端对话类型定义

**Files:**
- Create: `client/src/types/conversation.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
export interface Conversation {
  id: string
  projectId: string
  title: string
  type: 'general' | 'character' | 'plot' | 'world' | 'chapter' | 'outline'
  createdAt: Date
  updatedAt: Date
  messages?: Message[]
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionsJson?: any
  cardsJson?: ChoiceCard[]
}

export interface ChoiceCard {
  id: string
  title: string
  description: string
  content?: any
  actionType: string
}
```

### Task 3: 创建前端对话API

**Files:**
- Create: `client/src/api/conversations.ts`

- [ ] **Step 1: 创建API文件**

```typescript
import { client } from './client'
import type { Conversation, Message, ChoiceCard } from '../types/conversation'

export const conversationsApi = {
  getAll: async (projectId: string): Promise<Conversation[]> => {
    const response = await client.get(`/projects/${projectId}/conversations`)
    return response.data
  },

  create: async (projectId: string, data: { title: string; type?: string }): Promise<Conversation> => {
    const response = await client.post(`/projects/${projectId}/conversations`, data)
    return response.data
  },

  getById: async (projectId: string, id: string): Promise<Conversation> => {
    const response = await client.get(`/projects/${projectId}/conversations/${id}`)
    return response.data
  },

  update: async (projectId: string, id: string, data: Partial<Conversation>): Promise<Conversation> => {
    const response = await client.patch(`/projects/${projectId}/conversations/${id}`, data)
    return response.data
  },

  delete: async (projectId: string, id: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/conversations/${id}`)
  },

  sendMessage: async (projectId: string, id: string, message: { content: string; role: string }): Promise<Message> => {
    const response = await client.post(`/projects/${projectId}/conversations/${id}/messages`, message)
    return response.data
  },

  selectCard: async (projectId: string, conversationId: string, cardId: string): Promise<any> => {
    const response = await client.post(`/projects/${projectId}/conversations/${conversationId}/cards/${cardId}/select`)
    return response.data
  },
}
```

---

## 阶段二：后端对话模块

### Task 4: 创建后端对话控制器

**Files:**
- Create: `server/src/modules/conversations/conversations.controller.ts`
- Create: `server/src/modules/conversations/conversations.service.ts`
- Create: `server/src/modules/conversations/conversations.module.ts`
- Create: `server/src/modules/conversations/dto/create-conversation.dto.ts`
- Create: `server/src/modules/conversations/dto/create-message.dto.ts`

- [ ] **Step 1: 创建DTO文件**

`server/src/modules/conversations/dto/create-conversation.dto.ts`:
```typescript
import { IsString, IsOptional } from 'class-validator'

export class CreateConversationDto {
  @IsString()
  title: string

  @IsString()
  @IsOptional()
  type?: string
}
```

`server/src/modules/conversations/dto/create-message.dto.ts`:
```typescript
import { IsString } from 'class-validator'

export class CreateMessageDto {
  @IsString()
  content: string

  @IsString()
  role: string
}
```

- [ ] **Step 2: 创建服务层**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { CreateMessageDto } from './dto/create-message.dto'

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.conversation.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: false },
    })
  }

  async create(projectId: string, createConversationDto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        projectId,
        title: createConversationDto.title,
        type: createConversationDto.type || 'general',
      },
    })
  }

  async findOne(projectId: string, id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id, projectId },
      include: { 
        messages: { 
          orderBy: { timestamp: 'asc' } 
        } 
      },
    })
    
    if (!conversation) {
      throw new NotFoundException('Conversation not found')
    }
    
    return conversation
  }

  async update(projectId: string, id: string, updateData: any) {
    return this.prisma.conversation.update({
      where: { id, projectId },
      data: updateData,
    })
  }

  async remove(projectId: string, id: string) {
    await this.prisma.conversation.delete({
      where: { id, projectId },
    })
  }

  async createMessage(projectId: string, id: string, createMessageDto: CreateMessageDto) {
    const conversation = await this.findOne(projectId, id)
    
    return this.prisma.message.create({
      data: {
        conversationId: id,
        role: createMessageDto.role,
        content: createMessageDto.content,
      },
    })
  }
}
```

- [ ] **Step 3: 创建控制器**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { CreateMessageDto } from './dto/create-message.dto'

@Controller('projects/:projectId/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.conversationsService.findAll(projectId)
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.create(projectId, createConversationDto)
  }

  @Get(':id')
  findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.conversationsService.findOne(projectId, id)
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.conversationsService.update(projectId, id, updateData)
  }

  @Delete(':id')
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.conversationsService.remove(projectId, id)
  }

  @Post(':id/messages')
  createMessage(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.conversationsService.createMessage(projectId, id, createMessageDto)
  }

  @Post(':id/cards/:cardId/select')
  selectCard(
    @Param('projectId') projectId: string,
    @Param('id') conversationId: string,
    @Param('cardId') cardId: string,
  ) {
    // 卡片选择逻辑将在后续添加
    return { success: true, cardId }
  }
}
```

- [ ] **Step 4: 创建模块文件**

```typescript
import { Module } from '@nestjs/common'
import { ConversationsController } from './conversations.controller'
import { ConversationsService } from './conversations.service'

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
```

- [ ] **Step 5: 在主模块中注册**

修改 `server/src/app.module.ts`:
```typescript
// 导入ConversationsModule
import { ConversationsModule } from './modules/conversations/conversations.module'

// 在imports中添加
@Module({
  imports: [
    // ... 其他模块
    ConversationsModule,
  ],
  // ...
})
```

---

## 阶段三：前端UI组件

### Task 5: 创建对话列表组件

**Files:**
- Create: `client/src/components/ConversationList.tsx`

- [ ] **Step 1: 创建对话列表组件**

```typescript
import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react'
import { conversationsApi } from '../api/conversations'
import type { Conversation } from '../types/conversation'
import { cn } from '../utils/cn'
import { Button } from './ui/Button'

interface ConversationListProps {
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onCreateConversation: () => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
}) => {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => (projectId ? conversationsApi.getAll(projectId) : []),
    enabled: !!projectId,
  })

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!projectId) return
    
    if (confirm('确定要删除这个对话吗？')) {
      await conversationsApi.delete(projectId, id)
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'character': return '👥'
      case 'plot': return '📊'
      case 'world': return '🌍'
      case 'chapter': return '📄'
      case 'outline': return '📋'
      default: return '💬'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-[#333] flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">对话</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateConversation}
          className="h-7 w-7 p-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "w-full px-3 py-2 flex items-center gap-2 text-left transition-colors",
              currentConversationId === conversation.id
                ? "bg-[#094771] text-white"
                : "text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200"
            )}
          >
            <span className="text-sm">{getTypeIcon(conversation.type)}</span>
            <span className="flex-1 text-xs truncate">
              {conversation.title}
            </span>
            <button
              onClick={(e) => handleDelete(e, conversation.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        ))}

        {conversations.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-500">
            还没有对话，点击 + 创建新对话
          </div>
        )}
      </div>
    </div>
  )
}
```

### Task 6: 创建选择卡片组件

**Files:**
- Create: `client/src/components/ChoiceCard.tsx`

- [ ] **Step 1: 创建卡片组件**

```typescript
import React from 'react'
import { Check, X, RotateCcw } from 'lucide-react'
import { cn } from '../utils/cn'
import { Button } from './ui/Button'
import type { ChoiceCard as ChoiceCardType } from '../types/conversation'

interface ChoiceCardProps {
  card: ChoiceCardType
  isSelected?: boolean
  isDisabled?: boolean
  onSelect?: (card: ChoiceCardType) => void
  onRetry?: () => void
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  card,
  isSelected,
  isDisabled,
  onSelect,
  onRetry,
}) => {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all cursor-pointer group",
        isSelected
          ? "border-[#007acc] bg-[#0e4770]/30"
          : "border-[#555] bg-[#2d2d2d] hover:border-[#007acc]/50",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isDisabled && onSelect?.(card)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-200">{card.title}</h4>
        {isSelected && <Check className="w-4 h-4 text-[#007acc]" />}
      </div>
      
      <p className="text-xs text-gray-400 mb-3">{card.description}</p>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 text-xs h-7"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(card)
          }}
          disabled={isDisabled}
        >
          {isSelected ? '已选择' : '选择此方案'}
        </Button>
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={(e) => {
              e.stopPropagation()
              onRetry()
            }}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            重新提议
          </Button>
        )}
      </div>
    </div>
  )
}

interface ChoiceCardGroupProps {
  cards: ChoiceCardType[]
  selectedCardId?: string
  onSelectCard?: (card: ChoiceCardType) => void
  onRetry?: () => void
}

export const ChoiceCardGroup: React.FC<ChoiceCardGroupProps> = ({
  cards,
  selectedCardId,
  onSelectCard,
  onRetry,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-2">
        我为你提供了{cards.length}个方案，请选择：
      </p>
      <div className="grid gap-3">
        {cards.map((card) => (
          <ChoiceCard
            key={card.id}
            card={card}
            isSelected={selectedCardId === card.id}
            onSelect={onSelectCard}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 阶段四：整合和升级现有组件

### Task 7: 升级 ProjectExplorer

**Files:**
- Modify: `client/src/components/ProjectExplorer.tsx`

- [ ] **Step 1: 修改组件，整合对话列表**

```typescript
// 在文件开头添加
import { ConversationList } from './ConversationList'

// 修改props
interface ProjectExplorerProps {
  onOpenRoute?: (path: string) => void
  currentConversationId?: string
  onSelectConversation?: (id: string) => void
  onCreateConversation?: () => void
}

// 修改渲染结构
export const ProjectExplorer = ({ 
  onOpenRoute,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
}: ProjectExplorerProps) => {
  // ... 现有代码保持不变 ...

  return (
    <div className="h-full bg-[#1e1e1e] text-gray-300 flex flex-col">
      {/* ... 现有项目选择部分保持不变 ... */}
      
      {/* 添加对话列表 */}
      <div className="border-b border-[#333]">
        <ConversationList
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation || (() => {})}
          onCreateConversation={onCreateConversation || (() => {})}
        />
      </div>
      
      {/* ... 现有文件浏览器部分 ... */}
    </div>
  )
}
```

### Task 8: 升级 AiAssistant

**Files:**
- Modify: `client/src/components/AiAssistant.tsx`

- [ ] **Step 1: 升级AiAssistant支持对话管理和卡片**

```typescript
// 添加导入
import { ChoiceCardGroup, ChoiceCard } from './ChoiceCard'
import type { Conversation, Message, ChoiceCard as ChoiceCardType } from '../types/conversation'
import { conversationsApi } from '../api/conversations'

// 修改props
interface AiAssistantProps {
  chapterId?: string
  chapterContent?: string
  chapterTitle?: string
  onApplyChanges?: (changes: any[]) => void
  onOpenRoute?: (path: string) => void
  onOpenAISettings?: () => void
  conversationId?: string
  onConversationChange?: (id: string) => void
}

// 在组件中添加对话管理逻辑
export const AiAssistant = ({
  chapterId,
  chapterContent,
  chapterTitle,
  onApplyChanges,
  onOpenRoute,
  onOpenAISettings,
  conversationId,
  onConversationChange,
}: AiAssistantProps = {}) => {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  
  // 添加对话相关状态
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  
  // 加载对话
  const { refetch: refetchConversation } = useQuery({
    queryKey: ['conversation', projectId, conversationId],
    queryFn: () => (projectId && conversationId ? conversationsApi.getById(projectId, conversationId) : null),
    enabled: !!projectId && !!conversationId,
    onSuccess: (data) => {
      if (data) {
        setCurrentConversation(data)
        setMessages(data.messages || [])
      }
    },
  })
  
  // 修改handleSend，添加保存到对话的逻辑
  const handleSend = async () => {
    // ... 现有逻辑 ...
    
    // 如果有对话，保存消息
    if (conversationId && projectId) {
      // 保存用户消息
      await conversationsApi.sendMessage(projectId, conversationId, {
        content: input,
        role: 'user',
      })
      
      // 保存AI回复（在onDone中也需要处理）
    }
  }
  
  // 添加处理卡片选择
  const handleSelectCard = async (card: ChoiceCardType) => {
    setSelectedCardId(card.id)
    // 执行卡片对应的操作
    if (conversationId && projectId) {
      await conversationsApi.selectCard(projectId, conversationId, card.id)
    }
  }
  
  // ... 修改消息渲染，添加卡片显示 ...
  
  // 在消息渲染中添加卡片
  {message.cardsJson && message.cardsJson.length > 0 && (
    <div className="mt-3">
      <ChoiceCardGroup
        cards={message.cardsJson}
        selectedCardId={selectedCardId}
        onSelectCard={handleSelectCard}
      />
    </div>
  )}
  
  // ... 其他代码保持不变 ...
}
```

### Task 9: 升级 ProjectWorkspace

**Files:**
- Modify: `client/src/pages/ProjectWorkspace.tsx`

- [ ] **Step 1: 整合所有新功能**

```typescript
// 添加导入
import { conversationsApi } from '../api/conversations'
import type { Conversation } from '../types/conversation'

// 在组件中添加对话管理
export const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // 添加对话状态
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  
  // 处理创建新对话
  const handleCreateConversation = async () => {
    if (!projectId) return
    
    const title = `新对话 ${new Date().toLocaleTimeString()}`
    const conversation = await conversationsApi.create(projectId, { title })
    setCurrentConversationId(conversation.id)
    queryClient.invalidateQueries({ queryKey: ['conversations', projectId] })
  }
  
  // 处理选择对话
  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
  }
  
  // 初始化默认对话
  useEffect(() => {
    if (projectId && !currentConversationId) {
      // 加载第一个对话或创建默认对话
      conversationsApi.getAll(projectId).then(convs => {
        if (convs.length > 0) {
          setCurrentConversationId(convs[0].id)
        } else {
          handleCreateConversation()
        }
      })
    }
  }, [projectId])
  
  // 修改传递给ProjectExplorer的props
  <ProjectExplorer
    onOpenRoute={handleOpenRoute}
    currentConversationId={currentConversationId}
    onSelectConversation={handleSelectConversation}
    onCreateConversation={handleCreateConversation}
  />
  
  // 修改传递给AiAssistant的props
  <AiAssistant
    chapterId={chapterContext?.chapterId}
    chapterContent={chapterContext?.chapterContent}
    chapterTitle={chapterContext?.chapterTitle}
    onApplyChanges={handleApplyChanges}
    onOpenRoute={handleOpenRoute}
    onOpenAISettings={() => openTab('ai-settings', 'AI 设置', <Cpu className="w-3.5 h-3.5" />)}
    conversationId={currentConversationId}
  />
  
  // ... 其他代码保持不变 ...
}
```

---

## 阶段五：优化和测试

### Task 10: 测试和优化

**Files:**
- All modified files

- [ ] **Step 1: 运行类型检查**

```bash
cd client
npm run build
```

- [ ] **Step 2: 运行后端构建**

```bash
cd server
npm run build
```

- [ ] **Step 3: 启动开发服务器测试**

```bash
# 终端1 - 后端
cd server
npm run start:dev

# 终端2 - 前端
cd client
npm run dev
```

- [ ] **Step 4: 完整功能测试**

1. 创建新对话
2. 通过对话创建角色
3. 通过对话管理章节
4. 测试卡片选择功能
5. 验证数据持久化

---

## 执行说明

这个计划包含了5个阶段共10个主要任务。每个任务都可以独立执行并验证。

建议按顺序执行，每个阶段完成后测试通过再进入下一阶段。
