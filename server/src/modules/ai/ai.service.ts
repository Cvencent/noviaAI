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
  mimo: 'xiaomi/mimo-v2.5-pro',
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
      const result = await provider.chat({
        model,
        messages,
        temperature: dto.temperature,
      })

      await this.logUsage(userId, dto.projectId, 'chat', 'POST', 200, messages, result)

      return { response: result }
    } catch (error: any) {
      await this.logUsage(userId, dto.projectId, 'chat', 'POST', 500, messages, null)
      throw new InternalServerErrorException(`AI 调用失败: ${error.message}`)
    }
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
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: {
          take: 10,
        },
        chapters: {
          orderBy: { order: 'desc' },
          take: 3,
          include: {
            contents: {
              orderBy: { order: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    if (!project) {
      return ''
    }

    const characterInfo = project.characters
      .map(c => `人物: ${c.name}${c.role ? ` (${c.role})` : ''}${c.personality ? ` - 性格: ${c.personality}` : ''}`)
      .join('\n')

    const recentContent = project.chapters
      .flatMap(ch => ch.contents.map(c => c.content))
      .join('\n---\n')

    return `
项目: ${project.title}
类型: ${project.genre}
简介: ${project.synopsis}

主要人物:
${characterInfo || '暂无'}

最近章节内容:
${recentContent || '暂无'}
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
    requestBody: any,
    responseBody: any,
  ) {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: { userId, isActive: true },
        take: 1,
      })

      if (apiKeys.length > 0) {
        await this.usageLogsService.create(projectId, {
          apiKeyId: apiKeys[0].id,
          endpoint,
          method,
          statusCode,
          requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
          responseBody: responseBody ? JSON.stringify(responseBody) : undefined,
        })
      }
    } catch (error) {
      console.error('记录使用日志失败:', error)
    }
  }
}
