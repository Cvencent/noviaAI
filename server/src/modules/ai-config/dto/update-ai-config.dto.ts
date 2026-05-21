import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { AIProvider } from './create-ai-config.dto';

export class UpdateAIConfigDto {
  @IsEnum(AIProvider)
  @IsOptional()
  provider?: AIProvider;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  apiKeyId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
