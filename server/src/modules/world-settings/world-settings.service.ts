import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateWorldSettingDto, UpdateWorldSettingDto } from './dto'

@Injectable()
export class WorldSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, createWorldSettingDto: CreateWorldSettingDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const worldSetting = await this.prisma.worldSetting.create({
      data: {
        ...createWorldSettingDto,
        projectId,
        items: createWorldSettingDto.items ? {
          create: createWorldSettingDto.items.map(item => ({
            name: item.name,
            description: item.description,
            details: item.details,
          })),
        } : undefined,
      },
      include: {
        items: true,
      },
    })

    return worldSetting
  }

  async findAll(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const worldSettings = await this.prisma.worldSetting.findMany({
      where: { projectId },
      include: {
        items: true,
      },
      orderBy: {
        category: 'asc',
      },
    })

    return worldSettings
  }

  async findOne(userId: string, projectId: string, worldSettingId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const worldSetting = await this.prisma.worldSetting.findUnique({
      where: { id: worldSettingId },
      include: {
        items: true,
      },
    })

    if (!worldSetting) {
      throw new NotFoundException('世界观设定不存在')
    }

    return worldSetting
  }

  async update(
    userId: string,
    projectId: string,
    worldSettingId: string,
    updateWorldSettingDto: UpdateWorldSettingDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const existingWorldSetting = await this.prisma.worldSetting.findUnique({
      where: { id: worldSettingId },
    })

    if (!existingWorldSetting) {
      throw new NotFoundException('世界观设定不存在')
    }

    const { items, ...restData } = updateWorldSettingDto

    const updatedWorldSetting = await this.prisma.worldSetting.update({
      where: { id: worldSettingId },
      data: {
        ...restData,
        items: items ? {
          deleteMany: {},
          create: items.map(item => ({
            name: item.name,
            description: item.description,
            details: item.details,
          })),
        } : undefined,
      },
      include: {
        items: true,
      },
    })

    return updatedWorldSetting
  }

  async remove(userId: string, projectId: string, worldSettingId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const worldSetting = await this.prisma.worldSetting.findUnique({
      where: { id: worldSettingId },
    })

    if (!worldSetting) {
      throw new NotFoundException('世界观设定不存在')
    }

    await this.prisma.worldSetting.delete({
      where: { id: worldSettingId },
    })

    return { message: '世界观设定已删除' }
  }

  async getByCategory(userId: string, projectId: string, category: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const worldSettings = await this.prisma.worldSetting.findMany({
      where: {
        projectId,
        category,
      },
      include: {
        items: true,
      },
    })

    return worldSettings
  }

  async getCategories(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const categories = await this.prisma.worldSetting.findMany({
      where: { projectId },
      select: {
        category: true,
      },
      distinct: ['category'],
    })

    return categories.map(c => c.category)
  }
}
