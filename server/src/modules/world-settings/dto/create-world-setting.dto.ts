import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateWorldSettingItemDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsOptional()
  details?: any
}

export class CreateWorldSettingDto {
  @IsString()
  @IsNotEmpty()
  category: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorldSettingItemDto)
  @IsOptional()
  items?: CreateWorldSettingItemDto[]
}
