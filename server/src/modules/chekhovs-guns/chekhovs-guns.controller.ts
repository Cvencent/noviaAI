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
import { ChekhovsGunsService } from './chekhovs-guns.service'
import { CreateChekhovsGunDto, UpdateChekhovsGunDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('projects/:projectId/chekhovs-guns')
@UseGuards(JwtAuthGuard)
export class ChekhovsGunsController {
  constructor(private readonly chekhovsGunsService: ChekhovsGunsService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createChekhovsGunDto: CreateChekhovsGunDto,
  ) {
    return this.chekhovsGunsService.create(projectId, createChekhovsGunDto)
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.chekhovsGunsService.findAll(projectId)
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.chekhovsGunsService.findOne(projectId, id)
  }

  @Put(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateChekhovsGunDto: UpdateChekhovsGunDto,
  ) {
    return this.chekhovsGunsService.update(projectId, id, updateChekhovsGunDto)
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.chekhovsGunsService.remove(projectId, id)
  }
}
