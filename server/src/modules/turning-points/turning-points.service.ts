import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  CreateTurningPointDto,
  UpdateTurningPointDto,
  ReorderTurningPointsDto,
} from './dto'

@Injectable()
export class TurningPointsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, createTurningPointDto: CreateTurningPointDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限在此项目中创建转折点')
    }

    const lastTurningPoint = await this.prisma.turningPoint.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    const order = createTurningPointDto.order ?? (lastTurningPoint ? lastTurningPoint.order + 1 : 0)

    const turningPoint = await this.prisma.turningPoint.create({
      data: {
        ...createTurningPointDto,
        order,
        projectId,
      },
    })

    return turningPoint
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

    const turningPoints = await this.prisma.turningPoint.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return turningPoints
  }

  async findOne(userId: string, projectId: string, turningPointId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const turningPoint = await this.prisma.turningPoint.findUnique({
      where: { id: turningPointId },
    })

    if (!turningPoint) {
      throw new NotFoundException('转折点不存在')
    }

    if (turningPoint.projectId !== projectId) {
      throw new NotFoundException('转折点不属于此项目')
    }

    return turningPoint
  }

  async update(
    userId: string,
    projectId: string,
    turningPointId: string,
    updateTurningPointDto: UpdateTurningPointDto,
  ) {
    const turningPoint = await this.findOne(userId, projectId, turningPointId)

    const updatedTurningPoint = await this.prisma.turningPoint.update({
      where: { id: turningPointId },
      data: updateTurningPointDto,
    })

    return updatedTurningPoint
  }

  async remove(userId: string, projectId: string, turningPointId: string) {
    const turningPoint = await this.findOne(userId, projectId, turningPointId)

    await this.prisma.turningPoint.delete({
      where: { id: turningPointId },
    })

    const remainingTurningPoints = await this.prisma.turningPoint.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingTurningPoints.length; i++) {
      if (remainingTurningPoints[i].order !== i) {
        await this.prisma.turningPoint.update({
          where: { id: remainingTurningPoints[i].id },
          data: { order: i },
        })
      }
    }

    return { message: '转折点已删除' }
  }

  async reorder(userId: string, projectId: string, reorderDto: ReorderTurningPointsDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限修改此项目')
    }

    const turningPoints = await this.prisma.turningPoint.findMany({
      where: { projectId },
    })

    const turningPointMap = new Map(turningPoints.map((tp) => [tp.id, tp]))

    for (const turningPointId of reorderDto.turningPointIds) {
      if (!turningPointMap.has(turningPointId)) {
        throw new NotFoundException(`转折点 ${turningPointId} 不存在`)
      }
    }

    await this.prisma.$transaction(
      reorderDto.turningPointIds.map((turningPointId, index) =>
        this.prisma.turningPoint.update({
          where: { id: turningPointId },
          data: { order: index },
        }),
      ),
    )

    const reorderedTurningPoints = await this.prisma.turningPoint.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return reorderedTurningPoints
  }
}
