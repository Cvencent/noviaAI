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
import { CreateWorldSettingDto, UpdateWorldSettingDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/world-settings')
@UseGuards(JwtAuthGuard)
export class WorldSettingsController {
  constructor(private readonly worldSettingsService: WorldSettingsService) {}

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
}
