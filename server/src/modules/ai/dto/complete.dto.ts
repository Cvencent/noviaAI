import { IsString, IsOptional, IsEnum } from 'class-validator'

export class CompleteDto {
  @IsString()
  projectId: string

  @IsOptional()
  @IsString()
  chapterId?: string

  @IsString()
  content: string

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
}
