import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { StorySystemService } from './story-system.service'
import {
  ContinueStoryAgentRunDto,
  CreateChapterCommitDto,
  StartStoryAgentRunDto,
  WriteChapterDto,
} from './dto'

@Controller('projects/:projectId')
@UseGuards(JwtAuthGuard)
export class StorySystemController {
  constructor(private readonly storySystemService: StorySystemService) {}

  @Post('chapters/:chapterId/story-system/contracts/refresh')
  refreshContracts(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.refreshChapterContracts(user.id, projectId, chapterId)
  }

  @Post('chapters/:chapterId/story-system/context-pack')
  buildContextPack(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.buildContextPack(user.id, projectId, chapterId)
  }

  @Post('chapters/:chapterId/story-system/preflight')
  preflight(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.preflight(user.id, projectId, chapterId)
  }

  @Get('chapters/:chapterId/story-system/health')
  health(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.getRuntimeHealth(user.id, projectId, chapterId)
  }

  @Post('chapters/:chapterId/story-system/review')
  review(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
    @Body('content') content?: string,
  ) {
    return this.storySystemService.reviewChapter(user.id, projectId, chapterId, content)
  }

  @Post('chapters/:chapterId/story-system/write')
  write(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: WriteChapterDto,
  ) {
    return this.storySystemService.writeChapter(user.id, projectId, chapterId, dto)
  }

  @Post('chapters/:chapterId/story-system/commits')
  createCommit(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateChapterCommitDto,
  ) {
    return this.storySystemService.createChapterCommit(user.id, projectId, chapterId, dto)
  }

  @Get('chapters/:chapterId/story-system/commits')
  listCommits(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.listCommits(user.id, projectId, chapterId)
  }

  @Post('chapters/:chapterId/story-system/agent-runs')
  startRun(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: StartStoryAgentRunDto,
  ) {
    return this.storySystemService.startAgentRun(user.id, projectId, chapterId, dto)
  }

  @Post('story-system/agent-runs/:runId/continue')
  continueRun(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @Body() dto: ContinueStoryAgentRunDto,
  ) {
    return this.storySystemService.continueAgentRun(user.id, projectId, runId, dto)
  }

  @Post('story-system/agent-runs/:runId/pause')
  pauseRun(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
  ) {
    return this.storySystemService.pauseAgentRun(user.id, projectId, runId)
  }

  @Post('story-system/agent-runs/:runId/resume')
  resumeRun(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
  ) {
    return this.storySystemService.resumeAgentRun(user.id, projectId, runId)
  }
}
