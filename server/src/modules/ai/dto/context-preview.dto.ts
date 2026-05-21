import { IsOptional, IsString } from 'class-validator'

export class ContextPreviewQueryDto {
  @IsOptional()
  @IsString()
  chapterId?: string

  @IsOptional()
  @IsString()
  currentText?: string
}
