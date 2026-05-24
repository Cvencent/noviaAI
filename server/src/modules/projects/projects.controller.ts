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

  @Post(':id/ai-expand-character/:characterId')
  async aiExpandCharacter(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('characterId') characterId: string
  ) {
    return this.aiProjectGeneratorService.expandCharacter(user.id, projectId, characterId)
  }

  @Post(':id/ai-expand-world-setting/:settingId')
  async aiExpandWorldSetting(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('settingId') settingId: string
  ) {
    return this.aiProjectGeneratorService.expandWorldSetting(user.id, projectId, settingId)
  }

  @Get(':id/ai-suggestions')
  async aiGenerateSuggestions(@CurrentUser() user: any, @Param('id') projectId: string) {
    return this.aiProjectGeneratorService.generateProjectSuggestions(user.id, projectId)
  }

  @Post(':id/ai-chapter-outline')
  async aiGenerateChapterOutline(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: { chapterId?: string, content?: string }
  ) {
    return this.aiProjectGeneratorService.generateChapterOutline(user.id, projectId, body.chapterId, body.content)
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

  @Get(':id/template')
  async getProjectTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    const project = await this.projectsService.findOne(user.id, id)
    return {
      webNovelTemplateId: project.webNovelTemplateId || null,
      chapterTemplateId: project.chapterTemplateId || null,
    }
  }

  @Put(':id/template')
  async updateProjectTemplate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { webNovelTemplateId?: string | null; chapterTemplateId?: string | null },
  ) {
    return this.projectsService.update(user.id, id, {
      webNovelTemplateId: body.webNovelTemplateId,
      chapterTemplateId: body.chapterTemplateId,
    })
  }
}
