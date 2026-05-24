import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CharactersService } from '../characters/characters.service'
import { WorldSettingsService } from '../world-settings/world-settings.service'
import { AiService } from '../ai/ai.service'
import { AIAction, AIProvider } from '../ai-config/dto/create-ai-config.dto'

type ProviderName = `${AIProvider}`

export interface AssistantAction {
  type: 'create_character' | 'create_relationship' | 'create_world_setting' | 'modify_chapter' | 'chat' | 'unknown'
  data: any
  response: string
}

@Injectable()
export class AiAssistantService {
  constructor(
    private prisma: PrismaService,
    private charactersService: CharactersService,
    private worldSettingsService: WorldSettingsService,
    private aiService: AiService,
  ) {}

  async processMessage(
    userId: string,
    projectId: string,
    message: string,
    provider?: ProviderName,
    chapterId?: string,
    chapterContent?: string,
    chapterTitle?: string,
  ): Promise<{
    response: string
    actions: AssistantAction[]
  }> {
    // 使用 AI 分析用户意图
    const intent = await this.analyzeIntent(userId, projectId, message, provider, chapterContent)
    
    const actions: AssistantAction[] = []
    let response = ''

    switch (intent.type) {
      case 'create_character':
        const characterResult = await this.handleCreateCharacter(projectId, intent.data)
        actions.push(characterResult)
        response = characterResult.response
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
  ): Promise<{ type: string; data: any }> {
    const hasChapterContext = chapterContent && chapterContent.trim().length > 0

    const systemMessage = `你是一个意图分析助手。分析用户的消息，判断他们想要做什么。

返回 JSON 格式：
{
  "type": "create_character" | "create_relationship" | "create_world_setting" | "modify_chapter" | "chat",
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
- 如果用户提到创建角色、人物，返回 create_character
- 如果用户提到角色关系，返回 create_relationship
- 如果用户提到世界观、设定，返回 create_world_setting
- 其他情况返回 chat

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: `${systemMessage}\n\n用户消息：${message}`,
      provider,
      action: AIAction.DIALOGUE_GENERATION,
      temperature: 0.3,
    })

    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
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

  private async getChatResponse(
    userId: string,
    projectId: string,
    message: string,
    provider?: ProviderName,
    chapterId?: string,
    chapterContent?: string,
    chapterTitle?: string,
  ): Promise<string> {
    // 获取项目信息作为上下文
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: { take: 10 },
        worldSettings: { take: 10 },
      },
    })

    const context = project ? `
项目：${project.title}
类型：${project.genre}
简介：${project.synopsis}

主要角色：
${project.characters.map(c => `- ${c.name}（${c.role}）`).join('\n')}

世界观设定：
${project.worldSettings.map(w => `- ${w.name}（${w.category}）`).join('\n')}
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

    const fullMessage = `你是一个小说创作助手。帮助用户构思和完善他们的故事。
    
当前项目信息：
${context}
${chapterContext}

你可以帮助用户：
1. 创建角色 - 例如"帮我创建一个名叫张三的主角"
2. 设置关系 - 例如"张三是李四的师兄"
3. 创建世界观设定 - 例如"添加一个魔法体系设定"
4. 讨论剧情 - 讨论故事发展、情节建议等
${chapterContent ? '5. 分析和修改章节 - 分析章节内容，提出改进建议' : ''}

回复要简洁友好。

用户消息：${message}`

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
  ): AsyncGenerator<{ type: string; content?: string; actions?: AssistantAction[] }> {
    // 发送思考状态：正在分析意图
    yield { type: 'thinking', content: '正在分析你的请求...' }

    // 使用 AI 分析用户意图
    const intent = await this.analyzeIntent(userId, projectId, message, provider, chapterContent)

    const actions: AssistantAction[] = []

    switch (intent.type) {
      case 'create_character':
        yield { type: 'thinking', content: '正在创建角色...' }
        const characterResult = await this.handleCreateCharacter(projectId, intent.data)
        actions.push(characterResult)
        yield { type: 'content', content: characterResult.response }
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
        const response = await this.getChatResponse(
          userId,
          projectId,
          message,
          provider,
          chapterId,
          chapterContent,
          chapterTitle,
        )
        yield { type: 'content', content: response }
        break
    }

    // 发送完成状态和 actions
    yield { type: 'done', actions }
  }
}
