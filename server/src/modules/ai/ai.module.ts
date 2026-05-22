import { Module, forwardRef } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ContextBuilderService } from './context-builder.service'
import { OpenaiProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { DeepseekProvider } from './providers/deepseek.provider'
import { MimoProvider } from './providers/mimo.provider'
import { UsageLogsModule } from '../usage-logs/usage-logs.module'
import { ApiKeysModule } from '../api-keys/api-keys.module'
import { AIConfigModule } from '../ai-config/ai-config.module'
import { WritingStylesModule } from '../writing-styles/writing-styles.module'
import { CharactersModule } from '../characters/characters.module'
import { StorySystemModule } from '../story-system/story-system.module'

@Module({
  imports: [
    PrismaModule,
    UsageLogsModule,
    ApiKeysModule,
    AIConfigModule,
    WritingStylesModule,
    forwardRef(() => CharactersModule),
    forwardRef(() => StorySystemModule),
  ],
  controllers: [AiController],
  providers: [AiService, ContextBuilderService, OpenaiProvider, ClaudeProvider, DeepseekProvider, MimoProvider],
  exports: [AiService, ContextBuilderService, OpenaiProvider],
})
export class AiModule {}
