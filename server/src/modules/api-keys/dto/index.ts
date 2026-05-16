import { IsString, IsEnum, IsOptional } from 'class-validator'

export class CreateApiKeyDto {
  @IsEnum(['openai', 'claude'])
  provider: 'openai' | 'claude'

  @IsString()
  name: string

  @IsString()
  apiKey: string
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  apiKey?: string

  @IsOptional()
  isActive?: boolean
}
