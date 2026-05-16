import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { AIProvider, CompletionOptions } from './base.provider'

@Injectable()
export class ClaudeProvider implements AIProvider {
  private readonly baseUrl = 'https://api.anthropic.com/v1'
  private apiKey: string
  private apiVersion = '2023-06-01'

  constructor(private httpService: HttpService) {
    this.apiKey = process.env.CLAUDE_API_KEY || ''
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(options: CompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('Claude API Key 未配置')
    }

    try {
      const systemMessage = options.messages.find((m) => m.role === 'system')
      const otherMessages = options.messages.filter((m) => m.role !== 'system')

      const response = await this.httpService
        .post(
          `${this.baseUrl}/messages`,
          {
            model: options.model,
            system: systemMessage?.content || '',
            messages: otherMessages.map((m) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 4096,
          },
          {
            headers: {
              'x-api-key': this.apiKey,
              'anthropic-version': this.apiVersion,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise()

      return response.data.content[0].text
    } catch (error) {
      throw new InternalServerErrorException(
        `Claude API 调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  getProviderName(): string {
    return 'claude'
  }
}
