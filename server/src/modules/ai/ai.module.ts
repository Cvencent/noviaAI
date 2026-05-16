import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ContextBuilderService } from './context-builder.service'
import { OpenaiProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [AiService, ContextBuilderService, OpenaiProvider, ClaudeProvider],
  exports: [AiService, ContextBuilderService],
})
export class AiModule {}
