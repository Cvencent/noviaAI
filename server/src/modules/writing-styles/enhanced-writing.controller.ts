import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { EnhancedWritingService } from './enhanced-writing.service'

@Controller('enhanced-writing')
@UseGuards(JwtAuthGuard)
export class EnhancedWritingController {
  constructor(private enhancedWritingService: EnhancedWritingService) {}

  @Post('show-dont-tell')
  async showDontTell(
    @Body() body: {
      text: string
      provider?: 'openai' | 'claude' | 'mimo' | 'deepseek'
      model?: string
      temperature?: number
    },
    @CurrentUser() user: { id: string }
  ) {
    return this.enhancedWritingService.showDontTell(body.text, user.id, body)
  }

  @Post('enhance-description')
  async enhanceDescription(
    @Body() body: {
      text: string
      provider?: 'openai' | 'claude' | 'mimo' | 'deepseek'
      model?: string
      temperature?: number
      focus?: 'visual' | 'sensory' | 'emotional' | 'atmosphere'
      detailLevel?: 'light' | 'medium' | 'rich'
    },
    @CurrentUser() user: { id: string }
  ) {
    return this.enhancedWritingService.enhanceDescription(body.text, user.id, body)
  }

  @Post('rewrite')
  async rewrite(
    @Body() body: {
      text: string
      provider?: 'openai' | 'claude' | 'mimo' | 'deepseek'
      model?: string
      temperature?: number
      style?: 'vivid' | 'literary' | 'concise' | 'dramatic' | 'poetic'
      tone?: 'casual' | 'formal' | 'humorous' | 'serious'
    },
    @CurrentUser() user: { id: string }
  ) {
    return this.enhancedWritingService.rewrite(body.text, user.id, body)
  }

  @Post('brainstorm')
  async brainstorm(
    @Body() body: {
      prompt: string
      provider?: 'openai' | 'claude' | 'mimo' | 'deepseek'
      model?: string
      temperature?: number
      type?: 'plot' | 'character' | 'dialogue' | 'worldbuilding' | 'conflict'
      count?: number
    },
    @CurrentUser() user: { id: string }
  ) {
    return this.enhancedWritingService.brainstorm(body.prompt, user.id, body)
  }

  @Post('generate-dialogue')
  async generateDialogue(
    @Body() body: {
      context: string
      characterNames: string[]
      provider?: 'openai' | 'claude' | 'mimo' | 'deepseek'
      model?: string
      temperature?: number
    },
    @CurrentUser() user: { id: string }
  ) {
    return this.enhancedWritingService.generateDialogue(body.context, body.characterNames, user.id, body)
  }
}
