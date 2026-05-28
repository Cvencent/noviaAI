import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUsageLogDto } from './dto'

export interface UsageStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  totalCost: number
  totalTokens: number
  byModel: Array<{
    model: string
    count: number
    tokens: number
    cost: number
  }>
  dailyUsage: Array<{
    date: string
    count: number
    tokens: number
    cost: number
  }>
}

@Injectable()
export class UsageLogsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createUsageLogDto: CreateUsageLogDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: createUsageLogDto.apiKeyId },
    })

    if (!apiKey) {
      throw new NotFoundException('API密钥不存在')
    }

    if (apiKey.userId !== project.userId) {
      throw new ForbiddenException('API密钥不属于此用户')
    }

    const usageLog = await this.prisma.usageLog.create({
      data: {
        apiKey: { connect: { id: createUsageLogDto.apiKeyId } },
        endpoint: createUsageLogDto.endpoint,
        method: createUsageLogDto.method,
        statusCode: createUsageLogDto.statusCode,
        requestBody: createUsageLogDto.requestBody,
        responseBody: createUsageLogDto.responseBody,
        promptContent: createUsageLogDto.promptContent,
        responseContent: createUsageLogDto.responseContent,
        tokensUsed: createUsageLogDto.tokensUsed,
        cost: createUsageLogDto.cost,
        ipAddress: createUsageLogDto.ipAddress,
        userAgent: createUsageLogDto.userAgent,
        model: createUsageLogDto.model,
        promptTokens: createUsageLogDto.promptTokens,
        completionTokens: createUsageLogDto.responseTokens,
        duration: createUsageLogDto.duration,
      },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    })

    return usageLog
  }

  async findAll(projectId: string, page: number = 1, limit: number = 20) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const skip = (page - 1) * limit

    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId: project.userId },
      select: { id: true },
    })

    const apiKeyIds = apiKeys.map((k) => k.id)

    const [logs, total] = await Promise.all([
      this.prisma.usageLog.findMany({
        where: {
          apiKeyId: { in: apiKeyIds },
        },
        include: {
          apiKey: {
            select: {
              id: true,
              name: true,
              provider: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usageLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
        },
      }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getStats(projectId: string): Promise<UsageStats> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId: project.userId },
      select: { id: true },
    })

    const apiKeyIds = apiKeys.map((k) => k.id)

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalLogs,
      todayLogs,
      weekLogs,
      monthLogs,
      allLogs,
    ] = await Promise.all([
      this.prisma.usageLog.count({
        where: { apiKeyId: { in: apiKeyIds } },
      }),
      this.prisma.usageLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.usageLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: startOfWeek },
        },
      }),
      this.prisma.usageLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.usageLog.findMany({
        where: { apiKeyId: { in: apiKeyIds } },
        select: {
          tokensUsed: true,
          cost: true,
         model: true,
        },
      }),
    ])

    const totalTokens = allLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0)
    const totalCost = allLogs.reduce((sum, log) => sum + (log.cost || 0), 0)

    const recentLogs = await this.prisma.usageLog.findMany({
      where: { apiKeyId: { in: apiKeyIds } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })

    const byModelMap = new Map<string, { count: number; tokens: number; cost: number }>()
    const dailyMap = new Map<string, { count: number; tokens: number; cost: number }>()

    for (const log of recentLogs) {
      const model = log.model || (log.requestBody as any)?.model || log.endpoint
      const dateKey = log.createdAt.toISOString().split('T')[0]

      const modelStats = byModelMap.get(model) || { count: 0, tokens: 0, cost: 0 }
      modelStats.count++
      modelStats.tokens += log.tokensUsed || 0
      modelStats.cost += log.cost || 0
      byModelMap.set(model, modelStats)

      const dailyStats = dailyMap.get(dateKey) || { count: 0, tokens: 0, cost: 0 }
      dailyStats.count++
      dailyStats.tokens += log.tokensUsed || 0
      dailyStats.cost += log.cost || 0
      dailyMap.set(dateKey, dailyStats)
    }

    const byModel = Array.from(byModelMap.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    }))

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)

    return {
      total: totalLogs,
      today: todayLogs,
      thisWeek: weekLogs,
      thisMonth: monthLogs,
      totalCost,
      totalTokens,
      byModel,
      dailyUsage,
    }
  }

  async findOne(projectId: string, logId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const log = await this.prisma.usageLog.findUnique({
      where: { id: logId },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    })

    if (!log) {
      throw new NotFoundException('日志记录不存在')
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: log.apiKeyId },
    })

    if (apiKey?.userId !== project.userId) {
      throw new ForbiddenException('没有权限查看此日志')
    }

    return log
  }

  async getRetentionSetting(userId: string) {
    let setting = await this.prisma.logRetentionSetting.findUnique({
      where: { userId },
    })
    if (!setting) {
      setting = await this.prisma.logRetentionSetting.create({
        data: { userId, retentionDays: 30 },
      })
    }
    return setting
  }

  async updateRetentionSetting(userId: string, retentionDays: number) {
    return this.prisma.logRetentionSetting.upsert({
      where: { userId },
      update: { retentionDays },
      create: { userId, retentionDays },
    })
  }

  async cleanupExpiredLogs(userId: string) {
    const setting = await this.getRetentionSetting(userId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - setting.retentionDays)

    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true },
    })
    const apiKeyIds = apiKeys.map(k => k.id)

    const result = await this.prisma.usageLog.deleteMany({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { lt: cutoffDate },
      },
    })

    return { deleted: result.count, retentionDays: setting.retentionDays }
  }
}
