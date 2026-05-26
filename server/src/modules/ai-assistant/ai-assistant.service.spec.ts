import { AiAssistantService } from './ai-assistant.service'

describe('AiAssistantService', () => {
  const createService = () => {
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'project-1',
          title: 'AI末世',
          genre: '科幻',
          synopsis: 'AI 觉醒后的末世故事',
          characters: [],
          worldSettings: [],
        }),
      },
    }
    const aiService = {
      chat: jest.fn().mockResolvedValue({ response: '{"type":"chat","data":{}}' }),
      chatStream: jest.fn(async function* () {
        yield '角色设定'
      }),
    }
    const storySystemService = {
      searchStoryGraph: jest.fn().mockResolvedValue({
        results: [
          {
            sourceType: 'WORLD_FACT',
            text: 'ZERO 控制蜂巢网络，灵芯是叛变 AI。',
            score: 0.9,
          },
        ],
      }),
    }

    const service = new AiAssistantService(
      prisma as any,
      {} as any,
      {} as any,
      aiService as any,
      storySystemService as any,
    )

    return { service, aiService, storySystemService }
  }

  it('includes conversation history when building a streaming chat prompt', async () => {
    const { service, aiService } = createService()

    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '基于刚才的大纲，帮我生成主要角色设定',
      undefined,
      undefined,
      undefined,
      undefined,
      [
        { role: 'user', content: '你帮我写下故事大纲' },
        { role: 'assistant', content: '《AI末世：觉醒之日》故事大纲\n林晓、灵芯、ZERO、ARIA 是核心人物。' },
      ],
    )) {
      chunks.push(chunk)
    }

    expect(chunks.some(chunk => chunk.content === '角色设定')).toBe(true)
    expect(aiService.chatStream).toHaveBeenCalledTimes(1)
    const streamPrompt = (aiService.chatStream as jest.Mock).mock.calls[0][1].message
    expect(streamPrompt).toContain('近期对话上下文')
    expect(streamPrompt).toContain('林晓、灵芯、ZERO、ARIA 是核心人物')
    expect(streamPrompt).toContain('项目长期记忆')
    expect(streamPrompt).toContain('ZERO 控制蜂巢网络')
    expect(streamPrompt).toContain('基于刚才的大纲，帮我生成主要角色设定')
  })

  it('does not create a generic character for contextual character planning', async () => {
    const { service, aiService } = createService()
    aiService.chat.mockResolvedValueOnce({
      response: '{"type":"create_character","data":{"name":"主要角色","role":"主角"}}',
    })

    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '基于刚才的大纲，帮我生成主要角色设定，包括目标、弱点、人物弧光和彼此关系。',
      undefined,
      undefined,
      undefined,
      undefined,
      [
        { role: 'assistant', content: '林晓、灵芯、ZERO、ARIA 是核心人物。' },
      ],
    )) {
      chunks.push(chunk)
    }

    expect(chunks.some(chunk => chunk.content === '角色设定')).toBe(true)
    expect(aiService.chatStream).toHaveBeenCalledTimes(1)
  })

  it('emits executable action cards for generated creative material', async () => {
    const { service, aiService } = createService()
    aiService.chatStream.mockImplementation(async function* () {
      yield '第一章：觉醒之日\n林晓发现灵芯异常。'
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '帮我创建章节清单',
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    )) {
      chunks.push(chunk)
    }

    const cardsEvent = chunks.find(chunk => chunk.type === 'action_cards')
    expect(cardsEvent?.cards).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actionType: 'AI_ACTION',
        content: expect.objectContaining({
          actionType: 'CREATE_CHAPTER',
        }),
      }),
    ]))
    const chapterCard = cardsEvent?.cards.find((card: any) => card.content.actionType === 'CREATE_CHAPTER')
    expect(chapterCard?.content.parameters.chapterData.summary).toContain('林晓发现灵芯异常')
    expect(chapterCard?.content.parameters.chapterData.summary).not.toContain('你是一个小说创作助手')
  })
})
