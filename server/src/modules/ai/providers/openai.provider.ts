import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { AIProvider, CompletionOptions } from './base.provider'

@Injectable()
export class OpenaiProvider implements AIProvider {
  private readonly baseUrl = 'https://api.openai.com/v1'
  private apiKey: string

  constructor(private httpService: HttpService) {
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(options: CompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('OpenAI API Key 未配置')
    }

    try {
      const response = await this.httpService
        .post(
          `${this.baseUrl}/chat/completions`,
          {
            model: options.model,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            frequency_penalty: options.frequencyPenalty,
            presence_penalty: options.presencePenalty,
            stop: options.stop,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise()

      return response.data.choices[0].message.content
    } catch (error) {
      throw new InternalServerErrorException(
        `OpenAI API 调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  getProviderName(): string {
    return 'openai'
  }
}
