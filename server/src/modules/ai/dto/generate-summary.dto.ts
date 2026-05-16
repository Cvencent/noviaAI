import { IsString, IsOptional, IsEnum } from 'class-validator'

export class GenerateSummaryDto {
  @IsString()
  projectId: string

  @IsOptional()
  @IsString()
  chapterId?: string

  @IsOptional()
  @IsEnum(['openai', 'claude'])
  provider?: 'openai' | 'claude'

  @IsOptional()
  @IsString()
  model?: string
}
