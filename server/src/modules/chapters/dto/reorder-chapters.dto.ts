import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator'

export class ReorderChaptersDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  chapterIds: string[]
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  content?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number
}
