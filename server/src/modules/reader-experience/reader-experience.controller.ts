import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ReaderExperienceService } from './reader-experience.service'

@Controller('projects/:projectId/reader-experience')
@UseGuards(JwtAuthGuard)
export class ReaderExperienceController {
  constructor(private readonly readerExperienceService: ReaderExperienceService) {}

  @Get('analysis')
  analyzeProject(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.readerExperienceService.analyzeProject(user.id, projectId)
  }
}
