import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface LoreEntryWithKeywords {
  id: string
  name: string
  category: string
  description: string
  content?: string
  keywords: string[]
  priority: number
  isActive: boolean
  order: number
  triggerCondition?: string
  relatedCharacterIds?: string[]
  relatedLocationIds?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface LoreMatchResult {
  entry: LoreEntryWithKeywords
  matchedKeywords: string[]
  relevanceScore: number
}

@Injectable()
export class LorebookService {
  constructor(private prisma: PrismaService) {}

  async createLoreEntry(
    projectId: string,
    data: {
      name: string
      category: string
      description: string
      content?: string
      keywords: string[]
      priority?: number
      triggerCondition?: string
      relatedCharacterIds?: string[]
      relatedLocationIds?: string[]
    }
  ) {
    return this.prisma.loreEntry.create({
      data: {
        projectId,
        name: data.name,
        category: data.category,
        description: data.description,
        content: data.content,
        keywords: data.keywords.join(','),
        priority: data.priority || 50,
        isActive: true,
        triggerCondition: data.triggerCondition,
        relatedCharacterIds: data.relatedCharacterIds?.join(','),
        relatedLocationIds: data.relatedLocationIds?.join(','),
      },
    })
  }

  async updateLoreEntry(
    entryId: string,
    data: {
      name?: string
      category?: string
      description?: string
      content?: string
      keywords?: string[]
      priority?: number
      isActive?: boolean
      triggerCondition?: string
      relatedCharacterIds?: string[]
      relatedLocationIds?: string[]
    }
  ) {
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.description !== undefined) updateData.description = data.description
    if (data.content !== undefined) updateData.content = data.content
    if (data.keywords !== undefined) updateData.keywords = data.keywords.join(',')
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.triggerCondition !== undefined) updateData.triggerCondition = data.triggerCondition
    if (data.relatedCharacterIds !== undefined) 
      updateData.relatedCharacterIds = data.relatedCharacterIds.join(',')
    if (data.relatedLocationIds !== undefined) 
      updateData.relatedLocationIds = data.relatedLocationIds.join(',')

    return this.prisma.loreEntry.update({
      where: { id: entryId },
      data: updateData,
    })
  }

  async deleteLoreEntry(entryId: string) {
    return this.prisma.loreEntry.delete({
      where: { id: entryId },
    })
  }

  async getLoreEntries(projectId: string, category?: string) {
    const where: any = { projectId, isActive: true }
    if (category) where.category = category

    const entries = await this.prisma.loreEntry.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
    })

    return entries.map(entry => this.normalizeLoreEntry(entry))
  }

  async getLoreEntryById(entryId: string) {
    const entry = await this.prisma.loreEntry.findUnique({
      where: { id: entryId },
    })
    return entry ? this.normalizeLoreEntry(entry) : null
  }

  /**
   * 核心功能：根据文本内容匹配相关的Lore条目
   * 类似于NovelAI的Lorebook关键词触发机制
   */
  async matchLoreToText(
    projectId: string,
    text: string,
    options?: {
      maxResults?: number
      minScore?: number
      includeCategories?: string[]
    }
  ): Promise<LoreMatchResult[]> {
    const maxResults = options?.maxResults || 10
    const minScore = options?.minScore || 0

    const where: any = { projectId, isActive: true }
    if (options?.includeCategories?.length > 0) {
      where.category = { in: options.includeCategories }
    }

    const entries = await this.prisma.loreEntry.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { order: 'asc' }],
    })

    const matches: LoreMatchResult[] = []

    for (const rawEntry of entries) {
      const entry = this.normalizeLoreEntry(rawEntry)
      const matchedKeywords: string[] = []

      // 匹配关键词
      for (const keyword of entry.keywords) {
        if (keyword.trim() === '') continue
        // 不区分大小写的匹配
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
        }
      }

      if (matchedKeywords.length > 0) {
        // 计算相关性分数
        // 关键词数量 + 优先级权重
        const score = matchedKeywords.length + (entry.priority / 100)

        if (score >= minScore) {
          matches.push({
            entry,
            matchedKeywords,
            relevanceScore: score,
          })
        }
      }
    }

    // 按分数排序，返回前N个
    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults)
  }

  /**
   * 生成Lorebook上下文提示词
   * 将匹配到的Lore条目整合成AI可用的上下文
   */
  async generateLoreContext(
    projectId: string,
    text: string,
    options?: {
      maxEntries?: number
      format?: 'compact' | 'detailed'
    }
  ): Promise<string> {
    const matches = await this.matchLoreToText(projectId, text, {
      maxResults: options?.maxEntries || 8,
    })

    if (matches.length === 0) {
      return ''
    }

    const format = options?.format || 'compact'

    if (format === 'compact') {
      return matches
        .map(
          (match) =>
            `【${match.entry.category}】${match.entry.name}: ${match.entry.description}`
        )
        .join('\n')
    } else {
      return matches
        .map((match) => {
          let entryText = `【${match.entry.category}】${match.entry.name}\n`
          entryText += `描述: ${match.entry.description}\n`
          if (match.entry.content) {
            entryText += `详细: ${match.entry.content}\n`
          }
          entryText += `匹配关键词: ${match.matchedKeywords.join(', ')}`
          return entryText
        })
        .join('\n\n')
    }
  }

  /**
   * 记录Lore的使用情况
   */
  async recordLoreUsage(
    entryId: string,
    chapterId: string | undefined,
    content: string,
    context?: string
  ) {
    return this.prisma.loreUsage.create({
      data: {
        loreEntryId: entryId,
        chapterId,
        content,
        context,
      },
    })
  }

  /**
   * 获取Lore的使用统计
   */
  async getLoreUsageStats(projectId: string) {
    const entries = await this.prisma.loreEntry.findMany({
      where: { projectId },
      include: { usages: true },
    })

    return entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      usageCount: entry.usages.length,
      lastUsedAt:
        entry.usages.length > 0
          ? entry.usages.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )[0].createdAt
          : null,
    }))
  }

  private normalizeLoreEntry(entry: any): LoreEntryWithKeywords {
    return {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      description: entry.description,
      content: entry.content,
      keywords: entry.keywords ? entry.keywords.split(',') : [],
      priority: entry.priority,
      isActive: entry.isActive,
      order: entry.order,
      triggerCondition: entry.triggerCondition,
      relatedCharacterIds: entry.relatedCharacterIds
        ? entry.relatedCharacterIds.split(',')
        : undefined,
      relatedLocationIds: entry.relatedLocationIds
        ? entry.relatedLocationIds.split(',')
        : undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }
  }
}
