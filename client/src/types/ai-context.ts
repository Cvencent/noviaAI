export type ContextPriority = 'critical' | 'high' | 'medium' | 'low'

export interface ContextPreviewSection {
  id: string
  title: string
  priority: ContextPriority
  source: string
  items: string[]
  tokenEstimate: number
}

export interface ContextPreview {
  projectId: string
  chapterId?: string
  sections: ContextPreviewSection[]
  totalTokenEstimate: number
  warnings: string[]
}
