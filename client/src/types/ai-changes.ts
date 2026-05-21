export interface ContentChange {
  id: string
  type: 'replace' | 'insert' | 'delete'
  original: string
  suggested: string
  startIndex?: number
  endIndex?: number
  description?: string
}

export interface ChapterModification {
  chapterId: string
  chapterTitle: string
  changes: ContentChange[]
  fullOriginal: string
  fullSuggested: string
  timestamp: string
}

export interface ModificationConfig {
  requireConfirmation: boolean
  autoApplyMinorChanges: boolean
  showDiffInline: boolean
}

export const DEFAULT_MODIFICATION_CONFIG: ModificationConfig = {
  requireConfirmation: true,
  autoApplyMinorChanges: false,
  showDiffInline: true,
}
