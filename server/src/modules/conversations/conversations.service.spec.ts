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
})
