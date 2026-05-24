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
import { OutlinesService } from './outlines.service'
import {
  CreateOutlineDto,
  UpdateOutlineDto,
  CreateOutlineItemDto,
  UpdateOutlineItemDto,
  ReorderOutlineItemsDto,
  GenerateOutlineDto,
} from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/outlines')
@UseGuards(JwtAuthGuard)
export class OutlinesController {
  constructor(private readonly outlinesService: OutlinesService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createOutlineDto: CreateOutlineDto,
  ) {
    return this.outlinesService.create(user.id, projectId, createOutlineDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.outlinesService.findAll(user.id, projectId)
  }

  @Post('ai-generate')
  async generateWithAi(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() generateOutlineDto: GenerateOutlineDto,
  ) {
    return this.outlinesService.generateWithAi(user.id, projectId, generateOutlineDto)
  }

  @Post('ai-jobs')
  async createAiJob(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() generateOutlineDto: GenerateOutlineDto,
  ) {
    return this.outlinesService.createOutlineAiJob(user.id, projectId, generateOutlineDto)
  }

  @Get('ai-jobs')
  async listAiJobs(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.outlinesService.listOutlineAiJobs(user.id, projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.outlinesService.findOne(user.id, projectId, id)
  }

  @Get(':id/structure-health')
  async analyzeStructure(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.outlinesService.analyzeStructure(user.id, projectId, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateOutlineDto: UpdateOutlineDto,
  ) {
    return this.outlinesService.update(user.id, projectId, id, updateOutlineDto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.outlinesService.remove(user.id, projectId, id)
  }

  @Post(':id/items')
  async addItem(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') outlineId: string,
    @Body() createOutlineItemDto: CreateOutlineItemDto,
  ) {
    return this.outlinesService.addItem(user.id, projectId, outlineId, createOutlineItemDto)
  }

  @Put(':outlineId/items/:itemId')
  async updateItem(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('outlineId') outlineId: string,
    @Param('itemId') itemId: string,
    @Body() updateOutlineItemDto: UpdateOutlineItemDto,
  ) {
    return this.outlinesService.updateItem(user.id, projectId, outlineId, itemId, updateOutlineItemDto)
  }

  @Delete(':outlineId/items/:itemId')
  async removeItem(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('outlineId') outlineId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.outlinesService.removeItem(user.id, projectId, outlineId, itemId)
  }

  @Put(':id/items/reorder')
  async reorderItems(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') outlineId: string,
    @Body() reorderDto: ReorderOutlineItemsDto,
  ) {
    return this.outlinesService.reorderItems(user.id, projectId, outlineId, reorderDto)
  }
}
