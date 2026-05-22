import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AiService } from '../ai/ai.service'
import { AIAction } from '../ai-config/dto/create-ai-config.dto'
import {
  ContinueStoryAgentRunDto,
  CreateChapterCommitDto,
  StartStoryAgentRunDto,
  StoryAgentMode,
  StoryAgentStepType,
  WriteChapterDto,
} from './dto'

type ContractType = 'MASTER_SETTING' | 'VOLUME_BRIEF' | 'CHAPTER_BRIEF' | 'REVIEW_CONTRACT'

const REQUIRED_CONTRACTS: ContractType[] = [
  'MASTER_SETTING',
  'VOLUME_BRIEF',
  'CHAPTER_BRIEF',
  'REVIEW_CONTRACT',
]

const STEP_ORDER: StoryAgentStepType[] = [
  StoryAgentStepType.CONTEXT,
  StoryAgentStepType.DRAFT,
  StoryAgentStepType.REVIEW,
  StoryAgentStepType.EXTRACT,
  StoryAgentStepType.COMMIT,
]

@Injectable()
export class StorySystemService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async refreshChapterContracts(userId: string, projectId: string, chapterId: string) {
    const { project, chapter } = await this.loadProjectChapter(userId, projectId, chapterId)
    const [outlines, characters, worldSettings, loreEntries, chekhovsGuns, timelineEvents] =
      await Promise.all([
        this.prisma.outline.findMany({
          where: { projectId },
          include: { items: { orderBy: { order: 'asc' } } },
        }),
        this.prisma.character.findMany({ where: { projectId } }),
        this.prisma.worldSetting.findMany({ where: { projectId }, include: { items: true } }),
        this.prisma.loreEntry.findMany({ where: { projectId, isActive: true } }),
        this.prisma.chekhovsGun.findMany({ where: { projectId } }),
        this.prisma.timelineEvent.findMany({ where: { projectId }, orderBy: { order: 'asc' } }),
      ])

    const outlineItem = this.findOutlineItemForChapter(outlines, chapterId, chapter.order)
    const contracts = [
      this.buildMasterSetting(project, characters, worldSettings),
      this.buildVolumeBrief(project, outlines, timelineEvents, chekhovsGuns),
      this.buildChapterBrief(project, chapter, outlineItem, loreEntries, timelineEvents),
      this.buildReviewContract(project, chapter, outlineItem, worldSettings, characters),
    ]

    const persisted = []
    for (const contract of contracts) {
      persisted.push(
        await this.prisma.storyContract.upsert({
          where: {
            projectId_chapterId_type: {
              projectId,
              chapterId,
              type: contract.type,
            },
          },
          create: {
            projectId,
            chapterId,
            type: contract.type,
            payload: JSON.stringify(contract.payload),
            sourceTrace: JSON.stringify(contract.sourceTrace),
          },
          update: {
            payload: JSON.stringify(contract.payload),
            sourceTrace: JSON.stringify(contract.sourceTrace),
            status: 'ACTIVE',
          },
        }),
      )
    }

