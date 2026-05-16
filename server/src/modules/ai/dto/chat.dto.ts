import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator'

export class ChatDto {
  @IsString()
  projectId: string

  @IsString()
  message: string

  @IsOptional()
  @IsArray()
  history?: Array<{ role: string; content: string }>

  @IsOptional()
  @IsEnum(['openai', 'claude'])
  provider?: 'openai' | 'claude'

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  temperature?: number
}
