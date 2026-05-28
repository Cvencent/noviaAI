import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CharactersService } from '../characters/characters.service'
import { WorldSettingsService } from '../world-settings/world-settings.service'
import { AiService } from '../ai/ai.service'
import { AIAction, AIProvider } from '../ai-config/dto/create-ai-config.dto'
import { StorySystemService } from '../story-system/story-system.service'

type ProviderName = `${AIProvider}`
type ConversationHistoryMessage = { role: 'user' | 'assistant'; content: string }

export interface AssistantAction {
  type: 'create_character' | 'update_character' | 'create_relationship' | 'create_world_setting' | 'modify_chapter' | 'chat' | 'unknown'
  data: any
  response: string
}

export interface AssistantActionCard {
  id: string
  title: string
  description: string
  actionType: 'AI_ACTION'
  content: {
    actionType: string
    parameters: Record<string, any>
    targetRoute?: string
  }
}

export interface AssistantPromptCard {
  id: string
  title: string
  description: string
  actionType: 'SUGGEST_PROMPT'
  content: {
    prompt: string
  }
}

export type AssistantCard = AssistantActionCard | AssistantPromptCard

@Injectable()
export class AiAssistantService {
  constructor(
    private prisma: PrismaService,
    private charactersService: CharactersService,
    private worldSettingsService: WorldSettingsService,
    private aiService: AiService,
    @Optional() private storySystemService?: StorySystemService,
  ) {}

  async processMessage(
    userId: string,
    projectId: string,
    message: string,
    provider?: ProviderName,
    chapterId?: string,
    chapterContent?: string,
    chapterTitle?: string,
    conversationHistory?: ConversationHistoryMessage[],
  ): Promise<{
    response: string
    actions: AssistantAction[]
  }> {
    // 使用 AI 分析用户意图
    const intent = await this.analyzeIntent(userId, projectId, message, provider, chapterContent, conversationHistory)
    
    const actions: AssistantAction[] = []
    let response = ''

    switch (intent.type) {
      case 'create_character':
        const characterResult = await this.handleCreateCharacter(projectId, intent.data)
        actions.push(characterResult)
        response = characterResult.response
        break

      case 'update_character':
        const updateCharacterResult = await this.handleUpdateCharacter(projectId, intent.data)
        actions.push(updateCharacterResult)
        response = updateCharacterResult.response
        break

      case 'create_relationship':
        const relationshipResult = await this.handleCreateRelationship(projectId, intent.data)
        actions.push(relationshipResult)
        response = relationshipResult.response
        break

      case 'create_world_setting':
        const worldResult = await this.handleCreateWorldSetting(userId, projectId, intent.data)
        actions.push(worldResult)
        response = worldResult.response
        break

      case 'modify_chapter':
        const modifyResult = await this.handleModifyChapter(
          userId,
          projectId,
          message,
          chapterId,
          chapterContent,
          chapterTitle,
          provider,
        )
        actions.push(modifyResult)
        response = modifyResult.response
        break

      default:
        // 普通对话，使用 AI 回复
        response = await this.getChatResponse(
          userId,
          projectId,
          message,
          provider,
          chapterId,
          chapterContent,
          chapterTitle,
          conversationHistory,
        )
        break
    }

    return { response, actions }
  }

