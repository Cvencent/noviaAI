import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum AIAction {
  TEXT_COMPLETION = 'TEXT_COMPLETION',      // 文本续写
  CONSISTENCY_CHECK = 'CONSISTENCY_CHECK',  // 一致性检查
  SUMMARY_GENERATION = 'SUMMARY_GENERATION', // 摘要生成
  CHARACTER_GENERATION = 'CHARACTER_GENERATION', // 人物生成
  WORLD_BUILDING = 'WORLD_BUILDING',        // 世界观构建
  PLOT_SUGGESTION = 'PLOT_SUGGESTION',      // 情节建议
  DIALOGUE_GENERATION = 'DIALOGUE_GENERATION', // 对话生成
  POLISH_REVISION = 'POLISH_REVISION',      // 润色修改
}

export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  DEEPSEEK = 'deepseek',
  MIMO = 'mimo',
}

export class CreateAIConfigDto {
  @IsEnum(AIProvider)
  provider: AIProvider;

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
