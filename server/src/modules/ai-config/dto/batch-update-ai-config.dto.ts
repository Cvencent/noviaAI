import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAIConfigDto } from './create-ai-config.dto';

export class BatchUpdateAIConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  configs: ConfigItemDto[];
}

export class ConfigItemDto {
  action: string;
  config: CreateAIConfigDto;
}
