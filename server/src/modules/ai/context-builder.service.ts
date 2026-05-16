import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ContextBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildWritingContext(projectId: string, currentContent?: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        worldSettings: {
          include: { items: true },
        },
        characters: {
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
    if (project.tags && project.tags.length > 0) {
      context += `标签：${project.tags.join(', ')}\n`
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

    if (project.characters && project.characters.length > 0) {
      context += `# 人物\n`
      for (const char of project.characters) {
        context += `## ${char.name} (${char.role})\n`
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
