import { apiClient } from './client'
import type {
  Chapter,
  CreateChapterDto,
  UpdateChapterDto,
  AddContentDto,
  AddSummaryDto,
  ReorderChaptersDto,
  UpdateContentDto,
  ChapterContent,
  ChapterSummary,
} from '../types/chapter'

export type { Chapter }

export interface UpdateChapterContentDto {
  title: string
  contents: Array<{ content: string; order: number }>
}

export const chaptersApi = {
  async getAll(projectId: string): Promise<Chapter[]> {
    const response = await apiClient.get(`/projects/${projectId}/chapters`)
    return response.data
  },

  async getById(projectId: string, chapterId: string): Promise<Chapter> {
    const response = await apiClient.get(`/projects/${projectId}/chapters/${chapterId}`)
    return response.data
  },

  async create(projectId: string, data: CreateChapterDto): Promise<Chapter> {
    const response = await apiClient.post(`/projects/${projectId}/chapters`, data)
    return response.data
  },

  async update(projectId: string, chapterId: string, data: UpdateChapterDto): Promise<Chapter> {
    const response = await apiClient.put(`/projects/${projectId}/chapters/${chapterId}`, data)
    return response.data
  },

  async delete(projectId: string, chapterId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/chapters/${chapterId}`)
  },

  async reorder(projectId: string, data: ReorderChaptersDto): Promise<Chapter[]> {
    const response = await apiClient.put(`/projects/${projectId}/chapters/reorder`, data)
    return response.data
  },

  async addContent(
    projectId: string,
    chapterId: string,
    data: AddContentDto,
  ): Promise<ChapterContent> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/contents`,
      data,
    )
    return response.data
  },

  async updateContent(
    projectId: string,
    chapterId: string,
    data: UpdateChapterContentDto,
  ): Promise<Chapter> {
    const response = await apiClient.put(
      `/projects/${projectId}/chapters/${chapterId}/contents`,
      data,
    )
    return response.data
  },

  async updateContentById(
    projectId: string,
    chapterId: string,
    contentId: string,
    data: UpdateContentDto,
  ): Promise<ChapterContent> {
    const response = await apiClient.put(
      `/projects/${projectId}/chapters/${chapterId}/contents/${contentId}`,
      data,
    )
    return response.data
  },

  async removeContent(
    projectId: string,
    chapterId: string,
    contentId: string,
  ): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/chapters/${chapterId}/contents/${contentId}`)
  },

  async addSummary(
    projectId: string,
    chapterId: string,
    data: AddSummaryDto,
  ): Promise<ChapterSummary> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/summaries`,
      data,
    )
    return response.data
  },

  async removeSummary(
    projectId: string,
    chapterId: string,
    summaryId: string,
  ): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/chapters/${chapterId}/summaries/${summaryId}`)
  },

  async getWordCount(projectId: string, chapterId: string): Promise<number> {
    const response = await apiClient.get(
      `/projects/${projectId}/chapters/${chapterId}/word-count`,
    )
    return response.data.wordCount
  },

  async getProjectWordCount(projectId: string): Promise<{ wordCount: number }> {
    const response = await apiClient.get(`/projects/${projectId}/chapters/stats/total-words`)
    return response.data
  },
}