  private async analyzeIntent(
    userId: string,
    projectId: string,
    message: string,
    provider?: ProviderName,
    chapterContent?: string,
    conversationHistory?: ConversationHistoryMessage[],
  ): Promise<{ type: string; data: any }> {
    const hasChapterContext = chapterContent && chapterContent.trim().length > 0
    const historyContext = this.formatConversationHistory(conversationHistory)
    const memoryContext = await this.buildLongTermMemoryContext(userId, projectId, message)

    const systemMessage = `你是一个意图分析助手。分析用户的消息，判断他们想要做什么。

返回 JSON 格式：
{
  "type": "create_character" | "update_character" | "create_relationship" | "create_world_setting" | "modify_chapter" | "chat",
  "data": { ... }
}

对于 create_character，data 应该包含：
{
  "name": "角色名",
  "role": "主角/反派/配角等",
  "appearance": "外貌描述",
  "personality": "性格特点",
  "background": "背景故事",
  "goals": "目标",
  "flaws": "缺陷"
}

对于 update_character（当用户要求调整、修改、增强、完善某个已有角色的设定时使用），data 应该包含：
{
  "name": "角色名（必须是已存在的角色）",
  "personality": "新的性格特点（如果用户提到）",
  "background": "新的背景故事（如果用户提到）",
  "goals": "新的目标（如果用户提到）",
  "flaws": "新的缺陷（如果用户提到）",
  "appearance": "新的外貌描述（如果用户提到）"
}

对于 create_relationship，data 应该包含：
{
  "fromCharacter": "角色名1",
  "toCharacter": "角色名2",
  "relationship": "关系类型",
  "description": "关系描述"
}

对于 create_world_setting，data 应该包含：
{
  "category": "分类",
  "name": "设定名称",
  "description": "设定描述"
}

${hasChapterContext ? `对于 modify_chapter（当用户要求修改、改写、优化、扩展章节内容时使用），data 应该包含：
{
  "description": "修改要求的简要描述"
}` : ''}

判断规则：
- 如果用户提到修改、改写、优化、扩展、缩减章节内容，且有章节上下文，返回 modify_chapter
- 如果用户要求调整、修改、增强、完善某个已有角色的设定、性格、背景等，返回 update_character
- 如果用户明确要求创建一个具名角色，返回 create_character
- 如果用户要求"基于刚才/上面/大纲"生成主要角色设定、人物方案、角色表、角色关系梳理，返回 chat，不要直接创建一个笼统的"主要角色"
- 如果用户提到角色关系，返回 create_relationship
- 如果用户提到世界观、设定，返回 create_world_setting
- 其他情况返回 chat

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: `${systemMessage}\n\n${historyContext ? `近期对话上下文：\n${historyContext}\n\n` : ''}${memoryContext ? `项目长期记忆：\n${memoryContext}\n\n` : ''}用户消息：${message}`,
      provider,
      action: AIAction.DIALOGUE_GENERATION,
      temperature: 0.3,
    })

    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.type === 'create_character' && this.isContextualCharacterPlanningRequest(message)) {
          return { type: 'chat', data: {} }
        }
        return parsed
      }
      return { type: 'chat', data: {} }
    } catch {
      return { type: 'chat', data: {} }
    }
  }

  private async handleCreateCharacter(
    projectId: string,
    data: any,
  ): Promise<AssistantAction> {
    try {
      const character = await this.charactersService.create(projectId, {
        name: data.name,
        role: data.role || '其他',
        appearance: data.appearance,
        personality: data.personality,
        background: data.background,
        goals: data.goals,
        flaws: data.flaws,
      })

      return {
        type: 'create_character',
        data: character,
        response: `已创建角色「${data.name}」！\n\n` +
          `• 角色定位：${data.role || '其他'}\n` +
          (data.appearance ? `• 外貌：${data.appearance}\n` : '') +
          (data.personality ? `• 性格：${data.personality}\n` : '') +
          (data.background ? `• 背景：${data.background}\n` : '') +
          `\n你可以在人物页面查看和编辑这个角色。`,
      }
    } catch (error) {
      return {
        type: 'create_character',
        data: null,
        response: `创建角色失败：${error.message}`,
      }
    }
  }

  private async handleUpdateCharacter(
    projectId: string,
    data: any,
  ): Promise<AssistantAction> {
    try {
      // 查找角色
      const characters = await this.charactersService.findAllWithoutPagination(projectId)
      const character = characters.find(c => c.name === data.name)

      if (!character) {
        return {
          type: 'update_character',
          data: null,
          response: `找不到角色「${data.name}」。请检查角色名称是否正确。`,
        }
      }

      // 构建更新数据
      const updateData: any = {}
      if (data.personality) updateData.personality = data.personality
      if (data.background) updateData.background = data.background
      if (data.goals) updateData.goals = data.goals
      if (data.flaws) updateData.flaws = data.flaws
      if (data.appearance) updateData.appearance = data.appearance
      if (data.role) updateData.role = data.role

      if (Object.keys(updateData).length === 0) {
        return {
          type: 'update_character',
          data: null,
          response: `没有提供要更新的内容。请说明你想调整角色「${data.name}」的哪些方面。`,
        }
      }

      const updatedCharacter = await this.charactersService.update(projectId, character.id, updateData)

      return {
        type: 'update_character',
        data: updatedCharacter,
        response: `已更新角色「${data.name}」的设定！\n\n` +
          (updateData.personality ? `• 性格：${updateData.personality}\n` : '') +
          (updateData.background ? `• 背景：${updateData.background}\n` : '') +
          (updateData.goals ? `• 目标：${updateData.goals}\n` : '') +
          (updateData.flaws ? `• 缺陷：${updateData.flaws}\n` : '') +
          (updateData.appearance ? `• 外貌：${updateData.appearance}\n` : '') +
          `\n你可以在人物页面查看更新后的角色设定。`,
      }
    } catch (error) {
      return {
        type: 'update_character',
        data: null,
        response: `更新角色失败：${error.message}`,
      }
    }
  }

  private async handleCreateRelationship(
    projectId: string,
    data: any,
  ): Promise<AssistantAction> {
    try {
      // 查找角色
      const characters = await this.charactersService.findAllWithoutPagination(projectId)
      const fromChar = characters.find(c => c.name === data.fromCharacter)
      const toChar = characters.find(c => c.name === data.toCharacter)

      if (!fromChar || !toChar) {
        return {
          type: 'create_relationship',
          data: null,
          response: `找不到角色：${!fromChar ? data.fromCharacter : data.toCharacter}。请先创建这些角色。`,
        }
      }

      const relationship = await this.charactersService.createRelationship(
        projectId,
        fromChar.id,
        toChar.id,
        data.relationship,
        data.description,
      )

      return {
        type: 'create_relationship',
        data: relationship,
        response: `已创建关系！\n\n` +
          `「${data.fromCharacter}」 → 「${data.toCharacter}」\n` +
          `关系类型：${data.relationship}\n` +
          (data.description ? `描述：${data.description}` : ''),
      }
    } catch (error) {
      return {
        type: 'create_relationship',
        data: null,
        response: `创建关系失败：${error.message}`,
      }
    }
  }

  private async handleCreateWorldSetting(
    userId: string,
    projectId: string,
    data: any,
  ): Promise<AssistantAction> {
    try {
      const setting = await this.worldSettingsService.create(userId, projectId, {
        category: data.category || '其他',
        name: data.name,
        description: data.description || data.content,
      })

      return {
        type: 'create_world_setting',
        data: setting,
        response: `已创建世界观设定「${data.name}」！\n\n` +
          `• 分类：${data.category || '其他'}\n` +
          (data.description ? `• 描述：${data.description}` : ''),
      }
    } catch (error) {
      return {
        type: 'create_world_setting',
        data: null,
        response: `创建世界观设定失败：${error.message}`,
      }
    }
  }

  private async handleModifyChapter(
    userId: string,
    projectId: string,
    message: string,
    chapterId?: string,
    chapterContent?: string,
    chapterTitle?: string,
    provider?: ProviderName,
  ): Promise<AssistantAction> {
    if (!chapterContent || !chapterId) {
      return {
        type: 'modify_chapter',
        data: null,
        response: '请先打开一个章节，然后再请求修改。',
      }
    }

    const systemPrompt = `你是一个专业的网文编辑助手。用户会给你一段章节内容和修改要求。

你需要：
1. 理解用户的修改意图
2. 找到所有需要修改的位置（如果同一个内容出现多次，需要为每一处创建单独的修改）
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
    },
    {
      "id": "change_2",
      "type": "replace",
      "original": "原文内容",
      "suggested": "修改后内容",
      "description": "修改说明"
    }
  ],
  "fullSuggested": "完整的修改后章节内容",
  "explanation": "修改总结说明"
}

重要规则：
- 如果用户要求修改一个名称或词语，必须找到章节中所有出现的位置
- 每个出现位置都需要创建一个单独的 change 条目
- 例如：如果用户要求把"张三"改成"李四"，而"张三"出现了5次，就需要创建5个 change
- 保持原文的风格和语气
- 只修改用户要求的部分
- 每个修改都要有清晰的说明
- id 从 change_1 开始递增`

    const userPrompt = `章节标题：${chapterTitle || '未命名'}

章节内容：
---
${chapterContent}
---

