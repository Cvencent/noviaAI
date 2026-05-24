import type { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto 
} from '../types/project'
import { apiClient } from './client'

export type { Project, CreateProjectDto, UpdateProjectDto }

export interface ProjectAiSuggestions {
  nextSteps?: string[]
  contentSuggestions?: string[]
  characterSuggestions?: string[]
  worldSuggestions?: string[]
  plotSuggestions?: string[]
}

export interface ProjectAiSuggestionJob {
  id: string
  projectId: string
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
  input: string
  result?: string | null
  error?: string | null
  createdAt: string
  updatedAt: string
}

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get('/projects')
    return response.data
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  },

  async create(data: CreateProjectDto): Promise<Project> {
    const response = await apiClient.post('/projects', data)
    return response.data
  },

  async aiGenerate(description: string): Promise<Project> {
    const response = await apiClient.post('/projects/ai-generate', { description })
    return response.data
  },

  async aiGenerateCharacters(id: string, count?: number): Promise<any[]> {
    const response = await apiClient.post(`/projects/${id}/ai-generate-characters`, { count })
    return response.data
  },

  async aiGenerateWorldSettings(id: string, count?: number): Promise<any[]> {
    const response = await apiClient.post(`/projects/${id}/ai-generate-world-settings`, { count })
    return response.data
  },

  async aiExpandCharacter(id: string, characterId: string): Promise<any> {
    const response = await apiClient.post(`/projects/${id}/ai-expand-character/${characterId}`)
    return response.data
  },

  async aiExpandWorldSetting(id: string, settingId: string): Promise<any> {
    const response = await apiClient.post(`/projects/${id}/ai-expand-world-setting/${settingId}`)
    return response.data
  },

  async aiGetSuggestions(id: string): Promise<any> {
    const response = await apiClient.get(`/projects/${id}/ai-suggestions`)
    return response.data
  },

  async createAiSuggestionJob(id: string): Promise<ProjectAiSuggestionJob> {
    const response = await apiClient.post(`/projects/${id}/ai-suggestions/jobs`)
    return response.data
  },

  async listAiSuggestionJobs(id: string): Promise<ProjectAiSuggestionJob[]> {
    const response = await apiClient.get(`/projects/${id}/ai-suggestions/jobs`)
    return response.data
  },

  async aiGenerateChapterOutline(id: string, chapterId?: string, content?: string): Promise<any> {
    const response = await apiClient.post(`/projects/${id}/ai-chapter-outline`, { chapterId, content })
    return response.data
  },

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  },

  async export(id: string): Promise<void> {
    const response = await apiClient.get(`/projects/${id}/export`, {
      responseType: 'blob',
    })
    
    const contentDisposition = response.headers['content-disposition']
    let filename = `project_${id}_${Date.now()}.json`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async import(jsonData: object): Promise<Project> {
    const response = await apiClient.post('/projects/import', jsonData)
    return response.data
  },
}
