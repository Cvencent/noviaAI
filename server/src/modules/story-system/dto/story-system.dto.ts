import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export enum StoryAgentMode {
  FULL_WRITE = 'FULL_WRITE',
  REVIEW_ONLY = 'REVIEW_ONLY',
  EXTRACT_ONLY = 'EXTRACT_ONLY',
}

export enum StoryAgentStepType {
  CONTEXT = 'CONTEXT',
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  EXTRACT = 'EXTRACT',
  COMMIT = 'COMMIT',
}

export class StartStoryAgentRunDto {
  @IsEnum(StoryAgentMode)
  @IsOptional()
  mode?: StoryAgentMode | string

  @IsString()
  @IsOptional()
  instruction?: string
}

export class ContinueStoryAgentRunDto {
  @IsEnum(StoryAgentStepType)
  @IsOptional()
  stopAfterStep?: StoryAgentStepType | string

  @IsNumber()
  @IsOptional()
  maxSteps?: number
}

export class ReviewIssueDto {
  @IsString()
  @IsOptional()
  severity?: string

  @IsString()
  @IsOptional()
  message?: string

  @IsOptional()
  blocking?: boolean
}

export class StoryReviewResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewIssueDto)
  @IsOptional()
  issues?: ReviewIssueDto[]
}

export class StoryExtractionResultDto {
  @IsArray()
  @IsOptional()
  acceptedEvents?: unknown[]

  @IsArray()
  @IsOptional()
  stateDeltas?: unknown[]

  @IsArray()
  @IsOptional()
  worldFacts?: unknown[]

  @IsArray()
  @IsOptional()
  entityDeltas?: unknown[]

  @IsArray()
  @IsOptional()
  openLoops?: unknown[]

  @IsArray()
  @IsOptional()
  entities?: unknown[]

  @IsArray()
  @IsOptional()
  relations?: unknown[]

  @IsString()
  @IsOptional()
  summaryText?: string
}

export class RepairChapterDto {
  @IsString()
  content!: string

  @IsString()
  @IsOptional()
  instruction?: string

  @IsString()
  @IsOptional()
  repairPlanId?: string
}

export class DismissRepairPlanDto {
  @IsString()
  overrideReason!: string
}

export class CreateChapterCommitDto {
  @IsString()
  content!: string

  @IsString()
  @IsOptional()
  runId?: string

  @ValidateNested()
  @Type(() => StoryReviewResultDto)
  @IsOptional()
  reviewResult?: StoryReviewResultDto

  @ValidateNested()
  @Type(() => StoryExtractionResultDto)
  @IsOptional()
  extractionResult?: StoryExtractionResultDto
}

export class WriteChapterDto {
  @IsString()
  @IsOptional()
  content?: string

  @IsString()
  @IsOptional()
  instruction?: string

  @IsNumber()
  @IsOptional()
  temperature?: number

  @IsNumber()
  @IsOptional()
  maxTokens?: number
}
