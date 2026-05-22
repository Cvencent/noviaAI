import { Test, TestingModule } from '@nestjs/testing'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ContextBuilderService } from './context-builder.service'
import { StorySystemService } from '../story-system/story-system.service'

describe('AiController', () => {
  let controller: AiController
  const aiService = {
    chat: jest.fn(),
    consistencyCheck: jest.fn(),
    generateSummary: jest.fn(),
    textComplete: jest.fn(),
    textCompleteStream: jest.fn(),
  }
  const contextBuilderService = {
    buildContextPreview: jest.fn(),
  }
  const storySystemService = {
    writeChapter: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: aiService },
        { provide: ContextBuilderService, useValue: contextBuilderService },
        { provide: StorySystemService, useValue: storySystemService },
      ],
    }).compile()

    controller = module.get(AiController)
  })

  it('delegates context-preview to ContextBuilderService.buildContextPreview', async () => {
    const preview = { projectId: 'project-1', sections: [], totalTokenEstimate: 0, warnings: [] }
    contextBuilderService.buildContextPreview.mockResolvedValue(preview)

    const result = await controller.getContextPreview(
      'project-1',
      { chapterId: 'chapter-1' },
      { id: 'user-1' },
    )

    expect(contextBuilderService.buildContextPreview).toHaveBeenCalledWith(
      'project-1',
      'user-1',
      { chapterId: 'chapter-1' },
    )
    expect(result).toBe(preview)
  })

  it('routes chapter text completion through the Story System mainline', async () => {
    const result = { blocked: false, completion: 'Story draft', runId: 'run-1' }
    storySystemService.writeChapter.mockResolvedValue(result)

    await expect(
      controller.textComplete(
        { id: 'user-1' },
        {
          projectId: 'project-1',
          chapterId: 'chapter-1',
          content: 'current draft',
          temperature: 0.6,
          maxTokens: 500,
        },
      ),
    ).resolves.toBe(result)

    expect(storySystemService.writeChapter).toHaveBeenCalledWith('user-1', 'project-1', 'chapter-1', {
      content: 'current draft',
      temperature: 0.6,
      maxTokens: 500,
    })
    expect(aiService.textComplete).not.toHaveBeenCalled()
  })

  it('keeps free text completion on AiService when no chapter is provided', async () => {
    const result = { completion: 'free draft' }
    aiService.textComplete.mockResolvedValue(result)

    await expect(
      controller.textComplete(
        { id: 'user-1' },
        {
          projectId: 'project-1',
          content: 'free prompt',
        },
      ),
    ).resolves.toBe(result)

    expect(aiService.textComplete).toHaveBeenCalledWith('user-1', {
      projectId: 'project-1',
      content: 'free prompt',
    })
    expect(storySystemService.writeChapter).not.toHaveBeenCalled()
  })

  it('routes chapter streaming completion through Story System as a single SSE token', async () => {
    storySystemService.writeChapter.mockResolvedValue({ blocked: false, completion: 'Story stream draft' })
    const res = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    }

    await controller.textCompleteStream(
      { id: 'user-1' },
      {
        projectId: 'project-1',
        chapterId: 'chapter-1',
        content: 'current draft',
      },
      res as any,
    )

    expect(storySystemService.writeChapter).toHaveBeenCalledWith('user-1', 'project-1', 'chapter-1', {
      content: 'current draft',
      temperature: undefined,
      maxTokens: undefined,
    })
    expect(aiService.textCompleteStream).not.toHaveBeenCalled()
    expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ token: 'Story stream draft' })}\n\n`)
    expect(res.write).toHaveBeenCalledWith('data: [DONE]\n\n')
    expect(res.end).toHaveBeenCalled()
  })
})
