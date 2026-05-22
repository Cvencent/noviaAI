import { apiClient } from './client'

export interface ReaderExperienceChapter {
  chapterId: string
  title: string
  order: number
  emotion: {
    tension: number
    valence: number
    dominantTone: string
  }
  readability: {
    characterCount: number
    sentenceCount: number
    averageSentenceLength: number
    paragraphCount: number
    dialogueRatio: number
    score: number
  }
}

export interface ReaderExperienceRisk {
  chapterId: string
  title: string
  category: string
  severity: string
  message: string
}

export interface ReaderExperienceReport {
  projectId: string
  title: string
  summary: {
    chapterCount: number
    averageReadabilityScore: number
    averageTension: number
    riskCount: number
  }
  chapters: ReaderExperienceChapter[]
  risks: ReaderExperienceRisk[]
}

export const readerExperienceApi = {
  async analyze(projectId: string): Promise<ReaderExperienceReport> {
    const response = await apiClient.get(`/projects/${projectId}/reader-experience/analysis`)
    return response.data
  },
}
