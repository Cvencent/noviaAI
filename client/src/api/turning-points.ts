import { apiClient } from './client'

export interface TurningPoint {
  id: string
  projectId: string
  chapterId?: string
  title: string
  type: string
  description?: string
  impact?: string
  emotionalShift?: string
  position?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateTurningPointDto {
  title: string
  type: string
  description?: string
  impact?: string
  emotionalShift?: string
  position?: string
  order?: number
  chapterId?: string
}

export interface UpdateTurningPointDto {
  title?: string
  type?: string
  description?: string
  impact?: string
  emotionalShift?: string
  position?: string
  order?: number
  chapterId?: string
}

export const turningPointsApi = {
  async getAll(projectId: string): Promise<TurningPoint[]> {
    const response = await apiClient.get(`/projects/${projectId}/turning-points`)
    return response.data
  },

  async getById(projectId: string, id: string): Promise<TurningPoint> {
    const response = await apiClient.get(`/projects/${projectId}/turning-points/${id}`)
    return response.data
  },

  async create(projectId: string, data: CreateTurningPointDto): Promise<TurningPoint> {
    const response = await apiClient.post(`/projects/${projectId}/turning-points`, data)
    return response.data
  },

  async update(projectId: string, id: string, data: UpdateTurningPointDto): Promise<TurningPoint> {
    const response = await apiClient.put(`/projects/${projectId}/turning-points/${id}`, data)
    return response.data
  },

  async delete(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/turning-points/${id}`)
  },

  async reorder(projectId: string, ids: string[]): Promise<void> {
    await apiClient.put(`/projects/${projectId}/turning-points/reorder`, { ids })
  },
}
