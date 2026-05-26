import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

export enum AIActionType {
  CREATE_CHARACTER = 'CREATE_CHARACTER',
  UPDATE_CHARACTER = 'UPDATE_CHARACTER',
  DELETE_CHARACTER = 'DELETE_CHARACTER',
  CREATE_WORLD_SETTING = 'CREATE_WORLD_SETTING',
  UPDATE_WORLD_SETTING = 'UPDATE_WORLD_SETTING',
  DELETE_WORLD_SETTING = 'DELETE_WORLD_SETTING',
  CREATE_CHAPTER = 'CREATE_CHAPTER',
  UPDATE_CHAPTER = 'UPDATE_CHAPTER',
  DELETE_CHAPTER = 'DELETE_CHAPTER',
  CREATE_PLOT = 'CREATE_PLOT',
  CREATE_OUTLINE = 'CREATE_OUTLINE',
  ADD_RELATIONSHIP = 'ADD_RELATIONSHIP',
  CREATE_SCENE = 'CREATE_SCENE',
  CREATE_TIMELINE_EVENT = 'CREATE_TIMELINE_EVENT',
  CREATE_TURNING_POINT = 'CREATE_TURNING_POINT',
  CREATE_CHEKHOVS_GUN = 'CREATE_CHEKHOVS_GUN'
}

export class ActionParameter {
  @IsString()
  name: string

  @IsString()
  value: string

  @IsOptional()
  @IsString()
  description?: string
}

export class AIActionRequest {
  @IsString()
  projectId: string

  @IsEnum(AIActionType)
  actionType: AIActionType

  @IsObject()
  parameters: Record<string, any>

  @IsOptional()
  @IsObject()
  context?: any

  @IsOptional()
  @IsBoolean()
  confirm?: boolean
}

export class AnalyzeRequest {
  @IsString()
  projectId: string

  @IsString()
  content: string

  @IsOptional()
  @IsObject()
  context?: any
}

export class AIActionResponse {
  @IsBoolean()
  success: boolean

  @IsEnum(AIActionType)
  actionType: AIActionType

  @IsOptional()
  result?: any

  @IsString()
  message: string

  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean

  @IsOptional()
  suggestion?: any
}
