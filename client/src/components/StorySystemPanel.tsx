import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  GitCommitHorizontal,
  Pause,
  Play,
  RefreshCw,
  Send,
  X,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { DiffViewer } from './DiffViewer'
import {
  ChapterCommit,
  OpenLoop,
  ProjectionJob,
  PublishChecklist,
  RepairPlan,
  ReviewIssue,
  ReviewReport,
  StoryAgentRun,
  StoryContextPack,
  StoryEntity,
  StoryPreflightResult,
  StoryRuntimeHealth,
  WorldStateFact,
  storySystemApi,
} from '../api/story-system'

type StoryPanelTab = 'overview' | 'context' | 'agent' | 'repair' | 'commits' | 'memory' | 'publish'

interface StorySystemPanelProps {
  projectId: string
  chapterId: string
  content: string
  onHighlightIssues?: (issues: ReviewIssue[]) => void
  onApplyRepair?: (text: string) => void
  onClose: () => void
}

function parseJson(value?: string) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    READY: '就绪',
    STALE: '需刷新',
    ACCEPTED: '已接受',
    REJECTED: '已拒绝',
    MISSING: '缺失',
    RUNNING: '运行中',
    PAUSED: '已暂停',
    COMPLETED: '已完成',
  }
  return labels[status || ''] || status || '未知'
}

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

