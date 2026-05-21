import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface WorldConflict {
  type: 'geography' | 'magic' | 'politics' | 'history' | 'culture' | 'social' | 'economy' | 'military'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  content: string
  suggestion: string
}

export interface WorldConflictResult {
  hasConflict: boolean
  conflicts: WorldConflict[]
  context: {
    relevantSettings: string[]
    mentionedItems: string[]
  }
}

@Injectable()
export class WorldConflictDetectorService {
  constructor(private prisma: PrismaService) {}

  async detectConflicts(
    projectId: string,
    content: string,
    options?: {
      checkGeography?: boolean
      checkMagic?: boolean
      checkPolitics?: boolean
      checkCulture?: boolean
      checkSocial?: boolean
    }
  ): Promise<WorldConflictResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        worldSettings: {
          include: { items: true },
        },
        characters: {
          include: {
            relationshipsFrom: true,
            relationshipsTo: true,
          },
        },
      },
    })

    if (!project) {
      return { hasConflict: false, conflicts: [], context: { relevantSettings: [], mentionedItems: [] } }
    }

    const conflicts: WorldConflict[] = []
    const contentLower = content.toLowerCase()
    const mentionedItems: string[] = []

    for (const setting of project.worldSettings) {
      if (setting.items) {
        for (const item of setting.items) {
          if (contentLower.includes(item.name.toLowerCase())) {
            mentionedItems.push(item.name)
          }
        }
      }
    }

    const enabledChecks = {
      checkGeography: options?.checkGeography ?? true,
      checkMagic: options?.checkMagic ?? true,
      checkPolitics: options?.checkPolitics ?? true,
      checkCulture: options?.checkCulture ?? true,
      checkSocial: options?.checkSocial ?? true,
    }

    if (enabledChecks.checkGeography) {
      const geographyConflicts = this.checkGeographyConflicts(project.worldSettings, content)
      conflicts.push(...geographyConflicts)
    }

    if (enabledChecks.checkMagic) {
      const magicConflicts = this.checkMagicConflicts(project.worldSettings, content)
      conflicts.push(...magicConflicts)
    }

    if (enabledChecks.checkPolitics) {
      const politicsConflicts = this.checkPoliticsConflicts(project.worldSettings, content)
      conflicts.push(...politicsConflicts)
    }

    if (enabledChecks.checkCulture) {
      const cultureConflicts = this.checkCultureConflicts(project.worldSettings, content)
      conflicts.push(...cultureConflicts)
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      context: {
        relevantSettings: project.worldSettings.map(s => s.name),
        mentionedItems,
      },
    }
  }

  private checkGeographyConflicts(worldSettings: any[], content: string): WorldConflict[] {
    const conflicts: WorldConflict[] = []
    const geographySettings = worldSettings.filter(s => s.category === '地理环境')

    const locationPatterns = [
      /(?:在|来到|去|到达|来到|位于|坐落在)([^\s，。！？]+)/g,
      /([^\s，。！？]+)(?:是|位于|坐落在)([^\s，。！？]+)/g,
    ]

    const mentionedLocations: Set<string> = new Set()
    for (const pattern of locationPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        mentionedLocations.add(match[1])
      }
    }

    return conflicts
  }

  private checkMagicConflicts(worldSettings: any[], content: string): WorldConflict[] {
    const conflicts: WorldConflict[] = []
    const magicSettings = worldSettings.filter(s => 
      s.category === '魔法/科技' || s.category === '魔法体系'
    )

    for (const setting of magicSettings) {
      if (!setting.items) continue

      const magicRules = setting.items.find((item: any) => 
        item.name.includes('规则') || item.name.includes('限制')
      )

      if (magicRules && magicRules.description) {
        if (magicRules.description.includes('消耗') || magicRules.description.includes('限制')) {
          const hasConsumption = content.includes('无限') || content.includes('无消耗')
          if (hasConsumption) {
            conflicts.push({
              type: 'magic',
              severity: 'warning',
              title: '魔法消耗规则冲突',
              description: `世界观设定中规定魔法有消耗限制，但文本中描述魔法无消耗使用`,
              content: this.extractSentenceWithKeyword(content, '无限'),
              suggestion: '请检查魔法使用的消耗描述是否与世界观设定一致',
            })
          }
        }
      }
    }

    return conflicts
  }

  private checkPoliticsConflicts(worldSettings: any[], content: string): WorldConflict[] {
    const conflicts: WorldConflict[] = []
    const politicsSettings = worldSettings.filter(s => s.category === '政治体系')

    for (const setting of politicsSettings) {
      if (!setting.items) continue

      const politicalTerms = setting.items
        .filter((item: any) => item.description)
        .map((item: any) => item.name)

      const contentLower = content.toLowerCase()
      
      for (const term of politicalTerms) {
        if (term.length > 2 && contentLower.includes(term.toLowerCase())) {
          const relatedItems = setting.items.filter((item: any) => 
            item.name !== term && item.description?.includes(term)
          )

          for (const related of relatedItems) {
            if (related.description.includes('禁止') || related.description.includes('不存在')) {
              conflicts.push({
                type: 'politics',
                severity: 'warning',
                title: '政治体系冲突',
                description: `文本中提到了"${term}"，但世界观设定中${related.description}`,
                content: this.extractSentenceWithKeyword(content, term),
                suggestion: `请确认"${term}"在当前社会是否被允许存在`,
              })
            }
          }
        }
      }
    }

    return conflicts
  }

  private checkCultureConflicts(worldSettings: any[], content: string): WorldConflict[] {
    const conflicts: WorldConflict[] = []
    const cultureSettings = worldSettings.filter(s => s.category === '文化风俗')

    for (const setting of cultureSettings) {
      if (!setting.items) continue

      const religiousItems = setting.items.filter((item: any) =>
        item.name.includes('宗教') || item.name.includes('信仰')
      )

      for (const item of religiousItems) {
        if (item.description) {
          const forbiddenActions = this.extractForbiddenActions(item.description)
          
          for (const action of forbiddenActions) {
            if (content.includes(action)) {
              conflicts.push({
                type: 'culture',
                severity: 'warning',
                title: '宗教信仰冲突',
                description: `"${item.name}"规定禁止${action}，但文本中描述了此行为`,
                content: this.extractSentenceWithKeyword(content, action),
                suggestion: `请检查描述是否与宗教信仰设定一致，或考虑改变情节设计`,
              })
            }
          }
        }
      }
    }

    return conflicts
  }

  private checkSocialConflicts(worldSettings: any[], content: string): WorldConflict[] {
    const conflicts: WorldConflict[] = []
    const socialSettings = worldSettings.filter(s => s.category === '社会结构')

    const classPatterns = [
      /(?:平民|百姓|平民百姓|底层|下层)与(?:贵族|上层|统治阶级)/,
      /(?:贵族|上层|统治阶级)与(?:平民|百姓|底层|下层)/,
    ]

    for (const pattern of classPatterns) {
      if (pattern.test(content)) {
        for (const setting of socialSettings) {
          const classItems = setting.items?.filter((item: any) =>
            item.name.includes('阶层') || item.name.includes('阶级')
          )

          if (classItems && classItems.length > 0) {
            const hasClassConflict = classItems.some((item: any) =>
              item.description?.includes('禁止流动') || item.description?.includes('严格等级')
            )

            if (hasClassConflict) {
              conflicts.push({
                type: 'social',
                severity: 'info',
                title: '社会阶层流动性',
                description: '世界观设定中存在严格的社会等级制度，跨阶层互动需要特殊情节支撑',
                content: this.extractSentenceWithKeyword(content, '与'),
                suggestion: '如果需要描写跨阶层互动，请确保有合理的过渡情节或特殊原因',
              })
            }
          }
        }
      }
    }

    return conflicts
  }

  private extractForbiddenActions(description: string): string[] {
    const forbidden: string[] = []
    const forbiddenWords = ['禁止', '不允许', '不能', '不可']

    for (const word of forbiddenWords) {
      const index = description.indexOf(word)
      if (index !== -1) {
        const afterWord = description.substring(index + word.length)
        const match = afterWord.match(/^([^，。！？、]+)/)
        if (match) {
          forbidden.push(match[1])
        }
      }
    }

    return forbidden
  }

  private extractSentenceWithKeyword(content: string, keyword: string): string {
    const index = content.indexOf(keyword)
    if (index === -1) return content.substring(0, Math.min(100, content.length))

    const start = Math.max(0, index - 30)
    const end = Math.min(content.length, index + keyword.length + 30)
    
    let sentence = content.substring(start, end)
    
    if (start > 0) sentence = '...' + sentence
    if (end < content.length) sentence = sentence + '...'
    
    return sentence
  }

  async getRelevantContext(projectId: string, content: string): Promise<string> {
    const result = await this.detectConflicts(projectId, content)
    
    if (result.conflicts.length === 0) {
      return ''
    }

    let context = '# 相关世界观设定提醒\n\n'
    
    context += '当前内容可能与以下世界观设定存在关联：\n\n'
    
    for (const conflict of result.conflicts) {
      context += `## ${conflict.title}\n`
      context += `${conflict.description}\n`
      context += `建议：${conflict.suggestion}\n\n`
    }

    return context
  }
}
