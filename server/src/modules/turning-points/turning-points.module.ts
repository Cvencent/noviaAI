import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { TurningPointsService } from './turning-points.service'
import { TurningPointsController } from './turning-points.controller'

@Module({
  imports: [PrismaModule],
  controllers: [TurningPointsController],
  providers: [TurningPointsService],
  exports: [TurningPointsService],
})
export class TurningPointsModule {}
