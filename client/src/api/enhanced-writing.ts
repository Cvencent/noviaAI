import { apiClient } from './client'

// ==================== Lorebook API ====================
export interface LoreEntry {
  id: string
  name: string
  category: string
  description: string
  content?: string
  keywords: string[]
  priority: number
  isActive: boolean
  order: number
  triggerCondition?: string
  relatedCharacterIds?: string[]
  relatedLocationIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface LoreMatch {
  entry: LoreEntry
  matchedKeywords: string[]
  relevanceScore: number
}

export const lorebookApi = {
  async getEntries(projectId: string, category?: string) {
    const params = category ? { category } : {}
    const response = await apiClient.get<LoreEntry[]>(`/lorebook/${projectId}`, { params })
    return response.data
  },

  async getEntry(entryId: string) {
    const response = await apiClient.get<LoreEntry>(`/lorebook/entry/${entryId}`)
    return response.data
  },

  async createEntry(projectId: string, data: Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await apiClient.post<LoreEntry>(`/lorebook/${projectId}`, data)
    return response.data
  },

  async updateEntry(entryId: string, data: Partial<Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>>) {
    const response = await apiClient.put<LoreEntry>(`/lorebook/entry/${entryId}`, data)
    return response.data
  },

  async deleteEntry(entryId: string) {
    await apiClient.delete(`/lorebook/entry/${entryId}`)
  },

  async matchToText(projectId: string, text: string, options?: {
    maxResults?: number
    minScore?: number
    includeCategories?: string[]
  }) {
    const response = await apiClient.post<LoreMatch[]>(`/lorebook/${projectId}/match`, {
      text,
      ...options
    })
    return response.data
  },

  async generateContext(projectId: string, text: string, options?: {
    maxEntries?: number
    format?: 'compact' | 'detailed'
  }) {
    const response = await apiClient.post<{ context: string }>(`/lorebook/${projectId}/context`, {
      text,
      ...options
    })
    return response.data.context
  },
}

// ==================== Enhanced Writing API ====================
export interface ShowDontTellResult {
  original: string
  rewritten: string
  explanation: string
}

export interface EnhancedDescriptionResult {
  original: string
  enhanced: string
  suggestions: string[]
}

export interface RewriteResult {
  original: string
  versions: Array<{
    style: string
    content: string
  }>
}

export interface BrainstormIdea {
  title: string
  description: string
  potential: string
}

export interface BrainstormResult {
  ideas: BrainstormIdea[]
}

export interface DialogueResult {
  dialogue: string
  suggestions: string[]
}

export const enhancedWritingApi = {
  async showDontTell(text: string, options?: {
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
  }) {
    const response = await apiClient.post<ShowDontTellResult>('/enhanced-writing/show-dont-tell', {
      text,
      ...options
    })
    return response.data
  },

  async enhanceDescription(text: string, options?: {
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
    focus?: 'visual' | 'sensory' | 'emotional' | 'atmosphere'
    detailLevel?: 'light' | 'medium' | 'rich'
  }) {
    const response = await apiClient.post<EnhancedDescriptionResult>('/enhanced-writing/enhance-description', {
      text,
      ...options
    })
    return response.data
  },

  async rewrite(text: string, options?: {
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
    style?: 'vivid' | 'literary' | 'concise' | 'dramatic' | 'poetic'
    tone?: 'casual' | 'formal' | 'humorous' | 'serious'
  }) {
    const response = await apiClient.post<RewriteResult>('/enhanced-writing/rewrite', {
      text,
      ...options
    })
    return response.data
  },

  async brainstorm(prompt: string, options?: {
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
    type?: 'plot' | 'character' | 'dialogue' | 'worldbuilding' | 'conflict'
    count?: number
  }) {
    const response = await apiClient.post<BrainstormResult>('/enhanced-writing/brainstorm', {
      prompt,
      ...options
    })
    return response.data
  },

  async generateDialogue(context: string, characterNames: string[], options?: {
    provider?: 'openai' | 'claude'
    model?: string
    temperature?: number
  }) {
    const response = await apiClient.post<DialogueResult>('/enhanced-writing/generate-dialogue', {
      context,
      characterNames,
      ...options
    })
    return response.data
  },
}
