import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateProjectDto, UpdateProjectDto } from './dto'

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        subtitle: createProjectDto.subtitle,
        synopsis: createProjectDto.synopsis || '',
        genre: createProjectDto.genre,
        tags: createProjectDto.tags || '',
        status: createProjectDto.status,
        wordCount: createProjectDto.wordCount,
        userId,
      },
    })
    return project
  }

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
    return projects
  }

  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        worldSettings: {
          include: {
            items: true,
          },
        },
        characters: {
          include: {
            relationshipsFrom: true,
            relationshipsTo: true,
          },
        },
        scenes: {
          orderBy: {
            order: 'asc',
          },
        },
        plots: {
          include: {
            plotPoints: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        chapters: {
          include: {
            contents: {
              orderBy: {
                order: 'asc',
              },
            },
            summaries: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    return project
  }

  async update(userId: string, projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限修改此项目')
    }

    const updatedProject = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: updateProjectDto,
    })

    return updatedProject
  }

  async remove(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限删除此项目')
    }

    await this.prisma.project.delete({
      where: {
        id: projectId,
      },
    })

    return { message: '项目已删除' }
  }

  async exportProject(userId: string, projectId: string) {
    const project = await this.findOne(userId, projectId)
    return project
  }

  async importProject(userId: string, jsonData: any) {
    const {
      title,
      subtitle,
      synopsis,
      genre,
      tags,
      status,
      wordCount,
      worldSettings,
      characters,
      scenes,
      plots,
      chapters,
    } = jsonData

    const project = await this.prisma.project.create({
      data: {
        userId,
        title,
        subtitle,
        synopsis,
        genre,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
        status: status || 'IDEATION',
        wordCount: wordCount || 0,
        worldSettings: worldSettings ? {
          create: worldSettings.map((ws: any) => ({
            category: ws.category,
            name: ws.name,
            description: ws.description,
            items: ws.items ? {
              create: ws.items.map((item: any) => ({
                name: item.name,
                description: item.description,
                details: typeof item.details === 'object' ? JSON.stringify(item.details) : item.details,
              })),
            } : undefined,
          })),
        } : undefined,
        characters: characters ? {
          create: characters.map((char: any) => ({
            name: char.name,
            role: char.role,
            appearance: char.appearance,
            personality: char.personality,
            background: char.background,
            goals: char.goals,
            flaws: char.flaws,
            arc: char.arc,
            voice: char.voice,
            notes: char.notes,
          })),
        } : undefined,
        scenes: scenes ? {
          create: scenes.map((scene: any) => ({
            title: scene.title,
            summary: scene.summary,
            location: scene.location,
            timePeriod: scene.timePeriod,
            characters: Array.isArray(scene.characters) ? scene.characters.join(',') : (scene.characters || ''),
            content: scene.content,
            order: scene.order,
          })),
        } : undefined,
        plots: plots ? {
          create: plots.map((plot: any) => ({
            title: plot.title,
            description: plot.description,
            status: plot.status || 'ACTIVE',
            plotPoints: plot.plotPoints ? {
              create: plot.plotPoints.map((pp: any) => ({
                title: pp.title,
                type: pp.type,
                description: pp.description,
                order: pp.order,
              })),
            } : undefined,
          })),
        } : undefined,
        chapters: chapters ? {
          create: chapters.map((chapter: any) => ({
            title: chapter.title,
            order: chapter.order,
            status: chapter.status || 'DRAFT',
            wordCount: chapter.wordCount || 0,
            summary: chapter.summary,
            contents: chapter.contents ? {
              create: chapter.contents.map((content: any) => ({
                content: content.content,
                order: content.order,
              })),
            } : undefined,
            summaries: chapter.summaries ? {
              create: chapter.summaries.map((sum: any) => ({
                summary: sum.summary,
              })),
            } : undefined,
          })),
        } : undefined,
      },
    })

    return project
  }
}
