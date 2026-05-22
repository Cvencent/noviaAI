import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator'

export class CreateOutlineDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  structureType?: string

  @IsString()
  @IsOptional()
  status?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class UpdateOutlineDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  structureType?: string

  @IsString()
  @IsOptional()
  status?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class CreateOutlineItemDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  parentId?: string

  @IsString()
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  goal?: string

  @IsString()
  @IsOptional()
  conflict?: string

  @IsString()
  @IsOptional()
  outcome?: string

  @IsString()
  @IsOptional()
  povCharacter?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsInt()
  @IsOptional()
  estimatedWords?: number

  @IsInt()
  @IsOptional()
  order?: number
}

export class UpdateOutlineItemDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  parentId?: string

  @IsString()
  @IsOptional()
  summary?: string

  @IsString()
  @IsOptional()
  goal?: string

  @IsString()
  @IsOptional()
  conflict?: string

  @IsString()
  @IsOptional()
  outcome?: string

  @IsString()
  @IsOptional()
  povCharacter?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsInt()
  @IsOptional()
  estimatedWords?: number

  @IsInt()
  @IsOptional()
  order?: number
}

export class ReorderOutlineItemsDto {
  @IsString({ each: true })
  itemIds: string[]
}

export class GenerateOutlineDto {
  @IsString()
  @IsOptional()
  premise?: string

  @IsString()
  @IsOptional()
  @IsIn(['THREE_ACT', 'HERO_JOURNEY', 'KISHOTENKETSU', 'SAVE_THE_CAT', 'SEVEN_POINT'])
  structureTemplate?: string

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(80)
  chapterCount?: number

  @IsInt()
  @IsOptional()
  @Min(500)
  targetWords?: number
}
