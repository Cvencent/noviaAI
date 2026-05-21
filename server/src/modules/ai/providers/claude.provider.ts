import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import { CompletionOptions } from './base.provider'

@Injectable()
export class ClaudeProvider {
  private baseUrl = 'https://api.anthropic.com/v1'
  private apiKey: string
  private apiVersion = '2023-06-01'

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || ''
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除末尾的斜杠
  }

  async chat(options: CompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('Claude API Key 未配置')
    }

    try {
      const systemMessage = options.messages.find((m) => m.role === 'system')
      const otherMessages = options.messages.filter((m) => m.role !== 'system')

      const client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'Content-Type': 'application/json',
        },
      })

      const response = await client.post('/messages', {
        model: options.model,
        system: systemMessage?.content || '',
        messages: otherMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
      })

      return (response.data as any).content[0].text
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Claude API 调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('Claude API Key 未配置')
    }

    try {
      const systemMessage = options.messages.find((m) => m.role === 'system')
      const otherMessages = options.messages.filter((m) => m.role !== 'system')

      const client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      })

      const response = await client.post('/messages', {
        model: options.model,
        system: systemMessage?.content || '',
        messages: otherMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
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

          const parsed = JSON.parse(trimmed.slice(6))
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text
          }
        }
      }
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Claude API 流式调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  getProviderName(): string {
    return 'claude'
  }
}
