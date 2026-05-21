import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { OpenaiProvider } from '../ai/providers/openai.provider'

export interface DetectedElement {
  type: 'character' | 'location' | 'magic' | 'organization' | 'item' | 'concept'
  name: string
  description?: string
  context: string
  confidence: number
}

export interface WorldElementAnalysis {
  newElements: DetectedElement[]
  existingElements: string[]
  suggestions: string[]
}

@Injectable()
export class WorldElementExtractorService {
  constructor(
    private prisma: PrismaService,
    private openaiProvider: OpenaiProvider,
  ) {}

  async analyzeNewElements(
    projectId: string,
    newContent: string,
    existingContent?: string,
  ): Promise<WorldElementAnalysis> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: true,
        worldSettings: {
          include: { items: true },
        },
      },
    })

    if (!project) {
      throw new Error('项目不存在')
    }

    const existingCharacters = project.characters.map(c => c.name.toLowerCase())
    const existingSettings = project.worldSettings.flatMap(s => [
      s.name.toLowerCase(),
      ...(s.items?.map(i => i.name.toLowerCase()) || []),
    ])

    const systemPrompt = `你是一位专业的小说世界观分析师。请分析以下文本，识别出可能需要添加到世界观设定中的新元素。

请识别以下类型的元素：
1. **人物**：出现名字的新角色，即使只是配角
2. **地点**：故事中新提到的地点、城镇、建筑等
3. **魔法/能力**：新出现的魔法体系、技能、特殊能力
4. **组织**：新出现的门派、工会、势力、团体等
5. **物品**：新出现的武器、法宝、道具等
6. **概念**：新提到的规则、制度、传统等

请以JSON格式输出：
{
  "newElements": [
    {
      "type": "character|location|magic|organization|item|concept",
      "name": "元素名称",
      "description": "简要描述（可选）",
      "context": "在原文中的上下文（30字以内）",
      "confidence": 0.0-1.0
    }
  ],
  "suggestions": ["建议1", "建议2"]
}

注意：
- 只输出真正需要新增的元素，不要重复已有的设定
- confidence 表示你对这个判断的自信程度
- 如果没有发现新元素，返回空的 newElements 数组

请直接输出JSON，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请分析以下文本中的新世界观元素：\n\n${newContent}` },
    ]

    try {
      this.openaiProvider.setApiKey(process.env.OPENAI_API_KEY || '')
      const result = await this.openaiProvider.chat({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        maxTokens: 2000,
      })

      const parsed = JSON.parse(result)

      const filteredElements = (parsed.newElements || []).filter((element: DetectedElement) => {
        const nameLower = element.name.toLowerCase()
        
        if (element.type === 'character') {
          return !existingCharacters.some(c => c.includes(nameLower) || nameLower.includes(c))
        }
        
        return !existingSettings.some(s => s.includes(nameLower) || nameLower.includes(s))
      })

      return {
        newElements: filteredElements,
        existingElements: [...existingCharacters, ...existingSettings],
        suggestions: parsed.suggestions || [],
      }
    } catch (error) {
      console.error('分析新元素失败:', error)
      return {
        newElements: [],
        existingElements: [...existingCharacters, ...existingSettings],
        suggestions: [],
      }
    }
  }

  async quickAddElement(
    projectId: string,
    element: DetectedElement,
  ): Promise<{ id: string; type: string }> {
    switch (element.type) {
      case 'character': {
        const character = await this.prisma.character.create({
          data: {
            projectId,
            name: element.name,
            background: element.description || '',
          },
        })
        return { id: character.id, type: 'character' }
      }

      case 'location': {
        const existing = await this.prisma.worldSetting.findFirst({
          where: {
            projectId,
            category: '地理环境',
            name: element.name,
          },
        })
        
        if (existing) {
          return { id: existing.id, type: 'worldSetting' }
        }
        
        const locationSetting = await this.prisma.worldSetting.create({
          data: {
            projectId,
            category: '地理环境',
            name: element.name,
            description: element.description || '',
          },
        })
        return { id: locationSetting.id, type: 'worldSetting' }
      }

      case 'magic': {
        const existing = await this.prisma.worldSetting.findFirst({
          where: {
            projectId,
            category: '魔法/科技',
            name: element.name,
          },
        })
        
        if (existing) {
          return { id: existing.id, type: 'worldSetting' }
        }
        
        const magicSetting = await this.prisma.worldSetting.create({
          data: {
            projectId,
            category: '魔法/科技',
            name: element.name,
            description: element.description || '',
          },
        })
        return { id: magicSetting.id, type: 'worldSetting' }
      }

      case 'organization': {
        const existing = await this.prisma.worldSetting.findFirst({
          where: {
            projectId,
            category: '社会结构',
            name: element.name,
          },
        })
        
        if (existing) {
          return { id: existing.id, type: 'worldSetting' }
        }
        
        const orgSetting = await this.prisma.worldSetting.create({
          data: {
            projectId,
            category: '社会结构',
            name: element.name,
            description: element.description || '',
          },
        })
        return { id: orgSetting.id, type: 'worldSetting' }
      }

      case 'item': {
        const existing = await this.prisma.worldSetting.findFirst({
          where: {
            projectId,
            category: '物品装备',
            name: element.name,
          },
        })
        
        if (existing) {
          return { id: existing.id, type: 'worldSetting' }
        }
        
        const itemSetting = await this.prisma.worldSetting.create({
          data: {
            projectId,
            category: '物品装备',
            name: element.name,
            description: element.description || '',
          },
        })
        return { id: itemSetting.id, type: 'worldSetting' }
      }

      case 'concept': {
        const existing = await this.prisma.worldSetting.findFirst({
          where: {
            projectId,
            category: '文化风俗',
            name: element.name,
          },
        })
        
        if (existing) {
          return { id: existing.id, type: 'worldSetting' }
        }
        
        const conceptSetting = await this.prisma.worldSetting.create({
          data: {
            projectId,
            category: '文化风俗',
            name: element.name,
            description: element.description || '',
          },
        })
        return { id: conceptSetting.id, type: 'worldSetting' }
      }

      default:
        throw new Error(`不支持的元素类型: ${element.type}`)
    }
  }

  async batchAddElements(
    projectId: string,
    elements: DetectedElement[],
  ): Promise<Array<{ element: DetectedElement; result: { id: string; type: string } | null }>> {
    const results = []

    for (const element of elements) {
      try {
        const result = await this.quickAddElement(projectId, element)
        results.push({ element, result })
      } catch (error) {
        console.error(`添加元素 ${element.name} 失败:`, error)
        results.push({ element, result: null })
      }
    }

    return results
  }
}
