import { Test, TestingModule } from '@nestjs/testing'
import { EnhancedWritingController } from './enhanced-writing.controller'
import { EnhancedWritingService } from './enhanced-writing.service'

describe('EnhancedWritingController', () => {
  let controller: EnhancedWritingController
  const service = {
    showDontTell: jest.fn(),
    enhanceDescription: jest.fn(),
    rewrite: jest.fn(),
    brainstorm: jest.fn(),
    generateDialogue: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnhancedWritingController],
      providers: [{ provide: EnhancedWritingService, useValue: service }],
    }).compile()

    controller = module.get(EnhancedWritingController)
  })

  it('passes authenticated user id to showDontTell', async () => {
    service.showDontTell.mockResolvedValue({ result: 'shown' })

    await controller.showDontTell({ text: '她很害怕' }, { id: 'user-1' })

    expect(service.showDontTell).toHaveBeenCalledWith('她很害怕', 'user-1', { text: '她很害怕' })
  })

  it('passes authenticated user id to enhanceDescription', async () => {
    service.enhanceDescription.mockResolvedValue({ result: 'enhanced' })

    await controller.enhanceDescription({ text: '雨夜', focus: 'atmosphere' }, { id: 'user-2' })

    expect(service.enhanceDescription).toHaveBeenCalledWith('雨夜', 'user-2', {
      text: '雨夜',
      focus: 'atmosphere',
    })
  })

  it('passes authenticated user id to rewrite', async () => {
    service.rewrite.mockResolvedValue({ versions: [] })

    await controller.rewrite({ text: '原文', style: 'concise' }, { id: 'user-3' })

    expect(service.rewrite).toHaveBeenCalledWith('原文', 'user-3', {
      text: '原文',
      style: 'concise',
    })
  })

  it('passes authenticated user id to brainstorm', async () => {
    service.brainstorm.mockResolvedValue({ ideas: [] })

    await controller.brainstorm({ prompt: '下一章', type: 'plot' }, { id: 'user-4' })

    expect(service.brainstorm).toHaveBeenCalledWith('下一章', 'user-4', {
      prompt: '下一章',
      type: 'plot',
    })
  })

  it('passes authenticated user id to generateDialogue', async () => {
    service.generateDialogue.mockResolvedValue({ dialogue: '...' })

    await controller.generateDialogue(
      { context: '雨夜重逢', characterNames: ['林澈', '沈遥'] },
      { id: 'user-5' },
    )

    expect(service.generateDialogue).toHaveBeenCalledWith(
      '雨夜重逢',
      ['林澈', '沈遥'],
      'user-5',
      { context: '雨夜重逢', characterNames: ['林澈', '沈遥'] },
    )
  })
})
