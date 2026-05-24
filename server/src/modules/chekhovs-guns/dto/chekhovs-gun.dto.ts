import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator'

export class CreateChekhovsGunDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsString()
  @IsNotEmpty()
  setupText: string

  @IsString()
  @IsOptional()
  setupChapterId?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  setupPosition?: number

  @IsString()
  @IsOptional()
  status?: string

  @IsString()
  @IsOptional()
  payoffText?: string

  @IsString()
  @IsOptional()
  payoffChapterId?: string

  @IsString()
  @IsOptional()
  importance?: string

  @IsString()
  @IsOptional()
  tags?: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateChekhovsGunDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  setupText?: string

  @IsString()
  @IsOptional()
  setupChapterId?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  setupPosition?: number

  @IsString()
  @IsOptional()
  status?: string

  @IsString()
  @IsOptional()
  payoffText?: string

  @IsString()
  @IsOptional()
  payoffChapterId?: string

  @IsString()
  @IsOptional()
  importance?: string

  @IsString()
  @IsOptional()
  tags?: string

  @IsString()
  @IsOptional()
  notes?: string
}
