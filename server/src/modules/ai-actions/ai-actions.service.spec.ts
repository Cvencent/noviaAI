import { AIActionsService } from './ai-actions.service'
import { AIActionType } from './dto/ai-action.dto'

describe('AIActionsService', () => {
  const createService = () => {
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({ id: 'project-1', userId: 'user-1' }),
      },
      chapter: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(({ data }) => Promise.resolve({ id: 'chapter-1', ...data })),
      },
      scene: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(({ data }) => Promise.resolve({ id: 'scene-1', ...data })),
      },
    }

    return {
      prisma,
      service: new AIActionsService(prisma as any),
    }
  }

  it('executes nested action parameters from chat cards', async () => {
    const { prisma, service } = createService()

    const result = await service.executeAction(AIActionType.CREATE_CHAPTER, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        chapterData: {
          title: '觉醒之日',
          summary: 'AI 在零日时刻觉醒。',
        },
      },
    })

    expect(result.success).toBe(true)
    expect(prisma.chapter.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: '觉醒之日',
        summary: 'AI 在零日时刻觉醒。',
        projectId: 'project-1',
      }),
    }))
  })

  it('creates newly supported scene actions', async () => {
    const { prisma, service } = createService()

    await service.executeAction(AIActionType.CREATE_SCENE, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        sceneData: {
          title: '废弃实验室',
          summary: '林晓发现共鸣算法。',
        },
      },
    })

    expect(prisma.scene.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: '废弃实验室',
        project: { connect: { id: 'project-1' } },
      }),
    }))
  })
})
