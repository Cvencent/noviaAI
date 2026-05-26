import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AIActionsService } from './ai-actions.service'
import { AIActionRequest, AIActionResponse, AnalyzeRequest } from './dto/ai-action.dto'

@Controller('ai-actions')
@UseGuards(JwtAuthGuard)
export class AIActionsController {
  constructor(private readonly aiActionsService: AIActionsService) {}

  @Post('execute')
  async executeAction(
    @CurrentUser() user: any,
    @Body() dto: AIActionRequest,
  ): Promise<AIActionResponse> {
    return this.aiActionsService.executeAction(dto.actionType, {
      ...dto,
      userId: user.id,
    })
  }

  @Post('analyze')
  async analyze(
    @CurrentUser() user: any,
    @Body() dto: AnalyzeRequest,
  ) {
    return this.aiActionsService.analyzeAndSuggestActions({
      projectId: dto.projectId,
      userId: user.id,
      content: dto.content,
      context: dto.context,
    })
  }
}
