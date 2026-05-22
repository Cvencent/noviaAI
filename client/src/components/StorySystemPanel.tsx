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
import {
  ChapterCommit,
  OpenLoop,
  RepairPlan,
  ReviewReport,
  StoryAgentRun,
  StoryContextPack,
  StoryEntity,
  StoryPreflightResult,
  StoryRuntimeHealth,
  storySystemApi,
} from '../api/story-system'

interface StorySystemPanelProps {
  projectId: string
  chapterId: string
  content: string
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

export function StorySystemPanel({ projectId, chapterId, content, onClose }: StorySystemPanelProps) {
  const [health, setHealth] = useState<StoryRuntimeHealth | null>(null)
  const [preflight, setPreflight] = useState<StoryPreflightResult | null>(null)
  const [contextPack, setContextPack] = useState<StoryContextPack | null>(null)
  const [commits, setCommits] = useState<ChapterCommit[]>([])
  const [reviewReports, setReviewReports] = useState<ReviewReport[]>([])
  const [repairPlans, setRepairPlans] = useState<RepairPlan[]>([])
  const [openLoops, setOpenLoops] = useState<OpenLoop[]>([])
  const [graphEntities, setGraphEntities] = useState<StoryEntity[]>([])
  const [run, setRun] = useState<StoryAgentRun | null>(null)
  const [instruction, setInstruction] = useState('')
  const [repairPreview, setRepairPreview] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState('')

  const latestCommit = commits[0]
  const runDraft = useMemo(() => {
    const draft = run?.steps?.find((step) => step.stepType === 'DRAFT')
    const payload = parseJson(draft?.output)
    return payload?.content || ''
  }, [run])

  useEffect(() => {
    loadStatus()
  }, [projectId, chapterId])

  const loadStatus = async () => {
    const [healthData, commitData, reportData, repairData, loopData, entityData] = await Promise.all([
      storySystemApi.health(projectId, chapterId).catch(() => null),
      storySystemApi.listCommits(projectId, chapterId).catch(() => []),
      storySystemApi.listReviewReports(projectId, chapterId).catch(() => []),
      storySystemApi.listRepairPlans(projectId, chapterId).catch(() => []),
      storySystemApi.listOpenLoops(projectId).catch(() => []),
      storySystemApi.listGraphEntities(projectId).catch(() => []),
    ])
    setHealth(healthData)
    setCommits(commitData)
    setReviewReports(reportData)
    setRepairPlans(repairData)
    setOpenLoops(loopData)
    setGraphEntities(entityData)
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {message && (
          <div className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">{message}</div>
        )}

        <section className="space-y-2">
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
        </section>

        {preflight && (
          <section className={`rounded-lg border p-3 ${preflight.blocking ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <div className="text-sm font-medium">{preflight.blocking ? '预检阻断' : '预检通过'}</div>
            {[...preflight.blockingReasons, ...preflight.warnings].map((item, index) => (
              <div key={index} className="text-xs mt-1 text-gray-700">{item}</div>
            ))}
          </section>
        )}

        {contextPack && (
          <section className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              ContextPack · {contextPack.totalTokenEstimate} tokens
            </div>
            <div className="space-y-2">
              {contextPack.sections.map((section) => (
                <details key={section.layer} className="rounded-lg border border-gray-200 p-2">
                  <summary className="cursor-pointer text-sm font-medium text-gray-800">
                    {section.title} · {section.items.length}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {section.items.slice(0, 8).map((item, index) => (
                      <div key={index} className="text-xs text-gray-600">{item}</div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
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
        </section>

        {(repairPlans.length > 0 || reviewReports.length > 0) && (
          <section className="space-y-2">
            <div className="text-sm font-medium text-gray-900">审查与修复</div>
            {repairPlans.slice(0, 3).map((plan) => {
              const steps = parseJson(plan.steps) || []
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
                  </div>
                </details>
              )
            })}
            {repairPreview && (
              <details className="rounded-lg border border-indigo-100 bg-indigo-50 p-3" open>
                <summary className="cursor-pointer text-sm font-medium text-indigo-900">修复候选文本</summary>
                <div className="mt-2 whitespace-pre-wrap text-xs text-indigo-950">{repairPreview}</div>
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

        {(openLoops.length > 0 || graphEntities.length > 0) && (
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

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">ChapterCommit</div>
            <Button variant="outline" size="sm" onClick={commitCurrent} isLoading={isBusy}>
              <GitCommitHorizontal className="w-4 h-4 mr-2" />
              提交当前正文
            </Button>
          </div>
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
        </section>
      </div>
    </div>
  )
}
