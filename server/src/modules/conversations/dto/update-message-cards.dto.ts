import { IsString } from 'class-validator'

export class UpdateMessageCardsDto {
  @IsString()
  cardsJson: string
}
