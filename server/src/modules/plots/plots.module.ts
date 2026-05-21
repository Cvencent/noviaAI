import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { PlotsService } from './plots.service'
import { PlotsController } from './plots.controller'

@Module({
  imports: [PrismaModule],
  controllers: [PlotsController],
  providers: [PlotsService],
  exports: [PlotsService],
})
export class PlotsModule {}
