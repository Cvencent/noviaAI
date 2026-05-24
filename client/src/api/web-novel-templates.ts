import { getWebNovelTemplate, getWebNovelTemplates, resolveTemplateInput, type WebNovelTemplate } from '@/types/web-novel-templates'
import { apiClient } from './client'

export interface ProjectTemplatePreference {
  projectTemplateId: string | null
  chapterTemplateId: string | null
}

export const webNovelTemplatesApi = {
  async list(): Promise<WebNovelTemplate[]> {
    return getWebNovelTemplates()
  },

  async getProjectTemplate(projectId: string): Promise<ProjectTemplatePreference> {
    const response = await apiClient.get(`/projects/${projectId}/template`)
    return response.data
  },

  async saveProjectTemplate(
    projectId: string,
    data: ProjectTemplatePreference
  ): Promise<void> {
    await apiClient.put(`/projects/${projectId}/template`, data)
  },

  getById: getWebNovelTemplate,
  resolve: resolveTemplateInput,
}
