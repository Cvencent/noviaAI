import { IsString, IsOptional } from 'class-validator'

export class UpdateCharacterDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  role?: string

  @IsString()
  @IsOptional()
  appearance?: string

  @IsString()
  @IsOptional()
  personality?: string

  @IsString()
  @IsOptional()
  background?: string

  @IsString()
  @IsOptional()
  goals?: string

  @IsString()
  @IsOptional()
  flaws?: string

  @IsString()
  @IsOptional()
  arc?: string

  @IsString()
  @IsOptional()
  voice?: string

  @IsString()
  @IsOptional()
  notes?: string
}
