import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateConversationDto, CreateMessageDto, UpdateMessageCardsDto } from './dto'

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
}
