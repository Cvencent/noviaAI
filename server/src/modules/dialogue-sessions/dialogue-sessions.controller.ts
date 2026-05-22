import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { DialogueSessionsService } from './dialogue-sessions.service'
import { ContinueDialogueSessionDto, CreateDialogueSessionDto } from './dto'

@Controller('projects/:projectId/dialogue-sessions')
@UseGuards(JwtAuthGuard)
export class DialogueSessionsController {
  constructor(private readonly dialogueSessionsService: DialogueSessionsService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreateDialogueSessionDto,
  ) {
    return this.dialogueSessionsService.create(user.id, projectId, dto)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Query('chapterId') chapterId?: string,
  ) {
    return this.dialogueSessionsService.findAll(user.id, projectId, chapterId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.dialogueSessionsService.findOne(user.id, projectId, id)
  }

  @Post(':id/continue')
  async continueSession(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: ContinueDialogueSessionDto,
  ) {
    return this.dialogueSessionsService.continueSession(user.id, projectId, id, dto)
  }

  @Post(':id/pause')
  async pause(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.dialogueSessionsService.pause(user.id, projectId, id)
  }

  @Post(':id/resume')
  async resume(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.dialogueSessionsService.resume(user.id, projectId, id)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.dialogueSessionsService.remove(user.id, projectId, id)
  }
}
