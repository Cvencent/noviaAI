import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator'

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number

  @IsString()
  @IsOptional()
  status?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  wordCount?: number

  @IsString()
  @IsOptional()
  summary?: string
}
