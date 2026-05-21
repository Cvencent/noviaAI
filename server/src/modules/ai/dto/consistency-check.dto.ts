import { IsString, IsOptional, IsEnum } from 'class-validator'

export class ConsistencyCheckDto {
  @IsString()
  projectId: string

  @IsString()
  content: string

  @IsOptional()
  @IsEnum(['openai', 'claude', 'deepseek', 'mimo'])
  provider?: 'openai' | 'claude' | 'deepseek' | 'mimo'

  @IsOptional()
  @IsString()
  model?: string
}
