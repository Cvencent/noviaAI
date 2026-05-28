import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { UsageLogsService } from './usage-logs.service'
import { CreateUsageLogDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { IsOptional, IsNumber, Min, Max } from 'class-validator'

class UpdateRetentionDto {
  @IsNumber()
  @Min(1)
  @Max(365)
  retentionDays: number
}

@Controller('projects/:projectId/usage-logs')
@UseGuards(JwtAuthGuard)
export class UsageLogsController {
  constructor(private readonly usageLogsService: UsageLogsService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createUsageLogDto: CreateUsageLogDto,
  ) {
    return this.usageLogsService.create(projectId, createUsageLogDto)
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1
    const limitNum = limit ? parseInt(limit, 10) : 20
    return this.usageLogsService.findAll(projectId, pageNum, limitNum)
  }

  @Get('stats')
  async getStats(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.usageLogsService.getStats(projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.usageLogsService.findOne(projectId, id)
  }

  @Get('retention')
  async getRetention(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.usageLogsService.getRetentionSetting(user.id)
  }

  @Patch('retention')
  async updateRetention(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateRetentionDto,
  ) {
    return this.usageLogsService.updateRetentionSetting(user.id, dto.retentionDays)
  }

  @Post('cleanup')
  async cleanup(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.usageLogsService.cleanupExpiredLogs(user.id)
  }
}
