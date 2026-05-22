import { Module } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { StorySystemController } from './story-system.controller'
import { StorySystemService } from './story-system.service'

@Module({
  imports: [AiModule],
  controllers: [StorySystemController],
  providers: [StorySystemService],
  exports: [StorySystemService],
})
export class StorySystemModule {}
