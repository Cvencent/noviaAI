import { IsString, IsOptional, IsArray, IsInt, Min } from 'class-validator'

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsString()
  @IsOptional()
  status?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  wordCount?: number
}
