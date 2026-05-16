import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface CreateApiKeyDto {
  provider: 'openai' | 'claude'
  name: string
  apiKey: string
}

export interface UpdateApiKeyDto {
  name?: string
  apiKey?: string
  isActive?: boolean
}

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto): Promise<any> {
    const existing = await this.prisma.apiKey.findFirst({
      where: {
        userId,
        provider: dto.provider,
        isActive: true,
      },
    })

    if (existing) {
      throw new ConflictException(`已存在活跃的${dto.provider} API Key，请先禁用或删除`)
    }

    const hashedKey = await this.hashApiKey(dto.apiKey)

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        provider: dto.provider,
        name: dto.name,
        encryptedKey: hashedKey,
        isActive: true,
      },
    })

    return {
      id: apiKey.id,
      provider: apiKey.provider,
      name: apiKey.name,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    }
  }

  async findAll(userId: string): Promise<any[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return apiKeys.map((key) => ({
      id: key.id,
      provider: key.provider,
      name: key.name,
      isActive: key.isActive,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }))
  }

  async findOne(userId: string, apiKeyId: string): Promise<any> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    })

    if (!apiKey) {
      throw new NotFoundException('API Key不存在')
    }

    if (apiKey.userId !== userId) {
      throw new NotFoundException('API Key不存在')
    }

    return {
      id: apiKey.id,
      provider: apiKey.provider,
      name: apiKey.name,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    }
  }

  async update(userId: string, apiKeyId: string, dto: UpdateApiKeyDto): Promise<any> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    })

    if (!apiKey) {
      throw new NotFoundException('API Key不存在')
    }

    if (apiKey.userId !== userId) {
      throw new NotFoundException('API Key不存在')
    }

    const updateData: any = {}
    if (dto.name) updateData.name = dto.name
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive
    if (dto.apiKey) {
      updateData.encryptedKey = await this.hashApiKey(dto.apiKey)
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: updateData,
    })

    return {
      id: updated.id,
      provider: updated.provider,
      name: updated.name,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
  }

  async remove(userId: string, apiKeyId: string): Promise<{ message: string }> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    })

    if (!apiKey) {
      throw new NotFoundException('API Key不存在')
    }

    if (apiKey.userId !== userId) {
      throw new NotFoundException('API Key不存在')
    }

    await this.prisma.apiKey.delete({
      where: { id: apiKeyId },
    })

    return { message: 'API Key已删除' }
  }

  async getActiveKey(userId: string, provider: 'openai' | 'claude'): Promise<string | null> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        userId,
        provider,
        isActive: true,
      },
    })

    return apiKey?.encryptedKey || null
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(apiKey).digest('hex')
  }
}
