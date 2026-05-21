import { Test, TestingModule } from '@nestjs/testing'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ContextBuilderService } from './context-builder.service'

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

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: aiService },
        { provide: ContextBuilderService, useValue: contextBuilderService },
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
})
