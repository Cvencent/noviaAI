import { IsOptional, IsString } from 'class-validator'

export class CreateMessageDto {
  @IsString()
  content: string

  @IsString()
  role: string

  @IsString()
  @IsOptional()
  actionsJson?: string

  @IsString()
  @IsOptional()
  cardsJson?: string
}

export class CreateAssistantStreamDto {
  @IsString()
  requestMessageId: string

  @IsString()
  message: string

  @IsString()
  @IsOptional()
  provider?: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  chapterContent?: string

  @IsString()
  @IsOptional()
  chapterTitle?: string

  @IsOptional()
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export class UpdateAssistantStreamDto {
  @IsString()
  content: string

  @IsString()
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'

  @IsString()
  @IsOptional()
  actionsJson?: string

  @IsString()
  @IsOptional()
  cardsJson?: string

  @IsString()
  @IsOptional()
  error?: string
}
