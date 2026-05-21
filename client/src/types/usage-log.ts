export interface UsageLog {
  id: string
  apiKeyId: string
  endpoint: string
  method: string
  statusCode?: number
  requestBody?: object
  responseBody?: object
  tokensUsed?: number
  cost?: number
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
