import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { WorldSettingsService } from './world-settings.service'
import { WorldElementExtractorService } from './world-element-extractor.service'
import { CreateWorldSettingDto, UpdateWorldSettingDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/world-settings')
@UseGuards(JwtAuthGuard)
export class WorldSettingsController {
  constructor(
    private readonly worldSettingsService: WorldSettingsService,
    private readonly elementExtractor: WorldElementExtractorService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createWorldSettingDto: CreateWorldSettingDto,
  ) {
    return this.worldSettingsService.create(user.id, projectId, createWorldSettingDto)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Query('category') category?: string,
  ) {
    if (category) {
      return this.worldSettingsService.getByCategory(user.id, projectId, category)
    }
    return this.worldSettingsService.findAll(user.id, projectId)
  }

  @Get('categories')
  async getCategories(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.worldSettingsService.getCategories(user.id, projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.worldSettingsService.findOne(user.id, projectId, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateWorldSettingDto: UpdateWorldSettingDto,
  ) {
    return this.worldSettingsService.update(user.id, projectId, id, updateWorldSettingDto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.worldSettingsService.remove(user.id, projectId, id)
  }

  @Post('detect-conflicts')
  async detectConflicts(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() body: { content: string; checkGeography?: boolean; checkMagic?: boolean; checkPolitics?: boolean; checkCulture?: boolean; checkSocial?: boolean },
  ) {
    return this.worldSettingsService.detectConflicts(user.id, projectId, body.content, {
      checkGeography: body.checkGeography,
      checkMagic: body.checkMagic,
      checkPolitics: body.checkPolitics,
      checkCulture: body.checkCulture,
      checkSocial: body.checkSocial,
    })
  }

  @Get('context')
  async getContext(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.worldSettingsService.getWorldContext(user.id, projectId)
  }

  @Get('reference/:settingId')
  async getReference(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('settingId') settingId: string,
  ) {
    return this.worldSettingsService.getSettingReference(user.id, projectId, settingId)
  }

  @Get('search')
  async search(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Query('q') query: string,
  ) {
    return this.worldSettingsService.searchSettings(user.id, projectId, query)
  }

  @Post('extract-elements')
  async extractElements(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() body: { content: string; existingContent?: string },
  ) {
    return this.elementExtractor.analyzeNewElements(projectId, body.content, body.existingContent)
  }

  @Post('add-element')
  async addElement(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() body: { type: string; name: string; description?: string },
  ) {
    return this.elementExtractor.quickAddElement(projectId, {
      type: body.type as any,
      name: body.name,
      description: body.description,
      context: '',
      confidence: 1,
    })
  }

  @Post('batch-add-elements')
  async batchAddElements(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() body: { elements: Array<{ type: string; name: string; description?: string }> },
  ) {
    return this.elementExtractor.batchAddElements(
      projectId,
      body.elements.map(e => ({
        type: e.type as any,
        name: e.name,
        description: e.description,
        context: '',
        confidence: 1,
      }))
    )
  }
}
