import { apiClient } from './client'

export interface TimelineEvent {
  id: string
  projectId: string
  chapterId?: string
  title: string
  eventDate?: string
  timeLabel?: string
  description?: string
  location?: string
  characters?: string
  importance: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateTimelineEventDto {
  title: string
  eventDate?: string
  timeLabel?: string
  description?: string
  location?: string
  characters?: string
  importance?: string
  order?: number
  chapterId?: string
}

export interface UpdateTimelineEventDto {
  title?: string
  eventDate?: string
  timeLabel?: string
  description?: string
  location?: string
  characters?: string
  importance?: string
  order?: number
  chapterId?: string
}

export const timelineApi = {
  async getAll(projectId: string): Promise<TimelineEvent[]> {
    const response = await apiClient.get(`/projects/${projectId}/timeline`)
    return response.data
  },

  async getById(projectId: string, id: string): Promise<TimelineEvent> {
    const response = await apiClient.get(`/projects/${projectId}/timeline/${id}`)
    return response.data
  },

  async create(projectId: string, data: CreateTimelineEventDto): Promise<TimelineEvent> {
    const response = await apiClient.post(`/projects/${projectId}/timeline`, data)
    return response.data
  },

  async update(projectId: string, id: string, data: UpdateTimelineEventDto): Promise<TimelineEvent> {
    const response = await apiClient.put(`/projects/${projectId}/timeline/${id}`, data)
    return response.data
  },

  async delete(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/timeline/${id}`)
  },

  async reorder(projectId: string, ids: string[]): Promise<void> {
    await apiClient.put(`/projects/${projectId}/timeline/reorder`, { ids })
  },
}
