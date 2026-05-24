import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateChekhovsGunDto, UpdateChekhovsGunDto } from './dto'

interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

@Injectable()
export class ChekhovsGunsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createChekhovsGunDto: CreateChekhovsGunDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const chekhovsGun = await this.prisma.chekhovsGun.create({
      data: {
        ...createChekhovsGunDto,
        projectId,
      },
      include: {
        setupChapter: true,
        payoffChapter: true,
      },
    })

    return chekhovsGun
  }

  async findAll(projectId: string, pagination?: PaginationOptions) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const page = pagination?.page || 1
    const limit = pagination?.limit || 50
    const skip = (page - 1) * limit

    const [chekhovsGuns, total] = await Promise.all([
      this.prisma.chekhovsGun.findMany({
        where: { projectId },
        include: {
          setupChapter: true,
          payoffChapter: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chekhovsGun.count({
        where: { projectId },
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: chekhovsGuns,
      total,
      page,
      limit,
      totalPages,
    } as PaginatedResult<typeof chekhovsGuns[0]>
  }

  async findAllWithoutPagination(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const chekhovsGuns = await this.prisma.chekhovsGun.findMany({
      where: { projectId },
      include: {
        setupChapter: true,
        payoffChapter: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return chekhovsGuns
  }

  async findOne(projectId: string, gunId: string) {
    const chekhovsGun = await this.prisma.chekhovsGun.findUnique({
      where: { id: gunId },
      include: {
        setupChapter: true,
        payoffChapter: true,
      },
    })

    if (!chekhovsGun) {
      throw new NotFoundException('伏笔不存在')
    }

    if (chekhovsGun.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此伏笔')
    }

    return chekhovsGun
  }

  async update(projectId: string, gunId: string, updateChekhovsGunDto: UpdateChekhovsGunDto) {
    const chekhovsGun = await this.prisma.chekhovsGun.findUnique({
      where: { id: gunId },
    })

    if (!chekhovsGun) {
      throw new NotFoundException('伏笔不存在')
    }

    if (chekhovsGun.projectId !== projectId) {
      throw new ForbiddenException('没有权限修改此伏笔')
    }

    const updatedChekhovsGun = await this.prisma.chekhovsGun.update({
      where: { id: gunId },
      data: updateChekhovsGunDto,
      include: {
        setupChapter: true,
        payoffChapter: true,
      },
    })

    return updatedChekhovsGun
  }

  async remove(projectId: string, gunId: string) {
    const chekhovsGun = await this.prisma.chekhovsGun.findUnique({
      where: { id: gunId },
    })

    if (!chekhovsGun) {
      throw new NotFoundException('伏笔不存在')
    }

    if (chekhovsGun.projectId !== projectId) {
      throw new ForbiddenException('没有权限删除此伏笔')
    }

    await this.prisma.chekhovsGun.delete({
      where: { id: gunId },
    })

    return { message: '伏笔已删除' }
  }
}
