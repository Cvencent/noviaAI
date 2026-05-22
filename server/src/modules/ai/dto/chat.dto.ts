import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator'
import { AIAction } from '../../ai-config/dto/create-ai-config.dto'

export class ChatDto {
  @IsString()
  projectId: string

  @IsString()
  message: string

  @IsOptional()
  @IsArray()
  history?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>

  @IsOptional()
  @IsEnum(['openai', 'claude', 'deepseek', 'mimo'])
  provider?: 'openai' | 'claude' | 'deepseek' | 'mimo'

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  temperature?: number

  @IsOptional()
  maxTokens?: number

  @IsOptional()
  @IsEnum(AIAction)
  action?: AIAction
}
