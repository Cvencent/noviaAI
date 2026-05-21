import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator'

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  subtitle?: string

  @IsString()
  @IsOptional()
  synopsis?: string

  @IsString()
  @IsNotEmpty()
  genre: string

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
