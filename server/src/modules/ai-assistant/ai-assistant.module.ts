import { Module } from '@nestjs/common'
import { AiAssistantController } from './ai-assistant.controller'
import { AiAssistantService } from './ai-assistant.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { CharactersModule } from '../characters/characters.module'
import { WorldSettingsModule } from '../world-settings/world-settings.module'
import { AiModule } from '../ai/ai.module'
import { StorySystemModule } from '../story-system/story-system.module'

@Module({
  imports: [
    PrismaModule,
    CharactersModule,
    WorldSettingsModule,
    AiModule,
    StorySystemModule,
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
