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
import { PlotsService } from './plots.service'
import { CreatePlotDto, UpdatePlotDto, CreatePlotPointDto, UpdatePlotPointDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('projects/:projectId/plots')
@UseGuards(JwtAuthGuard)
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createPlotDto: CreatePlotDto,
  ) {
    return this.plotsService.create(projectId, createPlotDto)
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.plotsService.findAll(projectId)
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.plotsService.findOne(projectId, id)
  }

  @Put(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updatePlotDto: UpdatePlotDto,
  ) {
    return this.plotsService.update(projectId, id, updatePlotDto)
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.plotsService.remove(projectId, id)
  }

  @Post(':id/points')
  async addPlotPoint(
    @Param('projectId') projectId: string,
    @Param('id') plotId: string,
    @Body() createPlotPointDto: CreatePlotPointDto,
  ) {
    return this.plotsService.addPlotPoint(projectId, plotId, createPlotPointDto)
  }

  @Put(':plotId/points/:pointId')
  async updatePlotPoint(
    @Param('projectId') projectId: string,
    @Param('plotId') plotId: string,
    @Param('pointId') pointId: string,
    @Body() updatePlotPointDto: UpdatePlotPointDto,
  ) {
    return this.plotsService.updatePlotPoint(projectId, plotId, pointId, updatePlotPointDto)
  }

  @Delete(':plotId/points/:pointId')
  async removePlotPoint(
    @Param('projectId') projectId: string,
    @Param('plotId') plotId: string,
    @Param('pointId') pointId: string,
  ) {
    return this.plotsService.removePlotPoint(projectId, plotId, pointId)
  }

  @Put(':plotId/points/reorder')
  async reorderPlotPoints(
    @Param('projectId') projectId: string,
    @Param('plotId') plotId: string,
    @Body() body: { pointIds: string[] },
  ) {
    return this.plotsService.reorderPlotPoints(projectId, plotId, body.pointIds)
  }
}
