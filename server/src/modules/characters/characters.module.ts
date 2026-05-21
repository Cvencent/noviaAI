import { Module, forwardRef } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AiModule } from '../ai/ai.module'
import { CharactersService } from './characters.service'
import { CharactersController } from './characters.controller'
import { CharacterExtractorService } from './character-extractor.service'
import { ProgressiveCharacterContextService } from './progressive-character-context.service'
import { CharacterSearchService } from './character-search.service'
import { CharacterMCPServerService } from './character-mcp-server.service'
import { IntelligentCharacterContextService } from './intelligent-character-context.service'

@Module({
  imports: [PrismaModule, forwardRef(() => AiModule)],
  controllers: [CharactersController],
  providers: [
    CharactersService,
    CharacterExtractorService,
    ProgressiveCharacterContextService,
    CharacterSearchService,
    CharacterMCPServerService,
    IntelligentCharacterContextService,
  ],
  exports: [
    CharactersService,
    CharacterExtractorService,
    ProgressiveCharacterContextService,
    CharacterSearchService,
    CharacterMCPServerService,
    IntelligentCharacterContextService,
  ],
})
export class CharactersModule {}
