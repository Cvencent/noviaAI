import { apiClient } from './client'
import { ContentChange } from '@/types/ai-changes'

export interface AssistantAction {
  type: 'create_character' | 'create_relationship' | 'create_world_setting' | 'modify_chapter' | 'chat' | 'unknown'
  data: any
  response: string
}

export interface AssistantResponse {
  response: string
  actions: AssistantAction[]
}

export interface AssistantConversationHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChapterModificationData {
  chapterId: string
  changes: ContentChange[]
  fullSuggested: string
}

export const aiAssistantApi = {
  async chat(
    projectId: string,
    message: string,
    provider?: string,
    chapterContext?: {
      chapterId: string
      chapterContent: string
      chapterTitle: string
    },
    conversationHistory?: AssistantConversationHistoryMessage[],
  ): Promise<AssistantResponse> {
    const response = await apiClient.post('/ai-assistant/chat', {
      projectId,
      message,
      provider,
      conversationHistory,
      ...chapterContext,
    })
    return response.data
  },
}
