import { apiClient } from './client'

export interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface ActionSuggestion {
  id: string
  name: string
  description: string
  type: string
  actionType: string
  parameters: ActionParameter[]
}

export interface AIActionRequest {
  projectId: string
  actionType:
    | 'CREATE_CHARACTER'
    | 'UPDATE_CHARACTER'
    | 'DELETE_CHARACTER'
    | 'CREATE_WORLD_SETTING'
    | 'UPDATE_WORLD_SETTING'
    | 'DELETE_WORLD_SETTING'
    | 'CREATE_CHAPTER'
    | 'UPDATE_CHAPTER'
    | 'DELETE_CHAPTER'
    | 'DELETE_ALL_CHAPTERS'
    | 'CREATE_PLOT'
    | 'UPDATE_PLOT'
    | 'DELETE_PLOT'
    | 'CREATE_OUTLINE'
    | 'UPDATE_OUTLINE'
    | 'DELETE_OUTLINE'
    | 'ADD_RELATIONSHIP'
    | 'CREATE_SCENE'
    | 'UPDATE_SCENE'
    | 'DELETE_SCENE'
    | 'CREATE_TIMELINE_EVENT'
    | 'UPDATE_TIMELINE_EVENT'
    | 'DELETE_TIMELINE_EVENT'
    | 'CREATE_TURNING_POINT'
    | 'UPDATE_TURNING_POINT'
    | 'DELETE_TURNING_POINT'
    | 'CREATE_CHEKHOVS_GUN'
    | 'UPDATE_CHEKHOVS_GUN'
    | 'DELETE_CHEKHOVS_GUN'
    | string
  parameters: Record<string, any>
  context?: any
  confirm?: boolean
}

export interface AIActionResponse {
  success: boolean
  actionType?: string
  result?: any
  message: string
  requiresConfirmation?: boolean
  suggestion?: ActionSuggestion
}

export interface AnalyzeRequest {
  projectId: string
  content: string
  context?: any
}

export interface AnalyzeResponse {
  success: boolean
  suggestions: ActionSuggestion[]
  context?: any
}

export const aiActionsApi = {
  async analyze(params: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await apiClient.post('/ai-actions/analyze', params)
    return response.data
  },

  async execute(params: AIActionRequest): Promise<AIActionResponse> {
    const response = await apiClient.post('/ai-actions/execute', params)
    return response.data
  }
}
