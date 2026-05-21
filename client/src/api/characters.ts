import { apiClient } from './client'
import type {
  Character,
  CreateCharacterDto,
  UpdateCharacterDto,
  CreateCharacterRelationshipDto,
  UpdateCharacterRelationshipDto,
  CharacterRelationship,
} from '../types/character'

export { Character, CharacterRelationship, CreateCharacterDto, UpdateCharacterDto }

export interface DetectedCharacter {
  name: string
  role?: string
  description?: string
  context: string
  confidence: number
}

export interface DetectedRelationship {
  character1: string
  character2: string
  relationship: string
  description?: string
  context: string
  confidence: number
}

export interface ComprehensiveAnalysis {
  newCharacters: DetectedCharacter[]
  newRelationships: DetectedRelationship[]
  existingCharacters: string[]
  existingRelationships: string[]
  suggestions: string[]
}

export interface ProgressiveCharacterContextResult {
  context: string
  charactersLoaded: number
  totalCharacters: number
  truncated: boolean
}

export interface CharacterHierarchy {
  core: any[]
  important: any[]
  minor: any[]
}

export const charactersApi = {
  async getAll(projectId: string): Promise<Character[]> {
    const response = await apiClient.get(`/projects/${projectId}/characters`)
    return response.data
  },

  async getById(projectId: string, characterId: string): Promise<Character> {
    const response = await apiClient.get(
      `/projects/${projectId}/characters/${characterId}`
    )
    return response.data
  },

  async create(projectId: string, data: CreateCharacterDto): Promise<Character> {
    const response = await apiClient.post(
      `/projects/${projectId}/characters`,
      data
    )
    return response.data
  },

  async update(
    projectId: string,
    characterId: string,
    data: UpdateCharacterDto
  ): Promise<Character> {
    const response = await apiClient.put(
      `/projects/${projectId}/characters/${characterId}`,
      data
    )
    return response.data
  },

  async delete(projectId: string, characterId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/characters/${characterId}`)
  },

  async createRelationship(
    projectId: string,
    data: CreateCharacterRelationshipDto
  ): Promise<CharacterRelationship> {
    const response = await apiClient.post(
      `/projects/${projectId}/characters/relationships`,
      data
    )
    return response.data
  },

  async updateRelationship(
    projectId: string,
    relationshipId: string,
    data: UpdateCharacterRelationshipDto
  ): Promise<CharacterRelationship> {
    const response = await apiClient.put(
      `/projects/${projectId}/characters/relationships/${relationshipId}`,
      data
    )
    return response.data
  },

  async deleteRelationship(
    projectId: string,
    relationshipId: string
  ): Promise<void> {
    await apiClient.delete(
      `/projects/${projectId}/characters/relationships/${relationshipId}`
    )
  },

  async analyzeComprehensive(
    projectId: string,
    text: string
  ): Promise<ComprehensiveAnalysis> {
    const response = await apiClient.post(
      `/projects/${projectId}/characters/analyze-comprehensive`,
      { text }
    )
    return response.data
  },

  async generateCharacter(description: string): Promise<{
    name: string
    role: string
    appearance: string
    personality: string
    background: string
    goals: string
    flaws: string
  }> {
    const response = await apiClient.post(
      `/characters/generate`,
      { description }
    )
    return response.data
  },

  async getProgressiveContext(
    projectId: string,
    currentContent?: string,
    options?: {
      priority?: 'basic' | 'standard' | 'detailed'
      maxTokens?: number
    }
  ): Promise<ProgressiveCharacterContextResult> {
    const params = new URLSearchParams()
    if (currentContent) params.append('currentContent', currentContent)
    if (options?.priority) params.append('priority', options.priority)
    if (options?.maxTokens) params.append('maxTokens', options.maxTokens.toString())

    const response = await apiClient.get(
      `/projects/${projectId}/characters/progressive-context?${params.toString()}`
    )
    return response.data
  },

  async getCharacterHierarchy(
    projectId: string
  ): Promise<CharacterHierarchy> {
    const response = await apiClient.get(
      `/projects/${projectId}/characters/hierarchy`
    )
    return response.data
  },
}
