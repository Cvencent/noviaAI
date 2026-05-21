import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ScenesService } from './scenes.service'
import { CreateSceneDto, UpdateSceneDto, ReorderScenesDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/scenes')
@UseGuards(JwtAuthGuard)
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createSceneDto: CreateSceneDto,
  ) {
    return this.scenesService.create(user.id, projectId, createSceneDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.scenesService.findAll(user.id, projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.scenesService.findOne(user.id, projectId, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateSceneDto: UpdateSceneDto,
  ) {
    return this.scenesService.update(user.id, projectId, id, updateSceneDto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.scenesService.remove(user.id, projectId, id)
  }

  @Put('reorder')
  async reorder(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() reorderDto: ReorderScenesDto,
  ) {
    return this.scenesService.reorder(user.id, projectId, reorderDto)
  }
}
