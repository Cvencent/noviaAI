import { apiClient } from './client'

export interface StoryContract {
  id: string
  type: string
  payload: string
  status: string
  updatedAt?: string
}

export interface StoryContextSection {
  layer: string
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string
  reason: string
  items: string[]
  budget: number
  tokenEstimate: number
}

export interface StoryContextPack {
  id: string
  status: string
  sections: StoryContextSection[]
  totalTokenEstimate: number
  warnings: string[]
}

export interface StoryPreflightResult {
  chapterId: string
  blocking: boolean
  blockingReasons: string[]
  warnings: string[]
  missingContracts: string[]
}

export interface StoryRuntimeHealth {
  projectId: string
  chapterId: string
  mainlineReady: boolean
  fallbackSources: string[]
  latestCommitStatus: string
  contextPackStatus: string
  agentRunStatus: string
  primaryWriteSource: string
}

export interface StoryAgentStep {
  id: string
  stepType: string
  status: string
  output?: string
  error?: string
  order: number
}

export interface StoryAgentRun {
  id: string
  mode: string
  status: string
  currentStep: string
  instruction?: string
  steps?: StoryAgentStep[]
}

export interface ChapterCommit {
  id: string
  status: string
  contentSnapshot: string
  blockingReasons?: string
  repairPlanId?: string
  reviewResult: string
  fulfillmentResult: string
  extractionResult: string
  summaryText?: string
  projectionStatus: string
  createdAt: string
}

export interface ReviewIssue {
  id: string
  category: string
  severity: string
  blocking: boolean
  message: string
  evidence?: string
  suggestion?: string
  startOffset?: number
  endOffset?: number
}

export interface ReviewReport {
  id: string
  status: string
  summary?: string
  createdAt: string
  issues?: ReviewIssue[]
}

export interface RepairPlan {
  id: string
  status: string
  steps: string
  targetRanges?: string
  overrideReason?: string
  createdAt: string
}

export interface OpenLoop {
  id: string
  key: string
  title: string
  status: string
  payload?: string
  updatedAt: string
}

export interface WorldStateFact {
  id: string
  key: string
  category: string
  value: string
  source?: string
  commitId: string
  createdAt: string
}

export interface StoryEntity {
  id: string
  name: string
  type: string
  aliases?: string
  payload?: string
  updatedAt: string
}

export interface StoryWriteResult {
  blocked: boolean
  completion: string
  runId?: string
  contextPackId?: string
  preflight: StoryPreflightResult
}

export interface StoryRepairResult {
  repairedText: string
  runId: string
  repairPlanId: string
}

export interface FullBookReviewIssue {
  category: string
  severity: string
  chapterId?: string
  sourceId?: string
  message: string
}

export interface FullBookReview {
  projectId: string
  title: string
  status: 'PASS' | 'WARNING' | 'BLOCKED' | string
  summary: {
    totalChapters: number
    acceptedChapters: number
    blockingReports: number
    openLoops: number
    projectionFailures: number
  }
  issues: FullBookReviewIssue[]
}

export interface BookExportResult {
  projectId: string
  format: string
  mimeType: string
  fileName: string
  content?: string
  contentBase64?: string
  warnings?: string[]
}

export interface PublishingAssets {
  projectId: string
  title: string
  assetId?: string
  synopsis: string
  sellingPoints: string[]
  coverPrompt: string
  coverSvg?: string
  updatedAt?: string
  sourceStats: {
    chapters: number
    acceptedChapters: number
  }
}