    return { projectId, chapterId, contracts: persisted }
  }

  async buildContextPack(userId: string, projectId: string, chapterId: string) {
    const { project, chapter } = await this.loadProjectChapter(userId, projectId, chapterId)
    const [contracts, characters, recentChapters, loreEntries, chekhovsGuns, timelineEvents] =
      await Promise.all([
        this.getContracts(projectId, chapterId),
        this.prisma.character.findMany({ where: { projectId } }),
        this.prisma.chapter.findMany?.({
          where: { projectId, order: { lt: chapter.order } },
          include: { summaries: { orderBy: { createdAt: 'desc' }, take: 1 } },
          orderBy: { order: 'desc' },
          take: 5,
        }) ?? Promise.resolve([]),
        this.prisma.loreEntry.findMany({ where: { projectId, isActive: true }, orderBy: { priority: 'desc' } }),
        this.prisma.chekhovsGun.findMany({ where: { projectId } }),
        this.prisma.timelineEvent.findMany({ where: { projectId }, orderBy: { order: 'asc' } }),
      ])

    const contractMap = this.contractMap(contracts)
    const chapterBrief = contractMap.CHAPTER_BRIEF
    const reviewContract = contractMap.REVIEW_CONTRACT
    const currentContent = this.chapterText(chapter)
    const sections = [
      {
        layer: 'contract',
        title: '章节合同',
        priority: 'critical',
        source: 'StoryContract',
        items: [
          `目标：${chapterBrief?.chapterDirective?.goal || chapter.title}`,
          `冲突：${chapterBrief?.chapterDirective?.conflict || '未明确'}`,
          `必须覆盖：${this.asArray(chapterBrief?.chapterDirective?.mustCoverNodes).join('；') || '无'}`,
        ],
      },
      {
        layer: 'working',
        title: '当前工作记忆',
        priority: 'critical',
        source: 'Chapter',
        items: [
          `当前章节：第 ${chapter.order + 1} 章 ${chapter.title}`,
          currentContent ? `当前正文：${this.truncate(currentContent, 800)}` : '当前正文为空',
          ...recentChapters.map((item: any) => `近期摘要：${item.title} - ${item.summaries?.[0]?.summary || item.summary || '暂无摘要'}`),
        ],
      },
      {
        layer: 'episodic',
        title: '近期事件',
        priority: 'high',
        source: 'TimelineEvent,ChekhovsGun',
        items: [
          ...timelineEvents.slice(-8).map((event: any) => `${event.timeLabel || ''}${event.title}：${event.description || ''}`),
          ...chekhovsGuns.slice(0, 8).map((gun: any) => `伏笔 ${gun.name}（${gun.status}）：${gun.description}`),
        ],
      },
      {
        layer: 'semantic',
        title: '长期语义记忆',
        priority: 'high',
        source: 'Character,LoreEntry',
        items: [
          ...characters.slice(0, 12).map((character: any) => `${character.name}：${character.role || '未设定'}；目标 ${character.goals || '未设定'}；缺陷 ${character.flaws || '未设定'}`),
          ...loreEntries.slice(0, 12).map((entry: any) => `${entry.name}：${entry.description}`),
        ],
      },
      {
        layer: 'constraints',
        title: '硬约束与审查重点',
        priority: 'critical',
        source: 'ReviewContract',
        items: [
          ...this.asArray(chapterBrief?.chapterDirective?.forbiddenZones).map((item) => `禁区：${item}`),
          ...this.asArray(reviewContract?.blockingRules).map((item) => `阻断规则：${item}`),
          ...this.asArray(reviewContract?.mustCheck).map((item) => `必须检查：${item}`),
        ],
      },
    ].map((section) => ({
      ...section,
      tokenEstimate: this.estimateTokens(section.items.join('\n')),
    }))

    const warnings = []
    if (!chapterBrief) warnings.push('缺少 CHAPTER_BRIEF 合同，ContextPack 已降级')
    if (!reviewContract) warnings.push('缺少 REVIEW_CONTRACT 合同，审查重点不完整')

    const saved = await this.prisma.storyContextPack.create({
      data: {
        projectId,
        chapterId,
        status: warnings.length ? 'STALE' : 'READY',
        sections: JSON.stringify(sections),
        totalTokenEstimate: sections.reduce((sum, item) => sum + item.tokenEstimate, 0),
        warnings: JSON.stringify(warnings),
      },
    })

    return {
      ...saved,
      sections,
      warnings,
      totalTokenEstimate: sections.reduce((sum, item) => sum + item.tokenEstimate, 0),
    }
  }

  async preflight(userId: string, projectId: string, chapterId: string) {
    const { chapter } = await this.loadProjectChapter(userId, projectId, chapterId)
    const [contracts, rejectedCommit] = await Promise.all([
      this.getContracts(projectId, chapterId),
      this.prisma.chapterCommit.findFirst({
        where: { projectId, chapterId, status: 'REJECTED' },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    const present = new Set(contracts.map((contract: any) => contract.type))
    const missing = REQUIRED_CONTRACTS.filter((type) => !present.has(type))
    const blockingReasons: string[] = []
    const warnings: string[] = []
    const text = this.chapterText(chapter)

    if (missing.length) {
      blockingReasons.push(`缺少 Story Contract: ${missing.join(', ')}`)
    }
    if (!text.trim()) {
      blockingReasons.push('当前章节正文为空，无法进入审查和提交链路')
    }
    if (this.findPlaceholders(text).length) {
      blockingReasons.push('当前章节仍包含占位符或待补齐文本')
    }
    if (rejectedCommit) {
      warnings.push('存在最近 rejected ChapterCommit，请确认阻断问题已处理')
    }

    return {
      chapterId,
      blocking: blockingReasons.length > 0,
      blockingReasons,
      warnings,
      missingContracts: missing,
    }
  }

  async writeChapter(
    userId: string,
    projectId: string,
    chapterId: string,
    dto: WriteChapterDto,
  ) {
    await this.refreshChapterContracts(userId, projectId, chapterId)
    const preflight = await this.preflight(userId, projectId, chapterId)
    if (preflight.blocking) {
      return {
        blocked: true,
        preflight,
        completion: '',
      }
    }

    const contextPack = await this.buildContextPack(userId, projectId, chapterId)
    const run = await this.startAgentRun(userId, projectId, chapterId, {
      mode: StoryAgentMode.FULL_WRITE,
      instruction: dto.instruction,
    })

    await this.prisma.storyAgentStep.create({
      data: {
        runId: run.id,
        stepType: StoryAgentStepType.CONTEXT,
        status: 'COMPLETED',
        input: JSON.stringify({ chapterId, projectId }),
        output: JSON.stringify({
          contextPackId: contextPack.id,
          sections: contextPack.sections,
          warnings: contextPack.warnings,
        }),
        order: 0,
      },
    })

    const { chapter } = await this.loadProjectChapter(userId, projectId, chapterId)
    const currentContent = dto.content || this.chapterText(chapter)
    const prompt = this.buildMainlineWritePrompt(contextPack, currentContent, dto.instruction)
    const aiResult = await this.aiService.chat(userId, {
      projectId,
      message: prompt,
      temperature: dto.temperature ?? 0.75,
      maxTokens: dto.maxTokens,
      action: AIAction.TEXT_COMPLETION,
    })
    const completion = aiResult.response || ''

    await this.prisma.storyAgentStep.create({
      data: {
        runId: run.id,
        stepType: StoryAgentStepType.DRAFT,
        status: 'COMPLETED',
        input: JSON.stringify({ content: currentContent, instruction: dto.instruction }),
        output: JSON.stringify({ content: completion }),
        order: 1,
      },
    })
    await this.prisma.storyAgentRun.update({
      where: { id: run.id },
      data: {
        status: 'PAUSED',
        currentStep: StoryAgentStepType.REVIEW,
      },
    })

    return {
      blocked: false,
      completion,
      runId: run.id,
      contextPackId: contextPack.id,
      preflight,
    }
  }

  async startAgentRun(
    userId: string,
    projectId: string,
    chapterId: string,
    dto: StartStoryAgentRunDto,
  ) {
    await this.loadProjectChapter(userId, projectId, chapterId)
    return this.prisma.storyAgentRun.create({
      data: {
        projectId,
        chapterId,
        mode: dto.mode || StoryAgentMode.FULL_WRITE,
        status: 'RUNNING',
        currentStep: StoryAgentStepType.CONTEXT,
        instruction: dto.instruction,
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async continueAgentRun(
    userId: string,
    projectId: string,
    runId: string,
    dto: ContinueStoryAgentRunDto = {},
  ) {
    const run = await this.loadRun(userId, projectId, runId)
    if (run.status === 'COMPLETED') {
      return run
    }
    if (run.status === 'FAILED') {
      throw new BadRequestException('失败的 Agent Run 不能继续')
    }

    let currentStep = (run.currentStep || StoryAgentStepType.CONTEXT) as StoryAgentStepType
    let processed = 0
    const maxSteps = Math.max(1, dto.maxSteps || STEP_ORDER.length)

    while (processed < maxSteps) {
      const output = await this.executeRunStep(userId, run, currentStep)
      processed += 1
      const nextStep = this.nextStep(currentStep)
      const shouldPause = dto.stopAfterStep === currentStep

      if (shouldPause || !nextStep) {
        return this.prisma.storyAgentRun.update({
          where: { id: runId },
          data: {
            status: shouldPause ? 'PAUSED' : 'COMPLETED',
            currentStep: nextStep || currentStep,
            metadata: JSON.stringify({ lastOutput: output }),
          },
          include: { steps: { orderBy: { order: 'asc' } } },
        })
      }

      currentStep = nextStep
    }

    return this.prisma.storyAgentRun.update({
      where: { id: runId },
      data: { status: 'RUNNING', currentStep },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
  }

  async pauseAgentRun(userId: string, projectId: string, runId: string) {
    await this.loadRun(userId, projectId, runId)
    return this.prisma.storyAgentRun.update({
      where: { id: runId },
      data: { status: 'PAUSED' },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
  }

  async resumeAgentRun(userId: string, projectId: string, runId: string) {
    await this.loadRun(userId, projectId, runId)
    return this.prisma.storyAgentRun.update({
      where: { id: runId },
      data: { status: 'RUNNING' },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
  }

  async createChapterCommit(
    userId: string,
    projectId: string,
    chapterId: string,
    dto: CreateChapterCommitDto,
  ) {
    await this.loadProjectChapter(userId, projectId, chapterId)
    const contracts = await this.getContracts(projectId, chapterId)
    const contractMap = this.contractMap(contracts)
    const chapterDirective = contractMap.CHAPTER_BRIEF?.chapterDirective || {}
    const reviewContract = contractMap.REVIEW_CONTRACT || {}
    const reviewResult = dto.reviewResult || { issues: [] }
    const extractionResult = dto.extractionResult || {}
    const mustCoverNodes = this.asArray(chapterDirective.mustCoverNodes)
    const forbiddenZones = [
      ...this.asArray(chapterDirective.forbiddenZones),
      ...this.asArray(reviewContract.blockingRules),
    ]
    const missedNodes = mustCoverNodes.filter((node) => node && !dto.content.includes(node))
    const forbiddenHits = forbiddenZones.filter((zone) => zone && dto.content.includes(zone))
    const blockingIssues = this.asArray((reviewResult as any).issues).filter(
      (issue: any) => issue?.blocking || issue?.severity === 'CRITICAL',
    )
    const status = missedNodes.length || forbiddenHits.length || blockingIssues.length
      ? 'REJECTED'
      : 'ACCEPTED'
    const fulfillmentResult = {
      plannedNodes: mustCoverNodes,
      coveredNodes: mustCoverNodes.filter((node) => !missedNodes.includes(node)),
      missedNodes,
      forbiddenHits,
    }
    const summaryText = extractionResult.summaryText || this.buildFallbackSummary(dto.content)
    const projectionStatus = {
      state: status === 'ACCEPTED' ? 'DONE' : 'SKIPPED',
      summary: status === 'ACCEPTED' ? 'DONE' : 'SKIPPED',
      memory: status === 'ACCEPTED' ? 'DONE' : 'SKIPPED',
      vector: 'SKIPPED',
    }

    const commit = await this.prisma.chapterCommit.create({
      data: {
        projectId,
        chapterId,
        runId: dto.runId,
        status,
        contentSnapshot: dto.content,
        reviewResult: JSON.stringify(reviewResult),
        fulfillmentResult: JSON.stringify(fulfillmentResult),
        extractionResult: JSON.stringify(extractionResult),
        acceptedEvents: JSON.stringify(extractionResult.acceptedEvents || []),
        stateDeltas: JSON.stringify(extractionResult.stateDeltas || []),
        entityDeltas: JSON.stringify(extractionResult.entityDeltas || []),
        summaryText,
        projectionStatus: JSON.stringify(projectionStatus),
      },
    })

    if (status === 'ACCEPTED') {
      await this.prisma.chapterSummary.create({
        data: {
          chapterId,
          summary: summaryText,
        },
      })
      await this.prisma.chapter.update({
        where: { id: chapterId },
        data: {
          summary: summaryText,
          status: 'COMMITTED',
        },
      })
    }

    return commit
  }

  async reviewChapter(userId: string, projectId: string, chapterId: string, content?: string) {
    const { chapter } = await this.loadProjectChapter(userId, projectId, chapterId)
    const text = content || this.chapterText(chapter)
    const contracts = this.contractMap(await this.getContracts(projectId, chapterId))
    const forbiddenZones = [
      ...this.asArray(contracts.CHAPTER_BRIEF?.chapterDirective?.forbiddenZones),
      ...this.asArray(contracts.REVIEW_CONTRACT?.blockingRules),
    ]
    const issues = forbiddenZones
      .filter((zone) => zone && text.includes(zone))
      .map((zone) => ({
        severity: 'CRITICAL',
        blocking: true,
        message: `命中本章禁区：${zone}`,
      }))
    return { issues, blockingCount: issues.length }
  }

  async getRuntimeHealth(userId: string, projectId: string, chapterId: string) {
    await this.loadProjectChapter(userId, projectId, chapterId)
    const [contracts, commits, contextPack, agentRun] = await Promise.all([
      this.getContracts(projectId, chapterId),
      this.prisma.chapterCommit.findMany({
        where: { projectId, chapterId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
      this.prisma.storyContextPack.findFirst({
        where: { projectId, chapterId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.storyAgentRun.findFirst({
        where: { projectId, chapterId },
        orderBy: { updatedAt: 'desc' },
      }),
    ])
    const present = new Set(contracts.map((contract: any) => contract.type))
    const missingContracts = REQUIRED_CONTRACTS.filter((type) => !present.has(type))
    const fallbackSources = [
      ...missingContracts.map((type) => `missing_contract:${type}`),
      ...(!contextPack ? ['missing_context_pack'] : []),
      ...(commits.length === 0 ? ['missing_chapter_commit'] : []),
    ]

    return {
      projectId,
      chapterId,
      mainlineReady: fallbackSources.length === 0,
      fallbackSources,
      latestCommitStatus: commits[0]?.status || 'MISSING',
      contextPackStatus: contextPack?.status || 'MISSING',
      agentRunStatus: agentRun?.status || 'MISSING',
      primaryWriteSource: 'CHAPTER_COMMIT',
    }
  }

  async listCommits(userId: string, projectId: string, chapterId: string) {
    await this.loadProjectChapter(userId, projectId, chapterId)
    return this.prisma.chapterCommit.findMany({
      where: { projectId, chapterId },
      orderBy: { createdAt: 'desc' },
    })
  }

  private async executeRunStep(userId: string, run: any, stepType: StoryAgentStepType) {
    const steps = await this.prisma.storyAgentStep.findMany({
      where: { runId: run.id },
      orderBy: { order: 'asc' },
    })
    const output = await this.produceStepOutput(userId, run, stepType, steps)
    await this.prisma.storyAgentStep.create({
      data: {
        runId: run.id,
        stepType,
        status: 'COMPLETED',
        input: JSON.stringify({ runId: run.id, instruction: run.instruction }),
        output: JSON.stringify(output),
        order: steps.length,
      },
    })
    return output
  }

  private async produceStepOutput(
    userId: string,
    run: any,
    stepType: StoryAgentStepType,
    steps: any[],
  ) {
    switch (stepType) {
      case StoryAgentStepType.CONTEXT:
        return this.buildContextPack(userId, run.projectId, run.chapterId)
      case StoryAgentStepType.DRAFT:
        return this.generateDraft(userId, run)
      case StoryAgentStepType.REVIEW:
        return this.reviewChapter(userId, run.projectId, run.chapterId, this.latestTextFromSteps(steps))
      case StoryAgentStepType.EXTRACT:
        return this.extractChapterFacts(this.latestTextFromSteps(steps))
      case StoryAgentStepType.COMMIT:
        return this.createChapterCommit(userId, run.projectId, run.chapterId, {
          runId: run.id,
          content: this.latestTextFromSteps(steps),
          reviewResult: this.latestStepPayload(steps, StoryAgentStepType.REVIEW) || { issues: [] },
          extractionResult: this.latestStepPayload(steps, StoryAgentStepType.EXTRACT) || {},
        })
      default:
        throw new BadRequestException(`未知 Agent Step: ${stepType}`)
    }
  }

  private async generateDraft(userId: string, run: any) {
    const { chapter } = await this.loadProjectChapter(userId, run.projectId, run.chapterId)
    const contextPack = await this.buildContextPack(userId, run.projectId, run.chapterId)
    const prompt = `你是长篇小说写作 Agent。请根据 ContextPack 继续或改写本章正文，只输出正文。

作者指令：${run.instruction || '无'}

ContextPack:
${JSON.stringify(contextPack.sections, null, 2)}

当前正文：
${this.chapterText(chapter)}`
    const result = await this.aiService.chat(userId, {
      projectId: run.projectId,
      message: prompt,
      temperature: 0.75,
      action: AIAction.TEXT_COMPLETION,
    })
    return { content: result.response }
  }

  private extractChapterFacts(content: string) {
    return {
      acceptedEvents: content.trim()
        ? [{ eventType: 'CHAPTER_WRITTEN', subject: 'chapter', payload: { preview: this.truncate(content, 120) } }]
        : [],
      stateDeltas: [],
      entityDeltas: [],
      summaryText: this.buildFallbackSummary(content),
    }
  }

  private latestTextFromSteps(steps: any[]) {
    const draft = [...steps].reverse().find((step) => step.stepType === StoryAgentStepType.DRAFT)
    const payload = draft ? this.parseJson(draft.output, {}) : {}
    return payload.content || ''
  }

  private latestStepPayload(steps: any[], stepType: StoryAgentStepType) {
    const step = [...steps].reverse().find((item) => item.stepType === stepType)
    return step ? this.parseJson(step.output, null) : null
  }

  private nextStep(step: StoryAgentStepType) {
    const index = STEP_ORDER.indexOf(step)
    return index >= 0 ? STEP_ORDER[index + 1] : undefined
  }

  private async loadProjectChapter(userId: string, projectId: string, chapterId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
      include: {
        contents: { orderBy: { order: 'asc' } },
        summaries: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!chapter) {
      throw new NotFoundException('章节不存在')
    }
    return { project, chapter }
  }

  private async loadRun(userId: string, projectId: string, runId: string) {
    const run = await this.prisma.storyAgentRun.findFirst({
      where: { id: runId, projectId },
      include: { project: true },
    })
    if (!run) {
      throw new NotFoundException('Agent Run 不存在')
    }
    if (run.project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此 Agent Run')
    }
    return run
  }

  private async getContracts(projectId: string, chapterId: string) {
    return this.prisma.storyContract.findMany({
      where: { projectId, chapterId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    })
  }

  private buildMasterSetting(project: any, characters: any[], worldSettings: any[]) {
    return {
      type: 'MASTER_SETTING' as ContractType,
      payload: {
        route: {
          title: project.title,
          primaryGenre: project.genre,
          tags: project.tags,
        },
        masterConstraints: {
          synopsis: project.synopsis,
          coreTone: project.writingStyleConfig || '',
          characterCount: characters.length,
          worldRuleCount: worldSettings.length,
        },
        baseContext: [
          ...characters.slice(0, 8).map((character) => ({ type: 'character', name: character.name, role: character.role })),
          ...worldSettings.slice(0, 8).map((setting) => ({ type: 'world', name: setting.name, category: setting.category })),
        ],
      },
      sourceTrace: [{ source: 'Project' }, { source: 'Character' }, { source: 'WorldSetting' }],
    }
  }

  private buildVolumeBrief(project: any, outlines: any[], timelineEvents: any[], chekhovsGuns: any[]) {
    const volumeOutline = outlines.find((outline) => outline.structureType === 'VOLUME') || outlines[0]
    return {
      type: 'VOLUME_BRIEF' as ContractType,
      payload: {
        volumeGoal: {
          title: volumeOutline?.title || `${project.title} 当前卷`,
          summary: volumeOutline?.description || project.synopsis,
        },
        selectedPacing: {
          strandWeave: 'Quest 55-65%, Fire 20-30%, Constellation 10-20%',
        },
        selectedScenes: timelineEvents.slice(-6).map((event: any) => event.title),
        openLoops: chekhovsGuns.filter((gun: any) => gun.status !== 'PAYOFF').map((gun: any) => gun.name),
      },
      sourceTrace: [{ source: 'Outline' }, { source: 'TimelineEvent' }, { source: 'ChekhovsGun' }],
    }
  }

  private buildChapterBrief(project: any, chapter: any, outlineItem: any, loreEntries: any[], timelineEvents: any[]) {
    const goal = this.normalizeText(outlineItem?.goal, `推进《${project.title}》第 ${chapter.order + 1} 章`)
    const conflict = this.normalizeText(outlineItem?.conflict, '制造并推进本章核心冲突')
    const outcome = this.normalizeText(outlineItem?.outcome, '留下可延续的章末问题')
    return {
      type: 'CHAPTER_BRIEF' as ContractType,
      payload: {
        chapterDirective: {
          title: chapter.title,
          goal,
          conflict,
          outcome,
          povCharacter: this.normalizeText(outlineItem?.povCharacter),
          location: this.normalizeText(outlineItem?.location),
          timeAnchor: timelineEvents.at?.(-1)?.timeLabel || timelineEvents[timelineEvents.length - 1]?.timeLabel,
          mustCoverNodes: [goal, outcome].filter(Boolean),
          forbiddenZones: ['跳过本章核心冲突', '让角色无铺垫主动承认全部秘密'],
          keyEntities: loreEntries.slice(0, 8).map((entry: any) => entry.name),
        },
        dynamicContext: loreEntries.slice(0, 8).map((entry: any) => ({
          type: entry.category,
          name: entry.name,
          description: entry.description,
        })),
      },
      sourceTrace: [{ source: 'Chapter' }, { source: 'OutlineItem' }, { source: 'LoreEntry' }],
    }
  }

  private buildReviewContract(project: any, chapter: any, outlineItem: any, worldSettings: any[], characters: any[]) {
    return {
      type: 'REVIEW_CONTRACT' as ContractType,
      payload: {
        mustCheck: [
          this.normalizeText(outlineItem?.goal, chapter.title),
          this.normalizeText(outlineItem?.conflict, '核心冲突'),
          '人物行为是否符合人设',
          '时间线与世界观是否自洽',
        ].filter(Boolean),
        blockingRules: [
          '违反既有世界观硬规则',
          '关键人物 OOC 且无情节解释',
          '漏掉本章必须覆盖节点',
        ],
        genreSpecificRisks: [project.genre],
        systemConstraints: [
          `可用世界观条目：${worldSettings.length}`,
          `可用角色：${characters.map((character: any) => character.name).join('、') || '无'}`,
        ],
      },
      sourceTrace: [{ source: 'WorldSetting' }, { source: 'Character' }, { source: 'OutlineItem' }],
    }
  }

  private findOutlineItemForChapter(outlines: any[], chapterId: string, order: number) {
    for (const outline of outlines) {
      const direct = outline.items?.find((item: any) => item.chapterId === chapterId)
      if (direct) return direct
      const byOrder = outline.items?.find((item: any) => item.order === order)
      if (byOrder) return byOrder
    }
    return null
  }

  private contractMap(contracts: any[]) {
    return contracts.reduce((acc: any, contract: any) => {
      acc[contract.type] = this.parseJson(contract.payload, {})
      return acc
    }, {})
  }

  private chapterText(chapter: any) {
    return (chapter.contents || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((content: any) => content.content)
      .join('\n')
  }

  private findPlaceholders(text: string) {
    return text.match(/TODO|TBD|待补|待定|暂名|\{[^}]+\}|\[[^\]]*待[^\]]*\]/g) || []
  }

  private buildFallbackSummary(content: string) {
    const clean = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return this.truncate(clean, 120) || '本章暂无可投影摘要。'
  }

  private buildMainlineWritePrompt(contextPack: any, currentContent: string, instruction?: string) {
    const sections = (contextPack.sections || [])
      .map((section: any) => {
        const items = (section.items || []).map((item: string) => `- ${item}`).join('\n')
        return `## ${section.title}\n优先级：${section.priority}\n来源：${section.source}\n${items}`
      })
      .join('\n\n')

    return `你是 noviaAI 的长篇小说写作 Agent。请严格依据 Story System ContextPack 续写当前章节，只输出可直接插入正文的小说文本。

作者指令：
${instruction || '无'}

Story System ContextPack：
${sections}

当前正文：
${currentContent || '暂无正文'}

要求：
1. 不要解释你的思路，不要输出 Markdown 标题。
2. 遵守章节合同里的目标、必须覆盖节点和禁区。
3. 保持角色 voice、世界观规则和近期事件连续。
4. 只写下一段或下一小节，不要提前解决主线秘密。`
  }

  private estimateTokens(text: string) {
    return Math.ceil(text.length / 2)
  }

  private truncate(text: string, max: number) {
    return text.length > max ? `${text.slice(0, max)}...` : text
  }

  private normalizeText(value: unknown, fallback = '') {
    if (typeof value !== 'string') return fallback
    const trimmed = value.trim()
    return trimmed || fallback
  }

  private parseJson(value: unknown, fallback: any) {
    if (typeof value !== 'string') return fallback
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }

  private asArray(value: unknown): any[] {
    return Array.isArray(value) ? value : []
  }
}
