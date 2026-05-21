import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator'

export class CreateSceneDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  timePeriod?: string

  @IsString()
  @IsOptional()
  characters?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number
}

export class UpdateSceneDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  timePeriod?: string

  @IsString()
  @IsOptional()
  characters?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number
}

export class ReorderScenesDto {
  @IsString({ each: true })
  sceneIds: string[]
}
