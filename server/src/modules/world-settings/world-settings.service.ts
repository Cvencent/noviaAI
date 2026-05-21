import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateWorldSettingDto, UpdateWorldSettingDto } from './dto'
import { WorldConflictDetectorService } from './world-conflict-detector.service'

@Injectable()
export class WorldSettingsService {
  constructor(
    private prisma: PrismaService,
    private conflictDetector: WorldConflictDetectorService,
  ) {}

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

  async detectConflicts(
    userId: string,
    projectId: string,
    content: string,
    options?: {
      checkGeography?: boolean
      checkMagic?: boolean
      checkPolitics?: boolean
      checkCulture?: boolean
      checkSocial?: boolean
    },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    return await this.conflictDetector.detectConflicts(projectId, content, options)
  }

  async getWorldContext(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const worldSettings = await this.prisma.worldSetting.findMany({
      where: { projectId },
      include: { items: true },
      orderBy: { category: 'asc' },
    })

    const characters = await this.prisma.character.findMany({
      where: { projectId },
      include: {
        relationshipsFrom: {
          include: {
            toCharacter: { select: { id: true, name: true } },
          },
        },
        relationshipsTo: {
          include: {
            fromCharacter: { select: { id: true, name: true } },
          },
        },
      },
    })

    const plots = await this.prisma.plot.findMany({
      where: { projectId },
      include: { plotPoints: true },
    })

    return {
      worldSettings,
      characters,
      plots,
    }
  }

  async getSettingReference(userId: string, projectId: string, settingId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const setting = await this.prisma.worldSetting.findUnique({
      where: { id: settingId },
      include: { items: true },
    })

    if (!setting) {
      throw new NotFoundException('世界观设定不存在')
    }

    if (setting.projectId !== projectId) {
      throw new ForbiddenException('设定不属于此项目')
    }

    let reference = `# ${setting.name}\n\n`
    if (setting.description) {
      reference += `${setting.description}\n\n`
    }

    if (setting.items && setting.items.length > 0) {
      reference += `## 详细内容\n\n`
      for (const item of setting.items) {
        reference += `### ${item.name}\n`
        if (item.description) {
          reference += `${item.description}\n`
        }
        if (item.details) {
          reference += `\n详情：${JSON.stringify(item.details)}\n`
        }
        reference += '\n'
      }
    }

    return {
      id: setting.id,
      name: setting.name,
      category: setting.category,
      reference,
    }
  }

  async searchSettings(userId: string, projectId: string, query: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const queryLower = query.toLowerCase()

    const settings = await this.prisma.worldSetting.findMany({
      where: { projectId },
      include: { items: true },
    })

    const results = settings.filter(setting => {
      if (setting.name.toLowerCase().includes(queryLower)) return true
      if (setting.description?.toLowerCase().includes(queryLower)) return true
      if (setting.category.toLowerCase().includes(queryLower)) return true
      if (setting.items?.some(item =>
        item.name.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower)
      )) return true
      return false
    })

    return results.map(setting => ({
      id: setting.id,
      name: setting.name,
      category: setting.category,
      description: setting.description,
      matchedItems: setting.items?.filter(item =>
        item.name.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower)
      ).map(item => ({
        name: item.name,
        description: item.description,
      })),
    }))
  }
}
