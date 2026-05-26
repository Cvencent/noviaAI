import { apiClient as client } from './client'
import type { Conversation, Message, ChoiceCard } from '../types/conversation'

export const conversationsApi = {
  getAll: async (projectId: string): Promise<Conversation[]> => {
    const response = await client.get(`/projects/${projectId}/conversations`)
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

  selectCard: async (projectId: string, conversationId: string, cardId: string): Promise<any> => {
    const response = await client.post(`/projects/${projectId}/conversations/${conversationId}/cards/${cardId}/select`)
    return response.data
  },
}