修改要求：
${message}`

    try {
      const aiResponse = await this.aiService.chat(userId, {
        projectId,
        message: `${systemPrompt}\n\n${userPrompt}`,
        provider,
        action: AIAction.DIALOGUE_GENERATION,
        temperature: 0.7,
      })

      // 解析 AI 响应
      const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          type: 'modify_chapter',
          data: {
            chapterId,
            changes: parsed.changes || [],
            fullSuggested: parsed.fullSuggested || '',
          },
          response: parsed.explanation || '我已经分析了你的修改要求，以下是建议的修改。',
        }
      }

      // 如果无法解析 JSON，返回普通文本响应
      return {
        type: 'modify_chapter',
        data: null,
        response: aiResponse.response,
      }
    } catch (error) {
      return {
        type: 'modify_chapter',
        data: null,
        response: `处理修改请求失败：${error.message}`,
      }
    }
  }

  private async buildChatPrompt(
    userId: string,
    projectId: string,
    message: string,
    chapterContent?: string,
    chapterTitle?: string,
    conversationHistory?: ConversationHistoryMessage[],
  ): Promise<string> {
    // 获取项目信息作为上下文
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: { take: 10 },
        worldSettings: { take: 10 },
        chapters: { orderBy: { order: 'asc' }, take: 20 },
        plots: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: { plotPoints: { orderBy: { order: 'asc' }, take: 8 } },
        },
        outlines: {
          orderBy: { order: 'asc' },
          take: 10,
          include: { items: { orderBy: { order: 'asc' }, take: 12 } },
        },
        scenes: { orderBy: { order: 'asc' }, take: 20 },
        turningPoints: { orderBy: { order: 'asc' }, take: 20 },
        timelineEvents: { orderBy: { order: 'asc' }, take: 20 },
      },
    })

    const context = project ? `
项目：${project.title}
类型：${project.genre}
简介：${project.synopsis}

主要角色：
${project.characters.length ? project.characters.map(c => `- ${c.name}（${c.role || '未设定'}）${c.goals ? ` 目标：${c.goals}` : ''}${c.flaws ? ` 弱点：${c.flaws}` : ''}`).join('\n') : '- 暂无'}

世界观设定：
${project.worldSettings.length ? project.worldSettings.map(w => `- ${w.name}（${w.category}）${w.description ? `：${w.description}` : ''}`).join('\n') : '- 暂无'}

已有章节：
${project.chapters.length ? project.chapters.map(c => `- 第${(c.order ?? 0) + 1}章 ${c.title}（${c.status}）${c.summary ? `：${c.summary}` : ''}`).join('\n') : '- 暂无'}

已有情节线：
${project.plots.length ? project.plots.map(p => {
  const points = p.plotPoints?.length ? `\n  节点：${p.plotPoints.map(point => `${point.title}${point.description ? `（${point.description}` : ''}${point.description ? '）' : ''}`).join('；')}` : ''
  return `- ${p.title}（${p.status}）${p.description ? `：${p.description}` : ''}${points}`
}).join('\n') : '- 暂无'}

已有大纲：
${project.outlines.length ? project.outlines.map(o => {
  const items = o.items?.length ? `\n  条目：${o.items.map(item => `${item.title}${item.summary ? `（${item.summary}` : ''}${item.summary ? '）' : ''}`).join('；')}` : ''
  return `- ${o.title}（${o.structureType}/${o.status}）${o.description ? `：${o.description}` : ''}${items}`
}).join('\n') : '- 暂无'}

已有场景：
${project.scenes.length ? project.scenes.map(s => `- ${s.title}${s.location ? ` @${s.location}` : ''}${s.timePeriod ? ` / ${s.timePeriod}` : ''}${s.summary ? `：${s.summary}` : ''}`).join('\n') : '- 暂无'}

已有转折点：
${project.turningPoints.length ? project.turningPoints.map(t => `- ${t.title}（${t.type}）${t.position ? `位置：${t.position} ` : ''}${t.description ? `：${t.description}` : ''}${t.impact ? ` 影响：${t.impact}` : ''}`).join('\n') : '- 暂无'}

