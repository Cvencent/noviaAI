import { apiClient } from './client'
import type { UsageLog, UsageStats, UsageLogsResponse } from '@/types/usage-log'

export const usageLogsApi = {
  getLogs: async (
    projectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<UsageLogsResponse> => {
    const response = await apiClient.get<UsageLogsResponse>(
      `/projects/${projectId}/usage-logs`,
      {
        params: { page, limit },
      }
    )
    return response.data
  },

  getStats: async (projectId: string): Promise<UsageStats> => {
    const response = await apiClient.get<UsageStats>(
      `/projects/${projectId}/usage-logs/stats`
    )
    return response.data
  },

  getById: async (projectId: string, logId: string): Promise<UsageLog> => {
    const response = await apiClient.get<UsageLog>(
      `/projects/${projectId}/usage-logs/${logId}`
    )
    return response.data
  },
}
