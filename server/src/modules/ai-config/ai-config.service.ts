import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAIConfigDto, AIAction, AIProvider } from './dto/create-ai-config.dto';
import { UpdateAIConfigDto } from './dto/update-ai-config.dto';

@Injectable()
export class AIConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfigs(userId: string) {
    const configs = await this.prisma.aIConfig.findMany({
      where: { userId },
    });
    return this.formatConfigs(configs);
  }

  async getConfig(userId: string, action: AIAction) {
    const config = await this.prisma.aIConfig.findFirst({
      where: { userId, action },
    });
    return config;
  }

  async updateConfig(userId: string, action: AIAction, dto: UpdateAIConfigDto) {
    const config = await this.prisma.aIConfig.findFirst({
      where: { userId, action },
    });

    if (config) {
      // 准备更新数据
      const updateData: any = {};
      if (dto.provider !== undefined) updateData.provider = dto.provider;
      if (dto.model !== undefined) updateData.model = dto.model;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
      // 只在 apiKeyId 有值时才更新，空字符串或 undefined 不更新
      if (dto.apiKeyId) {
        updateData.apiKeyId = dto.apiKeyId;
      } else if (dto.apiKeyId === null) {
        updateData.apiKeyId = null;
      }

      return await this.prisma.aIConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      if (!dto.provider) {
        throw new Error('创建 AI 配置时必须提供 provider');
      }
      const createData: any = {
        userId,
        action,
        provider: dto.provider,
        model: dto.model,
        isActive: dto.isActive ?? true,
      };
      // 只在 apiKeyId 有值时才设置
      if (dto.apiKeyId) {
        createData.apiKeyId = dto.apiKeyId;
      }
      return await this.prisma.aIConfig.create({
        data: createData,
      });
    }
  }

  async batchUpdateConfigs(userId: string, configs: { action: string; config: CreateAIConfigDto }[]) {
    const results = [];
    
    for (const { action, config } of configs) {
      const result = await this.updateConfig(userId, action as AIAction, config);
      results.push({ action, config: result });
    }
    
    return results;
  }

  async getDefaultConfigs() {
    return {
      [AIAction.TEXT_COMPLETION]: {
        provider: AIProvider.OPENAI,
        model: 'gpt-4',
        isActive: true,
      },
      [AIAction.CONSISTENCY_CHECK]: {
        provider: AIProvider.CLAUDE,
        model: 'claude-3-sonnet-20240229',
        isActive: true,
      },
      [AIAction.SUMMARY_GENERATION]: {
        provider: AIProvider.OPENAI,
        model: 'gpt-4',
        isActive: true,
      },
      [AIAction.CHARACTER_GENERATION]: {
        provider: AIProvider.CLAUDE,
        model: 'claude-3-sonnet-20240229',
        isActive: true,
      },
      [AIAction.WORLD_BUILDING]: {
        provider: AIProvider.CLAUDE,
        model: 'claude-3-sonnet-20240229',
        isActive: true,
      },
      [AIAction.PLOT_SUGGESTION]: {
        provider: AIProvider.OPENAI,
        model: 'gpt-4',
        isActive: true,
      },
      [AIAction.DIALOGUE_GENERATION]: {
        provider: AIProvider.OPENAI,
        model: 'gpt-4',
        isActive: true,
      },
      [AIAction.POLISH_REVISION]: {
        provider: AIProvider.OPENAI,
        model: 'gpt-4',
        isActive: true,
      },
    };
  }

  private formatConfigs(configs: any[]) {
    const formatted: any = {};
    for (const config of configs) {
      formatted[config.action] = {
        provider: config.provider,
        model: config.model,
        apiKeyId: config.apiKeyId,
        isActive: config.isActive,
      };
    }
    return formatted;
  }
}
