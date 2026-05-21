import { apiClient } from './client'
import type {
  WorldSetting,
  CreateWorldSettingDto,
  UpdateWorldSettingDto,
} from '../types/world-setting'

export { WorldSetting, CreateWorldSettingDto, UpdateWorldSettingDto }

export interface WorldConflict {
  type: string
  severity: string
  title: string
  description: string
  content: string
  suggestion: string
}

export interface WorldConflictResult {
  hasConflict: boolean
  conflicts: WorldConflict[]
  context: {
    relevantSettings: string[]
    mentionedItems: string[]
  }
}

export interface DetectedElement {
  type: 'character' | 'location' | 'magic' | 'organization' | 'item' | 'concept'
  name: string
  description?: string
  context: string
  confidence: number
}

export interface WorldElementAnalysis {
  newElements: DetectedElement[]
  existingElements: string[]
  suggestions: string[]
}

export const worldSettingsApi = {
  async getAll(projectId: string): Promise<WorldSetting[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings`)
    return response.data
  },

  async getByCategory(projectId: string, category: string): Promise<WorldSetting[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings`, {
      params: { category },
    })
    return response.data
  },

  async getCategories(projectId: string): Promise<string[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/categories`)
    return response.data
  },

  async getById(projectId: string, id: string): Promise<WorldSetting> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/${id}`)
    return response.data
  },

  async create(projectId: string, data: CreateWorldSettingDto): Promise<WorldSetting> {
    const response = await apiClient.post(`/projects/${projectId}/world-settings`, data)
    return response.data
  },

  async update(
    projectId: string,
    id: string,
    data: UpdateWorldSettingDto,
  ): Promise<WorldSetting> {
    const response = await apiClient.put(`/projects/${projectId}/world-settings/${id}`, data)
    return response.data
  },

  async delete(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/world-settings/${id}`)
  },

  async detectConflicts(
    projectId: string,
    content: string,
    options?: {
      checkGeography?: boolean
      checkMagic?: boolean
      checkPolitics?: boolean
      checkCulture?: boolean
      checkSocial?: boolean
    }
  ): Promise<WorldConflictResult> {
    const response = await apiClient.post(`/projects/${projectId}/world-settings/detect-conflicts`, {
      content,
      ...options,
    })
    return response.data
  },

  async getContext(projectId: string): Promise<{
    worldSettings: WorldSetting[]
    characters: any[]
    plots: any[]
  }> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/context`)
    return response.data
  },

  async getReference(projectId: string, settingId: string): Promise<{
    id: string
    name: string
    category: string
    reference: string
  }> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/reference/${settingId}`)
    return response.data
  },

  async search(projectId: string, query: string): Promise<any[]> {
    const response = await apiClient.get(`/projects/${projectId}/world-settings/search`, {
      params: { q: query },
    })
    return response.data
  },

  async extractElements(
    projectId: string,
    content: string,
    existingContent?: string,
  ): Promise<WorldElementAnalysis> {
    const response = await apiClient.post(`/projects/${projectId}/world-settings/extract-elements`, {
      content,
      existingContent,
    })
    return response.data
  },

  async addElement(
    projectId: string,
    element: { type: string; name: string; description?: string },
  ): Promise<{ id: string; type: string }> {
    const response = await apiClient.post(`/projects/${projectId}/world-settings/add-element`, element)
    return response.data
  },

  async batchAddElements(
    projectId: string,
    elements: Array<{ type: string; name: string; description?: string }>,
  ): Promise<Array<{ element: DetectedElement; result: { id: string; type: string } | null }>> {
    const response = await apiClient.post(`/projects/${projectId}/world-settings/batch-add-elements`, {
      elements,
    })
    return response.data
  },
}
