import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AiService } from './ai.service'
import { ContextBuilderService } from './context-builder.service'
import { ChatDto, ConsistencyCheckDto, ContextPreviewQueryDto, GenerateSummaryDto, CompleteDto } from './dto'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly contextBuilderService: ContextBuilderService,
  ) {}

  @Get('context-preview/:projectId')
  async getContextPreview(
    @Param('projectId') projectId: string,
    @Query() query: ContextPreviewQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.contextBuilderService.buildContextPreview(projectId, user.id, query)
  }

  @Post('chat')
  async chat(@CurrentUser() user: any, @Body() dto: ChatDto) {
    return this.aiService.chat(user.id, dto)
  }

  @Post('consistency-check')
  async consistencyCheck(@CurrentUser() user: any, @Body() dto: ConsistencyCheckDto) {
    return this.aiService.consistencyCheck(user.id, dto)
  }

  @Post('generate-summary')
  async generateSummary(@CurrentUser() user: any, @Body() dto: GenerateSummaryDto) {
    return this.aiService.generateSummary(user.id, dto)
  }

  @Post('text-complete')
  async textComplete(@CurrentUser() user: any, @Body() dto: CompleteDto) {
    return this.aiService.textComplete(user.id, dto)
  }

  @Post('text-complete-stream')
  async textCompleteStream(@CurrentUser() user: any, @Body() dto: CompleteDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    try {
      for await (const token of this.aiService.textCompleteStream(user.id, dto)) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      }
      res.write('data: [DONE]\n\n')
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message || '文本续写失败' })}\n\n`)
      res.write('data: [DONE]\n\n')
    } finally {
      res.end()
    }
  }
}
