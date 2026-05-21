import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator'

export class CreateTurningPointDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  type?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  impact?: string

  @IsString()
  @IsOptional()
  emotionalShift?: string

  @IsString()
  @IsOptional()
  position?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class UpdateTurningPointDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  type?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  impact?: string

  @IsString()
  @IsOptional()
  emotionalShift?: string

  @IsString()
  @IsOptional()
  position?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class ReorderTurningPointsDto {
  @IsString({ each: true })
  turningPointIds: string[]
}
