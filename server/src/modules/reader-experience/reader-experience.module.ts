import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ReaderExperienceController } from './reader-experience.controller'
import { ReaderExperienceService } from './reader-experience.service'

@Module({
  imports: [PrismaModule],
  controllers: [ReaderExperienceController],
  providers: [ReaderExperienceService],
})
export class ReaderExperienceModule {}
