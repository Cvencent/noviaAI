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
