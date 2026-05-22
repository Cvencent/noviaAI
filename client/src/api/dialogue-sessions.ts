import { apiClient } from './client'

export interface DialogueMessage {
  id: string
  sessionId: string
  speaker: string
  content: string
  type: 'DIALOGUE' | 'INSTRUCTION' | 'SYSTEM'
  order: number
  metadata?: string
  createdAt: string
}

export interface DialogueSession {
  id: string
  projectId: string
  chapterId?: string
  title: string
  location?: string
  conflict: string
  goal: string
  mood?: string
  allowSecretReveal: boolean
  length: 'short' | 'medium' | 'long'
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  characterIds: string
  currentTurn: number
  lastInstruction?: string
  createdAt: string
  updatedAt: string
  messages: DialogueMessage[]
}

export interface CreateDialogueSessionDto {
  title: string
  chapterId?: string
  characterIds: string[]
  location?: string
  conflict: string
  goal: string
  mood?: string
  allowSecretReveal?: boolean
  length?: 'short' | 'medium' | 'long'
}

export interface ContinueDialogueSessionDto {
  instruction?: string
  rounds?: number
}

export const dialogueSessionsApi = {
  async getAll(projectId: string, chapterId?: string): Promise<DialogueSession[]> {
    const params = chapterId ? `?chapterId=${encodeURIComponent(chapterId)}` : ''
    const response = await apiClient.get(`/projects/${projectId}/dialogue-sessions${params}`)
    return response.data
  },

  async create(projectId: string, data: CreateDialogueSessionDto): Promise<DialogueSession> {
    const response = await apiClient.post(`/projects/${projectId}/dialogue-sessions`, data)
    return response.data
  },

  async continue(
    projectId: string,
    sessionId: string,
    data: ContinueDialogueSessionDto,
  ): Promise<DialogueSession> {
    const response = await apiClient.post(
      `/projects/${projectId}/dialogue-sessions/${sessionId}/continue`,
      data,
    )
    return response.data
  },

  async pause(projectId: string, sessionId: string): Promise<DialogueSession> {
    const response = await apiClient.post(`/projects/${projectId}/dialogue-sessions/${sessionId}/pause`)
    return response.data
  },

  async resume(projectId: string, sessionId: string): Promise<DialogueSession> {
    const response = await apiClient.post(`/projects/${projectId}/dialogue-sessions/${sessionId}/resume`)
    return response.data
  },

  async delete(projectId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/dialogue-sessions/${sessionId}`)
  },
}
