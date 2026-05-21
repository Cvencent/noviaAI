import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { AiProjectGeneratorService } from './ai-project-generator.service'
import { CreateProjectDto, UpdateProjectDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly aiProjectGeneratorService: AiProjectGeneratorService,
  ) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(user.id, createProjectDto)
  }

  @Post('ai-generate')
  async aiGenerate(@CurrentUser() user: any, @Body() body: { description: string }) {
    return this.aiProjectGeneratorService.generateProject(user.id, body.description)
  }

  @Post(':id/ai-generate-characters')
  async aiGenerateCharacters(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { count?: number }) {
    return this.aiProjectGeneratorService.generateCharacters(user.id, id, body.count)
  }

  @Post(':id/ai-generate-world-settings')
  async aiGenerateWorldSettings(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { count?: number }) {
    return this.aiProjectGeneratorService.generateWorldSettings(user.id, id, body.count)
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

  @Get(':id/export')
  async exportProject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.exportProject(user.id, id)
  }

  @Post('import')
  async importProject(@CurrentUser() user: any, @Body() jsonData: any) {
    return this.projectsService.importProject(user.id, jsonData)
  }
}
