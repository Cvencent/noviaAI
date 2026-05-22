import { apiClient } from './client'
import type { ContextPreview } from '@/types/ai-context'

export const aiApi = {
  async complete(params: {
    projectId: string
    chapterId?: string
    content: string
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
    maxTokens?: number
  }) {
    const response = await apiClient.post('/ai/text-complete', params)
    return response.data
  },

  async consistencyCheck(params: {
    projectId: string
    content: string
    provider?: 'openai' | 'claude'
    model?: string
  }) {
    const response = await apiClient.post('/ai/consistency-check', params)
    return response.data
  },

  async generateSummary(params: {
    projectId: string
    chapterId?: string
    provider?: 'openai' | 'claude'
    model?: string
  }) {
    const response = await apiClient.post('/ai/generate-summary', params)
    return response.data
  },

  async chat(params: {
    projectId: string
    message: string
    history?: Array<{ role: string; content: string }>
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
  }) {
    const response = await apiClient.post('/ai/chat', params)
    return response.data
  },

  async getContextPreview(
    projectId: string,
    params?: { chapterId?: string; currentText?: string },
  ): Promise<ContextPreview> {
    const response = await apiClient.get(`/ai/context-preview/${projectId}`, { params })
    return response.data
  },
}
