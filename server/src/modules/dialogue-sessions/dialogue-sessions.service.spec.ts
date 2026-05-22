import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { DialogueSessionsService } from './dialogue-sessions.service'

describe('DialogueSessionsService', () => {
  let service: DialogueSessionsService
  let prisma: any
  let aiService: any

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      character: {
        findMany: jest.fn(),
      },
      dialogueSession: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      dialogueMessage: {
        findFirst: jest.fn(),
        createMany: jest.fn(),
      },
      dialogueQualityReport: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      dialogueQualityIssue: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (actions: any[]) => Promise.all(actions)),
    }

    aiService = {
      chat: jest.fn(),
    }

    service = new DialogueSessionsService(prisma, aiService)
  })

  it('creates a persistent dialogue session with selected character profiles', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', userId: 'user-1' })
    prisma.character.findMany.mockResolvedValue([
      { id: 'char-1', name: '林澄' },
      { id: 'char-2', name: '沈遥' },
    ])
    prisma.dialogueSession.create.mockResolvedValue({
      id: 'session-1',
      title: '旧港质问',
      status: 'ACTIVE',
      characterIds: 'char-1,char-2',
      messages: [],
    })

    const session = await service.create('user-1', 'project-1', {
      title: '旧港质问',
      chapterId: 'chapter-1',
      characterIds: ['char-1', 'char-2'],
      location: '旧港',
      conflict: '林澄怀疑沈遥隐瞒了记忆交易',
      goal: '逼出沈遥的秘密',
      mood: '克制、紧张',
      allowSecretReveal: false,
      length: 'medium',
    })

    expect(prisma.dialogueSession.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        chapterId: 'chapter-1',
        title: '旧港质问',
        location: '旧港',
        conflict: '林澄怀疑沈遥隐瞒了记忆交易',
        goal: '逼出沈遥的秘密',
        mood: '克制、紧张',
        allowSecretReveal: false,
        length: 'medium',
        status: 'ACTIVE',
        characterIds: 'char-1,char-2',
        currentTurn: 0,
      },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })
    expect(session.id).toBe('session-1')
  })

  it('continues an active session by appending AI dialogue messages and the author instruction', async () => {
    prisma.dialogueSession.findFirst.mockResolvedValue({
      id: 'session-1',
      projectId: 'project-1',
      status: 'ACTIVE',
      title: '旧港质问',
      location: '旧港',
      conflict: '林澄怀疑沈遥隐瞒了记忆交易',
      goal: '逼出沈遥的秘密',
      mood: '克制',
      length: 'medium',
      allowSecretReveal: false,
      characterIds: 'char-1,char-2',
      project: { id: 'project-1', userId: 'user-1', title: '雨城' },
      messages: [
        { order: 0, speaker: '林澄', content: '你昨晚在旧港。', type: 'DIALOGUE' },
      ],
    })
    prisma.character.findMany.mockResolvedValue([
      {
        id: 'char-1',
        name: '林澄',
        personality: '冷静克制',
        goals: '查明记忆交易',
        flaws: '不信任他人',
        voice: '短句，少解释',
        relationshipsFrom: [],
        relationshipsTo: [],
      },
      {
        id: 'char-2',
        name: '沈遥',
        personality: '机警防备',
        goals: '隐藏身份',
        flaws: '遇到逼问会转移话题',
        voice: '语气直接，偶尔反问',
        relationshipsFrom: [],
        relationshipsTo: [],
      },
    ])
    aiService.chat.mockResolvedValue({
      response: JSON.stringify({
        messages: [
          { speaker: '沈遥', content: '你没有证据。' },
          { speaker: '林澄', content: '我有你掉下的芯片。' },
        ],
        oocWarnings: ['沈遥仍在回避核心问题，符合当前防备状态。'],
      }),
    })
    prisma.dialogueMessage.findFirst.mockResolvedValue({ order: 0 })
    prisma.dialogueMessage.createMany.mockResolvedValue({ count: 3 })
    prisma.dialogueQualityReport.create.mockResolvedValue({ id: 'report-1', status: 'WARN' })
    prisma.dialogueQualityIssue.createMany.mockResolvedValue({ count: 1 })
    prisma.dialogueSession.update.mockResolvedValue({
      id: 'session-1',
      currentTurn: 1,
      lastInstruction: '让沈遥更强势',
      messages: [
        { order: 0, speaker: '林澄', content: '你昨晚在旧港。', type: 'DIALOGUE' },
        { order: 1, speaker: '作者指令', content: '让沈遥更强势', type: 'INSTRUCTION' },
        { order: 2, speaker: '沈遥', content: '你没有证据。', type: 'DIALOGUE' },
        { order: 3, speaker: '林澄', content: '我有你掉下的芯片。', type: 'DIALOGUE' },
      ],
    })

    const result = await service.continueSession('user-1', 'project-1', 'session-1', {
      instruction: '让沈遥更强势',
      rounds: 2,
    })

    expect(aiService.chat).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        projectId: 'project-1',
        temperature: 0.8,
      }),
    )
    expect(prisma.dialogueMessage.createMany).toHaveBeenCalledWith({
      data: [
        {
          sessionId: 'session-1',
          speaker: '作者指令',
          content: '让沈遥更强势',
          type: 'INSTRUCTION',
          order: 1,
          metadata: undefined,
        },
        {
          sessionId: 'session-1',
          speaker: '沈遥',
          content: '你没有证据。',
          type: 'DIALOGUE',
          order: 2,
          metadata: '{"oocWarnings":["沈遥仍在回避核心问题，符合当前防备状态。"]}',
        },
        {
          sessionId: 'session-1',
          speaker: '林澄',
          content: '我有你掉下的芯片。',
          type: 'DIALOGUE',
          order: 3,
          metadata: '{"oocWarnings":["沈遥仍在回避核心问题，符合当前防备状态。"]}',
        },
      ],
    })
    expect(result.currentTurn).toBe(1)
    expect(prisma.dialogueQualityReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'project-1',
        sessionId: 'session-1',
        status: 'WARN',
      }),
    })
    expect(prisma.dialogueQualityIssue.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          reportId: 'report-1',
          category: 'OOC',
          severity: 'NORMAL',
          message: '沈遥仍在回避核心问题，符合当前防备状态。',
        }),
      ],
    })
  })

  it('lists dialogue quality reports for a session', async () => {
    prisma.dialogueSession.findFirst.mockResolvedValue({
      id: 'session-1',
      project: { id: 'project-1', userId: 'user-1' },
      messages: [],
    })
    prisma.dialogueQualityReport.findMany.mockResolvedValue([
      { id: 'report-1', issues: [{ id: 'issue-1', message: '声音趋同' }] },
    ])

    await expect(service.listQualityReports('user-1', 'project-1', 'session-1')).resolves.toEqual([
      { id: 'report-1', issues: [{ id: 'issue-1', message: '声音趋同' }] },
    ])
  })

  it('generates an improved dialogue candidate from the latest quality report without saving messages', async () => {
    prisma.dialogueSession.findFirst.mockResolvedValue({
      id: 'session-1',
      projectId: 'project-1',
      status: 'ACTIVE',
      title: '旧港质问',
      location: '旧港',
      conflict: '林澄怀疑沈遥隐瞒了记忆交易',
      goal: '逼出沈遥的秘密',
      mood: '克制',
      length: 'medium',
      allowSecretReveal: false,
      characterIds: 'char-1,char-2',
      project: { id: 'project-1', userId: 'user-1' },
      messages: [
        { order: 0, speaker: '林澄', content: '你昨晚在旧港。', type: 'DIALOGUE' },
        { order: 1, speaker: '沈遥', content: '我不知道。', type: 'DIALOGUE' },
      ],
    })
    prisma.character.findMany.mockResolvedValue([
      {
        id: 'char-1',
        name: '林澄',
        personality: '冷静克制',
        goals: '查明记忆交易',
        flaws: '不信任他人',
        voice: '短句，少解释',
        relationshipsFrom: [],
        relationshipsTo: [],
      },
      {
        id: 'char-2',
        name: '沈遥',
        personality: '机警防备',
        goals: '隐藏身份',
        flaws: '遇到逼问会转移话题',
        voice: '语气直接，偶尔反问',
        relationshipsFrom: [],
        relationshipsTo: [],
      },
    ])
    prisma.dialogueQualityReport.findMany.mockResolvedValue([
      { id: 'report-1', issues: [{ category: 'VOICE_SIMILARITY', message: '角色声音趋同' }] },
    ])
    aiService.chat.mockResolvedValue({
      response: JSON.stringify({
        messages: [{ speaker: '沈遥', content: '你想让我承认什么？' }],
        oocWarnings: [],
      }),
    })

    const result = await service.improveFromQualityReport('user-1', 'project-1', 'session-1', {
      instruction: '让沈遥更像在转移话题',
    })

    expect(result.messages).toEqual([{ speaker: '沈遥', content: '你想让我承认什么？' }])
    expect(prisma.dialogueMessage.createMany).not.toHaveBeenCalled()
    expect(aiService.chat).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        message: expect.stringContaining('角色声音趋同'),
      }),
    )
  })

  it('does not continue a paused session', async () => {
    prisma.dialogueSession.findFirst.mockResolvedValue({
      id: 'session-1',
      status: 'PAUSED',
      project: { id: 'project-1', userId: 'user-1' },
      messages: [],
    })

    await expect(
      service.continueSession('user-1', 'project-1', 'session-1', { rounds: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('pauses a session owned by the current user', async () => {
    prisma.dialogueSession.findFirst.mockResolvedValue({
      id: 'session-1',
      project: { id: 'project-1', userId: 'user-1' },
      messages: [],
    })
    prisma.dialogueSession.update.mockResolvedValue({ id: 'session-1', status: 'PAUSED' })

    const result = await service.pause('user-1', 'project-1', 'session-1')

    expect(prisma.dialogueSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'PAUSED' },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })
    expect(result.status).toBe('PAUSED')
  })

  it('rejects sessions from another user', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', userId: 'other-user' })

    await expect(
      service.create('user-1', 'project-1', {
        title: '越权会话',
        characterIds: ['char-1', 'char-2'],
        conflict: '冲突',
        goal: '目标',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('requires at least two characters to create a session', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', userId: 'user-1' })

    await expect(
      service.create('user-1', 'project-1', {
        title: '单人会话',
        characterIds: ['char-1'],
        conflict: '冲突',
        goal: '目标',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws not found for missing sessions', async () => {
    prisma.dialogueSession.findFirst.mockResolvedValue(null)

    await expect(service.findOne('user-1', 'project-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})
