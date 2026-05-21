import { apiClient } from './client'

export interface StyleTuningParams {
  dialogueRatio: number
  pacing: number
  vocabularyLevel: number
  descriptionDetail: number
}

export interface StyleApplicationConfig {
  presetId?: string
  customStyleId?: string
  fusedStyleIds?: string[]
  tuningParams?: StyleTuningParams
  useContextLearning?: boolean
  adaptationStrength?: number
}

export const writingStylesApi = {
  // 获取项目风格配置
  async getProjectStyleConfig(projectId: string) {
    const response = await apiClient.get(`/writing-styles/project/${projectId}/config`)
    return response.data
  },

  // 保存项目风格配置
  async saveProjectStyleConfig(projectId: string, config: StyleApplicationConfig) {
    const response = await apiClient.post(`/writing-styles/project/${projectId}/config`, config)
    return response.data
  },

  // 生成风格提示词
  async generateStylePrompt(projectId: string, currentContent?: string) {
    const response = await apiClient.post(`/writing-styles/project/${projectId}/generate-prompt`, {
      currentContent,
    })
    return response.data
  },

  // 分析文本风格
  async analyzeText(text: string) {
    const response = await apiClient.post('/writing-styles/analyze', { text })
    return response.data
  },

  // 融合风格
  async fuseStyles(styleIds: string[], weights?: number[]) {
    const response = await apiClient.post('/writing-styles/fuse', { styleIds, weights })
    return response.data
  },

  // 重写文本
  async rewriteWithStyles(text: string, styleIds: string[]) {
    const response = await apiClient.post('/writing-styles/rewrite', { text, styleIds })
    return response.data
  },

  // 深度分析风格
  async deepAnalyzeStyle(styleId: string, compareWith?: string[]) {
    const response = await apiClient.post('/writing-styles/deep-analyze', { styleId, compareWith })
    return response.data
  },

  // 获取自定义风格
  async getCustomStyles() {
    const response = await apiClient.get('/writing-styles/custom')
    return response.data
  },

  // 保存自定义风格
  async saveCustomStyle(data: {
    name: string
    config: string
    sourceType: string
    description?: string
    icon?: string
    sourceData?: string
  }) {
    const response = await apiClient.post('/writing-styles/custom', data)
    return response.data
  },

  // 获取风格历史
  async getStyleHistory(projectId?: string) {
    const params = projectId ? { projectId } : {}
    const response = await apiClient.get('/writing-styles/history', { params })
    return response.data
  },

  // 记录风格操作
  async recordStyleAction(data: {
    action: string
    projectId?: string
    styleId?: string
    details?: string
  }) {
    const response = await apiClient.post('/writing-styles/record-action', data)
    return response.data
  },
}
