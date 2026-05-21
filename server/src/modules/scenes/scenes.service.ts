import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateSceneDto, UpdateSceneDto, ReorderScenesDto } from './dto'

@Injectable()
export class ScenesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, createSceneDto: CreateSceneDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限在此项目中创建场景')
    }

    const lastScene = await this.prisma.scene.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    const order = createSceneDto.order ?? (lastScene ? lastScene.order + 1 : 0)

    const scene = await this.prisma.scene.create({
      data: {
        title: createSceneDto.title,
        summary: createSceneDto.summary,
        location: createSceneDto.location,
        timePeriod: createSceneDto.timePeriod,
        characters: createSceneDto.characters,
        content: createSceneDto.content,
        order,
        project: { connect: { id: projectId } },
      },
    })

    return scene
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

    const scenes = await this.prisma.scene.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return scenes
  }

  async findOne(userId: string, projectId: string, sceneId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const scene = await this.prisma.scene.findUnique({
      where: { id: sceneId },
    })

    if (!scene) {
      throw new NotFoundException('场景不存在')
    }

    if (scene.projectId !== projectId) {
      throw new NotFoundException('场景不属于此项目')
    }

    return scene
  }

  async update(
    userId: string,
    projectId: string,
    sceneId: string,
    updateSceneDto: UpdateSceneDto,
  ) {
    const scene = await this.findOne(userId, projectId, sceneId)

    const updatedScene = await this.prisma.scene.update({
      where: { id: sceneId },
      data: updateSceneDto,
    })

    return updatedScene
  }

  async remove(userId: string, projectId: string, sceneId: string) {
    const scene = await this.findOne(userId, projectId, sceneId)

    await this.prisma.scene.delete({
      where: { id: sceneId },
    })

    const remainingScenes = await this.prisma.scene.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingScenes.length; i++) {
      if (remainingScenes[i].order !== i) {
        await this.prisma.scene.update({
          where: { id: remainingScenes[i].id },
          data: { order: i },
        })
      }
    }

    return { message: '场景已删除' }
  }

  async reorder(userId: string, projectId: string, reorderDto: ReorderScenesDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限修改此项目')
    }

    const scenes = await this.prisma.scene.findMany({
      where: { projectId },
    })

    const sceneMap = new Map(scenes.map((s) => [s.id, s]))

    for (const sceneId of reorderDto.sceneIds) {
      if (!sceneMap.has(sceneId)) {
        throw new NotFoundException(`场景 ${sceneId} 不存在`)
      }
    }

    await this.prisma.$transaction(
      reorderDto.sceneIds.map((sceneId, index) =>
        this.prisma.scene.update({
          where: { id: sceneId },
          data: { order: index },
        }),
      ),
    )

    const reorderedScenes = await this.prisma.scene.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return reorderedScenes
  }
}
