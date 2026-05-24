import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import { CompletionOptions } from './base.provider'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

@Injectable()
export class OpenaiProvider {
  private baseUrl = 'https://api.openai.com/v1'
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除末尾的斜杠
  }

  private getClient() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  private shouldRetry(error: any): boolean {
    const status = error.response?.status
    return (
      status === 429 || // 太多请求
      status === 500 || // 服务器错误
      status === 502 || // 网关错误
      status === 503 || // 服务不可用
      status === 504 || // 网关超时
      !status // 网络错误
    )
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = MAX_RETRIES,
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        const delay = RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)
        await this.sleep(delay)
        return this.retryRequest(requestFn, retries - 1)
      }
      throw error
    }
  }

  async chat(options: CompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('OpenAI API Key 未配置')
    }

    return this.retryRequest(async () => {
      try {
        const client = this.getClient()
        const response = await client.post('/chat/completions', {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
          top_p: options.topP,
          frequency_penalty: options.frequencyPenalty,
          presence_penalty: options.presencePenalty,
          stop: options.stop,
        })
        return (response.data as any).choices[0].message.content
      } catch (error: any) {
        throw new InternalServerErrorException(
          `OpenAI API 调用失败: ${error.response?.data?.error?.message || error.message}`,
        )
      }
    })
  }

  async embed(input: string, model = 'text-embedding-3-small'): Promise<number[]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('OpenAI API Key 未配置')
    }

    return this.retryRequest(async () => {
      try {
        const client = this.getClient()
        const response = await client.post('/embeddings', {
          model,
          input,
        })
        return (response.data as any).data?.[0]?.embedding || []
      } catch (error: any) {
        throw new InternalServerErrorException(
          `OpenAI Embedding 调用失败: ${error.response?.data?.error?.message || error.message}`,
        )
      }
    })
  }

  async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('OpenAI API Key 未配置')
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
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
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
        `OpenAI API 流式调用失败: ${error.response?.data?.error?.message || error.message}`,
      )
    }
  }

  getProviderName(): string {
    return 'openai'
  }
}
