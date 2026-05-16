import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, Min } from 'class-validator'

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  subtitle?: string

  @IsString()
  @IsNotEmpty()
  synopsis: string

  @IsString()
  @IsNotEmpty()
  genre: string

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
