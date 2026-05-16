import { IsString, IsNotEmpty } from 'class-validator'

export class AddSummaryDto {
  @IsString()
  @IsNotEmpty()
  summary: string
}
