import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ConversationsService } from './conversations.service'

describe('ConversationsService', () => {
  const createPrisma = () => ({
    project: {
      findUnique: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })

  it('updates message cards when the message belongs to the project conversation', async () => {
    const prisma = createPrisma()
    const service = new ConversationsService(prisma as any)
    const cardsJson = JSON.stringify([{ id: 'card-1', selectedAt: '2026-05-26T00:00:00.000Z' }])

    prisma.message.findUnique.mockResolvedValue({
      id: 'message-1',
      conversationId: 'conversation-1',
      conversation: {
        id: 'conversation-1',
        projectId: 'project-1',
      },
    })
    prisma.message.update.mockResolvedValue({
      id: 'message-1',
      cardsJson,
    })

    const result = await service.updateMessageCards('project-1', 'conversation-1', 'message-1', { cardsJson })

    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: 'message-1' },
      data: { cardsJson },
    })
    expect(result).toEqual({ id: 'message-1', cardsJson })
  })

  it('rejects updates for messages in another project or conversation', async () => {
    const prisma = createPrisma()
    const service = new ConversationsService(prisma as any)

    prisma.message.findUnique.mockResolvedValue({
      id: 'message-1',
      conversationId: 'conversation-2',
      conversation: {
        id: 'conversation-2',
        projectId: 'project-2',
      },
    })

    await expect(
      service.updateMessageCards('project-1', 'conversation-1', 'message-1', { cardsJson: '[]' }),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.message.update).not.toHaveBeenCalled()
  })

  it('throws when the target message does not exist', async () => {
    const prisma = createPrisma()
    const service = new ConversationsService(prisma as any)

    prisma.message.findUnique.mockResolvedValue(null)

    await expect(
      service.updateMessageCards('project-1', 'conversation-1', 'missing-message', { cardsJson: '[]' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('creates and updates a resumable assistant stream message', async () => {
    const prisma = createPrisma()
    const service = new ConversationsService(prisma as any)

    prisma.conversation.findUnique.mockResolvedValue({ id: 'conversation-1', projectId: 'project-1' })
    prisma.message.create.mockResolvedValue({
      id: 'assistant-1',
      conversationId: 'conversation-1',
      role: 'assistant',
      content: '',
      actionsJson: JSON.stringify({ __stream: { status: 'RUNNING', requestMessageId: 'user-1' } }),
    })
    prisma.message.findUnique.mockResolvedValue({
      id: 'assistant-1',
      conversationId: 'conversation-1',
      actionsJson: JSON.stringify({ __stream: { status: 'RUNNING', requestMessageId: 'user-1' } }),
      conversation: {
        id: 'conversation-1',
        projectId: 'project-1',
      },
    })
    prisma.message.update.mockResolvedValue({
      id: 'assistant-1',
      content: '正在生成',
      actionsJson: JSON.stringify({ __stream: { status: 'RUNNING', requestMessageId: 'user-1' } }),
    })
    prisma.conversation.update.mockResolvedValue({ id: 'conversation-1' })

    const draft = await service.createAssistantStreamMessage('project-1', 'conversation-1', {
      requestMessageId: 'user-1',
      message: '继续写',
      provider: 'mimo',
      conversationHistory: [{ role: 'user', content: '前文' }],
    })
    await service.updateAssistantStreamMessage('project-1', 'conversation-1', 'assistant-1', {
      content: '正在生成',
      status: 'RUNNING',
    })

    expect(draft.id).toBe('assistant-1')
    expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        role: 'assistant',
        content: '',
        conversationId: 'conversation-1',
        actionsJson: expect.stringContaining('"status":"RUNNING"'),
      }),
    }))
    expect(prisma.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'assistant-1' },
      data: expect.objectContaining({
        content: '正在生成',
        actionsJson: expect.stringContaining('"status":"RUNNING"'),
      }),
    }))
  })
})
