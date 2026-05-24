import { apiClient } from './client'

export interface ChekhovsGun {
  id: string
  projectId: string
  name: string
  description: string
  setupText: string
  setupChapterId?: string
  setupPosition?: number
  status: string
  payoffText?: string
  payoffChapterId?: string
  importance: string
  tags?: string
  notes?: string
  createdAt: string
  updatedAt: string
  setupChapter?: any
  payoffChapter?: any
}

export interface PaginatedChekhovsGuns {
  data: ChekhovsGun[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateChekhovsGunDto {
  name: string
  description: string
  setupText: string
  setupChapterId?: string
  setupPosition?: number
  status?: string
  payoffText?: string
  payoffChapterId?: string
  importance?: string
  tags?: string
  notes?: string
}

export interface UpdateChekhovsGunDto {
  name?: string
  description?: string
  setupText?: string
  setupChapterId?: string
  setupPosition?: number
  status?: string
  payoffText?: string
  payoffChapterId?: string
  importance?: string
  tags?: string
  notes?: string
}

export const chekhovsGunsApi = {
  async getAll(projectId: string, page?: number, limit?: number): Promise<PaginatedChekhovsGuns> {
    const params = new URLSearchParams()
    if (page !== undefined) params.append('page', page.toString())
    if (limit !== undefined) params.append('limit', limit.toString())
    const queryString = params.toString()
    const url = queryString ? `/projects/${projectId}/chekhovs-guns?${queryString}` : `/projects/${projectId}/chekhovs-guns`
    const response = await apiClient.get(url)
    return response.data
  },

  async getAllWithoutPagination(projectId: string): Promise<ChekhovsGun[]> {
    const response = await apiClient.get(`/projects/${projectId}/chekhovs-guns?page=1&limit=10000`)
    return response.data.data
  },

  async getById(projectId: string, gunId: string): Promise<ChekhovsGun> {
    const response = await apiClient.get(`/projects/${projectId}/chekhovs-guns/${gunId}`)
    return response.data
  },

  async create(projectId: string, data: CreateChekhovsGunDto): Promise<ChekhovsGun> {
    const response = await apiClient.post(`/projects/${projectId}/chekhovs-guns`, data)
    return response.data
  },

  async update(projectId: string, gunId: string, data: UpdateChekhovsGunDto): Promise<ChekhovsGun> {
    const response = await apiClient.put(`/projects/${projectId}/chekhovs-guns/${gunId}`, data)
    return response.data
  },

  async delete(projectId: string, gunId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/chekhovs-guns/${gunId}`)
  },
}
