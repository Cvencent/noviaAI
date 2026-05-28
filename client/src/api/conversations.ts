import { apiClient as client } from './client'
import type { Conversation, Message, ChoiceCard } from '../types/conversation'

export interface CreateAssistantStreamPayload {
  requestMessageId: string
  message: string
  provider?: string
  chapterId?: string
  chapterContent?: string
  chapterTitle?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface UpdateAssistantStreamPayload {
  content: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  actionsJson?: string
  cardsJson?: string
  error?: string
}

export interface CardWithMeta {
  card: ChoiceCard
  conversationId: string
  conversationTitle: string
  conversationType: string
  messageId: string
  messageContent: string
  messageTimestamp: string
}

export const conversationsApi = {
  getAll: async (projectId: string): Promise<Conversation[]> => {
    const response = await client.get(`/projects/${projectId}/conversations`)
    return response.data
  },

  getAllCards: async (projectId: string): Promise<CardWithMeta[]> => {
    const response = await client.get(`/projects/${projectId}/conversations/cards/all`)
    return response.data
  },

  create: async (projectId: string, data: { title: string; type?: string }): Promise<Conversation> => {
    const response = await client.post(`/projects/${projectId}/conversations`, data)
    return response.data
  },

  getById: async (projectId: string, id: string): Promise<Conversation> => {
    const response = await client.get(`/projects/${projectId}/conversations/${id}`)
    return response.data
  },

  update: async (projectId: string, id: string, data: Partial<Conversation>): Promise<Conversation> => {
    const response = await client.patch(`/projects/${projectId}/conversations/${id}`, data)
    return response.data
  },

  delete: async (projectId: string, id: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/conversations/${id}`)
  },

  sendMessage: async (
    projectId: string,
    id: string,
    message: { content: string; role: string; actionsJson?: string; cardsJson?: string },
  ): Promise<Message> => {
    const response = await client.post(`/projects/${projectId}/conversations/${id}/messages`, message)
    return response.data
  },

  updateMessageCards: async (
    projectId: string,
    conversationId: string,
    messageId: string,
    cards: ChoiceCard[],
  ): Promise<Message> => {
    const response = await client.patch(
      `/projects/${projectId}/conversations/${conversationId}/messages/${messageId}/cards`,
      { cardsJson: JSON.stringify(cards) },
    )
    return response.data
  },

  createAssistantStream: async (
    projectId: string,
    conversationId: string,
    payload: CreateAssistantStreamPayload,
  ): Promise<Message> => {
    const response = await client.post(
      `/projects/${projectId}/conversations/${conversationId}/assistant-streams`,
      payload,
    )
    return response.data
  },

  updateAssistantStream: async (
    projectId: string,
    conversationId: string,
    messageId: string,
    payload: UpdateAssistantStreamPayload,
  ): Promise<Message> => {
    const response = await client.patch(
      `/projects/${projectId}/conversations/${conversationId}/assistant-streams/${messageId}`,
      payload,
    )
    return response.data
  },

  selectCard: async (projectId: string, conversationId: string, cardId: string): Promise<any> => {
    const response = await client.post(`/projects/${projectId}/conversations/${conversationId}/cards/${cardId}/select`)
    return response.data
  },
}
