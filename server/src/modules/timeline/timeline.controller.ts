import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { TimelineService } from './timeline.service'
import {
  CreateTimelineEventDto,
  UpdateTimelineEventDto,
  ReorderTimelineEventsDto,
} from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/timeline')
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createTimelineEventDto: CreateTimelineEventDto,
  ) {
    return this.timelineService.create(user.id, projectId, createTimelineEventDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.timelineService.findAll(user.id, projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.timelineService.findOne(user.id, projectId, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTimelineEventDto: UpdateTimelineEventDto,
  ) {
    return this.timelineService.update(user.id, projectId, id, updateTimelineEventDto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.timelineService.remove(user.id, projectId, id)
  }

  @Put('reorder')
  async reorder(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() reorderDto: ReorderTimelineEventsDto,
  ) {
    return this.timelineService.reorder(user.id, projectId, reorderDto)
  }
}
