import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { OutlinesService } from './outlines.service'

describe('OutlinesService AI structure tools', () => {
  let service: OutlinesService
  let prisma: any
  let aiService: any

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      outline: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    }

    aiService = {
      chat: jest.fn(),
    }

    service = new OutlinesService(prisma, aiService)
  })

  it('generates a persisted outline from AI JSON', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
      title: '雨城',
      genre: 'mystery',
      synopsis: '雨夜连环案与记忆交易。',
    })
    prisma.outline.findFirst.mockResolvedValue({ order: 2 })
    aiService.chat.mockResolvedValue({
      response: JSON.stringify({
        title: '三幕式全书大纲',
        description: '围绕雨夜记忆交易展开。',
        items: [
          {
            title: '雨夜开局',
            summary: '主角发现第一具没有记忆的尸体。',
            goal: '建立悬疑钩子',
            conflict: '警方拒绝公开真相',
            outcome: '主角拿到黑市记忆芯片',
            povCharacter: '林澄',
            location: '旧港',
            estimatedWords: 3200,
          },
        ],
      }),
    })
    prisma.outline.create.mockResolvedValue({
      id: 'outline-1',
      projectId: 'project-1',
      title: '三幕式全书大纲',
      description: '围绕雨夜记忆交易展开。',
      structureType: 'THREE_ACT',
      status: 'DRAFT',
      order: 3,
      items: [{ id: 'item-1', title: '雨夜开局' }],
    })

    const result = await service.generateWithAi('user-1', 'project-1', {
      structureTemplate: 'THREE_ACT',
      chapterCount: 1,
      targetWords: 3000,
    })

    expect(aiService.chat).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        projectId: 'project-1',
        temperature: 0.7,
      }),
    )
    expect(prisma.outline.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        title: '三幕式全书大纲',
        description: '围绕雨夜记忆交易展开。',
        structureType: 'THREE_ACT',
        status: 'DRAFT',
        order: 3,
        items: {
          create: [
            {
              title: '雨夜开局',
              summary: '主角发现第一具没有记忆的尸体。',
              goal: '建立悬疑钩子',
              conflict: '警方拒绝公开真相',
              outcome: '主角拿到黑市记忆芯片',
              povCharacter: '林澄',
              location: '旧港',
              estimatedWords: 3200,
              order: 0,
            },
          ],
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })
    expect(result.id).toBe('outline-1')
  })

  it('scores structure health from outline item coverage', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
    })
    prisma.outline.findUnique.mockResolvedValue({
      id: 'outline-1',
      projectId: 'project-1',
      structureType: 'THREE_ACT',
      items: [
        {
          title: '开端',
          goal: '引出主线',
          conflict: '主角被追捕',
          outcome: '逃离旧港',
          povCharacter: '林澄',
          estimatedWords: 3000,
          order: 0,
        },
        {
          title: '中段',
          goal: '',
          conflict: '',
          outcome: '',
          povCharacter: '',
          estimatedWords: 9000,
          order: 1,
        },
      ],
    })

    const report = await service.analyzeStructure('user-1', 'project-1', 'outline-1')

    expect(report.coverageScore).toBeLessThan(100)
    expect(report.pacingScore).toBeLessThan(100)
    expect(report.missingBeats).toContain('结局/回收')
    expect(report.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringContaining('第 2 个条目缺少目标'),
        expect.stringContaining('字数分配差异过大'),
      ]),
    )
  })

  it('rejects AI outline generation for projects owned by another user', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'other-user',
    })

    await expect(
      service.generateWithAi('user-1', 'project-1', {
        structureTemplate: 'THREE_ACT',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejects structure analysis for missing outlines', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
    })
    prisma.outline.findUnique.mockResolvedValue(null)

    await expect(
      service.analyzeStructure('user-1', 'project-1', 'outline-404'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
