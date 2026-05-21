import { NotFoundException } from '@nestjs/common'
import { ContextBuilderService } from './context-builder.service'

describe('ContextBuilderService', () => {
  const prisma = {
    project: { findFirst: jest.fn() },
    worldSetting: { findMany: jest.fn() },
    plot: { findMany: jest.fn() },
    chapter: { findMany: jest.fn(), findFirst: jest.fn() },
    loreEntry: { findMany: jest.fn() },
    chekhovsGun: { findMany: jest.fn() },
    outline: { findMany: jest.fn() },
    turningPoint: { findMany: jest.fn() },
    timelineEvent: { findMany: jest.fn() },
    customWritingStyle: { findUnique: jest.fn() },
    character: { findMany: jest.fn() },
  }

  const progressiveCharacterContext = {
    buildProgressiveCharacterContext: jest.fn(),
  }

  let service: ContextBuilderService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ContextBuilderService(
      prisma as unknown as import('../../prisma/prisma.service').PrismaService,
      progressiveCharacterContext as unknown as import('../characters/progressive-character-context.service').ProgressiveCharacterContextService,
    )
  })

  it('builds preview sections for project, lore, structure, style, character-voice, and anti-ai-rules', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p1',
      title: '黑塔',
      description: '雨夜开启的塔',
      genre: '奇幻',
      synopsis: '关于黑塔的故事',
      currentWritingStyleId: 'style-1',
      writingStyleConfig: null,
    })
    prisma.worldSetting.findMany.mockResolvedValue([])
    prisma.plot.findMany.mockResolvedValue([])
    prisma.chapter.findMany.mockResolvedValue([])
    prisma.chapter.findFirst.mockResolvedValue(null)
    prisma.loreEntry.findMany.mockResolvedValue([
      { name: '黑塔', category: 'LOCATION', description: '只能在雨夜开启', keywords: '黑塔,雨夜', priority: 10, isActive: true },
    ])
    prisma.chekhovsGun.findMany.mockResolvedValue([
      { name: '半枚钥匙', description: '尚未回收', status: 'SETUP' },
    ])
    prisma.outline.findMany.mockResolvedValue([
      { title: '第一卷', items: [{ title: '雨夜入塔', goal: '进入黑塔' }] },
    ])
    prisma.turningPoint.findMany.mockResolvedValue([
      { title: '身份揭露', type: 'CHARACTER_REVEAL', description: '沈遥隐瞒身份' },
    ])
    prisma.timelineEvent.findMany.mockResolvedValue([
      { title: '黑塔开启', timeLabel: '第一夜', description: '雨夜' },
    ])
    prisma.customWritingStyle.findUnique.mockResolvedValue({
      id: 'style-1',
      name: '简洁',
      description: '快速节奏',
      config: '{"pacing":"fast"}',
    })
    prisma.character.findMany.mockResolvedValue([
      { name: '沈遥', voice: '短句，直接，不解释情绪' },
    ])

    const preview = await service.buildContextPreview('p1', 'user-1', {
      chapterId: 'c1',
      currentText: '黑塔在雨夜出现。',
    })

    expect(preview.projectId).toBe('p1')
    expect(preview.chapterId).toBe('c1')
    expect(preview.sections.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        'project',
        'lorebook',
        'structure',
        'style',
        'character-voice',
        'anti-ai-rules',
      ]),
    )
    expect(preview.totalTokenEstimate).toBeGreaterThan(0)
    expect(preview.warnings).toEqual([])

    // Lorebook should match via keyword "黑塔" against currentText
    const loreSection = preview.sections.find((s) => s.id === 'lorebook')!
    expect(loreSection.items).toHaveLength(1)
    expect(loreSection.items[0]).toContain('黑塔')

    // Character voice section should include 沈遥
    const voiceSection = preview.sections.find((s) => s.id === 'character-voice')!
    expect(voiceSection.items).toHaveLength(1)
    expect(voiceSection.items[0]).toContain('沈遥')

    // Anti-AI rules section should contain the default rules
    const antiAiSection = preview.sections.find((s) => s.id === 'anti-ai-rules')!
    expect(antiAiSection.items.length).toBeGreaterThanOrEqual(5)
    expect(antiAiSection.items.some((r) => r.includes('总结式升华'))).toBe(true)
    expect(antiAiSection.items.some((r) => r.includes('模板化转折'))).toBe(true)
  })

  it('throws NotFoundException when project is missing or not owned by user', async () => {
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      service.buildContextPreview('missing-project', 'user-1'),
    ).rejects.toThrow(NotFoundException)
  })

  it('falls back to top priority lore entries when no currentText is provided', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p1',
      title: '黑塔',
      genre: '奇幻',
      synopsis: '故事简介',
      currentWritingStyleId: null,
      writingStyleConfig: null,
    })
    prisma.loreEntry.findMany.mockResolvedValue([
      { name: '高优先', category: 'ITEM', description: '重要物品', keywords: '物品', priority: 100, isActive: true },
      { name: '低优先', category: 'OTHER', description: '其他', keywords: '其他', priority: 1, isActive: true },
    ])
    prisma.chekhovsGun.findMany.mockResolvedValue([])
    prisma.outline.findMany.mockResolvedValue([])
    prisma.turningPoint.findMany.mockResolvedValue([])
    prisma.timelineEvent.findMany.mockResolvedValue([])
    prisma.character.findMany.mockResolvedValue([])

    const preview = await service.buildContextPreview('p1', 'user-1')

    const loreSection = preview.sections.find((s) => s.id === 'lorebook')!
    expect(loreSection.items).toHaveLength(2)
    expect(loreSection.items[0]).toContain('高优先')
  })

  it('filters lore entries by currentText keywords', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p1',
      title: '测试',
      genre: '奇幻',
      synopsis: '简介',
      currentWritingStyleId: null,
      writingStyleConfig: null,
    })
    prisma.loreEntry.findMany.mockResolvedValue([
      { name: '黑塔', category: 'LOCATION', description: '雨夜开启', keywords: '黑塔,雨夜', priority: 10, isActive: true },
      { name: '金钥匙', category: 'ITEM', description: '开启黑塔', keywords: '钥匙,金', priority: 5, isActive: true },
    ])
    prisma.chekhovsGun.findMany.mockResolvedValue([])
    prisma.outline.findMany.mockResolvedValue([])
    prisma.turningPoint.findMany.mockResolvedValue([])
    prisma.timelineEvent.findMany.mockResolvedValue([])
    prisma.character.findMany.mockResolvedValue([])

    const preview = await service.buildContextPreview('p1', 'user-1', {
      currentText: '她拿起钥匙，走向黑塔。',
    })

    const loreSection = preview.sections.find((s) => s.id === 'lorebook')!
    // Both entries match: 黑塔 matches via "黑塔" keyword, 金钥匙 matches via "钥匙" keyword
    expect(loreSection.items).toHaveLength(2)
  })

  it('uses CustomWritingStyle when currentWritingStyleId is set', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p1',
      title: '测试',
      genre: '奇幻',
      synopsis: '简介',
      currentWritingStyleId: 'cs-1',
      writingStyleConfig: '{"pacing":"slow"}',
    })
    prisma.loreEntry.findMany.mockResolvedValue([])
    prisma.chekhovsGun.findMany.mockResolvedValue([])
    prisma.outline.findMany.mockResolvedValue([])
    prisma.turningPoint.findMany.mockResolvedValue([])
    prisma.timelineEvent.findMany.mockResolvedValue([])
    prisma.customWritingStyle.findUnique.mockResolvedValue({
      id: 'cs-1',
      name: '古典',
      description: '文言文风格',
      config: null,
    })
    prisma.character.findMany.mockResolvedValue([])

    const preview = await service.buildContextPreview('p1', 'user-1')

    const styleSection = preview.sections.find((s) => s.id === 'style')!
    expect(styleSection.items.some((i) => i.includes('古典'))).toBe(true)
    expect(styleSection.items.some((i) => i.includes('文言文风格'))).toBe(true)
    expect(styleSection.items.some((i) => i.includes('pacing'))).toBe(true)
  })
})
