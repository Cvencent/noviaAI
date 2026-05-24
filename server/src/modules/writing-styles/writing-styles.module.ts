import { Module } from '@nestjs/common'
import { WritingStylesController } from './writing-styles.controller'
import { WritingStylesService } from './writing-styles.service'
import { StyleApplicationService } from './style-application.service'
import { LorebookService } from './lorebook.service'
import { EnhancedWritingService } from './enhanced-writing.service'
import { LorebookController } from './lorebook.controller'
import { EnhancedWritingController } from './enhanced-writing.controller'
import { OpenaiProvider } from '../ai/providers/openai.provider'
import { ClaudeProvider } from '../ai/providers/claude.provider'
import { DeepseekProvider } from '../ai/providers/deepseek.provider'
import { MimoProvider } from '../ai/providers/mimo.provider'
import { ApiKeysModule } from '../api-keys/api-keys.module'

@Module({
  imports: [ApiKeysModule],
  controllers: [WritingStylesController, LorebookController, EnhancedWritingController],
  providers: [
    WritingStylesService,
    StyleApplicationService,
    LorebookService,
    EnhancedWritingService,
    OpenaiProvider,
    ClaudeProvider,
    DeepseekProvider,
    MimoProvider,
  ],
  exports: [WritingStylesService, StyleApplicationService, LorebookService, EnhancedWritingService]
})
export class WritingStylesModule {}
