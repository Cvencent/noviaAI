import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  CreateTimelineEventDto,
  UpdateTimelineEventDto,
  ReorderTimelineEventsDto,
} from './dto'

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, createTimelineEventDto: CreateTimelineEventDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限在此项目中创建时间线事件')
    }

    const lastEvent = await this.prisma.timelineEvent.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    const order = createTimelineEventDto.order ?? (lastEvent ? lastEvent.order + 1 : 0)

    const timelineEvent = await this.prisma.timelineEvent.create({
      data: {
        ...createTimelineEventDto,
        order,
        projectId,
      },
    })

    return timelineEvent
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

    const timelineEvents = await this.prisma.timelineEvent.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return timelineEvents
  }

  async findOne(userId: string, projectId: string, eventId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const timelineEvent = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId },
    })

    if (!timelineEvent) {
      throw new NotFoundException('时间线事件不存在')
    }

    if (timelineEvent.projectId !== projectId) {
      throw new NotFoundException('时间线事件不属于此项目')
    }

    return timelineEvent
  }

  async update(
    userId: string,
    projectId: string,
    eventId: string,
    updateTimelineEventDto: UpdateTimelineEventDto,
  ) {
    const timelineEvent = await this.findOne(userId, projectId, eventId)

    const updatedEvent = await this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: updateTimelineEventDto,
    })

    return updatedEvent
  }

  async remove(userId: string, projectId: string, eventId: string) {
    const timelineEvent = await this.findOne(userId, projectId, eventId)

    await this.prisma.timelineEvent.delete({
      where: { id: eventId },
    })

    const remainingEvents = await this.prisma.timelineEvent.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingEvents.length; i++) {
      if (remainingEvents[i].order !== i) {
        await this.prisma.timelineEvent.update({
          where: { id: remainingEvents[i].id },
          data: { order: i },
        })
      }
    }

    return { message: '时间线事件已删除' }
  }

  async reorder(userId: string, projectId: string, reorderDto: ReorderTimelineEventsDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限修改此项目')
    }

    const events = await this.prisma.timelineEvent.findMany({
      where: { projectId },
    })

    const eventMap = new Map(events.map((e) => [e.id, e]))

    for (const eventId of reorderDto.eventIds) {
      if (!eventMap.has(eventId)) {
        throw new NotFoundException(`时间线事件 ${eventId} 不存在`)
      }
    }

    await this.prisma.$transaction(
      reorderDto.eventIds.map((eventId, index) =>
        this.prisma.timelineEvent.update({
          where: { id: eventId },
          data: { order: index },
        }),
      ),
    )

    const reorderedEvents = await this.prisma.timelineEvent.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return reorderedEvents
  }
}
