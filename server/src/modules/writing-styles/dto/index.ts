import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator'

export class AnalyzeTextDto {
  @IsString()
  text: string

  @IsOptional()
  @IsString()
  context?: string
}

export class FuseStylesDto {
  @IsArray()
  @IsString({ each: true })
  styleIds: string[]

  @IsOptional()
  @IsArray()
  weights?: number[]
}

export class RewriteWithStyleDto {
  @IsString()
  text: string

  @IsArray()
  @IsString({ each: true })
  styleIds: string[]
}

export class DeepAnalyzeStyleDto {
  @IsString()
  styleId: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compareWith?: string[]
}

export class SaveCustomStyleDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsString()
  config: string

  @IsString()
  sourceType: string

  @IsOptional()
  @IsString()
  sourceData?: string
}

export class UpdateStyleTuningDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  dialogue_ratio: number

  @IsNumber()
  @Min(0)
  @Max(100)
  pacing: number

  @IsNumber()
  @Min(0)
  @Max(100)
  vocabulary_level: number

  @IsNumber()
  @Min(0)
  @Max(100)
  description_detail: number
}
