import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { CharactersModule } from './modules/characters/characters.module'
import { WorldSettingsModule } from './modules/world-settings/world-settings.module'
import { ChaptersModule } from './modules/chapters/chapters.module'
import { AiModule } from './modules/ai/ai.module'
import { ApiKeysModule } from './modules/api-keys/api-keys.module'

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
  ],
})
export class AppModule {}
