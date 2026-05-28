import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateAssistantStreamDto, CreateConversationDto, CreateMessageDto, UpdateAssistantStreamDto, UpdateMessageCardsDto } from './dto'

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createConversationDto: CreateConversationDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        ...createConversationDto,
        projectId,
      },
    })

    return conversation
  }

  async findAll(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const conversations = await this.prisma.conversation.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    })

    return conversations
  }

  async findOne(projectId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    })

    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }

    if (conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此会话')
    }

    return conversation
  }

  async update(projectId: string, conversationId: string, updateData: Partial<CreateConversationDto>) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }

    if (conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限修改此会话')
    }

    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
    })

    return updatedConversation
  }

  async remove(projectId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }

    if (conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限删除此会话')
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    })

    return { message: '会话已删除' }
  }

  async addMessage(projectId: string, conversationId: string, createMessageDto: CreateMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }

    if (conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此会话')
    }

    const message = await this.prisma.message.create({
      data: {
        ...createMessageDto,
        conversationId,
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return message
  }

  async getMessages(projectId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }

    if (conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此会话')
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    })

    return messages
  }

  async updateMessageCards(
    projectId: string,
    conversationId: string,
    messageId: string,
    updateMessageCardsDto: UpdateMessageCardsDto,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    })

    if (!message) {
      throw new NotFoundException('消息不存在')
    }

    if (message.conversationId !== conversationId || message.conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限修改此消息')
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        cardsJson: updateMessageCardsDto.cardsJson,
      },
    })
  }

  async createAssistantStreamMessage(
    projectId: string,
    conversationId: string,
    streamDto: CreateAssistantStreamDto,
  ) {
    await this.verifyConversationAccess(projectId, conversationId)

    const message = await this.prisma.message.create({
      data: {
        role: 'assistant',
        content: '',
        conversationId,
        actionsJson: JSON.stringify({
          __stream: {
            status: 'RUNNING',
            requestMessageId: streamDto.requestMessageId,
            request: {
              message: streamDto.message,
              provider: streamDto.provider,
              chapterId: streamDto.chapterId,
              chapterContent: streamDto.chapterContent,
              chapterTitle: streamDto.chapterTitle,
              conversationHistory: streamDto.conversationHistory || [],
            },
            updatedAt: new Date().toISOString(),
          },
        }),
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return message
  }

  async updateAssistantStreamMessage(
    projectId: string,
    conversationId: string,
    messageId: string,
    updateDto: UpdateAssistantStreamDto,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    })

    if (!message) {
      throw new NotFoundException('消息不存在')
    }

    if (message.conversationId !== conversationId || message.conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限修改此消息')
    }

    const previousStreamState = this.parseStreamState(message.actionsJson)
    const nextActionsJson = updateDto.actionsJson || JSON.stringify({
      __stream: {
        ...(previousStreamState || {}),
        status: updateDto.status,
        error: updateDto.error,
        updatedAt: new Date().toISOString(),
      },
    })

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: updateDto.content,
        actionsJson: nextActionsJson,
        cardsJson: updateDto.cardsJson,
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return updated
  }

  private async verifyConversationAccess(projectId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }

    if (conversation.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此会话')
    }

    return conversation
  }

  private parseStreamState(actionsJson?: string | null) {
    if (!actionsJson) return null
    try {
      const parsed = JSON.parse(actionsJson)
      return parsed?.__stream || null
    } catch {
      return null
    }
  }

  async getAllCards(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    // 直接查询所有有卡片的消息，按时间倒序
    const messages = await this.prisma.message.findMany({
      where: {
        cardsJson: { not: null },
        conversation: { projectId },
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    const allCards: Array<{
      card: any
      conversationId: string
      conversationTitle: string
      conversationType: string
      messageId: string
      messageContent: string
      messageTimestamp: Date
    }> = []

    for (const message of messages) {
      if (!message.cardsJson) continue
      try {
        const cards = JSON.parse(message.cardsJson as string)
        if (!Array.isArray(cards)) continue
        for (const card of cards) {
          allCards.push({
            card,
            conversationId: message.conversation.id,
            conversationTitle: message.conversation.title,
            conversationType: message.conversation.type,
            messageId: message.id,
            messageContent: message.content.slice(0, 200),
            messageTimestamp: message.timestamp,
          })
        }
      } catch {
        // skip invalid JSON
      }
    }

    return allCards
  }
}
