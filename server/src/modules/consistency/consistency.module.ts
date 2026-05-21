import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { WritingConsistencyService } from './writing-consistency.service'

@Module({
  imports: [PrismaModule],
  providers: [WritingConsistencyService],
  exports: [WritingConsistencyService],
})
export class ConsistencyModule {}