export const storySystemApi = {
  async refreshContracts(projectId: string, chapterId: string): Promise<{ contracts: StoryContract[] }> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/contracts/refresh`,
    )
    return response.data
  },

  async buildContextPack(projectId: string, chapterId: string): Promise<StoryContextPack> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/context-pack`,
    )
    return response.data
  },

  async preflight(projectId: string, chapterId: string): Promise<StoryPreflightResult> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/preflight`,
    )
    return response.data
  },

  async health(projectId: string, chapterId: string): Promise<StoryRuntimeHealth> {
    const response = await apiClient.get(
      `/projects/${projectId}/chapters/${chapterId}/story-system/health`,
    )
    return response.data
  },

  async review(projectId: string, chapterId: string, content: string) {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/review`,
      { content },
    )
    return response.data
  },

  async writeChapter(projectId: string, chapterId: string, data: {
    content?: string
    instruction?: string
    temperature?: number
    maxTokens?: number
  }): Promise<StoryWriteResult> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/write`,
      data,
    )
    return response.data
  },

  async repairChapter(projectId: string, chapterId: string, data: {
    content: string
    instruction?: string
    repairPlanId?: string
  }): Promise<StoryRepairResult> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/repair`,
      data,
    )
    return response.data
  },

  async createCommit(projectId: string, chapterId: string, data: {
    content: string
    runId?: string
    reviewResult?: { issues?: Array<{ severity?: string; message?: string; blocking?: boolean }> }
    extractionResult?: {
      acceptedEvents?: unknown[]
      stateDeltas?: unknown[]
      entityDeltas?: unknown[]
      worldFacts?: unknown[]
      openLoops?: unknown[]
      entities?: unknown[]
      relations?: unknown[]
      summaryText?: string
    }
  }): Promise<ChapterCommit> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/commits`,
      data,
    )
    return response.data
  },

  async listReviewReports(projectId: string, chapterId: string): Promise<ReviewReport[]> {
    const response = await apiClient.get(
      `/projects/${projectId}/chapters/${chapterId}/story-system/review-reports`,
    )
    return response.data
  },

  async listRepairPlans(projectId: string, chapterId: string): Promise<RepairPlan[]> {
    const response = await apiClient.get(
      `/projects/${projectId}/chapters/${chapterId}/story-system/repair-plans`,
    )
    return response.data
  },

  async dismissRepairPlan(projectId: string, chapterId: string, repairPlanId: string, data: {
    overrideReason: string
  }): Promise<RepairPlan> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/repair-plans/${repairPlanId}/dismiss`,
      data,
    )
    return response.data
  },

  async listOpenLoops(projectId: string): Promise<OpenLoop[]> {
    const response = await apiClient.get(`/projects/${projectId}/story-graph/open-loops`)
    return response.data
  },

  async listWorldFacts(projectId: string): Promise<WorldStateFact[]> {
    const response = await apiClient.get(`/projects/${projectId}/story-graph/world-facts`)
    return response.data
  },

  async listGraphEntities(projectId: string): Promise<StoryEntity[]> {
    const response = await apiClient.get(`/projects/${projectId}/story-graph/entities`)
    return response.data
  },

  async reviewFullBook(projectId: string): Promise<FullBookReview> {
    const response = await apiClient.get(`/projects/${projectId}/story-system/full-book-review`)
    return response.data
  },

  async exportBook(projectId: string, data: { format?: 'MARKDOWN' | 'EPUB' | 'PDF' | string } = {}): Promise<BookExportResult> {
    const response = await apiClient.post(`/projects/${projectId}/story-system/export`, data)
    return response.data
  },

  async generatePublishingAssets(projectId: string, data: { audience?: string; tone?: string } = {}): Promise<PublishingAssets> {
    const response = await apiClient.post(`/projects/${projectId}/story-system/publishing-assets`, data)
    return response.data
  },

  async listCommits(projectId: string, chapterId: string): Promise<ChapterCommit[]> {
    const response = await apiClient.get(
      `/projects/${projectId}/chapters/${chapterId}/story-system/commits`,
    )
    return response.data
  },

  async startRun(projectId: string, chapterId: string, data: { mode?: string; instruction?: string }): Promise<StoryAgentRun> {
    const response = await apiClient.post(
      `/projects/${projectId}/chapters/${chapterId}/story-system/agent-runs`,
      data,
    )
    return response.data
  },

  async continueRun(projectId: string, runId: string, data: { stopAfterStep?: string; maxSteps?: number }): Promise<StoryAgentRun> {
    const response = await apiClient.post(
      `/projects/${projectId}/story-system/agent-runs/${runId}/continue`,
      data,
    )
    return response.data
  },

  async pauseRun(projectId: string, runId: string): Promise<StoryAgentRun> {
    const response = await apiClient.post(`/projects/${projectId}/story-system/agent-runs/${runId}/pause`)
    return response.data
  },

  async resumeRun(projectId: string, runId: string): Promise<StoryAgentRun> {
    const response = await apiClient.post(`/projects/${projectId}/story-system/agent-runs/${runId}/resume`)
    return response.data
  },
}
