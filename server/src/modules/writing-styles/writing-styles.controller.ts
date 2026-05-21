import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { WritingStylesService } from './writing-styles.service'
import { StyleApplicationService } from './style-application.service'
import { 
  AnalyzeTextDto, 
  FuseStylesDto, 
  RewriteWithStyleDto, 
  DeepAnalyzeStyleDto,
  SaveCustomStyleDto 
} from './dto'

@Controller('writing-styles')
@UseGuards(JwtAuthGuard)
export class WritingStylesController {
  constructor(
    private writingStylesService: WritingStylesService,
    private styleApplicationService: StyleApplicationService
  ) {}

  @Post('analyze')
  async analyzeText(
    @Body() dto: AnalyzeTextDto,
    @CurrentUser() user: any
  ) {
    return this.writingStylesService.analyzeText(dto.text, user.id)
  }

  @Post('fuse')
  async fuseStyles(
    @Body() dto: FuseStylesDto,
    @CurrentUser() user: any
  ) {
    return this.writingStylesService.fuseStyles(dto.styleIds, user.id, dto.weights)
  }

  @Post('rewrite')
  async rewriteWithStyles(
    @Body() dto: RewriteWithStyleDto,
    @CurrentUser() user: any
  ) {
    return this.writingStylesService.rewriteWithStyles(dto.text, dto.styleIds, user.id)
  }

  @Post('deep-analyze')
  async deepAnalyzeStyle(
    @Body() dto: DeepAnalyzeStyleDto,
    @CurrentUser() user: any
  ) {
    return this.writingStylesService.deepAnalyzeStyle(dto.styleId, user.id, dto.compareWith)
  }

  @Get('custom')
  async getCustomStyles(@CurrentUser() user: any) {
    return this.writingStylesService.getCustomStyles(user.id)
  }

  @Post('custom')
  async saveCustomStyle(
    @Body() dto: SaveCustomStyleDto,
    @CurrentUser() user: any
  ) {
    return this.writingStylesService.saveCustomStyle(
      user.id,
      dto.name,
      dto.config,
      dto.sourceType,
      dto.description,
      dto.icon,
      dto.sourceData
    )
  }

  @Get('history')
  async getStyleHistory(
    @CurrentUser() user: any,
    @Query('projectId') projectId?: string
  ) {
    return this.writingStylesService.getStyleHistory(user.id, projectId)
  }

  @Post('record-action')
  async recordAction(
    @Body() body: { action: string; projectId?: string; styleId?: string; details?: string },
    @CurrentUser() user: any
  ) {
    return this.writingStylesService.recordStyleAction(
      user.id,
      body.action,
      body.projectId,
      body.styleId,
      body.details
    )
  }

  // 新增：项目风格配置相关API
  @Get('project/:projectId/config')
  async getProjectStyleConfig(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any
  ) {
    return this.styleApplicationService.getProjectStyleConfig(projectId)
  }

  @Post('project/:projectId/config')
  async saveProjectStyleConfig(
    @Param('projectId') projectId: string,
    @Body() config: any,
    @CurrentUser() user: any
  ) {
    return this.styleApplicationService.saveProjectStyleConfig(projectId, user.id, config)
  }

  @Post('project/:projectId/generate-prompt')
  async generateStylePrompt(
    @Param('projectId') projectId: string,
    @Body() body: { currentContent?: string },
    @CurrentUser() user: any
  ) {
    return this.styleApplicationService.generateMultiStageStylePrompt(
      projectId,
      user.id,
      body.currentContent
    )
  }
}
