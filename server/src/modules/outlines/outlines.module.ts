import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { OutlinesService } from './outlines.service'
import { OutlinesController } from './outlines.controller'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [OutlinesController],
  providers: [OutlinesService],
  exports: [OutlinesService],
})
export class OutlinesModule {}
