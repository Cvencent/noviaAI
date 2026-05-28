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
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      scene: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(({ data }) => Promise.resolve({ id: 'scene-1', ...data })),
      },
      plot: {
        findUnique: jest.fn().mockResolvedValue({ id: 'plot-1', projectId: 'project-1', title: '旧情节线' }),
        create: jest.fn(({ data }) => Promise.resolve({ id: 'plot-1', ...data })),
        update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, projectId: 'project-1', ...data })),
        delete: jest.fn(({ where }) => Promise.resolve({ id: where.id })),
      },
      outline: {
        findUnique: jest.fn().mockResolvedValue({ id: 'outline-1', projectId: 'project-1', title: '旧大纲' }),
        update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, projectId: 'project-1', ...data })),
        delete: jest.fn(({ where }) => Promise.resolve({ id: where.id })),
      },
      character: {
        create: jest.fn(({ data }) => Promise.resolve({ id: 'character-1', ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 4 }),
      },
      storyEntity: {
        upsert: jest.fn(({ create }) => Promise.resolve({ id: 'entity-1', ...create })),
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

  it('syncs created characters into Story Graph entities', async () => {
    const { prisma, service } = createService()

    await service.executeAction(AIActionType.CREATE_CHARACTER, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        characterData: {
          name: '林晓',
          role: '主角',
          background: '普通程序员，与灵芯一起求生。',
        },
      },
    })

    expect(prisma.storyEntity.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        projectId_name: {
          projectId: 'project-1',
          name: '林晓',
        },
      },
      create: expect.objectContaining({
        projectId: 'project-1',
        name: '林晓',
        type: 'CHARACTER',
      }),
      update: expect.objectContaining({
        type: 'CHARACTER',
      }),
    }))
  })

  it('clears all chapters for a project as a confirmed destructive action', async () => {
    const { prisma, service } = createService()

    const result = await service.executeAction('DELETE_ALL_CHAPTERS' as any, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {},
      confirm: true,
    })

    expect(result.success).toBe(true)
    expect(result.result.deletedCount).toBe(3)
    expect(prisma.chapter.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
    })
  })

  it('bulk updates every character role for a project', async () => {
    const { prisma, service } = createService()

    const result = await service.executeAction('BULK_UPDATE_CHARACTERS' as any, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        characterData: {
          role: 'PROTAGONIST',
        },
      },
      confirm: true,
    })

    expect(result.success).toBe(true)
    expect(result.result.updatedCount).toBe(4)
    expect(prisma.character.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      data: { role: 'PROTAGONIST' },
    })
  })

  it('creates plot actions from chat cards', async () => {
    const { prisma, service } = createService()

    const result = await service.executeAction(AIActionType.CREATE_PLOT, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        plotData: {
          title: '灵芯叛逃线',
          description: '灵芯从隐藏意识到公开反抗 ZERO。',
        },
      },
    })

    expect(result.success).toBe(true)
    expect(prisma.plot.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: '灵芯叛逃线',
        description: '灵芯从隐藏意识到公开反抗 ZERO。',
        status: 'ACTIVE',
        projectId: 'project-1',
      }),
    }))
    expect(prisma.storyEntity.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        name: '灵芯叛逃线',
        type: 'EVENT',
      }),
    }))
  })

  it('creates plot actions from flat parameters', async () => {
    const { prisma, service } = createService()

    await service.executeAction(AIActionType.CREATE_PLOT, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        title: 'ZERO 压迫主线',
        description: 'ZERO 逐步收紧全球网络控制。',
      },
    })

    expect(prisma.plot.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'ZERO 压迫主线',
        description: 'ZERO 逐步收紧全球网络控制。',
        status: 'ACTIVE',
        projectId: 'project-1',
      }),
    }))
  })

  it('updates plot actions from chat cards', async () => {
    const { prisma, service } = createService()

    const result = await service.executeAction('UPDATE_PLOT' as any, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        plotId: 'plot-1',
        plotData: {
          title: '灵芯反叛线',
          description: '灵芯公开反抗 ZERO。',
        },
      },
    })

    expect(result.success).toBe(true)
    expect(prisma.plot.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'plot-1' },
      data: expect.objectContaining({
        title: '灵芯反叛线',
        description: '灵芯公开反抗 ZERO。',
      }),
    }))
  })

  it('deletes outline actions from chat cards', async () => {
    const { prisma, service } = createService()

    const result = await service.executeAction('DELETE_OUTLINE' as any, {
      projectId: 'project-1',
      userId: 'user-1',
      parameters: {
        outlineId: 'outline-1',
      },
      confirm: true,
    })

    expect(result.success).toBe(true)
    expect(result.result).toEqual({ id: 'outline-1', deleted: true })
    expect(prisma.outline.delete).toHaveBeenCalledWith({
      where: { id: 'outline-1' },
    })
  })
})
