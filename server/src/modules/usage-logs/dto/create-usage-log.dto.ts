import { IsString, IsOptional, IsNumber } from 'class-validator'

export class CreateUsageLogDto {
  @IsString()
  apiKeyId: string

  @IsString()
  endpoint: string

  @IsString()
  method: string

  @IsOptional()
  @IsNumber()
  statusCode?: number

  @IsOptional()
  @IsString()
  requestBody?: string

  @IsOptional()
  @IsString()
  responseBody?: string

  @IsOptional()
  @IsNumber()
  tokensUsed?: number

  @IsOptional()
  @IsNumber()
  cost?: number

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @IsString()
  promptContent?: string

  @IsOptional()
  @IsString()
  responseContent?: string

  @IsOptional()
  @IsNumber()
  promptTokens?: number

  @IsOptional()
  @IsNumber()
  responseTokens?: number

  @IsOptional()
  @IsNumber()
  duration?: number

  @IsOptional()
  @IsString()
  ipAddress?: string

  @IsOptional()
  @IsString()
  userAgent?: string
}
