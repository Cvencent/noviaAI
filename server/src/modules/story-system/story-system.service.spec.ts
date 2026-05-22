import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { StorySystemService } from './story-system.service'

describe('StorySystemService', () => {
  let service: StorySystemService
  let prisma: any
  let aiService: any

  const project = {
    id: 'project-1',
    userId: 'user-1',
    title: '雨城',
    genre: '都市悬疑',
    synopsis: '一座靠记忆交易运转的城市。',
    tags: '悬疑,记忆',
    currentWritingStyleId: null,
    writingStyleConfig: null,
  }

  const chapter = {
    id: 'chapter-1',
    projectId: 'project-1',
    title: '旧港质问',
    order: 0,
    status: 'DRAFT',
    summary: null,
    contents: [{ order: 0, content: '林澄站在旧港，看见沈遥把芯片藏进袖口。' }],
    summaries: [],
  }

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      chapter: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      outline: {
        findMany: jest.fn(),
      },
      character: {
        findMany: jest.fn(),
      },
      worldSetting: {
        findMany: jest.fn(),
      },
      loreEntry: {
        findMany: jest.fn(),
      },
      chekhovsGun: {
        findMany: jest.fn(),
      },
      timelineEvent: {
        findMany: jest.fn(),
      },
      storyContract: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      storyContextPack: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      storyAgentRun: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      storyAgentStep: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      chapterCommit: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      chapterSummary: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
    }

    aiService = {
      chat: jest.fn(),
    }

    service = new StorySystemService(prisma, aiService)
  })

  function mockProjectGraph() {
    prisma.project.findUnique.mockResolvedValue(project)
    prisma.chapter.findFirst.mockResolvedValue(chapter)
    prisma.outline.findMany.mockResolvedValue([
      {
        title: '第一卷',
        structureType: 'VOLUME',
        items: [
          {
            chapterId: 'chapter-1',
            title: '旧港质问',
            goal: '逼问沈遥关于记忆芯片的秘密',
            conflict: '沈遥拒绝承认自己参与记忆交易',
            outcome: '林澄拿出芯片作为证据',
            povCharacter: '林澄',
            location: '旧港',
            order: 0,
          },
        ],
      },
    ])
    prisma.character.findMany.mockResolvedValue([
      { id: 'char-1', name: '林澄', role: '调查员', goals: '查明记忆交易', flaws: '不信任他人', voice: '短句' },
      { id: 'char-2', name: '沈遥', role: '线人', goals: '隐藏身份', flaws: '回避逼问', voice: '反问' },
    ])
    prisma.worldSetting.findMany.mockResolvedValue([
      {
        category: '规则',
        name: '记忆交易',
        description: '记忆芯片不可在旧港公开交易。',
        items: [],
      },
    ])
    prisma.loreEntry.findMany.mockResolvedValue([
      { id: 'lore-1', category: 'ITEM', name: '记忆芯片', description: '封存记忆片段的非法载体', keywords: '芯片,记忆' },
    ])
    prisma.chekhovsGun.findMany.mockResolvedValue([
      { id: 'gun-1', name: '裂纹芯片', status: 'SETUP', description: '芯片裂纹指向被篡改的记忆' },
    ])
    prisma.timelineEvent.findMany.mockResolvedValue([
      { id: 'time-1', title: '旧港交易夜', timeLabel: '雨夜', description: '沈遥首次出现在监控里' },
    ])
  }

  it('refreshes story contracts from project, outline, world, characters, and review rules', async () => {
    mockProjectGraph()
    prisma.storyContract.upsert.mockImplementation(({ create }: any) => Promise.resolve(create))

    const result = await service.refreshChapterContracts('user-1', 'project-1', 'chapter-1')

    expect(prisma.storyContract.upsert).toHaveBeenCalledTimes(4)
    expect(result.contracts.map((contract: any) => contract.type)).toEqual([
      'MASTER_SETTING',
      'VOLUME_BRIEF',
      'CHAPTER_BRIEF',
      'REVIEW_CONTRACT',
    ])
    const chapterBrief = result.contracts.find((contract: any) => contract.type === 'CHAPTER_BRIEF')
    expect(JSON.parse(chapterBrief.payload).chapterDirective.goal).toBe('逼问沈遥关于记忆芯片的秘密')
    expect(JSON.parse(chapterBrief.payload).chapterDirective.mustCoverNodes).toContain('逼问沈遥关于记忆芯片的秘密')
  })

  it('builds a layered context pack with contract, working, episodic, semantic, and constraint sections', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany.mockResolvedValue([
      {
        type: 'CHAPTER_BRIEF',
        payload: JSON.stringify({
          chapterDirective: {
            goal: '逼问沈遥',
            conflict: '沈遥回避记忆交易',
            mustCoverNodes: ['林澄拿出芯片'],
            forbiddenZones: ['沈遥主动承认全部秘密'],
          },
        }),
      },
      {
        type: 'REVIEW_CONTRACT',
        payload: JSON.stringify({
          mustCheck: ['林澄拿出芯片'],
          blockingRules: ['沈遥主动承认全部秘密'],
        }),
      },
    ])
    prisma.storyContextPack.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'pack-1', ...data }))

    const pack = await service.buildContextPack('user-1', 'project-1', 'chapter-1')

    expect(pack.sections.map((section: any) => section.layer)).toEqual([
      'contract',
      'working',
      'episodic',
      'semantic',
      'constraints',
    ])
    expect(prisma.storyContextPack.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        status: 'READY',
      }),
    })
  })

  it('blocks preflight when required contracts are missing or chapter content is empty', async () => {
    mockProjectGraph()
    prisma.chapter.findFirst.mockResolvedValue({ ...chapter, contents: [] })
    prisma.storyContract.findMany.mockResolvedValue([{ type: 'MASTER_SETTING', payload: '{}' }])
    prisma.chapterCommit.findFirst.mockResolvedValue(null)

    const result = await service.preflight('user-1', 'project-1', 'chapter-1')

    expect(result.blocking).toBe(true)
    expect(result.blockingReasons).toEqual(
      expect.arrayContaining([
        '缺少 Story Contract: VOLUME_BRIEF, CHAPTER_BRIEF, REVIEW_CONTRACT',
        '当前章节正文为空，无法进入审查和提交链路',
      ]),
    )
  })

  it('runs a persistent agent loop that can pause and resume from the next step', async () => {
    mockProjectGraph()
    prisma.storyAgentRun.create.mockResolvedValue({
      id: 'run-1',
      projectId: 'project-1',
      chapterId: 'chapter-1',
      status: 'RUNNING',
      currentStep: 'CONTEXT',
      steps: [],
    })
    prisma.storyAgentRun.findFirst
      .mockResolvedValueOnce({
        id: 'run-1',
        projectId: 'project-1',
        chapterId: 'chapter-1',
        status: 'RUNNING',
        currentStep: 'CONTEXT',
        project,
      })
      .mockResolvedValueOnce({
        id: 'run-1',
        projectId: 'project-1',
        chapterId: 'chapter-1',
        status: 'PAUSED',
        currentStep: 'DRAFT',
        project,
      })
    prisma.storyAgentStep.create.mockImplementation(({ data }: any) => Promise.resolve({ id: `${data.stepType}-1`, ...data }))
    prisma.storyAgentStep.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ stepType: 'CONTEXT', status: 'COMPLETED' }])
    prisma.storyAgentRun.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'run-1', ...data }))
    prisma.storyContract.findMany.mockResolvedValue([
      { type: 'CHAPTER_BRIEF', payload: JSON.stringify({ chapterDirective: { goal: '逼问沈遥' } }) },
      { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ mustCheck: [], blockingRules: [] }) },
    ])
    prisma.storyContextPack.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'pack-1', ...data }))
    aiService.chat.mockResolvedValue({ response: '林澄拿出芯片，沈遥沉默。' })

    const run = await service.startAgentRun('user-1', 'project-1', 'chapter-1', { mode: 'FULL_WRITE' })
    const paused = await service.continueAgentRun('user-1', 'project-1', run.id, { stopAfterStep: 'CONTEXT' })
    const resumed = await service.resumeAgentRun('user-1', 'project-1', run.id)

    expect(paused.status).toBe('PAUSED')
    expect(resumed.status).toBe('RUNNING')
    expect(prisma.storyAgentStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runId: 'run-1',
        stepType: 'CONTEXT',
        status: 'COMPLETED',
      }),
    })
  })

  it('writes a chapter through the Story System mainline and records context and draft steps', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany
      .mockResolvedValueOnce([
        { type: 'MASTER_SETTING', payload: '{}' },
        { type: 'VOLUME_BRIEF', payload: '{}' },
        { type: 'CHAPTER_BRIEF', payload: JSON.stringify({ chapterDirective: { goal: '逼问沈遥' } }) },
        { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ mustCheck: [], blockingRules: [] }) },
      ])
      .mockResolvedValueOnce([
        { type: 'CHAPTER_BRIEF', payload: JSON.stringify({ chapterDirective: { goal: '逼问沈遥' } }) },
        { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ mustCheck: [], blockingRules: [] }) },
      ])
    prisma.chapterCommit.findFirst.mockResolvedValue(null)
    prisma.storyContextPack.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'pack-1', ...data }))
    prisma.storyAgentRun.create.mockResolvedValue({
      id: 'run-1',
      projectId: 'project-1',
      chapterId: 'chapter-1',
      status: 'RUNNING',
      currentStep: 'CONTEXT',
      steps: [],
    })
    prisma.storyAgentStep.create.mockImplementation(({ data }: any) => Promise.resolve({ id: `${data.stepType}-1`, ...data }))
    prisma.storyAgentRun.update.mockResolvedValue({
      id: 'run-1',
      status: 'PAUSED',
      currentStep: 'REVIEW',
    })
    aiService.chat.mockResolvedValue({ response: '林澄把芯片推到沈遥面前。' })

    const result = await service.writeChapter('user-1', 'project-1', 'chapter-1', {
      content: '林澄站在旧港。',
      instruction: '强化旧港对峙',
      temperature: 0.6,
    })

    expect(result.blocked).toBe(false)
    expect(result.completion).toBe('林澄把芯片推到沈遥面前。')
    expect(result.runId).toBe('run-1')
    expect(result.contextPackId).toBe('pack-1')
    expect(aiService.chat).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        projectId: 'project-1',
        temperature: 0.6,
        action: 'TEXT_COMPLETION',
      }),
    )
    expect(prisma.storyAgentStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runId: 'run-1',
        stepType: 'CONTEXT',
        status: 'COMPLETED',
      }),
    })
    expect(prisma.storyAgentStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runId: 'run-1',
        stepType: 'DRAFT',
        status: 'COMPLETED',
        output: JSON.stringify({ content: '林澄把芯片推到沈遥面前。' }),
      }),
    })
  })

  it('does not call AI when Story System write preflight is blocking', async () => {
    mockProjectGraph()
    prisma.chapter.findFirst.mockResolvedValue({ ...chapter, contents: [] })
    prisma.storyContract.findMany.mockResolvedValue([{ type: 'MASTER_SETTING', payload: '{}' }])
    prisma.chapterCommit.findFirst.mockResolvedValue(null)

    const result = await service.writeChapter('user-1', 'project-1', 'chapter-1', {
      content: '',
      instruction: '写第一段',
    })

    expect(result.blocked).toBe(true)
    expect(result.preflight.blockingReasons).toContain('当前章节正文为空，无法进入审查和提交链路')
    expect(aiService.chat).not.toHaveBeenCalled()
    expect(prisma.storyAgentRun.create).not.toHaveBeenCalled()
  })

  it('creates an accepted chapter commit and projects summary when review and fulfillment pass', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany.mockResolvedValue([
      {
        type: 'CHAPTER_BRIEF',
        payload: JSON.stringify({
          chapterDirective: {
            mustCoverNodes: ['芯片'],
            forbiddenZones: ['主动承认全部秘密'],
          },
        }),
      },
      {
        type: 'REVIEW_CONTRACT',
        payload: JSON.stringify({
          blockingRules: ['主动承认全部秘密'],
        }),
      },
    ])
    prisma.chapterCommit.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'commit-1', ...data }))
    prisma.chapterSummary.create.mockResolvedValue({ id: 'summary-1' })
    prisma.chapter.update.mockResolvedValue({ id: 'chapter-1', summary: '林澄用芯片逼问沈遥。' })

    const commit = await service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
      content: '林澄拿出芯片，沈遥沉默。',
      reviewResult: { issues: [] },
      extractionResult: {
        acceptedEvents: [{ eventType: 'EVIDENCE_REVEAL', subject: '林澄', payload: { item: '芯片' } }],
        stateDeltas: [{ entity: '沈遥', field: '心理', value: '动摇' }],
        summaryText: '林澄用芯片逼问沈遥。',
      },
    })

    expect(commit.status).toBe('ACCEPTED')
    expect(JSON.parse(commit.projectionStatus).summary).toBe('DONE')
    expect(prisma.chapterSummary.create).toHaveBeenCalledWith({
      data: {
        chapterId: 'chapter-1',
        summary: '林澄用芯片逼问沈遥。',
      },
    })
  })

  it('rejects a chapter commit when blocking review issues or missed nodes exist', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany.mockResolvedValue([
      {
        type: 'CHAPTER_BRIEF',
        payload: JSON.stringify({
          chapterDirective: {
            mustCoverNodes: ['芯片'],
            forbiddenZones: ['沈遥主动承认全部秘密'],
          },
        }),
      },
      { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ blockingRules: [] }) },
    ])
    prisma.chapterCommit.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'commit-1', ...data }))

    const commit = await service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
      content: '沈遥主动承认全部秘密。',
      reviewResult: { issues: [{ severity: 'CRITICAL', blocking: true, message: '越界泄密' }] },
      extractionResult: { summaryText: '沈遥越界泄密。' },
    })

    expect(commit.status).toBe('REJECTED')
    expect(JSON.parse(commit.fulfillmentResult).missedNodes).toContain('芯片')
    expect(JSON.parse(commit.projectionStatus).summary).toBe('SKIPPED')
  })

  it('reports runtime health from contracts, commits, context packs, and agent runs', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany.mockResolvedValue([
      { type: 'MASTER_SETTING', payload: '{}' },
      { type: 'VOLUME_BRIEF', payload: '{}' },
      { type: 'CHAPTER_BRIEF', payload: '{}' },
      { type: 'REVIEW_CONTRACT', payload: '{}' },
    ])
    prisma.chapterCommit.findMany.mockResolvedValue([{ id: 'commit-1', status: 'ACCEPTED' }])
    prisma.storyContextPack.findFirst.mockResolvedValue({ id: 'pack-1', status: 'READY' })
    prisma.storyAgentRun.findFirst.mockResolvedValue({ id: 'run-1', status: 'COMPLETED' })

    const health = await service.getRuntimeHealth('user-1', 'project-1', 'chapter-1')

    expect(health.mainlineReady).toBe(true)
    expect(health.latestCommitStatus).toBe('ACCEPTED')
    expect(health.contextPackStatus).toBe('READY')
    expect(health.agentRunStatus).toBe('COMPLETED')
  })

  it('rejects access to another user project', async () => {
    prisma.project.findUnique.mockResolvedValue({ ...project, userId: 'other-user' })

    await expect(
      service.refreshChapterContracts('user-1', 'project-1', 'chapter-1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws not found for missing chapters', async () => {
    prisma.project.findUnique.mockResolvedValue(project)
    prisma.chapter.findFirst.mockResolvedValue(null)

    await expect(
      service.refreshChapterContracts('user-1', 'project-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
