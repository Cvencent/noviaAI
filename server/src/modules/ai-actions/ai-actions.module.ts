import { Module } from '@nestjs/common'
import { AIActionsController } from './ai-actions.controller'
import { AIActionsService } from './ai-actions.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AIActionsController],
  providers: [AIActionsService],
  exports: [AIActionsService],
})
export class AIActionsModule {}
