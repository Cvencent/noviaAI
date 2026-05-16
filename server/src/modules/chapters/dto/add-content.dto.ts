import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator'

export class AddContentDto {
  @IsString()
  @IsNotEmpty()
  content: string

  @IsInt()
  @Min(0)
  order: number
}
