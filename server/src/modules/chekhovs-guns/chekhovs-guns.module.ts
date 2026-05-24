import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ChekhovsGunsService } from './chekhovs-guns.service'
import { ChekhovsGunsController } from './chekhovs-guns.controller'

@Module({
  imports: [PrismaModule],
  controllers: [ChekhovsGunsController],
  providers: [ChekhovsGunsService],
  exports: [ChekhovsGunsService],
})
export class ChekhovsGunsModule {}
