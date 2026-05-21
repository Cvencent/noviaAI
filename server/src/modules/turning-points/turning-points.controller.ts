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
import { TurningPointsService } from './turning-points.service'
import {
  CreateTurningPointDto,
  UpdateTurningPointDto,
  ReorderTurningPointsDto,
} from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/turning-points')
@UseGuards(JwtAuthGuard)
export class TurningPointsController {
  constructor(private readonly turningPointsService: TurningPointsService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createTurningPointDto: CreateTurningPointDto,
  ) {
    return this.turningPointsService.create(user.id, projectId, createTurningPointDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.turningPointsService.findAll(user.id, projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.turningPointsService.findOne(user.id, projectId, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTurningPointDto: UpdateTurningPointDto,
  ) {
    return this.turningPointsService.update(user.id, projectId, id, updateTurningPointDto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.turningPointsService.remove(user.id, projectId, id)
  }

  @Put('reorder')
  async reorder(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() reorderDto: ReorderTurningPointsDto,
  ) {
    return this.turningPointsService.reorder(user.id, projectId, reorderDto)
  }
}
