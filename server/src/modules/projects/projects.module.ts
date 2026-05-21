import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'
import { AiProjectGeneratorService } from './ai-project-generator.service'
import { AiModule } from '../ai/ai.module'

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, AiProjectGeneratorService],
  exports: [ProjectsService, AiProjectGeneratorService],
})
export class ProjectsModule {}
