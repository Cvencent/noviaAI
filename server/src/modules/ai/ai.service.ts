import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { OpenaiProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { DeepseekProvider } from './providers/deepseek.provider'
import { MimoProvider } from './providers/mimo.provider'
import { ChatDto, ConsistencyCheckDto, GenerateSummaryDto, CompleteDto } from './dto'
import { AIAction, AIProvider as AIConfigProvider } from '../ai-config/dto/create-ai-config.dto'
import { ApiKeysService } from '../api-keys/api-keys.service'
import { AIConfigService } from '../ai-config/ai-config.service'
import { UsageLogsService } from '../usage-logs/usage-logs.service'
import { StyleApplicationService } from '../writing-styles/style-application.service'
import { ContextBuilderService } from './context-builder.service'
import { AIProvider, ChatMessage } from './providers/base.provider'
import axios from 'axios'
import { Prisma } from '@prisma/client'

type ProviderName = 'openai' | 'claude' | 'deepseek' | 'mimo'

const DEFAULT_CHAT_ACTION = AIAction.DIALOGUE_GENERATION

const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: 'gpt-4',
  claude: 'claude-3-sonnet-20240229',
  deepseek: 'deepseek-chat',
  mimo: 'mimo-v2.5-pro',
}

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private openaiProvider: OpenaiProvider,
    private claudeProvider: ClaudeProvider,
    private deepseekProvider: DeepseekProvider,
    private mimoProvider: MimoProvider,
    private apiKeysService: ApiKeysService,
    private aiConfigService: AIConfigService,
    private usageLogsService: UsageLogsService,
    private styleApplicationService: StyleApplicationService,
    private contextBuilderService: ContextBuilderService,
  ) {}

  async chat(userId: string, dto: ChatDto) {
    const config = await this.aiConfigService.getConfig(userId, dto.action ?? DEFAULT_CHAT_ACTION)
    const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'openai'
    const model = dto.model || config?.model || DEFAULT_MODELS[providerName]
    const provider = this.getProvider(providerName)
    const keyData = await this.getApiKey(userId, providerName)

    if (!keyData) {
      throw new InternalServerErrorException('未配置 API Key')
    }

    provider.setApiKey(keyData.apiKey)
    if (keyData.baseUrl) {
      provider.setBaseUrl(keyData.baseUrl)
    }

    const messages: ChatMessage[] = dto.history
      ? [...dto.history, { role: 'user' as const, content: dto.message }]
      : [{ role: 'user' as const, content: dto.message }]

    try {
      const startTime = Date.now()
      const result = await provider.chat({
        model,
        messages,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      })
      const duration = Date.now() - startTime

      await this.logUsage(userId, dto.projectId, 'chat', 'POST', 200, messages, result, { model, duration })

      return { response: result }
    } catch (error: any) {
      await this.logUsage(userId, dto.projectId, 'chat', 'POST', 500, messages, null, { model })
      throw new InternalServerErrorException(`AI 调用失败: ${error.message}`)
    }
  }

  async *chatStream(userId: string, dto: ChatDto): AsyncGenerator<string> {
    const config = await this.aiConfigService.getConfig(userId, dto.action ?? DEFAULT_CHAT_ACTION)
    const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'openai'
    const model = dto.model || config?.model || DEFAULT_MODELS[providerName]
    const provider = this.getProvider(providerName)
    const keyData = await this.getApiKey(userId, providerName)

    if (!keyData) {
      throw new InternalServerErrorException('未配置 API Key')
    }

    provider.setApiKey(keyData.apiKey)
    if (keyData.baseUrl) {
      provider.setBaseUrl(keyData.baseUrl)
    }

    const messages: ChatMessage[] = dto.history
      ? [...dto.history, { role: 'user' as const, content: dto.message }]
      : [{ role: 'user' as const, content: dto.message }]

    yield* provider.chatStream({
      model,
      messages,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    })
  }

  async consistencyCheck(userId: string, dto: ConsistencyCheckDto) {
    const config = await this.aiConfigService.getConfig(userId, AIAction.CONSISTENCY_CHECK)
    const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'claude'
    const model = dto.model || config?.model || 'claude-3-sonnet-20240229'

    const keyData = await this.getApiKey(userId, providerName)
    if (!keyData) {
      throw new InternalServerErrorException('未配置 API Key')
    }

    const provider = this.getProvider(providerName)
    provider.setApiKey(keyData.apiKey)
    if (keyData.baseUrl) {
      provider.setBaseUrl(keyData.baseUrl)
    }

    const context = await this.buildContext(dto.projectId)

    const systemPrompt = `你是一位专业的小说一致性检查员。请检查以下内容是否存在以下问题：
1. 人物外貌描述前后不一致
2. 人物性格与行为不符
3. 时间线矛盾
4. 地点描述矛盾
5. 人物关系矛盾

上下文信息：
${context}

请分析并给出问题列表和改进建议。`

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: dto.content },
        ],
        temperature: 0.3,
      })

      return { result }
    } catch (error: any) {
      throw new InternalServerErrorException(`一致性检查失败: ${error.message}`)
    }
  }

  async generateSummary(userId: string, dto: GenerateSummaryDto) {
    const config = await this.aiConfigService.getConfig(userId, AIAction.SUMMARY_GENERATION)
    const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'openai'
    const model = dto.model || config?.model || 'gpt-4'

    const keyData = await this.getApiKey(userId, providerName)
    if (!keyData) {
      throw new InternalServerErrorException('未配置 API Key')
    }

    const provider = this.getProvider(providerName)
    provider.setApiKey(keyData.apiKey)
    if (keyData.baseUrl) {
      provider.setBaseUrl(keyData.baseUrl)
    }

    let content = ''

    if (dto.chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: dto.chapterId },
        include: {
          contents: {
            orderBy: { order: 'asc' },
          },
        },
      })

      if (chapter) {
        content = chapter.contents.map(c => c.content).join('\n')
      }
    }

    if (!content) {
      throw new InternalServerErrorException('未找到章节内容')
    }

    const systemPrompt = '请为以下小说章节生成简洁准确的摘要（100字以内）：'

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content },
        ],
        temperature: 0.3,
      })

      return { summary: result }
    } catch (error: any) {
      throw new InternalServerErrorException(`摘要生成失败: ${error.message}`)
    }
  }

  async textComplete(userId: string, dto: CompleteDto) {
    const config = await this.aiConfigService.getConfig(userId, AIAction.TEXT_COMPLETION)
    const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'openai'
    const model = dto.model || config?.model || 'gpt-4'

    const keyData = await this.getApiKey(userId, providerName)
    if (!keyData) {
      throw new InternalServerErrorException('未配置 API Key')
    }

    const provider = this.getProvider(providerName)
    provider.setApiKey(keyData.apiKey)
    if (keyData.baseUrl) {
      provider.setBaseUrl(keyData.baseUrl)
    }

    // 获取多阶段风格提示词（这是核心改进）
    let systemPrompt = ''
    try {
      const stylePrompt = await this.styleApplicationService.generateMultiStageStylePrompt(
        dto.projectId,
        userId,
        dto.content
      )
      systemPrompt = stylePrompt.fullPrompt
    } catch (e) {
      // 如果风格提示失败，回退到简单提示
      const context = await this.contextBuilderService.buildWritingContext(dto.projectId)
      systemPrompt = `你是一位专业的小说作家。请根据上下文续写故事，保持文风一致，情节连贯。\n\n${context}`
    }

    // 追加基础上下文预览信息
    try {
      const preview = await this.contextBuilderService.buildContextPreview(
        dto.projectId,
        userId,
        { currentText: dto.content },
      )
      const previewText = this.contextBuilderService.formatContextPreviewForPrompt(preview)
      if (previewText) {
        systemPrompt += `\n\n# 创作基础上下文\n\n${previewText}`
      }
    } catch (previewError) {
      // 上下文预览增强失败不应影响文本续写
      console.warn('上下文预览构建失败，使用已有提示词:', previewError)
    }

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: `【当前需要续写的内容】\n\n${dto.content}` },
        ],
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens,
      })

      return { completion: result }
    } catch (error: any) {
      throw new InternalServerErrorException(`文本续写失败: ${error.message}`)
    }
  }

  async *textCompleteStream(userId: string, dto: CompleteDto): AsyncGenerator<string> {
    const config = await this.aiConfigService.getConfig(userId, AIAction.TEXT_COMPLETION)
    const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'openai'
    const model = dto.model || config?.model || 'gpt-4'

    const keyData = await this.getApiKey(userId, providerName)
    if (!keyData) {
      throw new InternalServerErrorException('未配置 API Key')
    }

    const provider = this.getProvider(providerName)
    provider.setApiKey(keyData.apiKey)
    if (keyData.baseUrl) {
      provider.setBaseUrl(keyData.baseUrl)
    }

    let systemPrompt = ''
    try {
      const stylePrompt = await this.styleApplicationService.generateMultiStageStylePrompt(
        dto.projectId,
        userId,
        dto.content,
      )
      systemPrompt = stylePrompt.fullPrompt
    } catch (e) {
      const context = await this.contextBuilderService.buildWritingContext(dto.projectId)
      systemPrompt = `你是一位专业的小说作家。请根据上下文续写故事，保持文风一致，情节连贯。\n\n${context}`
    }

    // 追加基础上下文预览信息
    try {
      const preview = await this.contextBuilderService.buildContextPreview(
        dto.projectId,
        userId,
        { currentText: dto.content },
      )
      const previewText = this.contextBuilderService.formatContextPreviewForPrompt(preview)
      if (previewText) {
        systemPrompt += `\n\n# 创作基础上下文\n\n${previewText}`
      }
    } catch (previewError) {
      console.warn('上下文预览构建失败，使用已有提示词:', previewError)
    }

    yield* provider.chatStream({
      model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: `【当前需要续写的内容】\n\n${dto.content}` },
      ],
      temperature: dto.temperature ?? 0.7,
      maxTokens: dto.maxTokens,
    })
  }

  private async buildContext(projectId: string): Promise<string> {
    try {
      const baseContext = await this.contextBuilderService.buildWritingContext(projectId)

      const stylePrompt = await this.styleApplicationService.generateMultiStageStylePrompt(
        projectId,
        '',
      )

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      })

      let templateContext = ''
      if (project?.webNovelTemplateId) {
        const template = await this.getWebNovelTemplate(project.webNovelTemplateId)
        if (template) {
          templateContext = this.buildTemplateContext(template)
        }
      }

      const fullContext = `${templateContext}

${baseContext}

${stylePrompt.fullPrompt}`

      return fullContext
    } catch (error) {
      console.error('构建上下文失败:', error)
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      })
      return `项目: ${project?.title || ''}
类型: ${project?.genre || ''}
简介: ${project?.synopsis || ''}`
    }
  }

  private async getWebNovelTemplate(templateId: string) {
    const templates = {
      'shuangwen-system': {
        name: '爽文/系统流',
        promptBlocks: {
          system: '按爽文/系统流写作：强钩子、快推进、强反馈，让读者持续获得期待与兑现。',
          contract: '本章必须完成一次明确推进，能让读者感知升级、奖励、打脸或局势反转。',
          pacing: '事件密度高，段落偏短，尽量把信息拆成可读的小块，并在结尾留下期待。',
          taboo: '禁止大段设定讲解；禁止一章内把主线秘密全说完；金手指必须有代价、限制或冷却。',
          chapter: '写出爽点、压力点和下一章钩子，让本章读完后还有继续读下去的欲望。',
        },
      },
      'xianxia': {
        name: '修仙/玄幻',
        promptBlocks: {
          system: '按修仙/玄幻写作：突出境界、资源、法则与强弱秩序，兼顾机缘和压迫感。',
          contract: '本章必须体现主角目标与世界规则之间的张力，并推进一次修行、争夺或身份变化。',
          pacing: '允许少量铺垫，但每章要有资源、信息、能力或关系上的微兑现。',
          taboo: '禁止堆设定；禁止突破无代价；禁止让角色绕开既有世界硬规则。',
          chapter: '结尾留下一个更高层级的威胁、选择或机缘，让升级链条清晰延续。',
        },
      },
      'urban-suspense': {
        name: '都市悬疑',
        promptBlocks: {
          system: '按都市悬疑写作：让日常现实与谜团自然交织，用信息差驱动阅读。',
          contract: '本章必须保留至少一个未解问题，同时给出一个新的观察角度或证据变化。',
          pacing: '线索、误导、情绪压力交替出现，避免平铺直叙的解释。',
          taboo: '不要强行解释谜底；不要让主角凭空全知；不要让关键线索没有前文依据。',
          chapter: '让人物关系推动悬疑，结尾留下一句能让人停不住的钩子。',
        },
      },
      'romance': {
        name: '言情/甜宠',
        promptBlocks: {
          system: '按言情/甜宠写作：重点是人物互动的温度、节奏和关系张力。',
          contract: '本章必须让关系往前走半步，同时留一点没说透的情绪。',
          pacing: '场景切换轻巧，台词自然，情绪变化要可感知。',
          taboo: '不要过度煽情；不要让角色变成单一功能；不要靠误会无限拖延。',
          chapter: '收束时留一个让人会心一笑或心头一动的尾句。',
        },
      },
    }
    return templates[templateId as keyof typeof templates] || null
  }

  private buildTemplateContext(template: any): string {
    return `
## 网文模板：${template.name}

### 系统设定
${template.promptBlocks.system}

### 本章契约
${template.promptBlocks.contract}

### 节奏要求
${template.promptBlocks.pacing}

### 禁忌事项
${template.promptBlocks.taboo}

### 章节目标
${template.promptBlocks.chapter}
`
  }

  private getProvider(name: ProviderName): AIProvider {
    switch (name) {
      case 'openai':
        return this.openaiProvider
      case 'claude':
        return this.claudeProvider
      case 'deepseek':
        return this.deepseekProvider
      case 'mimo':
        return this.mimoProvider
      default:
        return this.openaiProvider
    }
  }

  private toProviderName(provider?: string | null): ProviderName | undefined {
    switch (provider) {
      case 'openai':
      case 'claude':
      case 'deepseek':
      case 'mimo':
        return provider
      default:
        return undefined
    }
  }

  private async getApiKey(userId: string, provider: ProviderName): Promise<{ apiKey: string; baseUrl: string | null } | null> {
    return this.apiKeysService.getActiveKey(userId, provider)
  }

  private async logUsage(
    userId: string,
    projectId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    messages: ChatMessage[],
    result: any,
    options?: { model?: string; duration?: number; tokensUsed?: number },
  ) {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: { userId, isActive: true },
        take: 1,
      })

      if (apiKeys.length > 0) {
        const promptContent = messages?.map(m => `[${m.role}]\n${m.content}`).join('\n\n') || ''
        const responseContent = typeof result === 'string' ? result : (result ? JSON.stringify(result) : '')
        const promptTokens = promptContent.length > 0 ? Math.ceil(promptContent.length / 4) : undefined

        await this.usageLogsService.create(projectId, {
          apiKeyId: apiKeys[0].id,
          endpoint,
          method,
          statusCode,
          requestBody: messages ? JSON.stringify(messages) : undefined,
          responseBody: result ? JSON.stringify(result) : undefined,
          model: options?.model,
          duration: options?.duration,
          promptContent: promptContent || undefined,
          responseContent: responseContent || undefined,
          promptTokens,
          tokensUsed: options?.tokensUsed,
        })
      }
    } catch (error) {
      console.error('记录使用日志失败:', error)
    }
  }
}
