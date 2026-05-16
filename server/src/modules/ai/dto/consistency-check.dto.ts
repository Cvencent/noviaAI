import { IsString, IsOptional, IsEnum } from 'class-validator'

export class ConsistencyCheckDto {
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
}
