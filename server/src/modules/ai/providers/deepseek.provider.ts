import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import { CompletionOptions } from './base.provider'

@Injectable()
export class DeepseekProvider {
  private baseUrl = 'https://api.deepseek.com'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ''
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除末尾的斜杠
  }

  async chat(options: CompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('DeepSeek API Key 未配置')
    }

    try {
      const client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const response = await client.post('/chat/completions', {
        model: options.model || 'deepseek-chat',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      })

      return (response.data as any).choices[0].message.content
    } catch (error: any) {
      throw new InternalServerErrorException(
        `DeepSeek API 调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('DeepSeek API Key 未配置')
    }

    try {
      const client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      })

      const response = await client.post('/chat/completions', {
        model: options.model || 'deepseek-chat',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      })

      let buffer = ''
      for await (const chunk of response.data as AsyncIterable<Buffer>) {
        buffer += chunk.toString('utf8')
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') return

          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        }
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        `DeepSeek API 流式调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  getProviderName(): string {
    return 'deepseek'
  }
}
