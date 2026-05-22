import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ReaderExperienceService } from './reader-experience.service'

describe('ReaderExperienceService', () => {
  let service: ReaderExperienceService
  let prisma: any

  beforeEach(() => {
    prisma = {
      project: { findUnique: jest.fn() },
      chapter: { findMany: jest.fn() },
    }
    service = new ReaderExperienceService(prisma)
  })

  it('analyzes readability, emotion curve, and reader risks across chapters', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
      title: '雨城',
    })
    prisma.chapter.findMany.mockResolvedValue([
      {
        id: 'chapter-1',
        title: '旧港',
        order: 0,
        contents: [{ content: '林澄沉默。雨很冷。沈遥笑了一下，紧张却没有退。' }],
      },
      {
        id: 'chapter-2',
        title: '空转',
        order: 1,
        contents: [{ content: '他想了很久。事情仿佛变得复杂，空气仿佛凝固。' }],
      },
    ])

    const report = await service.analyzeProject('user-1', 'project-1')

    expect(report.projectId).toBe('project-1')
    expect(report.chapters).toHaveLength(2)
    expect(report.chapters[0]).toEqual(expect.objectContaining({
      chapterId: 'chapter-1',
      title: '旧港',
      emotion: expect.objectContaining({ tension: expect.any(Number), valence: expect.any(Number) }),
      readability: expect.objectContaining({
        characterCount: expect.any(Number),
        sentenceCount: expect.any(Number),
        averageSentenceLength: expect.any(Number),
        dialogueRatio: expect.any(Number),
      }),
    }))
    expect(report.risks.some((risk) => risk.category === 'CLICHE')).toBe(true)
    expect(report.summary.averageReadabilityScore).toBeGreaterThanOrEqual(0)
  })

  it('rejects access to another user project', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', userId: 'other-user' })

    await expect(service.analyzeProject('user-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws not found for missing projects', async () => {
    prisma.project.findUnique.mockResolvedValue(null)

    await expect(service.analyzeProject('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException)
  })
})
