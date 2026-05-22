import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'

export class CreateDialogueSessionDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  characterIds: string[]

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsNotEmpty()
  conflict: string

  @IsString()
  @IsNotEmpty()
  goal: string

  @IsString()
  @IsOptional()
  mood?: string

  @IsBoolean()
  @IsOptional()
  allowSecretReveal?: boolean

  @IsString()
  @IsOptional()
  @IsIn(['short', 'medium', 'long'])
  length?: string
}

export class ContinueDialogueSessionDto {
  @IsString()
  @IsOptional()
  instruction?: string

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(3)
  rounds?: number
}
