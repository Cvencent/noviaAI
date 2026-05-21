import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  CreateChapterDto,
  UpdateChapterDto,
  AddContentDto,
  AddSummaryDto,
  ReorderChaptersDto,
  UpdateContentDto,
} from './dto'

@Injectable()
export class ChaptersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, projectId: string, createChapterDto: CreateChapterDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限在此项目中创建章节')
    }

    const lastChapter = await this.prisma.chapter.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })

    const order = createChapterDto.order ?? (lastChapter ? lastChapter.order + 1 : 0)

    const chapter = await this.prisma.chapter.create({
      data: {
        ...createChapterDto,
        order,
        projectId,
      },
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return chapter
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

    const chapters = await this.prisma.chapter.findMany({
      where: { projectId },
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return chapters
  }

  async findOne(userId: string, projectId: string, chapterId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!chapter) {
      throw new NotFoundException('章节不存在')
    }

    if (chapter.projectId !== projectId) {
      throw new NotFoundException('章节不属于此项目')
    }

    return chapter
  }

  async update(
    userId: string,
    projectId: string,
    chapterId: string,
    updateChapterDto: UpdateChapterDto,
  ) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    const updatedChapter = await this.prisma.chapter.update({
      where: { id: chapterId },
      data: updateChapterDto,
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return updatedChapter
  }

  async remove(userId: string, projectId: string, chapterId: string) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    await this.prisma.chapter.delete({
      where: { id: chapterId },
    })

    const remainingChapters = await this.prisma.chapter.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingChapters.length; i++) {
      if (remainingChapters[i].order !== i) {
        await this.prisma.chapter.update({
          where: { id: remainingChapters[i].id },
          data: { order: i },
        })
      }
    }

    return { message: '章节已删除' }
  }

  async reorder(userId: string, projectId: string, reorderDto: ReorderChaptersDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限修改此项目')
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { projectId },
    })

    const chapterMap = new Map(chapters.map((c) => [c.id, c]))

    for (const chapterId of reorderDto.chapterIds) {
      if (!chapterMap.has(chapterId)) {
        throw new NotFoundException(`章节 ${chapterId} 不存在`)
      }
    }

    await this.prisma.$transaction(
      reorderDto.chapterIds.map((chapterId, index) =>
        this.prisma.chapter.update({
          where: { id: chapterId },
          data: { order: index },
        }),
      ),
    )

    const reorderedChapters = await this.prisma.chapter.findMany({
      where: { projectId },
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return reorderedChapters
  }

  async addContent(userId: string, projectId: string, chapterId: string, addContentDto: AddContentDto) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    const content = await this.prisma.chapterContent.create({
      data: {
        ...addContentDto,
        chapterId,
      },
    })

    const wordCount = await this.calculateWordCount(chapterId)
    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: { wordCount },
    })

    return content
  }

  async updateAllContents(
    userId: string,
    projectId: string,
    chapterId: string,
    body: { title: string; contents: Array<{ content: string; order: number }> },
  ) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    // 更新标题
    if (body.title) {
      await this.prisma.chapter.update({
        where: { id: chapterId },
        data: { title: body.title },
      })
    }

    // 删除旧内容
    await this.prisma.chapterContent.deleteMany({
      where: { chapterId },
    })

    // 添加新内容
    if (body.contents && body.contents.length > 0) {
      await this.prisma.chapterContent.createMany({
        data: body.contents.map((c) => ({
          chapterId,
          content: c.content,
          order: c.order,
        })),
      })
    }

    // 重新计算字数
    const wordCount = await this.calculateWordCount(chapterId)
    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: { wordCount },
    })

    // 返回更新后的章节
    return this.findOne(userId, projectId, chapterId)
  }

  async updateContent(
    userId: string,
    projectId: string,
    chapterId: string,
    contentId: string,
    updateContentDto: UpdateContentDto,
  ) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    const existingContent = await this.prisma.chapterContent.findUnique({
      where: { id: contentId },
    })

    if (!existingContent) {
      throw new NotFoundException('内容不存在')
    }

    if (existingContent.chapterId !== chapterId) {
      throw new NotFoundException('内容不属于此章节')
    }

    const content = await this.prisma.chapterContent.update({
      where: { id: contentId },
      data: updateContentDto,
    })

    const wordCount = await this.calculateWordCount(chapterId)
    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: { wordCount },
    })

    return content
  }

  async removeContent(userId: string, projectId: string, chapterId: string, contentId: string) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    const existingContent = await this.prisma.chapterContent.findUnique({
      where: { id: contentId },
    })

    if (!existingContent) {
      throw new NotFoundException('内容不存在')
    }

    if (existingContent.chapterId !== chapterId) {
      throw new NotFoundException('内容不属于此章节')
    }

    await this.prisma.chapterContent.delete({
      where: { id: contentId },
    })

    const remainingContents = await this.prisma.chapterContent.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
    })

    for (let i = 0; i < remainingContents.length; i++) {
      if (remainingContents[i].order !== i) {
        await this.prisma.chapterContent.update({
          where: { id: remainingContents[i].id },
          data: { order: i },
        })
      }
    }

    const wordCount = await this.calculateWordCount(chapterId)
    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: { wordCount },
    })

    return { message: '内容已删除' }
  }

  async addSummary(userId: string, projectId: string, chapterId: string, addSummaryDto: AddSummaryDto) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    const summary = await this.prisma.chapterSummary.create({
      data: {
        ...addSummaryDto,
        chapterId,
      },
    })

    return summary
  }

  async removeSummary(userId: string, projectId: string, chapterId: string, summaryId: string) {
    const chapter = await this.findOne(userId, projectId, chapterId)

    const existingSummary = await this.prisma.chapterSummary.findUnique({
      where: { id: summaryId },
    })

    if (!existingSummary) {
      throw new NotFoundException('摘要不存在')
    }

    if (existingSummary.chapterId !== chapterId) {
      throw new NotFoundException('摘要不属于此章节')
    }

    await this.prisma.chapterSummary.delete({
      where: { id: summaryId },
    })

    return { message: '摘要已删除' }
  }

  private async calculateWordCount(chapterId: string): Promise<number> {
    const contents = await this.prisma.chapterContent.findMany({
      where: { chapterId },
    })

    let totalWords = 0
    for (const content of contents) {
      const words = content.content.trim().split(/\s+/).filter(Boolean).length
      totalWords += words
    }

    return totalWords
  }

  async getChapterWordCount(userId: string, projectId: string, chapterId: string): Promise<number> {
    const chapter = await this.findOne(userId, projectId, chapterId)
    return chapter.wordCount
  }

  async getProjectWordCount(userId: string, projectId: string): Promise<number> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { projectId },
    })

    return chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  }
}
