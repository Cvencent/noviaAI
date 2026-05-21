import { IsString, IsOptional, IsInt, Min } from 'class-validator'

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  subtitle?: string

  @IsString()
  @IsOptional()
  synopsis?: string

  @IsString()
  @IsOptional()
  genre?: string

  @IsString()
  @IsOptional()
  tags?: string

  @IsString()
  @IsOptional()
  status?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  wordCount?: number
}
