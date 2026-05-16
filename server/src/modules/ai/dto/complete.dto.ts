import { IsString, IsOptional, IsEnum } from 'class-validator'

export class CompleteDto {
  @IsString()
  projectId: string

  @IsString()
  content: string

  @IsOptional()
  @IsEnum(['openai', 'claude'])
  provider?: 'openai' | 'claude'

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  temperature?: number

  @IsOptional()
  maxTokens?: number
}
