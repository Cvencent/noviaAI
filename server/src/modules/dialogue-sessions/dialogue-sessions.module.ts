import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AiModule } from '../ai/ai.module'
import { DialogueSessionsController } from './dialogue-sessions.controller'
import { DialogueSessionsService } from './dialogue-sessions.service'

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [DialogueSessionsController],
  providers: [DialogueSessionsService],
  exports: [DialogueSessionsService],
})
export class DialogueSessionsModule {}
