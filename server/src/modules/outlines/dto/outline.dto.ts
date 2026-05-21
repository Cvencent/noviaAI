import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator'

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
