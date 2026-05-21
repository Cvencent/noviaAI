import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator'

export class CreatePlotPointDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  type: string

  @IsString()
  @IsOptional()
  description?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class UpdatePlotPointDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  type?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsInt()
  @IsOptional()
  order?: number
}
