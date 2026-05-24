import { AiProjectGeneratorService } from './ai-project-generator.service'

describe('AiProjectGeneratorService project suggestion jobs', () => {
  let service: AiProjectGeneratorService
  let prisma: any
  let aiService: any
  let projectsService: any

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      projectAiSuggestionJob: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    }
    aiService = {
      chat: jest.fn(),
    }
    projectsService = {
      create: jest.fn(),
    }
    service = new AiProjectGeneratorService(prisma, aiService, projectsService)
  })

  it('creates a resumable suggestion job and stores the generated result', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
      title: '星辰之旅',
      genre: 'scifi',
      synopsis: '一个关于太空探索的科幻故事',
      wordCount: 1,
      characters: [{ name: '李星辰', role: '主角' }],
      worldSettings: [{ category: '科技', name: '太阳系殖民地' }],
      chapters: [{ title: '神秘信号', wordCount: 1 }],
    })
    prisma.projectAiSuggestionJob.create.mockImplementation(({ data }: any) => ({
      id: 'suggestion-job-1',
      ...data,
      createdAt: new Date('2026-05-24T00:00:00.000Z'),
      updatedAt: new Date('2026-05-24T00:00:00.000Z'),
    }))
    prisma.projectAiSuggestionJob.update.mockImplementation(({ data }: any) => ({
      id: 'suggestion-job-1',
      ...data,
    }))
    aiService.chat.mockResolvedValue({
      response: JSON.stringify({
        nextSteps: ['开始撰写第一章“神秘信号”的具体内容'],
        contentSuggestions: ['设置信号包含未知符号'],
        characterSuggestions: ['为李星辰创建详细个人档案'],
        worldSuggestions: ['扩展银河系边缘设定'],
        plotSuggestions: ['信号来源指向失落文明'],
      }),
    })

    const job = await service.createProjectSuggestionJob('user-1', 'project-1')
    await service.waitForIdleProjectSuggestionJobs()

    expect(job).toEqual(expect.objectContaining({
      id: 'suggestion-job-1',
      projectId: 'project-1',
      status: 'RUNNING',
      result: null,
    }))
    expect(prisma.projectAiSuggestionJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'project-1',
        status: 'RUNNING',
        input: expect.stringContaining('user-1'),
      }),
    })
    expect(prisma.projectAiSuggestionJob.update).toHaveBeenCalledWith({
      where: { id: 'suggestion-job-1' },
      data: expect.objectContaining({
        status: 'DONE',
        result: expect.stringContaining('神秘信号'),
        error: null,
      }),
    })
  })

  it('lists project suggestion jobs newest first for page refresh recovery', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', userId: 'user-1' })
    prisma.projectAiSuggestionJob.findMany.mockResolvedValue([
      { id: 'suggestion-job-2', status: 'DONE', result: '{}' },
      { id: 'suggestion-job-1', status: 'RUNNING', result: null },
    ])

    const jobs = await service.listProjectSuggestionJobs('user-1', 'project-1')

    expect(jobs).toHaveLength(2)
    expect(prisma.projectAiSuggestionJob.findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  })
})
