import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { AiService } from '../ai/ai.service'
import { AIAction } from '../ai-config/dto/create-ai-config.dto'
import {
  CreateOutlineDto,
  UpdateOutlineDto,
  CreateOutlineItemDto,
  UpdateOutlineItemDto,
  ReorderOutlineItemsDto,
  GenerateOutlineDto,
} from './dto'

interface GeneratedOutlineItem {
  title?: string
  summary?: string
  goal?: string
  conflict?: string
  outcome?: string
  povCharacter?: string
  location?: string
  estimatedWords?: number
}

export interface StructureHealthReport {
  outlineId: string
  templateId: string
  coverageScore: number
  pacingScore: number
  missingBeats: string[]
  overloadedBeats: string[]
  suggestions: string[]
}

@Injectable()
export class OutlinesService {
  private outlineAiJobTasks = new Set<Promise<void>>()

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

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

  async generateWithAi(userId: string, projectId: string, generateOutlineDto: GenerateOutlineDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const structureTemplate = generateOutlineDto.structureTemplate || 'THREE_ACT'
    const chapterCount = generateOutlineDto.chapterCount || 12
    const targetWords = generateOutlineDto.targetWords || 80000
    const premise = generateOutlineDto.premise || project.synopsis || '请根据项目信息生成完整故事大纲'
    const prompt = this.buildOutlineGenerationPrompt(project, {
      premise,
      structureTemplate,
      chapterCount,
      targetWords,
    })

    const aiResult = await this.aiService.chat(userId, {
      projectId,
      message: prompt,
      temperature: 0.7,
      action: AIAction.PLOT_SUGGESTION,
    })
    const generatedOutline = this.parseGeneratedOutline(aiResult.response)

    const lastOutline = await this.prisma.outline.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    })
    const order = lastOutline ? lastOutline.order + 1 : 0
    const items = generatedOutline.items.slice(0, chapterCount).map((item, index) => ({
      title: this.normalizeText(item.title, `第 ${index + 1} 章`),
      summary: this.normalizeText(item.summary),
      goal: this.normalizeText(item.goal),
      conflict: this.normalizeText(item.conflict),
      outcome: this.normalizeText(item.outcome),
      povCharacter: this.normalizeText(item.povCharacter),
      location: this.normalizeText(item.location),
      estimatedWords: this.normalizePositiveInt(item.estimatedWords),
      order: index,
    }))

    if (items.length === 0) {
      throw new BadRequestException('AI 未返回可用的大纲条目')
    }

    return this.prisma.outline.create({
      data: {
        projectId,
        title: this.normalizeText(generatedOutline.title, `${this.getTemplateLabel(structureTemplate)}大纲`),
        description: this.normalizeText(generatedOutline.description, `由 AI 根据《${project.title}》生成`),
        structureType: structureTemplate,
        status: 'DRAFT',
        order,
        items: {
          create: items,
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async createOutlineAiJob(userId: string, projectId: string, generateOutlineDto: GenerateOutlineDto) {
    await this.loadProject(userId, projectId)
    const job = await this.createOutlineAiJobRecord({
      data: {
        projectId,
        status: 'RUNNING',
        input: JSON.stringify(generateOutlineDto || {}),
        result: null,
        error: null,
      },
    })
    this.enqueueOutlineAiJob(userId, projectId, job.id, generateOutlineDto || {})
    return job
  }

  async listOutlineAiJobs(userId: string, projectId: string) {
    await this.loadProject(userId, projectId)
    return this.findOutlineAiJobRecords({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  }

  async waitForIdleOutlineAiJobs() {
    await Promise.all([...this.outlineAiJobTasks])
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

  async analyzeStructure(
    userId: string,
    projectId: string,
    outlineId: string,
  ): Promise<StructureHealthReport> {
    const outline = await this.findOne(userId, projectId, outlineId)
    const items = [...outline.items].sort((a, b) => a.order - b.order)

    const suggestions: string[] = []
    let filledFields = 0
    let totalFields = 0
    const requiredFields = ['goal', 'conflict', 'outcome', 'povCharacter'] as const

    items.forEach((item, index) => {
      requiredFields.forEach((field) => {
        totalFields += 1
        if (this.hasValue(item[field])) {
          filledFields += 1
        } else {
          suggestions.push(`第 ${index + 1} 个条目缺少${this.getFieldLabel(field)}，结构推进可能不够清晰。`)
        }
      })
    })

    const missingBeats = this.getMissingBeats(items)
    missingBeats.forEach((beat) => {
      suggestions.push(`缺少${beat}段落，请补充对应的情节功能。`)
    })

    const estimatedWords = items
      .map((item) => item.estimatedWords)
      .filter((words): words is number => typeof words === 'number' && words > 0)
    const pacingScore = this.calculatePacingScore(estimatedWords)
    if (pacingScore < 75) {
      suggestions.push('字数分配差异过大，建议拆分过重章节或增强过轻章节的叙事任务。')
    }

    const overloadedBeats = items
      .filter((item) => item.estimatedWords && estimatedWords.length > 0 && item.estimatedWords > this.average(estimatedWords) * 1.5)
      .map((item) => item.title)

    const coverageScore = totalFields === 0
      ? 0
      : Math.max(0, Math.round((filledFields / totalFields) * 100) - missingBeats.length * 8)

    return {
      outlineId,
      templateId: outline.structureType,
      coverageScore,
      pacingScore,
      missingBeats,
      overloadedBeats,
      suggestions: suggestions.slice(0, 12),
    }
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

  private buildOutlineGenerationPrompt(
    project: any,
    options: {
      premise: string
      structureTemplate: string
      chapterCount: number
      targetWords: number
    },
  ) {
    return `你是专业长篇小说结构编辑。请基于项目信息生成可直接导入系统的大纲。

项目信息：
- 标题：${project.title}
- 类型：${project.genre || '未指定'}
- 简介：${project.synopsis || '未填写'}
- 用户补充：${options.premise}

结构模板：${this.getTemplateLabel(options.structureTemplate)}
章节数量：${options.chapterCount}
目标总字数：${options.targetWords}

只返回 JSON，不要 Markdown，不要解释。格式如下：
{
  "title": "大纲标题",
  "description": "一句话说明此大纲的结构策略",
  "items": [
    {
      "title": "章节或节拍标题",
      "summary": "本节摘要",
      "goal": "叙事目标",
      "conflict": "核心冲突",
      "outcome": "结尾结果或钩子",
      "povCharacter": "视角人物",
      "location": "主要场景",
      "estimatedWords": 3000
    }
  ]
}

要求：
1. items 数量必须等于 ${options.chapterCount}。
2. 每个条目都要有明确 goal、conflict、outcome。
3. estimatedWords 加总尽量接近 ${options.targetWords}。
4. 结构要符合${this.getTemplateLabel(options.structureTemplate)}，包含开端、推进、转折、高潮和回收。`
  }

  private async loadProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }
    return project
  }

  private enqueueOutlineAiJob(
    userId: string,
    projectId: string,
    jobId: string,
    input: GenerateOutlineDto,
  ) {
    const task = this.runOutlineAiJob(userId, projectId, jobId, input)
      .catch(() => undefined)
      .finally(() => {
        this.outlineAiJobTasks.delete(task)
      })
    this.outlineAiJobTasks.add(task)
  }

  private async runOutlineAiJob(
    userId: string,
    projectId: string,
    jobId: string,
    input: GenerateOutlineDto,
  ) {
    try {
      const outline = await this.generateWithAi(userId, projectId, input)
      await this.updateOutlineAiJobRecord({
        where: { id: jobId },
        data: {
          status: 'DONE',
          result: JSON.stringify({ outline }),
          error: null,
        },
      })
    } catch (error: any) {
      await this.updateOutlineAiJobRecord({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error?.message || 'AI 大纲任务失败',
        },
      })
    }
  }

  private async createOutlineAiJobRecord(args: any) {
    const delegate = (this.prisma as any).outlineAiJob
    if (delegate) {
      return delegate.create(args)
    }

    const id = randomUUID()
    const now = new Date()
    await this.prisma.$executeRaw`
      INSERT INTO "OutlineAiJob" ("id", "projectId", "status", "input", "result", "error", "updatedAt")
      VALUES (${id}, ${args.data.projectId}, ${args.data.status}, ${args.data.input}, ${args.data.result}, ${args.data.error}, ${now})
    `
    return { id, ...args.data, createdAt: now, updatedAt: now }
  }

  private async findOutlineAiJobRecords(args: any) {
    const delegate = (this.prisma as any).outlineAiJob
    if (delegate) {
      return delegate.findMany(args)
    }

    return this.prisma.$queryRaw`
      SELECT "id", "projectId", "status", "input", "result", "error", "createdAt", "updatedAt"
      FROM "OutlineAiJob"
      WHERE "projectId" = ${args.where.projectId}
      ORDER BY "createdAt" DESC
      LIMIT ${args.take || 10}
    `
  }

  private async updateOutlineAiJobRecord(args: any) {
    const delegate = (this.prisma as any).outlineAiJob
    if (delegate) {
      return delegate.update(args)
    }

    const now = new Date()
    await this.prisma.$executeRaw`
      UPDATE "OutlineAiJob"
      SET "status" = ${args.data.status},
          "result" = ${args.data.result ?? null},
          "error" = ${args.data.error ?? null},
          "updatedAt" = ${now}
      WHERE "id" = ${args.where.id}
    `
    return { id: args.where.id, ...args.data, updatedAt: now }
  }

  private parseGeneratedOutline(response: string): {
    title?: string
    description?: string
    items: GeneratedOutlineItem[]
  } {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new BadRequestException('AI 返回内容不是有效 JSON')
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed.items)) {
        throw new Error('items must be an array')
      }
      return parsed
    } catch {
      throw new BadRequestException('无法解析 AI 生成的大纲 JSON')
    }
  }

  private normalizeText(value: unknown, fallback?: string) {
    if (typeof value !== 'string') {
      return fallback
    }
    const trimmed = value.trim()
    return trimmed || fallback
  }

  private normalizePositiveInt(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return undefined
    }
    return Math.round(value)
  }

  private hasValue(value: unknown) {
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  }

  private getFieldLabel(field: 'goal' | 'conflict' | 'outcome' | 'povCharacter') {
    const labels = {
      goal: '目标',
      conflict: '冲突',
      outcome: '结局',
      povCharacter: '视角人物',
    }
    return labels[field]
  }

  private getMissingBeats(items: Array<{ title: string; summary?: string; outcome?: string }>) {
    const text = items
      .map((item) => `${item.title} ${item.summary || ''} ${item.outcome || ''}`)
      .join('\n')
    const beats: Array<{ label: string; pattern: RegExp }> = [
      { label: '开端/诱因', pattern: /开端|诱因|引子|触发|起点|开局/ },
      { label: '中段转折', pattern: /转折|反转|中点|危机|真相|代价/ },
      { label: '高潮', pattern: /高潮|决战|爆发|最终|对决/ },
      { label: '结局/回收', pattern: /结局|回收|解决|尾声|终局|收束/ },
    ]

    return beats.filter((beat) => !beat.pattern.test(text)).map((beat) => beat.label)
  }

  private calculatePacingScore(words: number[]) {
    if (words.length < 2) {
      return 100
    }
    const avg = this.average(words)
    if (avg <= 0) {
      return 100
    }
    const maxDeviation = Math.max(...words.map((wordCount) => Math.abs(wordCount - avg) / avg))
    return Math.max(0, Math.round(100 - maxDeviation * 100))
  }

  private average(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  private getTemplateLabel(template: string) {
    const labels: Record<string, string> = {
      THREE_ACT: '三幕式',
      HERO_JOURNEY: '英雄之旅',
      KISHOTENKETSU: '起承转合',
      SAVE_THE_CAT: 'Save the Cat 15 节拍',
      SEVEN_POINT: '七点故事结构',
    }
    return labels[template] || template
  }
}
