import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { CharactersModule } from './modules/characters/characters.module'
import { WorldSettingsModule } from './modules/world-settings/world-settings.module'
import { ChaptersModule } from './modules/chapters/chapters.module'
import { ScenesModule } from './modules/scenes/scenes.module'
import { AiModule } from './modules/ai/ai.module'
import { ApiKeysModule } from './modules/api-keys/api-keys.module'
import { AIConfigModule } from './modules/ai-config/ai-config.module'
import { ConsistencyCheckModule } from './modules/consistency-check/consistency-check.module'
import { UsageLogsModule } from './modules/usage-logs/usage-logs.module'
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module'
import { OutlinesModule } from './modules/outlines/outlines.module'
import { TurningPointsModule } from './modules/turning-points/turning-points.module'
import { TimelineModule } from './modules/timeline/timeline.module'
import { PlotsModule } from './modules/plots/plots.module'
import { WritingStylesModule } from './modules/writing-styles/writing-styles.module'
import { ConsistencyModule } from './modules/consistency/consistency.module'
import { DialogueSessionsModule } from './modules/dialogue-sessions/dialogue-sessions.module'
import { StorySystemModule } from './modules/story-system/story-system.module'
import { ReaderExperienceModule } from './modules/reader-experience/reader-experience.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    CharactersModule,
    WorldSettingsModule,
    ChaptersModule,
    AiModule,
    ApiKeysModule,
    AIConfigModule,
    ConsistencyCheckModule,
    UsageLogsModule,
    AiAssistantModule,
    OutlinesModule,
    TurningPointsModule,
    TimelineModule,
    ScenesModule,
    PlotsModule,
    WritingStylesModule,
    ConsistencyModule,
    DialogueSessionsModule,
    StorySystemModule,
    ReaderExperienceModule,
  ],
})
export class AppModule {}
