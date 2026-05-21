import { apiClient } from './client'

export interface ConsistencyCheckRule {
  id: string
  userId: string
  category: string
  name: string
  description?: string
  isEnabled: boolean
  severity: string
  createdAt: string
  updatedAt: string
}

export interface ReportIssue {
  type: string
  severity: string
  category: string
  title: string
  description: string
  location?: {
    chapterTitle?: string
    position?: string
  }
  suggestions?: string[]
}

export interface ReportMetadata {
  checkedAt: string
  contentLength: number
  chaptersIncluded: string[]
  rulesApplied: string[]
}

export interface ReportSummary {
  byCategory?: Record<string, number>
}

export interface ReportData {
  issues: ReportIssue[]
  summary?: string
  metadata?: ReportMetadata
}

export interface ConsistencyCheckReport {
  id: string
  projectId: string
  chapterId?: string
  content: string
  reportData: string
  totalIssues: number
  criticalCount: number
  normalCount: number
  minorCount: number
  isReviewed: boolean
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

function parseReportData(reportData: string): ReportData {
  try {
    return JSON.parse(reportData)
  } catch (e) {
    return { issues: [] }
  }
}

export const consistencyCheckApi = {
  async getRules(_projectId: string): Promise<ConsistencyCheckRule[]> {
    const response = await apiClient.get('/consistency-check/rules')
    return response.data
  },

  async getDefaultRules(): Promise<ConsistencyCheckRule[]> {
    const response = await apiClient.get('/consistency-check/rules/defaults')
    return response.data
  },

  async updateRule(
    _projectId: string,
    ruleId: string,
    data: { isEnabled?: boolean; name?: string; description?: string }
  ): Promise<ConsistencyCheckRule> {
    const response = await apiClient.put(
      `/consistency-check/rules/${ruleId}`,
      data
    )
    return response.data
  },

  async performCheck(
    projectId: string,
    data: {
      content: string
      chapterId?: string
      enabledRules?: string[]
    }
  ): Promise<ConsistencyCheckReport & { reportData: ReportData }> {
    const response = await apiClient.post('/consistency-check/check', {
      ...data,
      projectId,
    })
    return {
      ...response.data,
      reportData: parseReportData(response.data.reportData),
    }
  },

  async getReports(projectId: string, page = 1, limit = 10): Promise<{
    reports: Array<ConsistencyCheckReport & { reportData: ReportData }>
    total: number
    page: number
    totalPages: number
  }> {
    const response = await apiClient.get('/consistency-check/reports', {
      params: { projectId, page, limit },
    })
    // 后端返回的是数组，需要包装成对象格式
    const reports = Array.isArray(response.data) ? response.data : (response.data.reports || [])
    return {
      reports: reports.map((report: ConsistencyCheckReport) => ({
        ...report,
        reportData: parseReportData(report.reportData),
      })),
      total: response.data.total || reports.length,
      page: response.data.page || page,
      totalPages: response.data.totalPages || 1,
    }
  },

  async markReportAsReviewed(_projectId: string, reportId: string): Promise<ConsistencyCheckReport & { reportData: ReportData }> {
    const response = await apiClient.put(
      `/consistency-check/reports/${reportId}/review`
    )
    return {
      ...response.data,
      reportData: parseReportData(response.data.reportData),
    }
  },

  async deleteReport(_projectId: string, reportId: string): Promise<void> {
    await apiClient.delete(`/consistency-check/reports/${reportId}`)
  },
}
