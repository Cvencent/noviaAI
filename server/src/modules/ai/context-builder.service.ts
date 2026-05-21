import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ProgressiveCharacterContextService } from '../characters/progressive-character-context.service'
import { DEFAULT_ANTI_AI_RULES } from '../../common/constants/anti-ai-rules'

export interface ContextPreviewSection {
  id: string
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string
  items: string[]
  tokenEstimate: number
}

export interface ContextPreview {
  projectId: string
  chapterId?: string
  sections: ContextPreviewSection[]
  totalTokenEstimate: number
  warnings: string[]
}

@Injectable()
export class ContextBuilderService {
  constructor(
    private prisma: PrismaService,
    private progressiveContext: ProgressiveCharacterContextService,
  ) {}

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 2)
  }

  async buildContextPreview(
    projectId: string,
    userId: string,
    options: { chapterId?: string; currentText?: string } = {},
  ): Promise<ContextPreview> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    const sections: ContextPreviewSection[] = []
    const warnings: string[] = []

    // Project section
    const projectItems: string[] = [`标题：${project.title}`]
    if (project.genre) projectItems.push(`类型：${project.genre}`)
    if (project.synopsis) projectItems.push(`简介：${project.synopsis}`)
    sections.push({
      id: 'project',
      title: '项目信息',
      priority: 'critical',
      source: 'project',
      items: projectItems,
      tokenEstimate: this.estimateTokens(projectItems.join('\n')),
    })

    // Lorebook section
    const loreEntries = await this.prisma.loreEntry.findMany({
      where: { projectId, isActive: true },
      orderBy: { priority: 'desc' },
    })

    let matchedEntries: typeof loreEntries
    if (options.currentText && options.currentText.trim().length > 0) {
      const textLower = options.currentText.toLowerCase()
      matchedEntries = loreEntries.filter((entry) => {
        const keywords = entry.keywords
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0)
        return keywords.some((kw) => textLower.includes(kw))
      })
    } else {
      matchedEntries = loreEntries.slice(0, 10)
    }

    const loreItems = matchedEntries.map(
      (entry) => `[${entry.category}] ${entry.name}：${entry.description}`,
    )
    sections.push({
      id: 'lorebook',
      title: 'Lorebook 设定',
      priority: 'high',
      source: 'loreEntry',
      items: loreItems,
      tokenEstimate: this.estimateTokens(loreItems.join('\n')),
    })

    // Structure section
    const [chekhovsGuns, outlines, turningPoints, timelineEvents] = await Promise.all([
      this.prisma.chekhovsGun.findMany({ where: { projectId } }),
      this.prisma.outline.findMany({ where: { projectId }, include: { items: true } }),
      this.prisma.turningPoint.findMany({ where: { projectId }, orderBy: { order: 'asc' } }),
      this.prisma.timelineEvent.findMany({ where: { projectId }, orderBy: { order: 'asc' } }),
    ])

    const structureItems: string[] = []
    for (const gun of chekhovsGuns) {
      structureItems.push(`契诃夫之枪：${gun.name}（${gun.status}）— ${gun.description}`)
    }
    for (const outline of outlines) {
      structureItems.push(`大纲：${outline.title}`)
      if (outline.items) {
        for (const item of outline.items) {
          structureItems.push(`  - ${item.title}${item.goal ? `：${item.goal}` : ''}`)
        }
      }
    }
    for (const tp of turningPoints) {
      structureItems.push(`转折点：${tp.title}（${tp.type}）${tp.description ? `— ${tp.description}` : ''}`)
    }
    for (const te of timelineEvents) {
      structureItems.push(`时间线：${te.title}${te.timeLabel ? `（${te.timeLabel}）` : ''}${te.description ? `— ${te.description}` : ''}`)
    }
    sections.push({
      id: 'structure',
      title: '结构与剧情',
      priority: 'high',
      source: 'chekhovsGun,outline,turningPoint,timelineEvent',
      items: structureItems,
      tokenEstimate: this.estimateTokens(structureItems.join('\n')),
    })

    // Style section
    const styleItems: string[] = []
    if (project.currentWritingStyleId) {
      const customStyle = await this.prisma.customWritingStyle.findUnique({
        where: { id: project.currentWritingStyleId },
      })
      if (customStyle) {
        styleItems.push(`写作风格：${customStyle.name}`)
        if (customStyle.description) styleItems.push(`描述：${customStyle.description}`)
        if (customStyle.config) styleItems.push(`配置：${customStyle.config}`)
      }
    }
    if (project.writingStyleConfig) {
      styleItems.push(`风格参数：${project.writingStyleConfig}`)
    }
    if (styleItems.length === 0) {
      styleItems.push('未配置写作风格')
    }
    sections.push({
      id: 'style',
      title: '写作风格',
      priority: 'medium',
      source: 'customWritingStyle,project',
      items: styleItems,
      tokenEstimate: this.estimateTokens(styleItems.join('\n')),
    })

    // Character voice section
    const characters = await this.prisma.character.findMany({
      where: { projectId, voice: { not: null } },
    })
    const voiceItems = characters.map((char) => `${char.name}：${char.voice}`)
    sections.push({
      id: 'character-voice',
      title: '角色语言风格',
      priority: 'medium',
      source: 'character',
      items: voiceItems,
      tokenEstimate: this.estimateTokens(voiceItems.join('\n')),
    })

    // Anti-AI rules section
    sections.push({
      id: 'anti-ai-rules',
      title: '反 AI 味约束',
      priority: 'high',
      source: 'default',
      items: [...DEFAULT_ANTI_AI_RULES],
      tokenEstimate: this.estimateTokens(DEFAULT_ANTI_AI_RULES.join('\n')),
    })

    const totalTokenEstimate = sections.reduce((sum, s) => sum + s.tokenEstimate, 0)

    return {
      projectId,
      chapterId: options.chapterId,
      sections,
      totalTokenEstimate,
      warnings,
    }
  }

  formatContextPreviewForPrompt(preview: ContextPreview): string {
    return preview.sections
      .filter((section) => section.items.length > 0)
      .map(
        (section) =>
          `## ${section.title}\n${section.items.map((item) => `- ${item}`).join('\n')}`,
      )
      .join('\n\n')
  }

  async buildWritingContext(
    projectId: string,
    currentContent?: string,
    options?: {
      useProgressiveCharacterContext?: boolean
      maxCharacterTokens?: number
      characterPriority?: 'basic' | 'standard' | 'detailed'
    },
  ): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        worldSettings: {
          include: { items: true },
        },
        chapters: {
          include: {
            contents: {
              orderBy: { order: 'asc' },
            },
            summaries: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { order: 'asc' },
        },
        plots: {
          include: {
            plotPoints: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!project) {
      return ''
    }

    let context = `# 项目信息\n`
    context += `标题：${project.title}\n`
    if (project.subtitle) context += `副标题：${project.subtitle}\n`
    if (project.synopsis) context += `简介：${project.synopsis}\n`
    if (project.genre) context += `类型：${project.genre}\n`
    if (project.tags) {
      context += `标签：${project.tags}\n`
    }
    context += `\n`

    if (project.worldSettings && project.worldSettings.length > 0) {
      context += `# 世界观设定\n`
      for (const setting of project.worldSettings) {
        context += `## ${setting.name} (${setting.category})\n`
        if (setting.description) {
          context += `${setting.description}\n`
        }
        if (setting.items && setting.items.length > 0) {
          context += `相关条目：\n`
          for (const item of setting.items) {
            context += `- ${item.name}`
            if (item.description) {
              context += `: ${item.description}`
            }
            context += `\n`
          }
        }
      }
      context += `\n`
    }

    const useProgressive = options?.useProgressiveCharacterContext ?? true
    if (useProgressive) {
      const charResult = await this.progressiveContext.buildProgressiveCharacterContext(
        projectId,
        currentContent,
        {
          priority: options?.characterPriority || 'standard',
          maxTokens: options?.maxCharacterTokens || 4000,
        },
      )

      if (charResult.context) {
        context += charResult.context + '\n'

        if (charResult.truncated) {
          context += `> 注：共有 ${charResult.totalCharacters} 个人物，已加载 ${charResult.charactersLoaded} 个相关人物\n\n`
        }
      }
    } else {
      const characters = await this.prisma.character.findMany({
        where: { projectId },
        include: {
          relationshipsFrom: {
            include: {
              toCharacter: {
                select: { id: true, name: true },
              },
            },
          },
          relationshipsTo: {
            include: {
              fromCharacter: {
                select: { id: true, name: true },
              },
            },
          },
        },
      })

      if (characters.length > 0) {
        context += `# 人物\n`
        for (const char of characters) {
          context += `## ${char.name} (${char.role || '未设定'})\n`
          if (char.appearance) context += `外貌：${char.appearance}\n`
          if (char.personality) context += `性格：${char.personality}\n`
          if (char.background) context += `背景：${char.background}\n`
          if (char.goals) context += `目标：${char.goals}\n`
          if (char.flaws) context += `缺陷：${char.flaws}\n`
          if (char.voice) context += `语言风格：${char.voice}\n`

          const relationships: string[] = []
          for (const rel of char.relationshipsFrom) {
            relationships.push(`${char.name}是${rel.toCharacter.name}的${rel.relationship}`)
          }
          for (const rel of char.relationshipsTo) {
            relationships.push(`${rel.fromCharacter.name}是${char.name}的${rel.relationship}`)
          }
          if (relationships.length > 0) {
            context += `关系：${relationships.join('；')}\n`
          }
          context += `\n`
        }
      }
    }

    if (project.plots && project.plots.length > 0) {
      context += `# 情节线\n`
      for (const plot of project.plots) {
        context += `## ${plot.title}\n`
        if (plot.description) context += `${plot.description}\n`
        if (plot.plotPoints && plot.plotPoints.length > 0) {
          context += `关键节点：\n`
          for (const point of plot.plotPoints) {
            context += `- ${point.title} (${point.type}): ${point.description}\n`
          }
        }
        context += `\n`
      }
    }

    if (project.chapters && project.chapters.length > 0) {
      context += `# 章节内容\n`
      for (const chapter of project.chapters) {
        context += `## 第${chapter.order + 1}章：${chapter.title}\n`
        if (chapter.summaries && chapter.summaries.length > 0) {
          context += `摘要：${chapter.summaries[0].summary}\n`
        }
        if (chapter.contents && chapter.contents.length > 0) {
          const fullContent = chapter.contents.map((c) => c.content).join('\n')
          context += `正文：\n${fullContent}\n`
        }
        context += `\n`
      }
    }

    if (currentContent) {
      context += `# 当前写作内容\n`
      context += `${currentContent}\n`
    }

    return context
  }

  async buildCharacterContext(projectId: string, characterId?: string): Promise<string> {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      include: {
        relationshipsFrom: {
          include: {
            toCharacter: true,
          },
        },
        relationshipsTo: {
          include: {
            fromCharacter: true,
          },
        },
      },
    })

    let context = '# 人物关系\n\n'

    for (const char of characters) {
      if (characterId && char.id !== characterId) continue

      context += `## ${char.name}\n`
      context += `角色：${char.role}\n`

      if (char.appearance) context += `外貌特征：${char.appearance}\n`
      if (char.personality) context += `性格特点：${char.personality}\n`
      if (char.background) context += `背景故事：${char.background}\n`
      if (char.goals) context += `主要目标：${char.goals}\n`
      if (char.flaws) context += `性格缺陷：${char.flaws}\n`
      if (char.arc) context += `人物弧光：${char.arc}\n`
      if (char.voice) context += `语言风格：${char.voice}\n`
      if (char.notes) context += `备注：${char.notes}\n`

      const relationships: string[] = []
      for (const rel of char.relationshipsFrom) {
        relationships.push(
          `与${rel.toCharacter.name}的关系：${rel.relationship}${rel.description ? `（${rel.description}）` : ''}`,
        )
      }
      for (const rel of char.relationshipsTo) {
        relationships.push(
          `与${rel.fromCharacter.name}的关系：${rel.relationship}${rel.description ? `（${rel.description}）` : ''}`,
        )
      }
      if (relationships.length > 0) {
        context += `\n人际关系：\n`
        for (const rel of relationships) {
          context += `- ${rel}\n`
        }
      }

      context += '\n'
    }

    return context
  }

  async buildWorldSettingContext(projectId: string, category?: string): Promise<string> {
    const whereClause: any = { projectId }
    if (category) {
      whereClause.category = category
    }

    const worldSettings = await this.prisma.worldSetting.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { category: 'asc' },
    })

    let context = '# 世界观设定\n\n'

    const settingsByCategory = new Map<string, typeof worldSettings>()
    for (const setting of worldSettings) {
      if (!settingsByCategory.has(setting.category)) {
        settingsByCategory.set(setting.category, [])
      }
      settingsByCategory.get(setting.category)!.push(setting)
    }

    for (const [cat, settings] of settingsByCategory) {
      context += `## ${cat}\n\n`
      for (const setting of settings) {
        context += `### ${setting.name}\n`
        if (setting.description) {
          context += `${setting.description}\n\n`
        }
        if (setting.items && setting.items.length > 0) {
          context += `相关内容：\n`
          for (const item of setting.items) {
            context += `- **${item.name}**`
            if (item.description) {
              context += `: ${item.description}`
            }
            context += `\n`
            if (item.details) {
              context += `  ${item.details}\n`
            }
          }
          context += `\n`
        }
      }
    }

    return context
  }
}
