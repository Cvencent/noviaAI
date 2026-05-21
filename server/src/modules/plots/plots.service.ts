import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePlotDto, UpdatePlotDto, CreatePlotPointDto, UpdatePlotPointDto } from './dto'

@Injectable()
export class PlotsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createPlotDto: CreatePlotDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const plot = await this.prisma.plot.create({
      data: {
        ...createPlotDto,
        projectId,
      },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return plot
  }

  async findAll(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const plots = await this.prisma.plot.findMany({
      where: { projectId },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return plots
  }

  async findOne(projectId: string, plotId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此情节线')
    }

    return plot
  }

  async update(projectId: string, plotId: string, updatePlotDto: UpdatePlotDto) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限修改此情节线')
    }

    const updatedPlot = await this.prisma.plot.update({
      where: { id: plotId },
      data: updatePlotDto,
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return updatedPlot
  }

  async remove(projectId: string, plotId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限删除此情节线')
    }

    await this.prisma.plot.delete({
      where: { id: plotId },
    })

    return { message: '情节线已删除' }
  }

  async addPlotPoint(projectId: string, plotId: string, createPlotPointDto: CreatePlotPointDto) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: {
        plotPoints: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此情节线')
    }

    const maxOrder = plot.plotPoints[0]?.order ?? 0
    const order = createPlotPointDto.order ?? maxOrder + 1

    const plotPoint = await this.prisma.plotPoint.create({
      data: {
        ...createPlotPointDto,
        order,
        plotId,
      },
    })

    return plotPoint
  }

  async updatePlotPoint(
    projectId: string,
    plotId: string,
    pointId: string,
    updatePlotPointDto: UpdatePlotPointDto,
  ) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此情节线')
    }

    const plotPoint = await this.prisma.plotPoint.findUnique({
      where: { id: pointId },
    })

    if (!plotPoint) {
      throw new NotFoundException('情节点不存在')
    }

    if (plotPoint.plotId !== plotId) {
      throw new ForbiddenException('情节点不属于此情节线')
    }

    const updatedPoint = await this.prisma.plotPoint.update({
      where: { id: pointId },
      data: updatePlotPointDto,
    })

    return updatedPoint
  }

  async removePlotPoint(projectId: string, plotId: string, pointId: string) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此情节线')
    }

    const plotPoint = await this.prisma.plotPoint.findUnique({
      where: { id: pointId },
    })

    if (!plotPoint) {
      throw new NotFoundException('情节点不存在')
    }

    if (plotPoint.plotId !== plotId) {
      throw new ForbiddenException('情节点不属于此情节线')
    }

    await this.prisma.plotPoint.delete({
      where: { id: pointId },
    })

    return { message: '情节点已删除' }
  }

  async reorderPlotPoints(projectId: string, plotId: string, pointIds: string[]) {
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: { plotPoints: true },
    })

    if (!plot) {
      throw new NotFoundException('情节线不存在')
    }

    if (plot.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此情节线')
    }

    const updates = pointIds.map((pointId, index) =>
      this.prisma.plotPoint.update({
        where: { id: pointId },
        data: { order: index + 1 },
      }),
    )

    await this.prisma.$transaction(updates)

    return this.findOne(projectId, plotId)
  }
}
