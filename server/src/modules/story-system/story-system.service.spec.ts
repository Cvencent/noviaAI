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
        findMany: jest.fn(),
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
        update: jest.fn(),
      },
      chapterSummary: {
        create: jest.fn(),
      },
      reviewReport: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      reviewIssue: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      repairPlan: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      storyEvent: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      characterState: {
        createMany: jest.fn(),
      },
      worldStateFact: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      openLoop: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      storyEntity: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      entityMention: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      storyRelation: {
        upsert: jest.fn(),
        findMany: jest.fn(),
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

  it('budgets context pack sections and records warnings for trimmed items', async () => {
    mockProjectGraph()
    prisma.character.findMany.mockResolvedValue(
      Array.from({ length: 40 }, (_, index) => ({
        id: `char-${index}`,
        name: `角色${index}`,
        role: '长篇设定角色',
        goals: '追查一条非常复杂且横跨多卷的线索'.repeat(8),
        flaws: '在关键选择上反复迟疑'.repeat(8),
      })),
    )
    prisma.loreEntry.findMany.mockResolvedValue(
      Array.from({ length: 40 }, (_, index) => ({
        id: `lore-${index}`,
        category: 'SETTING',
        name: `设定${index}`,
        description: '这是一条需要被预算裁剪的长篇语义记忆。'.repeat(12),
      })),
    )
    prisma.storyContract.findMany.mockResolvedValue([
      {
        type: 'CHAPTER_BRIEF',
        payload: JSON.stringify({
          chapterDirective: {
            goal: '追问沈遥',
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

    expect(pack.sections.every((section: any) => section.reason && section.budget > 0)).toBe(true)
    expect(pack.sections.every((section: any) => section.tokenEstimate <= section.budget)).toBe(true)
    expect(pack.warnings).toEqual(expect.arrayContaining([expect.stringContaining('trimmed')]))
  })

  it('blocks preflight when required contracts are missing but allows empty content for writing', async () => {
    mockProjectGraph()
    prisma.chapter.findFirst.mockResolvedValue({ ...chapter, contents: [] })
    prisma.storyContract.findMany.mockResolvedValue([{ type: 'MASTER_SETTING', payload: '{}' }])
    prisma.chapterCommit.findFirst.mockResolvedValue(null)

    const result = await service.preflight('user-1', 'project-1', 'chapter-1')

    expect(result.blocking).toBe(true)
    expect(result.blockingReasons).toEqual(
      expect.arrayContaining([
        '缺少 Story Contract: VOLUME_BRIEF, CHAPTER_BRIEF, REVIEW_CONTRACT',
      ]),
    )
    expect(result.blockingReasons).not.toContain('当前章节正文为空，无法进入审查和提交链路')
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

  it('allows Story System write to draft from an empty chapter after contracts refresh', async () => {
    mockProjectGraph()
    prisma.chapter.findFirst.mockResolvedValue({ ...chapter, contents: [] })
    prisma.storyContract.upsert.mockImplementation(({ create }: any) => Promise.resolve(create))
    prisma.storyContract.findMany
      .mockResolvedValueOnce([
        { type: 'MASTER_SETTING', payload: '{}' },
        { type: 'VOLUME_BRIEF', payload: '{}' },
        { type: 'CHAPTER_BRIEF', payload: JSON.stringify({ chapterDirective: { goal: '打开雨夜旧港场景' } }) },
        { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ mustCheck: [], blockingRules: [] }) },
      ])
      .mockResolvedValueOnce([
        { type: 'CHAPTER_BRIEF', payload: JSON.stringify({ chapterDirective: { goal: '打开雨夜旧港场景' } }) },
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
    prisma.storyAgentRun.update.mockResolvedValue({ id: 'run-1', status: 'PAUSED', currentStep: 'REVIEW' })
    aiService.chat.mockResolvedValue({ response: '雨线压低旧港的灯。' })

    const result = await service.writeChapter('user-1', 'project-1', 'chapter-1', {
      content: '',
      instruction: '写第一段',
    })

    expect(result.blocked).toBe(false)
    expect(result.completion).toBe('雨线压低旧港的灯。')
    expect(aiService.chat).toHaveBeenCalled()
    expect(prisma.storyAgentRun.create).toHaveBeenCalled()
  })

  it('blocks an empty chapter commit without creating a commit', async () => {
    mockProjectGraph()

    await expect(
      service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
        content: '   ',
        reviewResult: { issues: [] },
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(prisma.chapterCommit.create).not.toHaveBeenCalled()
  })

  it('returns review issue offsets for editor annotations', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany.mockResolvedValue([
      {
        type: 'CHAPTER_BRIEF',
        payload: JSON.stringify({
          chapterDirective: {
            forbiddenZones: ['沈遥主动承认全部秘密'],
          },
        }),
      },
      {
        type: 'REVIEW_CONTRACT',
        payload: JSON.stringify({ blockingRules: [] }),
      },
    ])

    const content = '林澄逼近一步。沈遥主动承认全部秘密，又立刻沉默。'
    const result = await service.reviewChapter('user-1', 'project-1', 'chapter-1', content)

    expect(result.issues[0]).toEqual(
      expect.objectContaining({
        blocking: true,
        startOffset: content.indexOf('沈遥主动承认全部秘密'),
        endOffset: content.indexOf('沈遥主动承认全部秘密') + '沈遥主动承认全部秘密'.length,
      }),
    )
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
    prisma.storyEvent.createMany.mockResolvedValue({ count: 1 })
    prisma.characterState.createMany.mockResolvedValue({ count: 1 })
    prisma.openLoop.upsert.mockResolvedValue({ id: 'loop-1' })
    prisma.storyEntity.upsert.mockImplementation(({ create }: any) => Promise.resolve({ id: `${create.type}-${create.name}`, ...create }))
    prisma.entityMention.createMany.mockResolvedValue({ count: 1 })
    prisma.storyRelation.upsert.mockResolvedValue({ id: 'relation-1' })

    const commit = await service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
      content: '林澄拿出芯片，沈遥沉默。',
      reviewResult: { issues: [] },
      extractionResult: {
        acceptedEvents: [{ eventType: 'EVIDENCE_REVEAL', subject: '林澄', payload: { item: '芯片' } }],
        stateDeltas: [{ entity: '沈遥', field: '心理', value: '动摇' }],
        worldFacts: [{ key: '旧港规则', category: 'RULE', value: '旧港禁止公开交易记忆芯片' }],
        openLoops: [{ key: '芯片裂纹', title: '芯片裂纹尚未解释', status: 'OPEN' }],
        entities: [{ name: '林澄', type: 'CHARACTER' }, { name: '芯片', type: 'ITEM' }],
        relations: [{ from: '林澄', to: '芯片', type: 'POSSESSES', description: '林澄拿出芯片作为证据' }],
        summaryText: '林澄用芯片逼问沈遥。',
      },
    })

    expect(commit.status).toBe('ACCEPTED')
    expect(JSON.parse(commit.projectionStatus)).toEqual(expect.objectContaining({
      summary: 'DONE',
      event: 'DONE',
      state: 'DONE',
      openLoop: 'DONE',
      world: 'DONE',
      graph: 'DONE',
    }))
    expect(prisma.chapterSummary.create).toHaveBeenCalledWith({
      data: {
        chapterId: 'chapter-1',
        summary: '林澄用芯片逼问沈遥。',
      },
    })
    expect(prisma.storyEvent.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ projectId: 'project-1', chapterId: 'chapter-1', commitId: 'commit-1', eventType: 'EVIDENCE_REVEAL' })],
    })
    expect(prisma.characterState.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ projectId: 'project-1', chapterId: 'chapter-1', commitId: 'commit-1', characterName: '沈遥' })],
    })
    expect(prisma.worldStateFact.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ projectId: 'project-1', chapterId: 'chapter-1', commitId: 'commit-1', key: '旧港规则' })],
    })
    expect(prisma.openLoop.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { projectId_key: { projectId: 'project-1', key: '芯片裂纹' } },
    }))
    expect(prisma.entityMention.createMany).toHaveBeenCalled()
    expect(prisma.storyRelation.upsert).toHaveBeenCalled()
  })

  it('extracts default projection facts from an accepted commit when no extraction result is provided', async () => {
    mockProjectGraph()
    prisma.character.findMany.mockResolvedValue([
      { id: 'char-1', name: '林澄', role: '调查员' },
      { id: 'char-2', name: '沈遥', role: '线人' },
    ])
    prisma.loreEntry.findMany.mockResolvedValue([
      { id: 'lore-1', name: '芯片', category: 'ITEM', description: '封存记忆片段的非法载体' },
    ])
    prisma.chekhovsGun.findMany.mockResolvedValue([
      { id: 'gun-1', name: '芯片裂纹', status: 'SETUP', description: '裂纹指向被篡改的记忆' },
    ])
    prisma.storyContract.findMany.mockResolvedValue([
      {
        type: 'CHAPTER_BRIEF',
        payload: JSON.stringify({
          chapterDirective: {
            mustCoverNodes: ['芯片'],
            forbiddenZones: [],
          },
        }),
      },
      { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ blockingRules: [] }) },
    ])
    prisma.chapterCommit.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'commit-1', ...data }))
    prisma.chapterSummary.create.mockResolvedValue({ id: 'summary-1' })
    prisma.chapter.update.mockResolvedValue({ id: 'chapter-1' })
    prisma.storyEvent.createMany.mockResolvedValue({ count: 1 })
    prisma.characterState.createMany.mockResolvedValue({ count: 2 })
    prisma.openLoop.upsert.mockResolvedValue({ id: 'loop-1' })
    prisma.storyEntity.upsert.mockImplementation(({ create }: any) => Promise.resolve({ id: `${create.type}-${create.name}`, ...create }))
    prisma.entityMention.createMany.mockResolvedValue({ count: 3 })

    await service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
      content: '林澄把芯片放在桌上，沈遥看见芯片裂纹后沉默。',
      reviewResult: { issues: [] },
    })

    expect(prisma.storyEvent.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ eventType: 'CHAPTER_WRITTEN', subject: 'chapter' })],
    })
    expect(prisma.characterState.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ characterName: '林澄' }),
        expect.objectContaining({ characterName: '沈遥' }),
      ]),
    })
    expect(prisma.openLoop.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { projectId_key: { projectId: 'project-1', key: '芯片裂纹' } },
    }))
    expect(prisma.storyEntity.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { projectId_name: { projectId: 'project-1', name: '芯片' } },
    }))
  })

  it('keeps an accepted commit when projection fails and marks projection status failed', async () => {
    mockProjectGraph()
    prisma.storyContract.findMany.mockResolvedValue([
      { type: 'CHAPTER_BRIEF', payload: JSON.stringify({ chapterDirective: { mustCoverNodes: ['芯片'] } }) },
      { type: 'REVIEW_CONTRACT', payload: JSON.stringify({ blockingRules: [] }) },
    ])
    prisma.chapterCommit.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'commit-1', ...data }))
    prisma.chapterCommit.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'commit-1', ...data }))
    prisma.chapterSummary.create.mockRejectedValue(new Error('summary projection failed'))

    const commit = await service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
      content: '林澄拿出芯片。',
      reviewResult: { issues: [] },
    })

    expect(commit.status).toBe('ACCEPTED')
    expect(JSON.parse(commit.projectionStatus)).toEqual(expect.objectContaining({
      summary: 'FAILED',
      event: 'SKIPPED',
    }))
    expect(prisma.chapterCommit.update).toHaveBeenCalledWith({
      where: { id: 'commit-1' },
      data: expect.objectContaining({
        projectionStatus: expect.stringContaining('FAILED'),
      }),
    })
  })

  it('dismisses an open repair plan with an override reason', async () => {
    mockProjectGraph()
    prisma.repairPlan.findFirst.mockResolvedValue({
      id: 'repair-1',
      projectId: 'project-1',
      chapterId: 'chapter-1',
      status: 'OPEN',
      steps: '[]',
    })
    prisma.repairPlan.update.mockResolvedValue({
      id: 'repair-1',
      status: 'DISMISSED',
      overrideReason: '作者确认这是有意误导读者',
    })

    await expect(
      service.dismissRepairPlan('user-1', 'project-1', 'chapter-1', 'repair-1', {
        overrideReason: '作者确认这是有意误导读者',
      }),
    ).resolves.toEqual(expect.objectContaining({ status: 'DISMISSED' }))

    expect(prisma.repairPlan.update).toHaveBeenCalledWith({
      where: { id: 'repair-1' },
      data: {
        status: 'DISMISSED',
        overrideReason: '作者确认这是有意误导读者',
      },
    })
  })

  it('rejects a chapter commit and creates structured review report and repair plan', async () => {
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
    prisma.reviewReport.create.mockResolvedValue({ id: 'report-1' })
    prisma.reviewIssue.createMany.mockResolvedValue({ count: 3 })
    prisma.repairPlan.create.mockResolvedValue({ id: 'repair-1', status: 'OPEN' })
    prisma.chapterCommit.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'commit-1', ...data }))

    const commit = await service.createChapterCommit('user-1', 'project-1', 'chapter-1', {
      content: '沈遥主动承认全部秘密。',
      reviewResult: { issues: [{ severity: 'CRITICAL', blocking: true, message: '越界泄密' }] },
      extractionResult: { summaryText: '沈遥越界泄密。' },
    })

    expect(commit.status).toBe('REJECTED')
    expect(JSON.parse(commit.fulfillmentResult).missedNodes).toContain('芯片')
    expect(JSON.parse(commit.projectionStatus).summary).toBe('SKIPPED')
    expect(prisma.reviewReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ projectId: 'project-1', chapterId: 'chapter-1', commitId: 'commit-1', status: 'BLOCKED' }),
    })
    expect(prisma.reviewIssue.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ reportId: 'report-1', category: 'FULFILLMENT', blocking: true }),
        expect.objectContaining({ reportId: 'report-1', category: 'CONTINUITY', blocking: true }),
        expect.objectContaining({ reportId: 'report-1', category: 'STYLE', message: '越界泄密' }),
      ]),
    })
    expect(prisma.repairPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ projectId: 'project-1', chapterId: 'chapter-1', commitId: 'commit-1', reportId: 'report-1', status: 'OPEN' }),
    })
    expect(prisma.chapterCommit.update).toHaveBeenCalledWith({
      where: { id: 'commit-1' },
      data: expect.objectContaining({ blockingReasons: expect.any(String), repairPlanId: 'repair-1' }),
    })
  })

  it('lists repair plans, review reports, open loops, graph entities, and graph paths', async () => {
    mockProjectGraph()
    prisma.repairPlan.findMany.mockResolvedValue([{ id: 'repair-1', status: 'OPEN' }])
    prisma.reviewReport.findMany.mockResolvedValue([{ id: 'report-1', issues: [{ id: 'issue-1' }] }])
    prisma.openLoop.findMany.mockResolvedValue([{ id: 'loop-1', key: '芯片裂纹' }])
    prisma.worldStateFact.findMany.mockResolvedValue([{ id: 'fact-1', key: '芯片', commitId: 'commit-1' }])
    prisma.storyEntity.findMany.mockResolvedValue([{ id: 'entity-1', name: '林澄' }])
    prisma.storyEntity.findFirst
      .mockResolvedValueOnce({ id: 'entity-a', name: '林澄' })
      .mockResolvedValueOnce({ id: 'entity-b', name: '芯片' })
    prisma.storyRelation.findMany.mockResolvedValue([{ fromEntityId: 'entity-a', toEntityId: 'entity-b', type: 'POSSESSES' }])

    await expect(service.listRepairPlans('user-1', 'project-1', 'chapter-1')).resolves.toEqual([{ id: 'repair-1', status: 'OPEN' }])
    await expect(service.listReviewReports('user-1', 'project-1', 'chapter-1')).resolves.toEqual([{ id: 'report-1', issues: [{ id: 'issue-1' }] }])
    await expect(service.listOpenLoops('user-1', 'project-1')).resolves.toEqual([{ id: 'loop-1', key: '芯片裂纹' }])
    await expect(service.listWorldFacts('user-1', 'project-1')).resolves.toEqual([{ id: 'fact-1', key: '芯片', commitId: 'commit-1' }])
    await expect(service.listGraphEntities('user-1', 'project-1')).resolves.toEqual([{ id: 'entity-1', name: '林澄' }])
    await expect(service.findGraphPath('user-1', 'project-1', '林澄', '芯片')).resolves.toEqual({
      from: { id: 'entity-a', name: '林澄' },
      to: { id: 'entity-b', name: '芯片' },
      relations: [{ fromEntityId: 'entity-a', toEntityId: 'entity-b', type: 'POSSESSES' }],
    })
  })

  it('reviews the full book for unaccepted chapters, blocking reports, open loops, and projection failures', async () => {
    mockProjectGraph()
    prisma.chapter.findMany.mockResolvedValue([
      { id: 'chapter-1', title: '旧港质问', order: 0, contents: [{ order: 0, content: '林澄拿出芯片。' }] },
      { id: 'chapter-2', title: '雨巷追踪', order: 1, contents: [{ order: 0, content: '沈遥消失在雨巷。' }] },
    ])
    prisma.chapterCommit.findMany.mockResolvedValue([
      { id: 'commit-3', chapterId: 'chapter-1', status: 'ACCEPTED', projectionStatus: JSON.stringify({ summary: 'FAILED' }), createdAt: new Date('2026-05-22T03:00:00Z') },
      { id: 'commit-2', chapterId: 'chapter-2', status: 'REJECTED', projectionStatus: JSON.stringify({ summary: 'SKIPPED' }) },
      { id: 'commit-1', chapterId: 'chapter-1', status: 'ACCEPTED', projectionStatus: JSON.stringify({ summary: 'DONE' }), createdAt: new Date('2026-05-22T01:00:00Z') },
    ])
    prisma.reviewReport.findMany.mockResolvedValue([
      { id: 'report-1', status: 'BLOCKED', chapterId: 'chapter-2', issues: [{ id: 'issue-1', blocking: true, message: '缺少芯片证据' }] },
    ])
    prisma.openLoop.findMany.mockResolvedValue([{ id: 'loop-1', key: '芯片裂纹', title: '芯片裂纹', status: 'OPEN' }])

    const review = await service.reviewFullBook('user-1', 'project-1')

    expect(review.status).toBe('BLOCKED')
    expect(review.summary.totalChapters).toBe(2)
    expect(review.summary.acceptedChapters).toBe(1)
    expect(review.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'COMMIT', chapterId: 'chapter-2' }),
      expect.objectContaining({ category: 'REVIEW', chapterId: 'chapter-2' }),
      expect.objectContaining({ category: 'OPEN_LOOP', sourceId: 'loop-1' }),
      expect.objectContaining({ category: 'PROJECTION', chapterId: 'chapter-1', sourceId: 'commit-3' }),
    ]))
  })

  it('reviews the full book against the latest accepted chapter snapshot', async () => {
    mockProjectGraph()
    prisma.chapter.findMany.mockResolvedValue([
      { id: 'chapter-1', title: '旧港质问', order: 0, contents: [{ order: 0, content: '林澄拿出芯片。' }] },
    ])
    prisma.chapterCommit.findMany.mockResolvedValue([
      { id: 'commit-new', chapterId: 'chapter-1', status: 'ACCEPTED', projectionStatus: JSON.stringify({ summary: 'DONE' }), createdAt: new Date('2026-05-22T03:00:00Z') },
      { id: 'commit-old', chapterId: 'chapter-1', status: 'ACCEPTED', projectionStatus: JSON.stringify({ summary: 'FAILED' }), createdAt: new Date('2026-05-22T01:00:00Z') },
    ])
    prisma.reviewReport.findMany.mockResolvedValue([
      { id: 'report-old', status: 'BLOCKED', chapterId: 'chapter-1', createdAt: new Date('2026-05-22T02:00:00Z'), issues: [{ id: 'issue-1', blocking: true }] },
    ])
    prisma.openLoop.findMany.mockResolvedValue([])

    const review = await service.reviewFullBook('user-1', 'project-1')

    expect(review.status).toBe('PASS')
    expect(review.summary.acceptedChapters).toBe(1)
    expect(review.summary.blockingReports).toBe(0)
    expect(review.summary.projectionFailures).toBe(0)
    expect(review.issues).toEqual([])
  })

  it('exports the book to Markdown in chapter order with accepted commit snapshots', async () => {
    mockProjectGraph()
    prisma.chapter.findMany.mockResolvedValue([
      { id: 'chapter-1', title: '旧港质问', order: 0, contents: [{ order: 0, content: '草稿不应优先。' }] },
      { id: 'chapter-2', title: '雨巷追踪', order: 1, contents: [{ order: 0, content: '沈遥消失在雨巷。' }] },
    ])
    prisma.chapterCommit.findMany.mockResolvedValue([
      { id: 'commit-1', chapterId: 'chapter-1', status: 'ACCEPTED', contentSnapshot: '<p>林澄拿出芯片。</p>', createdAt: new Date('2026-05-22T01:00:00Z') },
      { id: 'commit-2', chapterId: 'chapter-2', status: 'REJECTED', contentSnapshot: '不能导出', createdAt: new Date('2026-05-22T02:00:00Z') },
    ])

    const exported = await service.exportBook('user-1', 'project-1', { format: 'MARKDOWN' })

    expect(exported.format).toBe('MARKDOWN')
    expect(exported.fileName).toBe('雨城.md')
    expect(exported.content).toContain('# 雨城')
    expect(exported.content).toContain('## 第 1 章 旧港质问')
    expect(exported.content).toContain('林澄拿出芯片。')
    expect(exported.content).toContain('## 第 2 章 雨巷追踪')
    expect(exported.content).toContain('> 未找到 accepted commit，导出当前草稿。')
    expect(exported.content).toContain('沈遥消失在雨巷。')
  })

  it('generates publishing assets from accepted chapter snapshots', async () => {
    mockProjectGraph()
    prisma.chapter.findMany.mockResolvedValue([
      { id: 'chapter-1', title: '旧港质问', order: 0, contents: [{ order: 0, content: '草稿文本。' }] },
      { id: 'chapter-2', title: '雨巷追踪', order: 1, contents: [{ order: 0, content: '第二章草稿。' }] },
    ])
    prisma.chapterCommit.findMany.mockResolvedValue([
      { id: 'commit-1', chapterId: 'chapter-1', status: 'ACCEPTED', contentSnapshot: '林澄拿出芯片。', summaryText: '旧港出现记忆芯片。' },
    ])
    aiService.chat.mockResolvedValue({
      response: JSON.stringify({
        synopsis: '一座记忆交易城市里，调查员追查芯片真相。',
        sellingPoints: ['记忆交易悬疑设定', '双主角身份博弈'],
        coverPrompt: '雨夜城市，霓虹旧港，破裂的记忆芯片，悬疑小说封面',
      }),
    })

    const assets = await service.generatePublishingAssets('user-1', 'project-1', { audience: '悬疑读者' })

    expect(assets.projectId).toBe('project-1')
    expect(assets.synopsis).toContain('记忆交易城市')
    expect(assets.sellingPoints).toEqual(['记忆交易悬疑设定', '双主角身份博弈'])
    expect(assets.coverPrompt).toContain('霓虹旧港')
    expect(assets.sourceStats).toEqual({ chapters: 2, acceptedChapters: 1 })
    expect(aiService.chat).toHaveBeenCalledWith('user-1', expect.objectContaining({
      projectId: 'project-1',
      action: expect.any(String),
      message: expect.stringContaining('悬疑读者'),
    }))
  })

  it('falls back publishing selling points when AI omits them', async () => {
    mockProjectGraph()
    prisma.project.findUnique.mockResolvedValue({
      ...project,
      title: 'Memory City',
      genre: 'Urban suspense',
      tags: 'memory, mystery',
      synopsis: 'A city runs on traded memories.',
    })
    prisma.chapter.findMany.mockResolvedValue([
      { id: 'chapter-1', title: 'Old Port', order: 0, contents: [{ order: 0, content: 'Lin finds a memory chip.' }] },
    ])
    prisma.chapterCommit.findMany.mockResolvedValue([])
    aiService.chat.mockResolvedValue({
      response: '```json\n{"synopsis":"A tighter market-ready synopsis.","sellingPoints":[],"coverPrompt":"Rainy neon port cover"}\n```',
    })

    const assets = await service.generatePublishingAssets('user-1', 'project-1', {})

    expect(assets.synopsis).toBe('A tighter market-ready synopsis.')
    expect(assets.coverPrompt).toBe('Rainy neon port cover')
    expect(assets.sellingPoints).toEqual(['Urban suspense genre hook', 'memory element', 'mystery element'])
  })

  it('creates a repair agent step from an open repair plan without changing chapter content', async () => {
    mockProjectGraph()
    prisma.repairPlan.findFirst.mockResolvedValue({
      id: 'repair-1',
      projectId: 'project-1',
      chapterId: 'chapter-1',
      status: 'OPEN',
      steps: JSON.stringify([{ order: 1, action: '补写芯片证据' }]),
    })
    prisma.storyAgentRun.create.mockResolvedValue({
      id: 'run-1',
      projectId: 'project-1',
      chapterId: 'chapter-1',
      status: 'RUNNING',
      currentStep: 'REPAIR',
      steps: [],
    })
    prisma.storyAgentStep.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'repair-step-1', ...data }))
    prisma.storyAgentRun.update.mockResolvedValue({ id: 'run-1', status: 'PAUSED', currentStep: 'REVIEW' })
    aiService.chat.mockResolvedValue({ response: '林澄把芯片裂纹推到灯下。' })

    const result = await service.repairChapter('user-1', 'project-1', 'chapter-1', {
      content: '沈遥沉默。',
      repairPlanId: 'repair-1',
      instruction: '只补证据，不改结尾',
    })

    expect(result.repairedText).toBe('林澄把芯片裂纹推到灯下。')
    expect(result.runId).toBe('run-1')
    expect(result.repairPlanId).toBe('repair-1')
    expect(prisma.storyAgentStep.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runId: 'run-1',
        stepType: 'REPAIR',
        status: 'COMPLETED',
      }),
    })
    expect(prisma.chapter.update).not.toHaveBeenCalled()
  })

  it('rebuilds projections from accepted commits', async () => {
    mockProjectGraph()
    prisma.chapterCommit.findMany.mockResolvedValue([
      {
        id: 'commit-1',
        projectId: 'project-1',
        chapterId: 'chapter-1',
        status: 'ACCEPTED',
        extractionResult: JSON.stringify({
          summaryText: '林澄用芯片逼问沈遥。',
          acceptedEvents: [{ eventType: 'EVIDENCE_REVEAL', subject: '林澄' }],
        }),
        summaryText: '林澄用芯片逼问沈遥。',
      },
    ])
    prisma.chapterSummary.create.mockResolvedValue({ id: 'summary-1' })
    prisma.chapter.update.mockResolvedValue({ id: 'chapter-1' })
    prisma.storyEvent.createMany.mockResolvedValue({ count: 1 })

    const result = await service.rebuildProjections('user-1', 'project-1')

    expect(result.rebuiltCommits).toBe(1)
    expect(prisma.chapterCommit.findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'ACCEPTED' },
      orderBy: { createdAt: 'asc' },
    })
    expect(prisma.storyEvent.createMany).toHaveBeenCalled()
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