已有时间线：
${project.timelineEvents.length ? project.timelineEvents.map(e => `- ${e.timeLabel || e.eventDate || `#${(e.order ?? 0) + 1}`} ${e.title}（${e.importance}）${e.description ? `：${e.description}` : ''}${e.location ? ` 地点：${e.location}` : ''}${e.characters ? ` 角色：${e.characters}` : ''}`).join('\n') : '- 暂无'}
` : ''

    let chapterContext = ''
    if (chapterContent && chapterTitle) {
      chapterContext = `
当前正在编辑的章节：《${chapterTitle}》
章节内容：
---
${chapterContent}
---

用户可能会要求你分析、修改或讨论这个章节的内容。
如果用户要求修改内容，请明确指出你要修改的部分，并提供修改建议。`
    }

    const historyContext = this.formatConversationHistory(conversationHistory)
    const memoryContext = await this.buildLongTermMemoryContext(userId, projectId, message)

    return `你是一个小说创作助手。帮助用户构思和完善他们的故事。
    
当前项目信息：
${context}
${chapterContext}
${historyContext ? `
近期对话上下文：
${historyContext}

当用户说"刚才""上面""这个大纲""这些角色"时，优先引用这段对话上下文，不要要求用户重复。
` : ''}
${memoryContext ? `
项目长期记忆：
${memoryContext}

如果长期记忆和近期对话都相关，优先综合两者；如果冲突，请提醒用户确认。
` : ''}

你可以帮助用户：
1. 创建角色 - 例如"帮我创建一个名叫张三的主角"
2. 设置关系 - 例如"张三是李四的师兄"
3. 创建世界观设定 - 例如"添加一个魔法体系设定"
4. 讨论剧情 - 讨论故事发展、情节建议等
${chapterContent ? '5. 分析和修改章节 - 分析章节内容，提出改进建议' : ''}

回复要简洁友好。

用户消息：${message}`
  }

  private async getChatResponse(
    userId: string,
    projectId: string,
    message: string,
    provider?: ProviderName,
    chapterId?: string,
    chapterContent?: string,
    chapterTitle?: string,
    conversationHistory?: ConversationHistoryMessage[],
  ): Promise<string> {
    const fullMessage = await this.buildChatPrompt(userId, projectId, message, chapterContent, chapterTitle, conversationHistory)

    const result = await this.aiService.chat(userId, {
      projectId,
      message: fullMessage,
      provider,
      action: AIAction.DIALOGUE_GENERATION,
      temperature: 0.7,
    })

    return result.response
  }

  async *processMessageStream(
    userId: string,
    projectId: string,
    message: string,
    provider?: ProviderName,
    chapterId?: string,
    chapterContent?: string,
    chapterTitle?: string,
    conversationHistory?: ConversationHistoryMessage[],
  ): AsyncGenerator<{ type: string; content?: string; actions?: AssistantAction[]; cards?: AssistantCard[] }> {
    // 发送思考状态：正在分析意图
    yield { type: 'thinking', content: '正在分析你的请求...' }

    // 使用 AI 分析用户意图
    const intent = await this.analyzeIntent(userId, projectId, message, provider, chapterContent, conversationHistory)

    const actions: AssistantAction[] = []

    switch (intent.type) {
      case 'create_character':
        yield { type: 'thinking', content: '正在创建角色...' }
        const characterResult = await this.handleCreateCharacter(projectId, intent.data)
        actions.push(characterResult)
        yield { type: 'content', content: characterResult.response }
        break

      case 'update_character':
        yield { type: 'thinking', content: '正在更新角色设定...' }
        const updateCharacterResult = await this.handleUpdateCharacter(projectId, intent.data)
        actions.push(updateCharacterResult)
        yield { type: 'content', content: updateCharacterResult.response }
        break

      case 'create_relationship':
        yield { type: 'thinking', content: '正在创建关系...' }
        const relationshipResult = await this.handleCreateRelationship(projectId, intent.data)
        actions.push(relationshipResult)
        yield { type: 'content', content: relationshipResult.response }
        break

      case 'create_world_setting':
        yield { type: 'thinking', content: '正在创建世界观设定...' }
        const worldResult = await this.handleCreateWorldSetting(userId, projectId, intent.data)
        actions.push(worldResult)
        yield { type: 'content', content: worldResult.response }
        break

      case 'modify_chapter':
        yield { type: 'thinking', content: '正在分析章节内容...' }
        const modifyResult = await this.handleModifyChapter(
          userId,
          projectId,
          message,
          chapterId,
          chapterContent,
          chapterTitle,
          provider,
        )
        actions.push(modifyResult)
        yield { type: 'content', content: modifyResult.response }
        break

      default:
        // 普通对话，流式返回
        yield { type: 'thinking', content: '正在思考...' }
        const fullMessage = await this.buildChatPrompt(
          userId,
          projectId,
          message,
          chapterContent,
          chapterTitle,
          conversationHistory,
        )
        let responseContent = ''
        for await (const chunk of this.aiService.chatStream(userId, {
          projectId,
          message: fullMessage,
          provider,
          action: AIAction.DIALOGUE_GENERATION,
          temperature: 0.7,
        })) {
          responseContent += chunk
          yield { type: 'content', content: chunk }
        }
        yield { type: 'action_cards', cards: await this.buildActionCards(userId, projectId, message, responseContent, provider) }
        break
    }

    // 发送完成状态和 actions
    yield { type: 'done', actions }
  }

  private formatConversationHistory(history?: ConversationHistoryMessage[]): string {
    if (!history?.length) return ''

    return history
      .filter(item => item.content?.trim())
      .slice(-8)
      .map(item => {
        const role = item.role === 'assistant' ? '助手' : '用户'
        const content = item.content.trim().slice(0, 2000)
        return `${role}：${content}`
      })
      .join('\n\n')
      .slice(0, 8000)
  }

  private isContextualCharacterPlanningRequest(message: string): boolean {
    return (
      /刚才|上面|前面|大纲|故事大纲|故事结构/.test(message) &&
      /主要角色|核心人物|人物设定|角色设定|人物弧光|彼此关系|角色表/.test(message)
    )
  }

  private async buildLongTermMemoryContext(userId: string, projectId: string, query: string): Promise<string> {
    if (!this.storySystemService || !query.trim()) return ''

    try {
      const result = await this.storySystemService.searchStoryGraph(userId, projectId, query)
      const results = Array.isArray((result as any).results) ? (result as any).results : []
      return results
        .slice(0, 5)
        .map((item: any, index: number) => {
          const source = item.sourceType ? `来源：${item.sourceType}` : '来源：项目记忆'
          return `${index + 1}. ${item.text || ''}（${source}）`
        })
        .filter(Boolean)
        .join('\n')
        .slice(0, 4000)
    } catch {
      return ''
    }
  }

  private async buildActionCards(
    userId: string,
    projectId: string,
    message: string,
    response: string,
    provider?: ProviderName,
  ): Promise<AssistantCard[]> {
    const modelCards = await this.buildModelActionCards(userId, projectId, message, response, provider)
    if (modelCards.length > 0) {
      return modelCards.slice(0, 6)
    }
    return this.buildRuleBasedActionCards(message, response)
  }

  private async buildModelActionCards(
    userId: string,
    projectId: string,
    message: string,
    response: string,
    provider?: ProviderName,
  ): Promise<AssistantCard[]> {
    try {
      const entityContext = await this.buildActionEntityContext(projectId)
      const result = await this.aiService.chat(userId, {
        projectId,
        provider,
        action: AIAction.DIALOGUE_GENERATION,
        temperature: 0.2,
        message: this.buildActionPlanPrompt(message, response, entityContext),
      })
      const parsed = this.extractJson(result.response)
      const actionCards = this.normalizeModelActions(message, parsed?.actions)
      const promptCards = this.normalizeModelNextSteps(parsed?.nextSteps)
      return [...actionCards, ...promptCards]
    } catch {
      return []
    }
  }

  private buildRuleBasedActionCards(message: string, response: string): AssistantActionCard[] {
    const cards: AssistantActionCard[] = []
    const source = `${message}\n${response}`
    const title = this.inferTitle(source)
    const summary = this.truncate(this.stripMarkdown(response), 500)
    const characterCards = this.extractCharacterActionCards(response)
    const plotCards = this.extractPlotActionCards(response)
    const isContextualCharacterPlan = this.isContextualCharacterPlanningRequest(message)
    const isClearAllChaptersRequest = this.isClearAllChaptersRequest(message)
    const isPlotLineRequest = this.isPlotLineRequest(source)

    if (isClearAllChaptersRequest) {
      cards.push(this.createActionCard('DELETE_ALL_CHAPTERS', '清空章节', '删除当前项目里的全部章节。这个操作不可撤销，执行前请确认。', {
        confirmText: 'DELETE_ALL_CHAPTERS',
      }, 'chapters'))
    }

    if (isPlotLineRequest) {
      if (plotCards.length > 0) {
        cards.push(...plotCards)
      } else {
        cards.push(this.createActionCard('CREATE_PLOT', '创建情节线', '把这段剧情方向加入情节线。', {
          plotData: {
            title: this.inferTitle(response) || '新情节线',
            description: summary,
          },
        }, 'plots'))
      }
    }

    if (!isPlotLineRequest && /角色|人物|主角|配角|反派/.test(source)) {
      if (characterCards.length > 0) {
        cards.push(...characterCards)
      } else if (!isContextualCharacterPlan) {
        cards.push(this.createActionCard('CREATE_CHARACTER', '沉淀为角色', '把这段人物设定加入人物管理。', {
          characterData: {
            name: title || '新角色',
            role: /反派/.test(source) ? '反派' : /配角/.test(source) ? '配角' : '主角',
            background: summary,
          },
        }, 'characters'))
      }
    }

    if (!isClearAllChaptersRequest && /章节|章|幕|拆成/.test(source)) {
      cards.push(this.createActionCard('CREATE_CHAPTER', '创建章节', '把这段内容加入章节列表。', {
        chapterData: {
          title: title || '新章节',
          summary,
        },
      }, 'chapters'))
    }

    if (/世界观|设定|规则|势力|地图/.test(source)) {
      cards.push(this.createActionCard('CREATE_WORLD_SETTING', '沉淀为世界观', '把这段设定加入世界观管理。', {
        worldSettingData: {
          category: 'GENERAL',
          name: title || '新设定',
          description: summary,
        },
      }, 'world'))
    }

    if (!isPlotLineRequest && /剧情线|情节线|主线|支线/.test(source)) {
      cards.push(this.createActionCard('CREATE_PLOT', '创建情节线', '把这段剧情方向加入情节线。', {
        plotData: {
          title: title || '新情节线',
          description: summary,
        },
      }, 'plots'))
    }

    if (/大纲|故事结构|结构/.test(source)) {
      cards.push(this.createActionCard('CREATE_OUTLINE', '创建大纲', '把这段结构沉淀为系统大纲。', {
        outlineData: {
          title: title || '新大纲',
          description: summary,
          structureType: 'FULL_BOOK',
          status: 'DRAFT',
        },
      }, 'outlines'))
    }

    if (/场景|桥段|片段/.test(source)) {
      cards.push(this.createActionCard('CREATE_SCENE', '创建场景', '把这段内容加入场景管理。', {
        sceneData: {
          title: title || '新场景',
          summary,
          content: response,
        },
      }, 'scenes'))
    }

    if (/时间线|事件|节点/.test(source)) {
      cards.push(this.createActionCard('CREATE_TIMELINE_EVENT', '加入时间线', '把这个事件加入时间线。', {
        timelineEventData: {
          title: title || '新事件',
          description: summary,
        },
      }, 'timeline'))
    }

    if (/转折|反转|转折点/.test(source)) {
      cards.push(this.createActionCard('CREATE_TURNING_POINT', '创建转折点', '把这个变化加入转折点管理。', {
        turningPointData: {
          title: title || '新转折点',
          description: summary,
          type: 'PLOT',
        },
      }, 'turning-points'))
    }

    if (/伏笔|契诃夫|回收/.test(source)) {
      cards.push(this.createActionCard('CREATE_CHEKHOVS_GUN', '创建伏笔', '把这个线索加入伏笔管理。', {
        chekhovsGunData: {
          name: title || '新伏笔',
          description: summary,
          setupText: summary || '待补充',
        },
      }, 'chekhovs-guns'))
    }

    return cards.slice(0, 4)
  }

  private extractCharacterActionCards(response: string): AssistantActionCard[] {
    const cards: AssistantActionCard[] = []
    const seenNames = new Set<string>()
    const lines = response.split(/\r?\n/).map(line => this.stripMarkdown(line).trim()).filter(Boolean)

    for (const line of lines) {
      const match = line.match(/^([A-Za-z0-9_\u4e00-\u9fa5·]{2,20})(?:[（(][^）)]{1,30}[）)])?[：:]\s*(.{8,})$/)
      if (!match) continue

      const name = match[1].trim()
      const description = match[2].trim()
      if (seenNames.has(name) || this.isGenericCharacterHeading(name)) continue

      seenNames.add(name)
      cards.push(this.createActionCard('CREATE_CHARACTER', `创建角色：${name}`, '把这个人物设定加入人物管理。', {
        characterData: {
          name,
          role: this.inferCharacterRole(`${name} ${description}`),
          background: this.truncate(description, 500),
        },
      }, 'characters'))

      if (cards.length >= 4) break
    }

    return cards
  }

  private extractPlotActionCards(response: string): AssistantActionCard[] {
    const cards: AssistantActionCard[] = []
    const lines = response.split(/\r?\n/).map(line => this.stripMarkdown(line).trim()).filter(Boolean)

    for (const line of lines) {
      const optionMatch = line.match(/^情节线选项[一二三四五六七八九十\d]*[：:]\s*([^\s：:，。,.]{2,30})\s*(.*)$/)
      const lineMatch = optionMatch || line.match(/^([A-Za-z0-9_\u4e00-\u9fa5·]{2,30}(?:线|主线|支线))[：:]\s*(.{8,})$/)
      if (!lineMatch) continue

      const title = lineMatch[1].trim()
      if (this.isGenericCharacterHeading(title)) continue

      const description = this.truncate(lineMatch[2]?.trim() || line, 500)
      cards.push(this.createActionCard('CREATE_PLOT', `创建情节线：${title}`, '把这条剧情方向加入情节线管理。', {
        plotData: {
          title,
          description,
          status: 'ACTIVE',
        },
      }, 'plots'))

      if (cards.length >= 4) break
    }

    return cards
  }

  private async buildActionEntityContext(projectId: string): Promise<string> {
    try {
      const [
        characters,
        worldSettings,
        chapters,
        plots,
        outlines,
        scenes,
        timelineEvents,
        turningPoints,
        chekhovsGuns,
      ] = await Promise.all([
        this.prisma.character.findMany({ where: { projectId }, select: { id: true, name: true }, take: 20 }),
        this.prisma.worldSetting.findMany({ where: { projectId }, select: { id: true, name: true, category: true }, take: 20 }),
        this.prisma.chapter.findMany({ where: { projectId }, select: { id: true, title: true, order: true }, orderBy: { order: 'asc' }, take: 30 }),
        this.prisma.plot.findMany({ where: { projectId }, select: { id: true, title: true, status: true }, take: 20 }),
        this.prisma.outline.findMany({ where: { projectId }, select: { id: true, title: true, status: true }, take: 20 }),
        this.prisma.scene.findMany({ where: { projectId }, select: { id: true, title: true, order: true }, orderBy: { order: 'asc' }, take: 20 }),
        this.prisma.timelineEvent.findMany({ where: { projectId }, select: { id: true, title: true, order: true }, orderBy: { order: 'asc' }, take: 20 }),
        this.prisma.turningPoint.findMany({ where: { projectId }, select: { id: true, title: true, order: true }, orderBy: { order: 'asc' }, take: 20 }),
        this.prisma.chekhovsGun.findMany({ where: { projectId }, select: { id: true, name: true, status: true }, take: 20 }),
      ])

      const lines = [
        this.formatEntityList('characters', characters, 'name'),
        this.formatEntityList('worldSettings', worldSettings, 'name'),
        this.formatEntityList('chapters', chapters, 'title'),
        this.formatEntityList('plots', plots, 'title'),
        this.formatEntityList('outlines', outlines, 'title'),
        this.formatEntityList('scenes', scenes, 'title'),
        this.formatEntityList('timelineEvents', timelineEvents, 'title'),
        this.formatEntityList('turningPoints', turningPoints, 'title'),
        this.formatEntityList('chekhovsGuns', chekhovsGuns, 'name'),
      ].filter(Boolean)

      return lines.join('\n').slice(0, 4000)
    } catch {
      return ''
    }
  }

  private formatEntityList(label: string, items: any[], nameField: 'name' | 'title'): string {
    if (!Array.isArray(items) || items.length === 0) return ''
    const body = items
      .map(item => `- ${item.id}: ${item[nameField]}`)
      .join('\n')
    return `${label}:\n${body}`
  }

  private buildActionPlanPrompt(message: string, response: string, entityContext = ''): string {
    return `你是小说创作系统的结构化动作规划器。请根据用户请求和助手回复，决定应该展示哪些可执行卡片和下一步建议卡片。

只返回 JSON，不要返回解释。JSON 格式：
{
  "actions": [
    {
      "type": "CREATE_CHARACTER | UPDATE_CHARACTER | DELETE_CHARACTER | CREATE_WORLD_SETTING | UPDATE_WORLD_SETTING | DELETE_WORLD_SETTING | CREATE_CHAPTER | UPDATE_CHAPTER | DELETE_CHAPTER | DELETE_ALL_CHAPTERS | CREATE_PLOT | UPDATE_PLOT | DELETE_PLOT | CREATE_OUTLINE | UPDATE_OUTLINE | DELETE_OUTLINE | CREATE_SCENE | UPDATE_SCENE | DELETE_SCENE | CREATE_TIMELINE_EVENT | UPDATE_TIMELINE_EVENT | DELETE_TIMELINE_EVENT | CREATE_TURNING_POINT | UPDATE_TURNING_POINT | DELETE_TURNING_POINT | CREATE_CHEKHOVS_GUN | UPDATE_CHEKHOVS_GUN | DELETE_CHEKHOVS_GUN",
      "title": "实体或动作标题",
      "description": "要保存到系统里的内容摘要",
      "parameters": {}
    }
  ],
  "nextSteps": [
    {
      "title": "下一步：...",
      "description": "简短说明",
      "prompt": "用户点击后要填入输入框的追问"
    }
  ]
}

规则：
- 由语义决定卡片，不要用关键词机械匹配。
- 回复里如果只是结构标签，例如"开端、发展、转折、高潮、建议、选项"，不要当成角色或实体。
- 用户要求创建情节线/剧情线时，优先输出 CREATE_PLOT；如果回复提供多个情节线选项，请每个选项输出一张 CREATE_PLOT。
- 用户要求角色设定时，只有明确的人物名才输出 CREATE_CHARACTER。
- 更新或删除已有实体时，必须使用下面“当前已有实体”里的对应 id，例如 plotId、outlineId、characterId。找不到明确 id 时不要输出执行动作，可放到 nextSteps 让用户选择。
- 删除动作必须是用户明确要求删除/清空时才输出；DELETE_ALL_CHAPTERS 只有在用户明确要求删除/清空全部章节时才能输出。
- 创建动作参数请放入对应数据对象：characterData、worldSettingData、chapterData、plotData、outlineData、sceneData、timelineEventData、turningPointData、chekhovsGunData。
- 更新动作参数必须包含实体 id 和对应数据对象；删除动作必须包含实体 id。
- 字段不确定或目标不确定时不要输出执行动作，可放到 nextSteps。
- actions 最多 4 个，nextSteps 最多 3 个。

当前已有实体：
${entityContext || '暂无可引用实体。'}

用户请求：
${message}

助手回复：
${response}`
  }

  private normalizeModelActions(message: string, actions: unknown): AssistantActionCard[] {
    if (!Array.isArray(actions)) return []

    return actions
      .map((action) => this.normalizeModelAction(message, action))
      .filter((card): card is AssistantActionCard => Boolean(card))
      .slice(0, 4)
  }

  private normalizeModelAction(message: string, action: unknown): AssistantActionCard | null {
    if (!action || typeof action !== 'object') return null

    const raw = action as Record<string, any>
    const actionType = String(raw.actionType || raw.type || '').toUpperCase()
    const parameters = raw.parameters && typeof raw.parameters === 'object' ? raw.parameters : {}
    const data = raw.data && typeof raw.data === 'object' ? raw.data : {}
    const title = this.cleanModelText(raw.title || parameters.title || parameters.name || data.title || data.name)
    const description = this.cleanModelText(raw.description || parameters.description || parameters.summary || data.description || data.summary)

    switch (actionType) {
      case 'CREATE_CHARACTER': {
        const characterData = parameters.characterData || data.characterData || {}
        const name = this.cleanModelText(characterData.name || raw.name || title)
        if (!name || this.isGenericCharacterHeading(name)) return null
        return this.createActionCard('CREATE_CHARACTER', `创建角色：${name}`, raw.cardDescription || '把这个人物设定加入人物管理。', {
          characterData: {
            name,
            role: characterData.role || raw.role || '配角',
            appearance: characterData.appearance || raw.appearance,
            personality: characterData.personality || raw.personality,
            background: characterData.background || description,
            goals: characterData.goals || raw.goals,
            flaws: characterData.flaws || raw.flaws,
          },
        }, 'characters')
      }
      case 'CREATE_WORLD_SETTING': {
        const worldSettingData = parameters.worldSettingData || data.worldSettingData || {}
        const name = this.cleanModelText(worldSettingData.name || raw.name || title)
        if (!name) return null
        return this.createActionCard('CREATE_WORLD_SETTING', `沉淀世界观：${name}`, raw.cardDescription || '把这段设定加入世界观管理。', {
          worldSettingData: {
            category: worldSettingData.category || raw.category || 'GENERAL',
            name,
            description: worldSettingData.description || description,
          },
        }, 'world')
      }
      case 'CREATE_CHAPTER': {
        const chapterData = parameters.chapterData || data.chapterData || {}
        const chapterTitle = this.cleanModelText(chapterData.title || title)
        if (!chapterTitle) return null
        return this.createActionCard('CREATE_CHAPTER', `创建章节：${chapterTitle}`, raw.cardDescription || '把这段内容加入章节列表。', {
          chapterData: {
            title: chapterTitle,
            summary: chapterData.summary || description,
            status: chapterData.status || 'DRAFT',
          },
        }, 'chapters')
      }
      case 'CREATE_PLOT': {
        const plotData = parameters.plotData || data.plotData || {}
        const plotTitle = this.cleanModelText(plotData.title || title)
        if (!plotTitle || this.isGenericCharacterHeading(plotTitle)) return null
        return this.createActionCard('CREATE_PLOT', `创建情节线：${plotTitle}`, raw.cardDescription || '把这条剧情方向加入情节线管理。', {
          plotData: {
            title: plotTitle,
            description: plotData.description || description,
            status: plotData.status || 'ACTIVE',
            plotPoints: Array.isArray(plotData.plotPoints) ? plotData.plotPoints : undefined,
          },
        }, 'plots')
      }
      case 'CREATE_OUTLINE': {
        const outlineData = parameters.outlineData || data.outlineData || {}
        const outlineTitle = this.cleanModelText(outlineData.title || title)
        if (!outlineTitle) return null
        return this.createActionCard('CREATE_OUTLINE', `创建大纲：${outlineTitle}`, raw.cardDescription || '把这段结构沉淀为系统大纲。', {
          outlineData: {
            title: outlineTitle,
            description: outlineData.description || description,
            structureType: outlineData.structureType || 'FULL_BOOK',
            status: outlineData.status || 'DRAFT',
          },
        }, 'outlines')
      }
      case 'CREATE_SCENE': {
        const sceneData = parameters.sceneData || data.sceneData || {}
        const sceneTitle = this.cleanModelText(sceneData.title || title)
        if (!sceneTitle) return null
        return this.createActionCard('CREATE_SCENE', `创建场景：${sceneTitle}`, raw.cardDescription || '把这段内容加入场景管理。', {
          sceneData: {
            title: sceneTitle,
            summary: sceneData.summary || description,
            content: sceneData.content || description,
          },
        }, 'scenes')
      }
      case 'CREATE_TIMELINE_EVENT': {
        const timelineEventData = parameters.timelineEventData || data.timelineEventData || {}
        const eventTitle = this.cleanModelText(timelineEventData.title || title)
        if (!eventTitle) return null
        return this.createActionCard('CREATE_TIMELINE_EVENT', `加入时间线：${eventTitle}`, raw.cardDescription || '把这个事件加入时间线。', {
          timelineEventData: {
            title: eventTitle,
            description: timelineEventData.description || description,
          },
        }, 'timeline')
      }
      case 'CREATE_TURNING_POINT': {
        const turningPointData = parameters.turningPointData || data.turningPointData || {}
        const pointTitle = this.cleanModelText(turningPointData.title || title)
        if (!pointTitle) return null
        return this.createActionCard('CREATE_TURNING_POINT', `创建转折点：${pointTitle}`, raw.cardDescription || '把这个变化加入转折点管理。', {
          turningPointData: {
            title: pointTitle,
            description: turningPointData.description || description,
            type: turningPointData.type || 'PLOT',
          },
        }, 'turning-points')
      }
      case 'CREATE_CHEKHOVS_GUN': {
        const chekhovsGunData = parameters.chekhovsGunData || data.chekhovsGunData || {}
        const name = this.cleanModelText(chekhovsGunData.name || raw.name || title)
        if (!name || !description) return null
        return this.createActionCard('CREATE_CHEKHOVS_GUN', `创建伏笔：${name}`, raw.cardDescription || '把这个线索加入伏笔管理。', {
          chekhovsGunData: {
            name,
            description: chekhovsGunData.description || description,
            setupText: chekhovsGunData.setupText || description,
          },
        }, 'chekhovs-guns')
      }
      case 'DELETE_ALL_CHAPTERS': {
        if (!this.isClearAllChaptersRequest(message)) return null
        return this.createActionCard('DELETE_ALL_CHAPTERS', '清空章节', '删除当前项目里的全部章节。这个操作不可撤销，执行前请确认。', {
          confirmText: 'DELETE_ALL_CHAPTERS',
        }, 'chapters')
      }
      default:
        return this.normalizeCrudModelAction(actionType, raw, parameters, data, title, description)
    }
  }

  private normalizeCrudModelAction(
    actionType: string,
    raw: Record<string, any>,
    parameters: Record<string, any>,
    data: Record<string, any>,
    title: string,
    description: string,
  ): AssistantActionCard | null {
    const configs: Record<string, {
      idKey: string
      dataKey: string
      titleField: 'title' | 'name'
      route: string
      label: string
      defaultData?: Record<string, any>
    }> = {
      CHARACTER: { idKey: 'characterId', dataKey: 'characterData', titleField: 'name', route: 'characters', label: '角色', defaultData: { role: '配角' } },
      WORLD_SETTING: { idKey: 'worldSettingId', dataKey: 'worldSettingData', titleField: 'name', route: 'world', label: '世界观', defaultData: { category: 'GENERAL' } },
      CHAPTER: { idKey: 'chapterId', dataKey: 'chapterData', titleField: 'title', route: 'chapters', label: '章节', defaultData: { status: 'DRAFT' } },
      PLOT: { idKey: 'plotId', dataKey: 'plotData', titleField: 'title', route: 'plots', label: '情节线', defaultData: { status: 'ACTIVE' } },
      OUTLINE: { idKey: 'outlineId', dataKey: 'outlineData', titleField: 'title', route: 'outlines', label: '大纲', defaultData: { structureType: 'FULL_BOOK', status: 'DRAFT' } },
      SCENE: { idKey: 'sceneId', dataKey: 'sceneData', titleField: 'title', route: 'scenes', label: '场景' },
      TIMELINE_EVENT: { idKey: 'timelineEventId', dataKey: 'timelineEventData', titleField: 'title', route: 'timeline', label: '时间线事件' },
      TURNING_POINT: { idKey: 'turningPointId', dataKey: 'turningPointData', titleField: 'title', route: 'turning-points', label: '转折点', defaultData: { type: 'PLOT_TURN' } },
      CHEKHOVS_GUN: { idKey: 'chekhovsGunId', dataKey: 'chekhovsGunData', titleField: 'name', route: 'chekhovs-guns', label: '伏笔' },
    }

    const match = actionType.match(/^(UPDATE|DELETE)_(CHARACTER|WORLD_SETTING|CHAPTER|PLOT|OUTLINE|SCENE|TIMELINE_EVENT|TURNING_POINT|CHEKHOVS_GUN)$/)
    if (!match) return null

    const operation = match[1]
    const entity = match[2]
    const config = configs[entity]
    if (!config) return null

    const id = this.cleanModelText(parameters[config.idKey] || data[config.idKey] || raw[config.idKey] || raw.id)
    if (!id) return null

    if (operation === 'DELETE') {
      return this.createActionCard(actionType, `删除${config.label}：${title || id}`, raw.cardDescription || `从项目中删除这个${config.label}。`, {
        [config.idKey]: id,
      }, config.route)
    }

    const modelData = parameters[config.dataKey] || data[config.dataKey] || data || {}
    const normalizedData = this.normalizeEntityData(modelData, config.titleField, title, description, config.defaultData)
    if (Object.keys(normalizedData).length === 0) return null

    return this.createActionCard(actionType, `更新${config.label}：${normalizedData[config.titleField] || title || id}`, raw.cardDescription || `把这次调整应用到${config.label}。`, {
      [config.idKey]: id,
      [config.dataKey]: normalizedData,
    }, config.route)
  }

  private normalizeEntityData(
    value: unknown,
    titleField: 'title' | 'name',
    title: string,
    description: string,
    defaultData?: Record<string, any>,
  ): Record<string, any> {
    const rawData = value && typeof value === 'object' ? value as Record<string, any> : {}
    const data: Record<string, any> = {}
    const allowedKeys = new Set([
      'name',
      'title',
      'role',
      'appearance',
      'personality',
      'background',
      'goals',
      'flaws',
      'arc',
      'voice',
      'notes',
      'category',
      'description',
      'summary',
      'status',
      'order',
      'structureType',
      'location',
      'timePeriod',
      'characters',
      'content',
      'chapterId',
      'eventDate',
      'timeLabel',
      'importance',
      'type',
      'impact',
      'emotionalShift',
      'position',
      'setupText',
      'setupChapterId',
      'setupPosition',
      'payoffText',
      'payoffChapterId',
      'tags',
    ])

    for (const [key, item] of Object.entries(rawData)) {
      if (allowedKeys.has(key) && item !== undefined && item !== null && item !== '') {
        data[key] = item
      }
    }

    if (!data[titleField] && title) data[titleField] = title
    if (!data.description && description) data.description = description

    return {
      ...(defaultData || {}),
      ...data,
    }
  }

  private normalizeModelNextSteps(nextSteps: unknown): AssistantPromptCard[] {
    if (!Array.isArray(nextSteps)) return []
    return nextSteps
      .map((step, index) => {
        if (!step || typeof step !== 'object') return null
        const raw = step as Record<string, any>
        const title = this.cleanModelText(raw.title)
        const description = this.cleanModelText(raw.description)
        const prompt = this.cleanModelText(raw.prompt)
        if (!title || !prompt) return null
        return this.createPromptCard(`next-${Date.now()}-${index}`, title, description || '继续推进这个方向。', prompt)
      })
      .filter((card): card is AssistantPromptCard => Boolean(card))
      .slice(0, 3)
  }

  private extractJson(text: string): any {
    try {
      return JSON.parse(text)
    } catch {
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
      if (fenced) {
        try {
          return JSON.parse(fenced)
        } catch {
          return null
        }
      }
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return null
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
  }

  private cleanModelText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  private isClearAllChaptersRequest(message: string): boolean {
    return (
      /章节|章/.test(message) &&
      /删掉|删除|清空|重置|全部删|都删|删光/.test(message) &&
      /全部|所有|都|重新|重写|重来|重置/.test(message)
    )
  }

  private isPlotLineRequest(source: string): boolean {
    return /剧情线|情节线|主线|支线/.test(source)
  }

  private isGenericCharacterHeading(value: string): boolean {
    return /主要角色|核心人物|人物|角色|阵营|事件|部分|章节|结局|主题|开端|发展|转折|高潮|冲突|目标|弱点|关系|世界观|设定|登场|选项|建议/.test(value)
  }

  private inferCharacterRole(text: string): string {
    if (/反派|敌对|对手|统治|接管/.test(text)) return '反派'
    if (/配角|盟友|助手|妹妹|伙伴|支援/.test(text)) return '配角'
    if (/主角|主人公|人类程序员|核心视角/.test(text)) return '主角'
    return '配角'
  }

  private createActionCard(
    actionType: string,
    title: string,
    description: string,
    parameters: Record<string, any>,
    targetRoute?: string,
  ): AssistantActionCard {
    return {
      id: `action-${actionType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      actionType: 'AI_ACTION',
      content: { actionType, parameters, targetRoute },
    }
  }

  private createPromptCard(id: string, title: string, description: string, prompt: string): AssistantPromptCard {
    return {
      id,
      title,
      description,
      actionType: 'SUGGEST_PROMPT',
      content: { prompt },
    }
  }

  private inferTitle(text: string): string {
    const bookTitle = text.match(/《([^》]{1,40})》/)?.[1]
    if (bookTitle) return bookTitle
    const heading = text
      .split(/\r?\n/)
      .map(line => this.stripMarkdown(line).trim())
      .find(line => line.length >= 2 && line.length <= 40)
    return heading || ''
  }

  private stripMarkdown(text: string): string {
    return text.replace(/[#>*`\-\[\]()]/g, '').replace(/\s+/g, ' ').trim()
  }

  private truncate(text: string, length: number): string {
    return text.length > length ? `${text.slice(0, length)}...` : text
  }
}
