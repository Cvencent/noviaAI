export interface Chapter {
  id: string
  projectId: string
  title: string
  order: number
  status: string
  wordCount: number
  summary?: string
  webNovelTemplateId?: string | null
  createdAt: string
  updatedAt: string
  contents?: ChapterContent[]
  summaries?: ChapterSummary[]
}

export interface ChapterContent {
  id: string
  chapterId: string
  content: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface ChapterSummary {
  id: string
  chapterId: string
  summary: string
  createdAt: string
  updatedAt: string
}

export interface CreateChapterDto {
  title: string
  order?: number
  status?: string
  wordCount?: number
  summary?: string
  webNovelTemplateId?: string | null
}

export interface UpdateChapterDto {
  title?: string
  order?: number
  status?: string
  wordCount?: number
  summary?: string
  webNovelTemplateId?: string | null
}

export interface AddContentDto {
  content: string
  order: number
}

export interface UpdateContentDto {
  content?: string
  order?: number
}

export interface AddSummaryDto {
  summary: string
}

export interface ReorderChaptersDto {
  chapterIds: string[]
}
