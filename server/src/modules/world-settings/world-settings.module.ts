import { Module } from '@nestjs/common'
import { WorldSettingsController } from './world-settings.controller'
import { WorldSettingsService } from './world-settings.service'

@Module({
  controllers: [WorldSettingsController],
  providers: [WorldSettingsService],
  exports: [WorldSettingsService],
})
export class WorldSettingsModule {}
