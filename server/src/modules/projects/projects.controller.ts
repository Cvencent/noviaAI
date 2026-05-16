import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { ProjectsService } from './projects.service'
import { CreateProjectDto, UpdateProjectDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(user.id, createProjectDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.projectsService.findAll(user.id)
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.findOne(user.id, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, id, updateProjectDto)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.remove(user.id, id)
  }

  @Post(':id/export')
  async exportProject(@CurrentUser() user: any, @Param('id') id: string, @Res() res: Response) {
    const project = await this.projectsService.exportProject(user.id, id)
    const jsonData = JSON.stringify(project, null, 2)
    const filename = `${project.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.json`

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(jsonData)
  }

  @Post('import')
  async importProject(@CurrentUser() user: any, @Body() jsonData: any) {
    return this.projectsService.importProject(user.id, jsonData)
  }
}
