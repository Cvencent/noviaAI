import { Module } from '@nestjs/common'
import { WorldSettingsController } from './world-settings.controller'
import { WorldSettingsService } from './world-settings.service'
import { WorldConflictDetectorService } from './world-conflict-detector.service'
import { WorldElementExtractorService } from './world-element-extractor.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [WorldSettingsController],
  providers: [
    WorldSettingsService,
    WorldConflictDetectorService,
    WorldElementExtractorService,
  ],
  exports: [
    WorldSettingsService,
    WorldConflictDetectorService,
    WorldElementExtractorService,
  ],
})
export class WorldSettingsModule {}