export function StorySystemPanel({
  projectId,
  chapterId,
  content,
  onHighlightIssues,
  onApplyRepair,
  onClose,
}: StorySystemPanelProps) {
  const [health, setHealth] = useState<StoryRuntimeHealth | null>(null)
  const [preflight, setPreflight] = useState<StoryPreflightResult | null>(null)
  const [contextPack, setContextPack] = useState<StoryContextPack | null>(null)
  const [commits, setCommits] = useState<ChapterCommit[]>([])
  const [reviewReports, setReviewReports] = useState<ReviewReport[]>([])
  const [repairPlans, setRepairPlans] = useState<RepairPlan[]>([])
  const [openLoops, setOpenLoops] = useState<OpenLoop[]>([])
  const [worldFacts, setWorldFacts] = useState<WorldStateFact[]>([])
  const [graphEntities, setGraphEntities] = useState<StoryEntity[]>([])
  const [publishChecklist, setPublishChecklist] = useState<PublishChecklist | null>(null)
  const [projectionJobs, setProjectionJobs] = useState<ProjectionJob[]>([])
  const [activeTab, setActiveTab] = useState<StoryPanelTab>('overview')
  const [run, setRun] = useState<StoryAgentRun | null>(null)
  const [instruction, setInstruction] = useState('')
  const [repairPreview, setRepairPreview] = useState('')
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({})
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')

  const latestCommit = commits[0]
  const latestAcceptedCommit = useMemo(
    () => commits.find((commit) => commit.status === 'ACCEPTED'),
    [commits],
  )
  const latestAcceptedText = latestAcceptedCommit ? plainText(latestAcceptedCommit.contentSnapshot) : ''
  const currentText = plainText(content)
  const hasCommitDiff = Boolean(latestAcceptedText && currentText && latestAcceptedText !== currentText)
  const runDraft = useMemo(() => {
    const draft = run?.steps?.find((step) => step.stepType === 'DRAFT')
    const payload = parseJson(draft?.output)
    return payload?.content || ''
  }, [run])

  useEffect(() => {
    loadStatus()
  }, [projectId, chapterId])

  const loadStatus = async () => {
    const [healthData, commitData, reportData, repairData, loopData, factData, entityData, checklistData, projectionJobData] = await Promise.all([
      storySystemApi.health(projectId, chapterId).catch(() => null),
      storySystemApi.listCommits(projectId, chapterId).catch(() => []),
      storySystemApi.listReviewReports(projectId, chapterId).catch(() => []),
      storySystemApi.listRepairPlans(projectId, chapterId).catch(() => []),
      storySystemApi.listOpenLoops(projectId).catch(() => []),
      storySystemApi.listWorldFacts(projectId).catch(() => []),
      storySystemApi.listGraphEntities(projectId).catch(() => []),
      storySystemApi.getPublishChecklist(projectId).catch(() => null),
      storySystemApi.listProjectionJobs(projectId).catch(() => []),
    ])
    setHealth(healthData)
    setCommits(commitData)
    setReviewReports(reportData)
    setRepairPlans(repairData)
    setOpenLoops(loopData)
    setWorldFacts(factData)
    setGraphEntities(entityData)
    setPublishChecklist(checklistData)
    setProjectionJobs(projectionJobData)
  }

  const runAction = async (label: string, action: () => Promise<void>) => {
    setIsBusy(true)
    setMessage('')
    try {
      await action()
      setMessage(`${label}完成`)
      await loadStatus()
    } catch (error) {
      console.error(`${label}失败:`, error)
      setMessage(`${label}失败，请检查后端日志或 AI 配置`)
    } finally {
      setIsBusy(false)
    }
  }

  const refreshContracts = () => runAction('合同刷新', async () => {
    await storySystemApi.refreshContracts(projectId, chapterId)
  })

  const runPreflight = () => runAction('写前预检', async () => {
    setPreflight(await storySystemApi.preflight(projectId, chapterId))
  })

  const buildContext = () => runAction('ContextPack 构建', async () => {
    setContextPack(await storySystemApi.buildContextPack(projectId, chapterId))
  })

  const startRun = () => runAction('Agent Run 创建', async () => {
    const created = await storySystemApi.startRun(projectId, chapterId, {
      mode: 'FULL_WRITE',
      instruction: instruction.trim() || undefined,
    })
    setRun(created)
  })

  const continueRun = (stopAfterStep?: string) => {
    if (!run) return
    runAction(stopAfterStep ? `执行到 ${stopAfterStep}` : 'Agent Run 继续', async () => {
      setRun(await storySystemApi.continueRun(projectId, run.id, { stopAfterStep, maxSteps: stopAfterStep ? 1 : 5 }))
    })
  }

  const pauseOrResume = () => {
    if (!run) return
    runAction(run.status === 'PAUSED' ? '继续运行' : '暂停运行', async () => {
      setRun(run.status === 'PAUSED'
        ? await storySystemApi.resumeRun(projectId, run.id)
        : await storySystemApi.pauseRun(projectId, run.id))
    })
  }

  const reviewCurrent = () => runAction('章节审查', async () => {
    const result = await storySystemApi.review(projectId, chapterId, content)
    onHighlightIssues?.(result.issues || [])
    setPreflight({
      chapterId,
      blocking: result.blockingCount > 0,
      blockingReasons: result.issues?.map((issue: any) => issue.message) || [],
      warnings: [],
      missingContracts: [],
    })
  })

  const commitCurrent = () => runAction('ChapterCommit', async () => {
    const reviewResult = await storySystemApi.review(projectId, chapterId, content)
    await storySystemApi.createCommit(projectId, chapterId, {
      content,
      runId: run?.id,
      reviewResult,
      extractionResult: {
        acceptedEvents: content.trim() ? [{ eventType: 'MANUAL_COMMIT', subject: 'chapter' }] : [],
        stateDeltas: [],
        entityDeltas: [],
        summaryText: content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120),
      },
    })
    setCommits(await storySystemApi.listCommits(projectId, chapterId))
    await loadStatus()
  })

  const repairCurrent = (repairPlanId: string) => runAction('修复候选', async () => {
    const result = await storySystemApi.repairChapter(projectId, chapterId, {
      content,
      repairPlanId,
      instruction: instruction.trim() || undefined,
    })
    setRepairPreview(result.repairedText)
    await loadStatus()
  })

  const dismissRepairPlan = (repairPlanId: string) => runAction('忽略修复计划', async () => {
    const overrideReason = overrideReasons[repairPlanId]?.trim()
    if (!overrideReason) {
      setMessage('请先填写忽略原因')
      return
    }
    await storySystemApi.dismissRepairPlan(projectId, chapterId, repairPlanId, { overrideReason })
    setOverrideReasons((current) => ({ ...current, [repairPlanId]: '' }))
    await loadStatus()
  })

  const applyRepairAndReview = () => runAction('应用修复并重审', async () => {
    if (!repairPreview.trim()) return
    onApplyRepair?.(repairPreview)
    const result = await storySystemApi.review(projectId, chapterId, repairPreview)
    onHighlightIssues?.(result.issues || [])
    const blockingIssues = (result.issues || []).filter((issue: any) => issue.blocking)
    setPreflight({
      chapterId,
      blocking: blockingIssues.length > 0,
      blockingReasons: blockingIssues.map((issue: any) => issue.message),
      warnings: [],
      missingContracts: [],
    })
    if (blockingIssues.length === 0) {
      await storySystemApi.createCommit(projectId, chapterId, {
        content: repairPreview,
        runId: run?.id,
        reviewResult: result,
        extractionResult: {
          acceptedEvents: [{ eventType: 'REPAIR_ACCEPTED', subject: 'chapter' }],
          stateDeltas: [],
          entityDeltas: [],
          summaryText: repairPreview.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120),
        },
      })
      setRepairPreview('')
      setCommits(await storySystemApi.listCommits(projectId, chapterId))
      await loadStatus()
    }
  })

  const createProjectionJob = (scope: 'ALL' | 'FAILED' | 'CHAPTER') => runAction('ProjectionJob', async () => {
    await storySystemApi.createProjectionJob(projectId, {
      scope,
      chapterId: scope === 'CHAPTER' ? chapterId : undefined,
    })
    setProjectionJobs(await storySystemApi.listProjectionJobs(projectId))
  })

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Story System
          </h3>
          <p className="text-xs text-gray-500 mt-1">合同、预检、Agent loop、审查、提交和投影</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-gray-200 p-2">
            <div className="text-gray-500">主链状态</div>
            <div className={health?.mainlineReady ? 'text-green-700 font-medium' : 'text-yellow-700 font-medium'}>
              {health?.mainlineReady ? 'mainline ready' : '需要补齐'}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-2">
            <div className="text-gray-500">最近提交</div>
            <div className="font-medium text-gray-900">{statusLabel(health?.latestCommitStatus)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-2">
            <div className="text-gray-500">ContextPack</div>
            <div className="font-medium text-gray-900">{statusLabel(health?.contextPackStatus)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-2">
            <div className="text-gray-500">Agent Run</div>
            <div className="font-medium text-gray-900">{statusLabel(run?.status || health?.agentRunStatus)}</div>
          </div>
        </div>
        {health && health.fallbackSources.length > 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-2 text-xs text-yellow-800">
            {health.fallbackSources.join('；')}
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {[
            ['overview', 'Overview'],
            ['context', 'Context'],
            ['agent', 'Agent'],
            ['repair', 'Review'],
            ['commits', 'Commits'],
            ['memory', 'Memory'],
            ['publish', 'Publish'],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as StoryPanelTab)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {message && (
          <div className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">{message}</div>
        )}

        {activeTab === 'overview' && <section className="space-y-2">
          <div className="text-sm font-medium text-gray-900">写作主链</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={refreshContracts} isLoading={isBusy}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新合同
            </Button>
            <Button variant="outline" size="sm" onClick={runPreflight} isLoading={isBusy}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              预检
            </Button>
            <Button variant="outline" size="sm" onClick={buildContext} isLoading={isBusy}>
              <Activity className="w-4 h-4 mr-2" />
              ContextPack
            </Button>
            <Button variant="outline" size="sm" onClick={reviewCurrent} isLoading={isBusy}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              审查
            </Button>
          </div>
        </section>}

        {activeTab === 'overview' && preflight && (
          <section className={`rounded-lg border p-3 ${preflight.blocking ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <div className="text-sm font-medium">{preflight.blocking ? '预检阻断' : '预检通过'}</div>
            {[...preflight.blockingReasons, ...preflight.warnings].map((item, index) => (
              <div key={index} className="text-xs mt-1 text-gray-700">{item}</div>
            ))}
          </section>
        )}

        {activeTab === 'context' && contextPack && (
          <section className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              ContextPack · {contextPack.totalTokenEstimate} tokens
            </div>
            {contextPack.warnings.length > 0 && (
              <div className="rounded border border-yellow-100 bg-yellow-50 p-2 text-xs text-yellow-800">
                {contextPack.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {contextPack.sections.map((section) => (
                <details key={section.layer} className="rounded-lg border border-gray-200 p-2">
                  <summary className="cursor-pointer text-sm font-medium text-gray-800">
                    {section.title} · {section.items.length}
                  </summary>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500">
                      {section.reason} · {section.tokenEstimate}/{section.budget} tokens
                    </div>
                    {section.items.slice(0, 8).map((item, index) => (
                      <div key={index} className="text-xs text-gray-600">{item}</div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'agent' && <section className="space-y-2">
          <div className="text-sm font-medium text-gray-900">Agent Loop</div>
          <Textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={2}
            placeholder="给本次 agent run 的写作指令，例如：强化旧港对峙，保持沈遥不完全承认秘密"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={startRun} isLoading={isBusy}>
              <Play className="w-4 h-4 mr-2" />
              新建 Run
            </Button>
            <Button variant="outline" size="sm" onClick={() => continueRun()} disabled={!run} isLoading={isBusy}>
              <Send className="w-4 h-4 mr-2" />
              跑完整链
            </Button>
            <Button variant="outline" size="sm" onClick={() => continueRun('CONTEXT')} disabled={!run} isLoading={isBusy}>
              跑一步
            </Button>
            <Button variant="outline" size="sm" onClick={pauseOrResume} disabled={!run} isLoading={isBusy}>
              {run?.status === 'PAUSED' ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {run?.status === 'PAUSED' ? '继续' : '暂停'}
            </Button>
          </div>
          {run?.steps && run.steps.length > 0 && (
            <div className="rounded-lg border border-gray-200 divide-y">
              {run.steps.map((step) => (
                <div key={step.id} className="flex items-center justify-between p-2 text-xs">
                  <span className="font-medium text-gray-800">{step.stepType}</span>
                  <span className="text-gray-500">{statusLabel(step.status)}</span>
                </div>
              ))}
            </div>
          )}
          {runDraft && (
            <details className="rounded-lg border border-gray-200 p-2">
              <summary className="cursor-pointer text-sm font-medium">最近草稿</summary>
              <div className="text-xs text-gray-700 whitespace-pre-wrap mt-2">{runDraft}</div>
            </details>
          )}
        </section>}

        {activeTab === 'repair' && (repairPlans.length > 0 || reviewReports.length > 0) && (
          <section className="space-y-2">
            <div className="text-sm font-medium text-gray-900">审查与修复</div>
            {repairPlans.slice(0, 3).map((plan) => {
              const steps = parseJson(plan.steps) || []
              const isOpen = plan.status === 'OPEN'
              return (
                <details key={plan.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-red-800">
                    修复计划 · {statusLabel(plan.status)}
                  </summary>
                  <div className="mt-2 space-y-2">
                    {steps.map((step: any, index: number) => (
                      <div key={index} className="text-xs text-red-900">
                        {step.order || index + 1}. {step.action || step.issue}
                      </div>
                    ))}
                    {steps.length === 0 && <div className="text-xs text-red-700">暂无结构化修复步骤</div>}
                    <Button variant="outline" size="sm" onClick={() => repairCurrent(plan.id)} isLoading={isBusy}>
                      生成修复候选
                    </Button>
                    {isOpen && (
                      <div className="space-y-2 rounded border border-red-200 bg-white/70 p-2">
                        <Textarea
                          value={overrideReasons[plan.id] || ''}
                          onChange={(event) => setOverrideReasons((current) => ({
                            ...current,
                            [plan.id]: event.target.value,
                          }))}
                          rows={2}
                          placeholder="忽略原因：会记录到修复计划中，便于后续源追踪"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dismissRepairPlan(plan.id)}
                          disabled={!overrideReasons[plan.id]?.trim()}
                          isLoading={isBusy}
                        >
                          忽略并记录原因
                        </Button>
                      </div>
                    )}
                    {plan.status === 'DISMISSED' && plan.overrideReason && (
                      <div className="rounded border border-gray-200 bg-white/70 p-2 text-xs text-gray-700">
                        已忽略原因：{plan.overrideReason}
                      </div>
                    )}
                  </div>
                </details>
              )
            })}
            {repairPreview && (
              <details className="rounded-lg border border-indigo-100 bg-indigo-50 p-3" open>
                <summary className="cursor-pointer text-sm font-medium text-indigo-900">修复候选文本</summary>
                <div className="mt-2 whitespace-pre-wrap text-xs text-indigo-950">{repairPreview}</div>
                {onApplyRepair && (
                  <Button className="mt-3" size="sm" onClick={applyRepairAndReview} isLoading={isBusy}>
                    应用修复并重审
                  </Button>
                )}
              </details>
            )}
            {reviewReports.slice(0, 2).map((report) => (
              <details key={report.id} className="rounded-lg border border-gray-200 p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-800">
                  ReviewReport · {statusLabel(report.status)}
                </summary>
                <div className="mt-2 space-y-2">
                  {report.summary && <div className="text-xs text-gray-600">{report.summary}</div>}
                  {(report.issues || []).map((issue) => (
                    <div key={issue.id} className={issue.blocking ? 'text-xs text-red-700' : 'text-xs text-gray-600'}>
                      [{issue.category}/{issue.severity}] {issue.message}
                      {issue.suggestion && <div className="mt-1 text-gray-500">建议：{issue.suggestion}</div>}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </section>
        )}

        {activeTab === 'memory' && (openLoops.length > 0 || worldFacts.length > 0 || graphEntities.length > 0) && (
          <section className="space-y-2">
            <div className="text-sm font-medium text-gray-900">投影记忆</div>
            {openLoops.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs font-medium text-gray-700 mb-2">开放伏笔</div>
                <div className="space-y-1">
                  {openLoops.slice(0, 6).map((loop) => (
                    <div key={loop.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-gray-700 truncate">{loop.title}</span>
                      <span className={loop.status === 'OPEN' ? 'text-yellow-700' : 'text-green-700'}>
                        {loop.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {worldFacts.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs font-medium text-gray-700 mb-2">世界事实</div>
                <div className="space-y-1">
                  {worldFacts.slice(0, 6).map((fact) => (
                    <div key={fact.id} className="text-xs text-gray-700">
                      <span className="font-medium">{fact.key}</span>
                      <span className="text-gray-500"> · {fact.category}</span>
                      <div className="truncate">{fact.value}</div>
                      <div className="text-gray-400">
                        source: {fact.source || fact.commitId.slice(0, 8)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {graphEntities.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs font-medium text-gray-700 mb-2">图谱实体</div>
                <div className="flex flex-wrap gap-2">
                  {graphEntities.slice(0, 12).map((entity) => (
                    <span key={entity.id} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {entity.name} · {entity.type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'publish' && publishChecklist && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">发布前检查</div>
              <span className={publishChecklist.status === 'PASS' ? 'text-xs font-medium text-green-700' : 'text-xs font-medium text-yellow-700'}>
                {publishChecklist.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => createProjectionJob('FAILED')} isLoading={isBusy}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重跑失败投影
              </Button>
              <Button variant="outline" size="sm" onClick={() => createProjectionJob('CHAPTER')} isLoading={isBusy}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重算本章投影
              </Button>
            </div>
            <div className="space-y-2">
              {publishChecklist.checks.map((check) => (
                <div key={check.key} className="rounded-lg border border-gray-200 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800">{check.label}</span>
                    <span className={check.status === 'PASS' ? 'text-green-700' : check.status === 'BLOCKED' ? 'text-red-700' : 'text-yellow-700'}>
                      {check.status}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-600">{check.message}</div>
                  <div className="mt-1 text-gray-400">{check.action}</div>
                </div>
              ))}
            </div>
            {projectionJobs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Projection Jobs</div>
                {projectionJobs.slice(0, 4).map((job) => {
                  const items = parseJson(job.items) || []
                  return (
                    <details key={job.id} className="rounded-lg border border-gray-200 p-3 text-xs">
                      <summary className="cursor-pointer font-medium text-gray-800">
                        {job.scope} · {job.status} · {job.doneItems}/{job.totalItems}
                      </summary>
                      {job.error && <div className="mt-2 text-red-700">{job.error}</div>}
                      <div className="mt-2 space-y-1">
                        {items.slice(0, 5).map((item: any, index: number) => (
                          <div key={`${item.commitId || index}`} className={item.status === 'FAILED' ? 'text-red-700' : 'text-gray-600'}>
                            {item.chapterId || 'chapter'} · {item.commitId || 'commit'} · {item.status}
                            {item.error && <span> · {item.error}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'commits' && <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">ChapterCommit</div>
            <Button variant="outline" size="sm" onClick={commitCurrent} isLoading={isBusy}>
              <GitCommitHorizontal className="w-4 h-4 mr-2" />
              提交当前正文
            </Button>
          </div>
          {hasCommitDiff && (
            <details className="rounded-lg border border-gray-200 p-3" open>
              <summary className="cursor-pointer text-sm font-medium text-gray-800">
                与最近 accepted commit 的差异
              </summary>
              <DiffViewer
                original={latestAcceptedText}
                suggested={currentText}
                mode="words"
                className="mt-2 max-h-48 overflow-y-auto rounded bg-gray-50 p-2 text-xs"
              />
            </details>
          )}
          <div className="space-y-2">
            {commits.map((commit) => {
              const fulfillment = parseJson(commit.fulfillmentResult)
              const projection = parseJson(commit.projectionStatus)
              const blockingReasons = parseJson(commit.blockingReasons) || []
              return (
                <div key={commit.id} className="rounded-lg border border-gray-200 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={commit.status === 'ACCEPTED' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                      {statusLabel(commit.status)}
                    </span>
                    <span className="text-gray-500">{new Date(commit.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  {commit.summaryText && <div className="mt-2 text-gray-700">{commit.summaryText}</div>}
                  {fulfillment?.missedNodes?.length > 0 && (
                    <div className="mt-2 text-red-700">漏掉节点：{fulfillment.missedNodes.join('；')}</div>
                  )}
                  {blockingReasons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {blockingReasons.map((reason: string, index: number) => (
                        <div key={index} className="text-red-700">阻断：{reason}</div>
                      ))}
                    </div>
                  )}
                  {commit.status === 'REJECTED' && commit.repairPlanId && (
                    <div className="mt-2 rounded bg-red-50 px-2 py-1 text-red-700">
                      已生成修复计划：{commit.repairPlanId.slice(0, 8)}
                    </div>
                  )}
                  {projection && (
                    <div className="mt-2 text-gray-500">投影：{Object.entries(projection).map(([key, value]) => `${key}:${value}`).join(' · ')}</div>
                  )}
                </div>
              )
            })}
            {!latestCommit && <div className="text-sm text-gray-500">还没有 ChapterCommit</div>}
          </div>
        </section>}
      </div>
    </div>
  )
}
