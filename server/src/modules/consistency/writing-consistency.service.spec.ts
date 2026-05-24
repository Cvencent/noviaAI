import { WritingConsistencyService } from './writing-consistency.service'

describe('WritingConsistencyService', () => {
  let service: WritingConsistencyService
  let prisma: any

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      plot: {
        findMany: jest.fn(),
      },
    }

    service = new WritingConsistencyService(prisma)
  })

  describe('generateStylePrompt', () => {
    it('returns default prompt when project has no style config', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      const result = await service.generateStylePrompt('project-1')

      expect(result).toBe('请保持一致的叙事风格。')
    })

    it('returns default prompt when writingStyleConfig is null', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        writingStyleConfig: null,
      })

      const result = await service.generateStylePrompt('project-1')

      expect(result).toBe('请保持一致的叙事风格。')
    })

    it('generates prompt from valid style config', async () => {
      const styleConfig = {
        narrative: {
          perspective: 'third_limited',
          tense: 'past',
          tone: 'neutral',
          pacing: 'moderate',
        },
        language: {
          vocabulary_level: 'literary',
          sentence_structure: 'varied',
          paragraph_length: 'moderate',
          dialogue_ratio: 0.3,
        },
        formatting: {
          chapter_structure: 'conventional',
          POV_switches: true,
          flashbacks: 'rare',
        },
      }

      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        writingStyleConfig: JSON.stringify(styleConfig),
      })

      const result = await service.generateStylePrompt('project-1')

      expect(result).toContain('写作风格指南')
      expect(result).toContain('第三人称有限视角')
      expect(result).toContain('过去时')
      expect(result).toContain('对话比例：30%')
    })

    it('handles invalid JSON in writingStyleConfig', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        writingStyleConfig: 'invalid-json',
      })

      const result = await service.generateStylePrompt('project-1')

      expect(result).toBe('请保持一致的叙事风格。')
    })
  })

  describe('checkConsistency', () => {
    it('returns consistency check results', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        writingStyleConfig: null,
      })
      prisma.plot.findMany.mockResolvedValue([])

      const result = await service.checkConsistency('project-1', '测试内容')

      expect(result).toHaveProperty('styleViolations')
      expect(result).toHaveProperty('continuityIssues')
      expect(result).toHaveProperty('characterInconsistencies')
      expect(result).toHaveProperty('suggestions')
    })

    it('detects long sentences when style is short', async () => {
      const styleConfig = {
        narrative: {},
        language: {
          sentence_structure: 'short',
        },
        formatting: {},
      }

      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        writingStyleConfig: JSON.stringify(styleConfig),
      })
      prisma.plot.findMany.mockResolvedValue([])

      const longText = '这是一个非常长的句子，它包含了很多很多的内容和描述，目的是测试系统是否能够正确地识别出这种过长的句子并给出相应的建议和警告。'.repeat(5)
      const result = await service.checkConsistency('project-1', longText)

      expect(result.styleViolations.some((v: string) => v.includes('句子偏长'))).toBe(true)
    })

    it('detects dialogue ratio mismatch', async () => {
      const styleConfig = {
        narrative: {},
        language: {
          dialogue_ratio: 0.1,
        },
        formatting: {},
      }

      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        writingStyleConfig: JSON.stringify(styleConfig),
      })
      prisma.plot.findMany.mockResolvedValue([])

      const textWithHighDialogue = '"你好！"'.repeat(50)
      const result = await service.checkConsistency('project-1', textWithHighDialogue)

      expect(result.styleViolations.some((v: string) => v.includes('对话比例'))).toBe(true)
    })
  })
})
