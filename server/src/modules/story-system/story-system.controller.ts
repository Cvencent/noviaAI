import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { StorySystemService } from './story-system.service'
import {
  ContinueStoryAgentRunDto,
  CreateChapterCommitDto,
  DismissRepairPlanDto,
  ExportBookDto,
  FullBookAiReviewDto,
  GeneratePublishingAssetsDto,
  RepairChapterDto,
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

  @Post('chapters/:chapterId/story-system/repair')
  repair(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: RepairChapterDto,
  ) {
    return this.storySystemService.repairChapter(user.id, projectId, chapterId, dto)
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

  @Get('chapters/:chapterId/story-system/review-reports')
  listReviewReports(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.listReviewReports(user.id, projectId, chapterId)
  }

  @Get('chapters/:chapterId/story-system/repair-plans')
  listRepairPlans(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.storySystemService.listRepairPlans(user.id, projectId, chapterId)
  }

  @Post('chapters/:chapterId/story-system/repair-plans/:repairPlanId/dismiss')
  dismissRepairPlan(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('chapterId') chapterId: string,
    @Param('repairPlanId') repairPlanId: string,
    @Body() dto: DismissRepairPlanDto,
  ) {
    return this.storySystemService.dismissRepairPlan(user.id, projectId, chapterId, repairPlanId, dto)
  }

  @Get('story-graph/entities')
  listGraphEntities(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.storySystemService.listGraphEntities(user.id, projectId)
  }

  @Get('story-graph/entities/:entityId')
  getGraphEntity(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('entityId') entityId: string,
  ) {
    return this.storySystemService.getGraphEntity(user.id, projectId, entityId)
  }

  @Get('story-graph/open-loops')
  listOpenLoops(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.storySystemService.listOpenLoops(user.id, projectId)
  }

  @Get('story-graph/world-facts')
  listWorldFacts(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.storySystemService.listWorldFacts(user.id, projectId)
  }

  @Get('story-graph/path')
  findGraphPath(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.storySystemService.findGraphPath(user.id, projectId, from, to)
  }

  @Post('story-system/projections/rebuild')
  rebuildProjections(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.storySystemService.rebuildProjections(user.id, projectId)
  }

  @Get('story-system/full-book-review')
  reviewFullBook(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.storySystemService.reviewFullBook(user.id, projectId)
  }

  @Post('story-system/export')
  exportBook(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: ExportBookDto,
  ) {
    return this.storySystemService.exportBook(user.id, projectId, dto)
  }

  @Post('story-system/publishing-assets')
  generatePublishingAssets(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: GeneratePublishingAssetsDto,
  ) {
    return this.storySystemService.generatePublishingAssets(user.id, projectId, dto)
  }

  @Post('story-system/full-book-ai-review')
  reviewFullBookWithAi(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: FullBookAiReviewDto,
  ) {
    return this.storySystemService.reviewFullBookWithAi(user.id, projectId, dto)
  }

  @Get('story-system/publish-checklist')
  getPublishChecklist(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.storySystemService.getPublishChecklist(user.id, projectId)
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
