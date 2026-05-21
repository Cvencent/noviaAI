import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';

export enum CheckCategory {
  CHECK_CHARACTER = 'CHECK_CHARACTER',
  CHECK_TIMELINE = 'CHECK_TIMELINE',
  CHECK_WORLD = 'CHECK_WORLD',
  CHECK_PLOT = 'CHECK_PLOT',
  CHECK_RELATIONSHIP = 'CHECK_RELATIONSHIP',
  CHECK_GEOGRAPHY = 'CHECK_GEOGRAPHY',
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  NORMAL = 'NORMAL',
  MINOR = 'MINOR',
}

export class CreateCheckRuleDto {
  @IsEnum(CheckCategory)
  category: CheckCategory;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;
}

export class UpdateCheckRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;
}

export class ConsistencyCheckDto {
  @IsString()
  projectId: string;

  @IsString()
  @IsOptional()
  chapterId?: string;

  @IsString()
  content: string;

  @IsArray()
  @IsOptional()
  categories?: CheckCategory[];

  @IsBoolean()
  @IsOptional()
  incremental?: boolean;
}

export class BatchCreateRulesDto {
  @IsArray()
  rules: CreateCheckRuleDto[];
}
