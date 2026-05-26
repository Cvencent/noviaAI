import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { CreateConversationDto, CreateMessageDto, UpdateMessageCardsDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('projects/:projectId/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Param('projectId') projectId: string, @Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(projectId, createConversationDto)
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.conversationsService.findAll(projectId)
  }

  @Get(':id')
  async findOne(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.conversationsService.findOne(projectId, id)
  }

  @Put(':id')
  async update(@Param('projectId') projectId: string, @Param('id') id: string, @Body() updateData: Partial<CreateConversationDto>) {
    return this.conversationsService.update(projectId, id, updateData)
  }

  @Delete(':id')
  async remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.conversationsService.remove(projectId, id)
  }

  @Post(':id/messages')
  async addMessage(
    @Param('projectId') projectId: string,
    @Param('id') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.conversationsService.addMessage(projectId, conversationId, createMessageDto)
  }

  @Get(':id/messages')
  async getMessages(@Param('projectId') projectId: string, @Param('id') conversationId: string) {
    return this.conversationsService.getMessages(projectId, conversationId)
  }

  @Patch(':id/messages/:messageId/cards')
  async updateMessageCards(
    @Param('projectId') projectId: string,
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() updateMessageCardsDto: UpdateMessageCardsDto,
  ) {
    return this.conversationsService.updateMessageCards(projectId, conversationId, messageId, updateMessageCardsDto)
  }
}
