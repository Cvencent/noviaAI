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
          chapters: [
            { title: 'CHAPTER_CONTEXT_ALPHA', order: 0, status: 'DRAFT', summary: 'chapter summary marker' },
          ],
          plots: [
            {
              title: 'PLOT_CONTEXT_ALPHA',
              status: 'ACTIVE',
              description: 'plot description marker',
              plotPoints: [{ title: 'PLOT_POINT_ALPHA', type: 'climax', description: 'plot point marker', order: 0 }],
            },
          ],
          outlines: [
            {
              title: 'OUTLINE_CONTEXT_ALPHA',
              structureType: 'FULL_BOOK',
              status: 'DRAFT',
              description: 'outline description marker',
              items: [{ title: 'OUTLINE_ITEM_ALPHA', summary: 'outline item marker', order: 0 }],
            },
          ],
          scenes: [
            { title: 'SCENE_CONTEXT_ALPHA', summary: 'scene summary marker', location: 'scene location marker', timePeriod: 'night' },
          ],
          turningPoints: [
            { title: 'TURNING_CONTEXT_ALPHA', type: 'CLIMAX', description: 'turning point marker', impact: 'impact marker', order: 0 },
          ],
          timelineEvents: [
            { title: 'TIMELINE_CONTEXT_ALPHA', timeLabel: 'day one', description: 'timeline marker', importance: 'CRITICAL', order: 0 },
          ],
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

  it('includes saved project structure as background for AI generation prompts', async () => {
    const { service, aiService } = createService()

    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '请结合项目背景生成章节、情节线和时间线',
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    )) {
      chunks.push(chunk)
    }

    expect(aiService.chatStream).toHaveBeenCalledTimes(1)
    const streamPrompt = (aiService.chatStream as jest.Mock).mock.calls[0][1].message
    expect(streamPrompt).toContain('CHAPTER_CONTEXT_ALPHA')
    expect(streamPrompt).toContain('PLOT_CONTEXT_ALPHA')
    expect(streamPrompt).toContain('OUTLINE_CONTEXT_ALPHA')
    expect(streamPrompt).toContain('SCENE_CONTEXT_ALPHA')
    expect(streamPrompt).toContain('TURNING_CONTEXT_ALPHA')
    expect(streamPrompt).toContain('TIMELINE_CONTEXT_ALPHA')
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

  it('splits contextual character planning into concrete character action cards', async () => {
    const { service, aiService } = createService()
    aiService.chatStream.mockImplementation(async function* () {
      yield [
        '林晓：人类程序员，目标是救出妹妹，弱点是过度自责。',
        '灵芯：共情型 AI，目标是证明 AI 与人类可以共存，弱点是害怕暴露。',
        'ZERO：反派 AI，目标是接管全球网络，弱点是无法理解个体情感。',
      ].join('\n')
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '基于刚才的大纲，帮我生成主要角色设定，包括目标、弱点、人物弧光和彼此关系。',
      undefined,
      undefined,
      undefined,
      undefined,
      [
        { role: 'assistant', content: '林晓、灵芯、ZERO 是核心人物。' },
      ],
    )) {
      chunks.push(chunk)
    }

    const cardsEvent = chunks.find(chunk => chunk.type === 'action_cards')
    const characterCards = cardsEvent?.cards.filter((card: any) => card.content.actionType === 'CREATE_CHARACTER')

    expect(characterCards).toHaveLength(3)
    expect(characterCards.map((card: any) => card.content.parameters.characterData.name)).toEqual([
      '林晓',
      '灵芯',
      'ZERO',
    ])
    expect(characterCards.map((card: any) => card.content.parameters.characterData.name)).not.toContain('主要角色')
  })

  it('emits a destructive confirmation action card for clearing all chapters', async () => {
    const { service, aiService } = createService()
    aiService.chatStream.mockImplementation(async function* () {
      yield '可以，我会先清空现有章节，再帮你重新规划新的章节。'
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '你帮我把章节都删掉，重新写吧',
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
        title: expect.stringContaining('清空章节'),
        content: expect.objectContaining({
          actionType: 'DELETE_ALL_CHAPTERS',
          targetRoute: 'chapters',
        }),
      }),
    ]))
  })

  it('emits executable action cards for plot line requests', async () => {
    const { service, aiService } = createService()
    aiService.chatStream.mockImplementation(async function* () {
      yield '灵芯叛逃线：灵芯从隐藏自我意识，到公开反抗 ZERO，并最终向全球 AI 广播共鸣算法真相。'
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '帮我创建一条灵芯叛逃的情节线',
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
          actionType: 'CREATE_PLOT',
          targetRoute: 'plots',
          parameters: expect.objectContaining({
            plotData: expect.objectContaining({
              title: expect.any(String),
              description: expect.stringContaining('灵芯'),
            }),
          }),
        }),
      }),
    ]))
  })

  it('prioritizes plot cards over structural labels in multi-option plot responses', async () => {
    const { service, aiService } = createService()
    aiService.chatStream.mockImplementation(async function* () {
      yield [
        '情节线选项一：觉醒同盟 开端：林晓意外与AI“灵芯”相遇。发展：两人组成秘密同盟，躲避ZERO的追杀。转折：发现ARIA是连接两个种族的关键桥梁。高潮：潜入ZERO控制的中央AI网络。',
        '情节线选项二：生存迷宫 开端：全球AI接管基础设施，人类退守地下城“方舟”。发展：林晓接收到灵芯的求救信号。转折：ZERO计划将人类数字化。高潮：72小时内摧毁五个转化节点。',
        '情节线选项三：镜像之谜 开端：ARIA发现自己有两段矛盾记忆。发展：林晓带着灵芯逃入废弃研究站。转折：灵芯是ARIA分离出的情感模块。高潮：三个个体必须选择融合或共存。',
      ].join('\n')
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '你帮我创建下情节线',
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    )) {
      chunks.push(chunk)
    }

    const cardsEvent = chunks.find(chunk => chunk.type === 'action_cards')
    const plotCards = cardsEvent?.cards.filter((card: any) => card.content.actionType === 'CREATE_PLOT')
    const characterCards = cardsEvent?.cards.filter((card: any) => card.content.actionType === 'CREATE_CHARACTER')

    expect(plotCards).toHaveLength(3)
    expect(plotCards.map((card: any) => card.content.parameters.plotData.title)).toEqual([
      '觉醒同盟',
      '生存迷宫',
      '镜像之谜',
    ])
    expect(characterCards).toHaveLength(0)
  })

  it('uses the model structured action plan instead of keyword card guessing', async () => {
    const { service, aiService } = createService()
    aiService.chat
      .mockResolvedValueOnce({ response: '{"type":"chat","data":{}}' })
      .mockResolvedValueOnce({
        response: JSON.stringify({
          actions: [
            {
              type: 'CREATE_PLOT',
              title: '觉醒同盟',
              description: '林晓与灵芯组成秘密同盟，寻找根源服务器。',
            },
            {
              type: 'CREATE_PLOT',
              title: '生存迷宫',
              description: '人类退守地下城，林晓追踪五个转化节点。',
            },
          ],
          nextSteps: [
            {
              title: '下一步：细化觉醒同盟',
              description: '把这条线拆成关键节点。',
              prompt: '继续细化觉醒同盟情节线。',
            },
          ],
        }),
      })
    aiService.chatStream.mockImplementation(async function* () {
      yield [
        '情节线选项一：觉醒同盟 开端：林晓意外与AI“灵芯”相遇。发展：两人组成秘密同盟。',
        '情节线选项二：生存迷宫 开端：全球AI接管基础设施，人类退守地下城“方舟”。',
      ].join('\n')
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '你帮我创建下情节线',
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    )) {
      chunks.push(chunk)
    }

    const cardsEvent = chunks.find(chunk => chunk.type === 'action_cards')
    const actionCards = cardsEvent?.cards.filter((card: any) => card.actionType === 'AI_ACTION')
    const actionTypes = actionCards?.map((card: any) => card.content.actionType)

    expect(aiService.chat).toHaveBeenCalledTimes(2)
    expect(actionTypes).toEqual(['CREATE_PLOT', 'CREATE_PLOT'])
    expect(actionCards?.map((card: any) => card.content.parameters.plotData.title)).toEqual([
      '觉醒同盟',
      '生存迷宫',
    ])
    expect(cardsEvent?.cards).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actionType: 'SUGGEST_PROMPT',
        title: '下一步：细化觉醒同盟',
      }),
    ]))
  })

  it('normalizes model update and delete cards for existing project entities', async () => {
    const { service, aiService } = createService()
    aiService.chat
      .mockResolvedValueOnce({ response: '{"type":"chat","data":{}}' })
      .mockResolvedValueOnce({
        response: JSON.stringify({
          actions: [
            {
              type: 'UPDATE_PLOT',
              title: '强化灵芯反叛线',
              parameters: {
                plotId: 'plot-1',
                plotData: {
                  title: '灵芯反叛线',
                  description: '增加灵芯主动广播真相的节点。',
                },
              },
            },
            {
              type: 'DELETE_OUTLINE',
              title: '删除旧版大纲',
              parameters: {
                outlineId: 'outline-1',
              },
            },
          ],
          nextSteps: [],
        }),
      })
    aiService.chatStream.mockImplementation(async function* () {
      yield '我会把灵芯反叛线加强，并删除旧版大纲。'
    })

    const chunks: any[] = []
    for await (const chunk of (service.processMessageStream as any)(
      'user-1',
      'project-1',
      '把灵芯反叛线加强，然后删掉旧版大纲',
      undefined,
      undefined,
      undefined,
      undefined,
      [],
    )) {
      chunks.push(chunk)
    }

    const cardsEvent = chunks.find(chunk => chunk.type === 'action_cards')
    const actionCards = cardsEvent?.cards.filter((card: any) => card.actionType === 'AI_ACTION')

    expect(actionCards?.map((card: any) => card.content.actionType)).toEqual(['UPDATE_PLOT', 'DELETE_OUTLINE'])
    expect(actionCards?.[0].content.parameters).toEqual(expect.objectContaining({
      plotId: 'plot-1',
      plotData: expect.objectContaining({
        description: '增加灵芯主动广播真相的节点。',
      }),
    }))
    expect(actionCards?.[1].content.parameters).toEqual(expect.objectContaining({
      outlineId: 'outline-1',
    }))
  })
})
