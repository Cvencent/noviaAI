import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  CreateOutlineDto,
  UpdateOutlineDto,
  CreateOutlineItemDto,
  UpdateOutlineItemDto,
  ReorderOutlineItemsDto,
} from './dto'

@Injectable()
export class OutlinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, createOutlineDto: CreateOutlineDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限在此项目中创建大纲')
    }

    const lastOutline = await this.prisma.outline.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    const order = createOutlineDto.order ?? (lastOutline ? lastOutline.order + 1 : 0)

    const outline = await this.prisma.outline.create({
      data: {
        ...createOutlineDto,
        order,
        projectId,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return outline
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

    const outlines = await this.prisma.outline.findMany({
      where: { projectId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return outlines
  }

  async findOne(userId: string, projectId: string, outlineId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const outline = await this.prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!outline) {
      throw new NotFoundException('大纲不存在')
    }

    if (outline.projectId !== projectId) {
      throw new NotFoundException('大纲不属于此项目')
    }

    return outline
  }

  async update(
    userId: string,
    projectId: string,
    outlineId: string,
    updateOutlineDto: UpdateOutlineDto,
  ) {
    const outline = await this.findOne(userId, projectId, outlineId)

    const updatedOutline = await this.prisma.outline.update({
      where: { id: outlineId },
      data: updateOutlineDto,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return updatedOutline
  }

  async remove(userId: string, projectId: string, outlineId: string) {
    const outline = await this.findOne(userId, projectId, outlineId)

    await this.prisma.outline.delete({
      where: { id: outlineId },
    })

    const remainingOutlines = await this.prisma.outline.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingOutlines.length; i++) {
      if (remainingOutlines[i].order !== i) {
        await this.prisma.outline.update({
          where: { id: remainingOutlines[i].id },
          data: { order: i },
        })
      }
    }

    return { message: '大纲已删除' }
  }

  async addItem(
    userId: string,
    projectId: string,
    outlineId: string,
    createOutlineItemDto: CreateOutlineItemDto,
  ) {
    const outline = await this.findOne(userId, projectId, outlineId)

    const lastItem = await this.prisma.outlineItem.findFirst({
      where: { outlineId },
      orderBy: { order: 'desc' },
    })

    const order = createOutlineItemDto.order ?? (lastItem ? lastItem.order + 1 : 0)

    const item = await this.prisma.outlineItem.create({
      data: {
        ...createOutlineItemDto,
        order,
        outlineId,
      },
    })

    return item
  }

  async updateItem(
    userId: string,
    projectId: string,
    outlineId: string,
    itemId: string,
    updateOutlineItemDto: UpdateOutlineItemDto,
  ) {
    const outline = await this.findOne(userId, projectId, outlineId)

    const item = await this.prisma.outlineItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundException('大纲条目不存在')
    }

    if (item.outlineId !== outlineId) {
      throw new ForbiddenException('大纲条目不属于此大纲')
    }

    const updatedItem = await this.prisma.outlineItem.update({
      where: { id: itemId },
      data: updateOutlineItemDto,
    })

    return updatedItem
  }

  async removeItem(userId: string, projectId: string, outlineId: string, itemId: string) {
    const outline = await this.findOne(userId, projectId, outlineId)

    const item = await this.prisma.outlineItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundException('大纲条目不存在')
    }

    if (item.outlineId !== outlineId) {
      throw new ForbiddenException('大纲条目不属于此大纲')
    }

    await this.prisma.outlineItem.delete({
      where: { id: itemId },
    })

    const remainingItems = await this.prisma.outlineItem.findMany({
      where: { outlineId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingItems.length; i++) {
      if (remainingItems[i].order !== i) {
        await this.prisma.outlineItem.update({
          where: { id: remainingItems[i].id },
          data: { order: i },
        })
      }
    }

    return { message: '大纲条目已删除' }
  }

  async reorderItems(
    userId: string,
    projectId: string,
    outlineId: string,
    reorderDto: ReorderOutlineItemsDto,
  ) {
    const outline = await this.findOne(userId, projectId, outlineId)

    const items = await this.prisma.outlineItem.findMany({
      where: { outlineId },
    })

    const itemMap = new Map(items.map((item) => [item.id, item]))

    for (const itemId of reorderDto.itemIds) {
      if (!itemMap.has(itemId)) {
        throw new NotFoundException(`大纲条目 ${itemId} 不存在`)
      }
    }

    await this.prisma.$transaction(
      reorderDto.itemIds.map((itemId, index) =>
        this.prisma.outlineItem.update({
          where: { id: itemId },
          data: { order: index },
        }),
      ),
    )

    const reorderedOutline = await this.prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return reorderedOutline
  }
}
