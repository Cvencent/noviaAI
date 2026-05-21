import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { OpenaiProvider } from '../ai/providers/openai.provider'
import { ClaudeProvider } from '../ai/providers/claude.provider'

export interface EnhancedWritingOptions {
  provider?: 'openai' | 'claude'
  model?: string
  temperature?: number
}

export interface RewriteOptions extends EnhancedWritingOptions {
  style?: 'vivid' | 'literary' | 'concise' | 'dramatic' | 'poetic'
  tone?: 'casual' | 'formal' | 'humorous' | 'serious'
}

export interface DescribeOptions extends EnhancedWritingOptions {
  focus?: 'visual' | 'sensory' | 'emotional' | 'atmosphere'
  detailLevel?: 'light' | 'medium' | 'rich'
}

export interface BrainstormOptions extends EnhancedWritingOptions {
  type?: 'plot' | 'character' | 'dialogue' | 'worldbuilding' | 'conflict'
  count?: number
}

@Injectable()
export class EnhancedWritingService {
  constructor(
    private prisma: PrismaService,
    private openaiProvider: OpenaiProvider,
    private claudeProvider: ClaudeProvider
  ) {}

  /**
   * Show, Don't Tell 转换
   * 把叙述性文字转换为生动的描写文字
   */
  async showDontTell(
    text: string,
    userId: string,
    options?: EnhancedWritingOptions
  ): Promise<{
    original: string
    rewritten: string
    explanation: string
  }> {
    const provider = this.getProvider(options?.provider || 'claude')
    const model = options?.model || this.getDefaultModel(options?.provider || 'claude')
    
    // 构建提示词
    const systemPrompt = `你是一位专业的写作教练，擅长"Show, Don't Tell（展示而非告知）的写作技巧。

Show, Don't Tell 是指：
- 不要直接说"他很生气"
- 而是展示"他的拳头攥得咯咯作响，指节泛白，胸膛剧烈起伏"

任务：将用户提供的Tell型叙述，转换为Show型描写。`

    const userPrompt = `请将以下文字从"Tell"转换为"Show"：

原文：
${text}

请提供：
1. 改写后的Show版本（更生动、更有画面感
2. 简短的解释说明你做了什么改动以及为什么`

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature || 0.7,
      })

      const parsedResult = this.parseShowDontTellResult(result)

      return {
        original: text,
        rewritten: parsedResult.rewritten || result,
        explanation: parsedResult.explanation || '',
      }
    } catch (error) {
      throw new Error('Show, Don\'t Tell 转换失败')
    }
  }

  /**
   * 描写增强工具
   * 扩展和润色选中的段落
   */
  async enhanceDescription(
    text: string,
    userId: string,
    options?: DescribeOptions
  ): Promise<{
      original: string
      enhanced: string
      suggestions: string[]
    }> {
    const provider = this.getProvider(options?.provider || 'claude')
    const model = options?.model || this.getDefaultModel(options?.provider || 'claude')
    
    const focus = options?.focus || 'sensory'
    const detailLevel = options?.detailLevel || 'medium'
    
    const focusDescription = {
      visual: '视觉细节、色彩、光影、动作',
      sensory: '视觉、听觉、嗅觉、味觉、触觉的五感描写',
      emotional: '人物的情绪、心理活动、情感反应',
      atmosphere: '环境氛围、场景气氛、意境营造'
    }[focus]

    const detailInstruction = {
      light: '适当扩展，不要过于冗长',
      medium: '丰富的细节描写',
      rich: '极其详尽的细节，大量细节'
    }[detailLevel]

    const systemPrompt = `你是一位擅长细节描写大师。你的任务是扩写和增强用户提供的文本，增加生动的细节。`

    const userPrompt = `请扩写以下文本，增强描写。

原文：
${text}

要求：
- 重点增强：${focusDescription}
- 详略程度：${detailInstruction}

请提供：
1. 增强描写后的版本
2. 3-5个具体的改进建议（可以进一步优化的地方`

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature || 0.8,
      })

      const parsedResult = this.parseEnhancedDescriptionResult(result)

      return {
        original: text,
        enhanced: parsedResult.enhanced || result,
        suggestions: parsedResult.suggestions || [],
      }
    } catch (error) {
      throw new Error('描写增强失败')
    }
  }

  /**
   * 重写/润色工具
   * 多种风格重写
   */
  async rewrite(
    text: string,
    userId: string,
    options?: RewriteOptions
  ): Promise<{
      original: string
      versions: Array<{
        style: string
        content: string
      }>
    }> {
    const provider = this.getProvider(options?.provider || 'claude')
    const model = options?.model || this.getDefaultModel(options?.provider || 'claude')
    
    const styleDescriptions = {
      vivid: '生动形象，画面感强',
      literary: '文学性强，语言优美',
      concise: '简洁有力，删繁就简',
      dramatic: '戏剧性强，富有张力',
      poetic: '诗意化，富有意境'
    }

    const style = options?.style || 'vivid'

    const systemPrompt = `你是一位文字润色大师，能够将一段文字用多种风格进行改写。`

    const userPrompt = `请将以下文字用"${style}"（${styleDescriptions[style]}）的风格重写：

原文：
${text}

请提供1-3个不同的改写版本，每个版本都用${styleDescriptions[style]}风格。`

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature || 0.8,
      })

      const parsedResult = this.parseRewriteResult(result, style)

      return {
        original: text,
        versions: parsedResult.versions || [{ style, content: result }],
      }
    } catch (error) {
      throw new Error('重写失败')
    }
  }

  /**
   * 头脑风暴功能
   * 激发创意灵感
   */
  async brainstorm(
    prompt: string,
    userId: string,
    options?: BrainstormOptions
  ): Promise<{
      ideas: Array<{
        title: string
        description: string
        potential: string
      }>
    }> {
    const provider = this.getProvider(options?.provider || 'claude')
    const model = options?.model || this.getDefaultModel(options?.provider || 'claude')
    
    const type = options?.type || 'plot'
    const count = options?.count || 5

    const typeDescription = {
      plot: '情节转折、剧情发展',
      character: '人物设定、人物关系、人物弧光',
      dialogue: '对话创意、对话风格',
      worldbuilding: '世界观设定、世界细节',
      conflict: '冲突设计、矛盾冲突'
    }[type]

    const systemPrompt = `你是一位创意写作的头脑风暴专家。你的任务是激发创意，提供有创意的灵感。`

    const userPrompt = `请围绕以下主题进行头脑风暴：

主题：
${prompt}

类型：${typeDescription}
请提供 ${count} 个创意想法，每个想法包括：
- 简洁的标题
- 详细的描述
- 这个想法的潜力/发展可能性

请确保想法要多样化，既有常规的，也有突破性的创意。`

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature || 0.9,
      })

      const parsedResult = this.parseBrainstormResult(result)

      return {
        ideas: parsedResult.ideas || [],
      }
    } catch (error) {
      throw new Error('头脑风暴失败')
    }
  }

  /**
   * 对话生成/增强
   */
  async generateDialogue(
    context: string,
    characterNames: string[],
    userId: string,
    options?: EnhancedWritingOptions
  ): Promise<{
      dialogue: string
      suggestions: string[]
    }> {
    const provider = this.getProvider(options?.provider || 'claude')
    const model = options?.model || this.getDefaultModel(options?.provider || 'claude')
    
    const systemPrompt = `你是一位对话写作专家。你擅长写自然、符合人物性格、推动情节的对话。`

    const userPrompt = `请根据以下上下文，写一段对话。

上下文：
${context}

人物：${characterNames.join('、')}

要求：
- 对话要符合人物性格
- 对话要自然流畅
- 对话要推动情节发展或揭示人物关系`

    try {
      const result = await provider.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature || 0.8,
      })

      return {
        dialogue: result,
        suggestions: ['可以尝试让对话更有张力', '可以增加潜台词'],
      }
    } catch (error) {
      throw new Error('对话生成失败')
    }
  }

  private getProvider(provider: string) {
    return provider === 'openai' ? this.openaiProvider : this.claudeProvider
  }

  private getDefaultModel(provider: string): string {
    return provider === 'openai' ? 'gpt-4' : 'claude-3-sonnet-20240229'
  }

  private parseShowDontTellResult(text: string): { rewritten: string; explanation: string } {
    return { rewritten: text, explanation: '' }
  }

  private parseEnhancedDescriptionResult(text: string): { enhanced: string; suggestions: string[] } {
    return { enhanced: text, suggestions: [] }
  }

  private parseRewriteResult(text: string, style: string): { versions: Array<{ style: string; content: string }> } {
    return { versions: [{ style, content: text }] }
  }

  private parseBrainstormResult(text: string): { ideas: Array<{ title: string; description: string; potential: string }> } {
    return { ideas: [] }
  }
}
