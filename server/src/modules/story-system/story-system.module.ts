import { Module, forwardRef } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { WritingStylesModule } from '../writing-styles/writing-styles.module'
import { StorySystemController } from './story-system.controller'
import { StorySystemService } from './story-system.service'

@Module({
  imports: [forwardRef(() => AiModule), WritingStylesModule],
  controllers: [StorySystemController],
  providers: [StorySystemService],
  exports: [StorySystemService],
})
export class StorySystemModule {}
