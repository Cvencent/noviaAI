import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { OpenaiProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { ContextBuilderService } from './context-builder.service'
import { PrismaService } from '../../prisma/prisma.service'

export interface CompleteDto {
  projectId: string
  content: string
  provider?: 'openai' | 'claude'
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ConsistencyCheckDto {
  projectId: string
  content: string
  provider?: 'openai' | 'claude'
  model?: string
}

export interface GenerateSummaryDto {
  projectId: string
  chapterId?: string
  provider?: 'openai' | 'claude'
  model?: string
}

export interface ChatDto {
  projectId: string
  message: string
  history?: Array<{ role: string; content: string }>
  provider?: 'openai' | 'claude'
  model?: string
  temperature?: number
}

@Injectable()
export class AiService {
  private defaultModel = 'gpt-4'

  constructor(
    private openaiProvider: OpenaiProvider,
    private claudeProvider: ClaudeProvider,
    private contextBuilder: ContextBuilderService,
    private prisma: PrismaService,
  ) {}

  private getProvider(providerName?: 'openai' | 'claude') {
    const provider = providerName === 'claude' ? this.claudeProvider : this.openaiProvider
    if (providerName === 'claude') {
      this.claudeProvider.setApiKey(process.env.CLAUDE_API_KEY || '')
    } else {
      this.openaiProvider.setApiKey(process.env.OPENAI_API_KEY || '')
    }
    return provider
  }

  async complete(dto: CompleteDto): Promise<{ result: string }> {
    const { projectId, content, provider, model, temperature, maxTokens } = dto

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    const writingContext = await this.contextBuilder.buildWritingContext(projectId, content)
    const aiProvider = this.getProvider(provider)

    const systemPrompt = `你是一位专业的小说作家，擅长续写故事内容。请根据提供的上下文信息，续写故事。

续写要求：
1. 保持与前文的文风一致
2. 遵循已有的世界观和人物设定
3. 情节发展要自然合理
4. 不要重复已有内容
5. 续写长度适中，保持故事节奏

请直接输出续写内容，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `${writingContext}\n\n请续写以下内容：\n${content}` },
    ]

    const result = await aiProvider.chat({
      model: model || this.defaultModel,
      messages,
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens || 2000,
    })

    return { result }
  }

  async consistencyCheck(dto: ConsistencyCheckDto): Promise<{ issues: string[] }> {
    const { projectId, content, provider, model } = dto

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    const writingContext = await this.contextBuilder.buildWritingContext(projectId, content)
    const aiProvider = this.getProvider(provider)

    const systemPrompt = `你是一位专业的小说编辑，擅长检查故事内容的一致性问题。

请检查以下内容是否存在以下问题：
1. 人物设定不一致（如外貌、性格、能力的矛盾）
2. 时间线矛盾
3. 世界观规则冲突
4. 前后情节矛盾
5. 人物关系冲突
6. 地理/空间位置矛盾

请仔细分析并列出发现的所有一致性问题。

请以JSON格式输出：
{
  "issues": ["问题1", "问题2", ...]
}

如果没有发现问题，返回空的issues数组。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `${writingContext}\n\n请检查以下内容的一致性：\n${content}` },
    ]

    try {
      const result = await aiProvider.chat({
        model: model || this.defaultModel,
        messages,
        temperature: 0.3,
        maxTokens: 2000,
      })

      const parsed = JSON.parse(result)
      return { issues: parsed.issues || [] }
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { issues: ['无法解析AI返回结果'] }
      }
      throw error
    }
  }

  async generateSummary(dto: GenerateSummaryDto): Promise<{ summary: string }> {
    const { projectId, chapterId, provider, model } = dto

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    let content = ''
    let title = project.title

    if (chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          contents: {
            orderBy: { order: 'asc' },
          },
        },
      })

      if (!chapter) {
        throw new BadRequestException('章节不存在')
      }

      if (chapter.projectId !== projectId) {
        throw new BadRequestException('章节不属于此项目')
      }

      title = chapter.title
      content = chapter.contents.map((c) => c.content).join('\n')
    } else {
      const chapters = await this.prisma.chapter.findMany({
        where: { projectId },
        include: {
          contents: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      })

      content = chapters.map((c) => `第${c.order + 1}章 ${c.title}:\n${c.contents.map((co) => co.content).join('\n')}`).join('\n\n')
    }

    const aiProvider = this.getProvider(provider)

    const systemPrompt = `你是一位专业的小说编辑，擅长总结章节或故事内容。

请为以下内容生成简洁准确的摘要。摘要应该：
1. 概括主要情节和事件
2. 突出重要的人物互动
3. 标注关键转折点
4. 保持客观中立

请直接输出摘要，不要添加任何前缀或解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `项目：${title}\n\n${content}` },
    ]

    const summary = await aiProvider.chat({
      model: model || this.defaultModel,
      messages,
      temperature: 0.3,
      maxTokens: 500,
    })

    return { summary }
  }

  async chat(dto: ChatDto): Promise<{ response: string; history: Array<{ role: string; content: string }> }> {
    const { projectId, message, history = [], provider, model, temperature } = dto

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    const writingContext = await this.contextBuilder.buildWritingContext(projectId)
    const aiProvider = this.getProvider(provider)

    const systemPrompt = `你是一位专业的小说写作助手，服务于项目"${project.title}"。

项目信息：
- 副标题：${project.subtitle || '无'}
- 简介：${project.synopsis || '无'}
- 类型：${project.genre || '未知'}
- 标签：${project.tags?.join(', ') || '无'}

${writingContext}

你可以帮助用户：
1. 续写故事内容
2. 讨论人物设定
3. 完善世界观设定
4. 提供写作建议
5. 检查内容一致性

请用中文回答，语气专业且友好。`

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ]

    const response = await aiProvider.chat({
      model: model || this.defaultModel,
      messages,
      temperature: temperature ?? 0.7,
      maxTokens: 2000,
    })

    const newHistory = [...history, { role: 'user', content: message }, { role: 'assistant', content: response }]

    return { response, history: newHistory }
  }
}
