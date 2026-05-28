export interface UsageLog {
  id: string
  apiKeyId: string
  endpoint: string
  method: string
  statusCode?: number
  requestBody?: object
  responseBody?: object
  model?: string
  promptContent?: string
  responseContent?: string
  tokensUsed?: number
  promptTokens?: number
  completionTokens?: number
  cost?: number
  duration?: number
  ipAddress?: string
  userAgent?: string
  createdAt: string
  apiKey?: {
    id: string
    name: string
    provider: string
  }
}

export interface UsageStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  totalCost: number
  totalTokens: number
  byModel: Array<{
    model: string
    count: number
    tokens: number
    cost: number
  }>
  dailyUsage: Array<{
    date: string
    count: number
    tokens: number
    cost: number
  }>
}

export interface UsageLogsResponse {
  logs: UsageLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LogRetentionSetting {
  id: string
  userId: string
  retentionDays: number
  createdAt: string
  updatedAt: string
}
