import { IsString, IsOptional, IsEnum } from 'class-validator'

export class GenerateSummaryDto {
  @IsString()
  projectId: string

  @IsOptional()
  @IsString()
  chapterId?: string

  @IsOptional()
  @IsEnum(['openai', 'claude', 'deepseek', 'mimo'])
  provider?: 'openai' | 'claude' | 'deepseek' | 'mimo'

  @IsOptional()
  @IsString()
  model?: string
}
