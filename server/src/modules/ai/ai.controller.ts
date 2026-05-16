import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator'
import { AiService } from './ai.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('complete')
  async complete(
    @CurrentUser() user: any,
    @Body()
    body: {
      projectId: string
      content: string
      provider?: 'openai' | 'claude'
      model?: string
      temperature?: number
      maxTokens?: number
    },
  ) {
    return this.aiService.complete({
      projectId: body.projectId,
      content: body.content,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    })
  }

  @Post('consistency-check')
  async consistencyCheck(
    @CurrentUser() user: any,
    @Body()
    body: {
      projectId: string
      content: string
      provider?: 'openai' | 'claude'
      model?: string
    },
  ) {
    return this.aiService.consistencyCheck({
      projectId: body.projectId,
      content: body.content,
      provider: body.provider,
      model: body.model,
    })
  }

  @Post('generate-summary')
  async generateSummary(
    @CurrentUser() user: any,
    @Body()
    body: {
      projectId: string
      chapterId?: string
      provider?: 'openai' | 'claude'
      model?: string
    },
  ) {
    return this.aiService.generateSummary({
      projectId: body.projectId,
      chapterId: body.chapterId,
      provider: body.provider,
      model: body.model,
    })
  }

  @Post('chat')
  async chat(
    @CurrentUser() user: any,
    @Body()
    body: {
      projectId: string
      message: string
      history?: Array<{ role: string; content: string }>
      provider?: 'openai' | 'claude'
      model?: string
      temperature?: number
    },
  ) {
    return this.aiService.chat({
      projectId: body.projectId,
      message: body.message,
      history: body.history,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
    })
  }
}
