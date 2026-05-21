import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator'

export class CreateTimelineEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  eventDate?: string

  @IsString()
  @IsOptional()
  timeLabel?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  characters?: string

  @IsString()
  @IsOptional()
  importance?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class UpdateTimelineEventDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  chapterId?: string

  @IsString()
  @IsOptional()
  eventDate?: string

  @IsString()
  @IsOptional()
  timeLabel?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  characters?: string

  @IsString()
  @IsOptional()
  importance?: string

  @IsInt()
  @IsOptional()
  order?: number
}

export class ReorderTimelineEventsDto {
  @IsString({ each: true })
  eventIds: string[]
}
