import { apiClient } from './client'

export interface OutlineItem {
  id: string
  outlineId: string
  chapterId?: string
  parentId?: string
  title: string
  summary?: string
  goal?: string
  conflict?: string
  outcome?: string
  povCharacter?: string
  location?: string
  estimatedWords?: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface Outline {
  id: string
  projectId: string
  title: string
  description?: string
  structureType: string
  status: string
  order: number
  createdAt: string
  updatedAt: string
  items: OutlineItem[]
}

export interface CreateOutlineDto {
  title: string
  description?: string
  structureType?: string
  status?: string
  order?: number
}

export interface GenerateOutlineDto {
  premise?: string
  structureTemplate?: 'THREE_ACT' | 'HERO_JOURNEY' | 'KISHOTENKETSU' | 'SAVE_THE_CAT' | 'SEVEN_POINT'
  chapterCount?: number
  targetWords?: number
}

export interface StructureHealthReport {
  outlineId: string
  templateId: string
  coverageScore: number
  pacingScore: number
  missingBeats: string[]
  overloadedBeats: string[]
  suggestions: string[]
}

export interface UpdateOutlineDto {
  title?: string
  description?: string
  structureType?: string
  status?: string
  order?: number
}

export interface CreateOutlineItemDto {
  title: string
  summary?: string
  goal?: string
  conflict?: string
  outcome?: string
  povCharacter?: string
  location?: string
  estimatedWords?: number
  order?: number
  chapterId?: string
  parentId?: string
}

export interface UpdateOutlineItemDto {
  title?: string
  summary?: string
  goal?: string
  conflict?: string
  outcome?: string
  povCharacter?: string
  location?: string
  estimatedWords?: number
  order?: number
  chapterId?: string
  parentId?: string
}

export const outlinesApi = {
  async getAll(projectId: string): Promise<Outline[]> {
    const response = await apiClient.get(`/projects/${projectId}/outlines`)
    return response.data
  },

  async getById(projectId: string, outlineId: string): Promise<Outline> {
    const response = await apiClient.get(`/projects/${projectId}/outlines/${outlineId}`)
    return response.data
  },

  async create(projectId: string, data: CreateOutlineDto): Promise<Outline> {
    const response = await apiClient.post(`/projects/${projectId}/outlines`, data)
    return response.data
  },

  async generateWithAi(projectId: string, data: GenerateOutlineDto): Promise<Outline> {
    const response = await apiClient.post(`/projects/${projectId}/outlines/ai-generate`, data)
    return response.data
  },

  async analyzeStructure(projectId: string, outlineId: string): Promise<StructureHealthReport> {
    const response = await apiClient.get(
      `/projects/${projectId}/outlines/${outlineId}/structure-health`,
    )
    return response.data
  },

  async update(projectId: string, outlineId: string, data: UpdateOutlineDto): Promise<Outline> {
    const response = await apiClient.put(`/projects/${projectId}/outlines/${outlineId}`, data)
    return response.data
  },

  async delete(projectId: string, outlineId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/outlines/${outlineId}`)
  },

  async addItem(
    projectId: string,
    outlineId: string,
    data: CreateOutlineItemDto,
  ): Promise<OutlineItem> {
    const response = await apiClient.post(
      `/projects/${projectId}/outlines/${outlineId}/items`,
      data,
    )
    return response.data
  },

  async updateItem(
    projectId: string,
    outlineId: string,
    itemId: string,
    data: UpdateOutlineItemDto,
  ): Promise<OutlineItem> {
    const response = await apiClient.put(
      `/projects/${projectId}/outlines/${outlineId}/items/${itemId}`,
      data,
    )
    return response.data
  },

  async deleteItem(
    projectId: string,
    outlineId: string,
    itemId: string,
  ): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/outlines/${outlineId}/items/${itemId}`)
  },

  async reorderItems(
    projectId: string,
    outlineId: string,
    itemIds: string[],
  ): Promise<Outline> {
    const response = await apiClient.put(
      `/projects/${projectId}/outlines/${outlineId}/items/reorder`,
      { itemIds },
    )
    return response.data
  },
}
