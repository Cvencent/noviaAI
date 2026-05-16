import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { CharactersService } from './characters.service'
import { CharactersController } from './characters.controller'

@Module({
  imports: [PrismaModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
