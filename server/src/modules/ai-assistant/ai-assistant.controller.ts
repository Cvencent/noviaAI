import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AiAssistantService } from './ai-assistant.service'

export class ProcessMessageDto {
  @IsString()
  @IsNotEmpty()
  projectId: string

  @IsString()
  @IsNotEmpty()
  message: string

  @IsString()
  @IsOptional()
  provider?: 'openai' | 'claude' | 'deepseek' | 'mimo'

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  chapterContent?: string

  @IsString()
  @IsOptional()
  chapterTitle?: string

  @IsArray()
  @IsOptional()
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  async processMessage(
    @CurrentUser() user: any,
    @Body() dto: ProcessMessageDto,
  ) {
    return this.aiAssistantService.processMessage(
      user.id,
      dto.projectId,
      dto.message,
      dto.provider,
      dto.chapterId,
      dto.chapterContent,
      dto.chapterTitle,
      dto.conversationHistory,
    )
  }

  @Post('chat-stream')
  async processMessageStream(
    @CurrentUser() user: any,
    @Body() dto: ProcessMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    try {
      for await (const chunk of this.aiAssistantService.processMessageStream(
        user.id,
        dto.projectId,
        dto.message,
        dto.provider,
        dto.chapterId,
        dto.chapterContent,
        dto.chapterTitle,
        dto.conversationHistory,
      )) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        ;(res as any).flush?.()
      }
      res.write('data: [DONE]\n\n')
      ;(res as any).flush?.()
      ;(res as any).flush?.()
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message || 'AI 助手请求失败' })}\n\n`)
      res.write('data: [DONE]\n\n')
    } finally {
      res.end()
    }
  }
}
