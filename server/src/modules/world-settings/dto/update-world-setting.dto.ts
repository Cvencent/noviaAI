import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateWorldSettingItemDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsOptional()
  details?: any
}

export class UpdateWorldSettingDto {
  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateWorldSettingItemDto)
  @IsOptional()
  items?: UpdateWorldSettingItemDto[]
}
