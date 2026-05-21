import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { OutlinesService } from './outlines.service'
import { OutlinesController } from './outlines.controller'

@Module({
  imports: [PrismaModule],
  controllers: [OutlinesController],
  providers: [OutlinesService],
  exports: [OutlinesService],
})
export class OutlinesModule {}
