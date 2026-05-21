import { apiClient } from './client'

export interface Scene {
  id: string
  projectId: string
  title: string
  summary?: string
  location?: string
  timePeriod?: string
  characters: string[]
  content?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateSceneDto {
  title: string
  summary?: string
  location?: string
  timePeriod?: string
  characters?: string
  content?: string
  order?: number
}

export interface UpdateSceneDto {
  title?: string
  summary?: string
  location?: string
  timePeriod?: string
  characters?: string
  content?: string
  order?: number
}

export interface ReorderScenesDto {
  sceneIds: string[]
}

function parseScene(scene: any): Scene {
  return {
    ...scene,
    characters: scene.characters 
      ? (typeof scene.characters === 'string' 
          ? scene.characters.split(',').filter(Boolean) 
          : scene.characters)
      : []
  }
}

export const scenesApi = {
  async getAll(projectId: string): Promise<Scene[]> {
    const response = await apiClient.get(`/projects/${projectId}/scenes`)
    return response.data.map(parseScene)
  },

  async getById(projectId: string, id: string): Promise<Scene> {
    const response = await apiClient.get(`/projects/${projectId}/scenes/${id}`)
    return parseScene(response.data)
  },

  async create(projectId: string, data: CreateSceneDto): Promise<Scene> {
    const response = await apiClient.post(`/projects/${projectId}/scenes`, data)
    return parseScene(response.data)
  },

  async update(projectId: string, id: string, data: UpdateSceneDto): Promise<Scene> {
    const response = await apiClient.put(`/projects/${projectId}/scenes/${id}`, data)
    return parseScene(response.data)
  },

  async delete(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/scenes/${id}`)
  },

  async reorder(projectId: string, data: ReorderScenesDto): Promise<Scene[]> {
    const response = await apiClient.put(`/projects/${projectId}/scenes/reorder`, data)
    return response.data.map(parseScene)
  },
}
