import { Controller, Get, Post, Put, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AIConfigService } from './ai-config.service';
import { CreateAIConfigDto, AIAction } from './dto/create-ai-config.dto';
import { UpdateAIConfigDto } from './dto/update-ai-config.dto';

@Controller('ai-config')
@UseGuards(JwtAuthGuard)
export class AIConfigController {
  constructor(private readonly aiConfigService: AIConfigService) {}

  @Get()
  async getConfigs(@CurrentUser('id') userId: string) {
    return await this.aiConfigService.getConfigs(userId);
  }

  @Get('defaults')
  async getDefaults() {
    return await this.aiConfigService.getDefaultConfigs();
  }

  @Get(':action')
  async getConfig(
    @CurrentUser('id') userId: string,
    @Param('action') action: string,
  ) {
    return await this.aiConfigService.getConfig(userId, action as AIAction);
  }

  @Put(':action')
  async updateConfig(
    @CurrentUser('id') userId: string,
    @Param('action') action: string,
    @Body() dto: UpdateAIConfigDto,
  ) {
    return await this.aiConfigService.updateConfig(userId, action as AIAction, dto);
  }

  @Post('batch')
  async batchUpdate(
    @CurrentUser('id') userId: string,
    @Body() configs: { action: string; config: CreateAIConfigDto }[],
  ) {
    return await this.aiConfigService.batchUpdateConfigs(userId, configs);
  }
}
