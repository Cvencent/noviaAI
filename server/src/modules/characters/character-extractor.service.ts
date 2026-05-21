import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { OpenaiProvider } from '../ai/providers/openai.provider'

export interface DetectedCharacter {
  name: string
  role?: string
  description?: string
  context: string
  confidence: number
}

export interface DetectedRelationship {
  character1: string
  character2: string
  relationship: string
  description?: string
  context: string
  confidence: number
}

export interface CharacterAnalysis {
  detectedCharacters: DetectedCharacter[]
  existingCharacters: string[]
  suggestions: string[]
}

export interface ComprehensiveAnalysis {
  newCharacters: DetectedCharacter[]
  newRelationships: DetectedRelationship[]
  existingCharacters: string[]
  existingRelationships: string[]
  suggestions: string[]
}

@Injectable()
export class CharacterExtractorService {
  constructor(
    private prisma: PrismaService,
    private openaiProvider: OpenaiProvider,
  ) {}

  async analyzeTextForCharacters(
    projectId: string,
    text: string,
  ): Promise<CharacterAnalysis> {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      select: { name: true },
    })

    const existingNames = characters.map(c => c.name.toLowerCase())

    const systemPrompt = `你是一位专业的小说人物分析师。请分析以下文本，识别出所有出现的人物角色。

请识别以下信息：
1. **人物姓名**：出现的人物名字
2. **角色定位**：可能的角色类型（主角、配角、反派等）
3. **简要描述**：从文本中推断的人物特征
4. **出现上下文**：在原文中的描述片段

请以JSON格式输出：
{
  "detectedCharacters": [
    {
      "name": "人物姓名",
      "role": "可能的角色定位",
      "description": "简要描述",
      "context": "原文中的描述片段",
      "confidence": 0.0-1.0
    }
  ],
  "suggestions": ["建议1", "建议2"]
}

注意：
- 只输出真正出现的人物，不要猜测不存在的人物
- confidence 表示你对这个判断的自信程度
- 如果人物定位不确定，可以为空字符串
- 如果没有发现新人物，返回空的 detectedCharacters 数组

请直接输出JSON，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请分析以下文本中的人物：\n\n${text}` },
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

      const filteredCharacters = (parsed.detectedCharacters || []).filter((char: DetectedCharacter) => {
        const nameLower = char.name.toLowerCase()
        return !existingNames.some(existing => 
          existing.includes(nameLower) || nameLower.includes(existing)
        )
      })

      return {
        detectedCharacters: filteredCharacters,
        existingCharacters: characters.map(c => c.name),
        suggestions: parsed.suggestions || [],
      }
    } catch (error) {
      console.error('分析人物失败:', error)
      return {
        detectedCharacters: [],
        existingCharacters: characters.map(c => c.name),
        suggestions: [],
      }
    }
  }

  async analyzeTextComprehensively(
    projectId: string,
    text: string,
  ): Promise<ComprehensiveAnalysis> {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      select: { 
        id: true,
        name: true,
        relationshipsFrom: {
          include: {
            toCharacter: { select: { id: true, name: true } },
          },
        },
        relationshipsTo: {
          include: {
            fromCharacter: { select: { id: true, name: true } },
          },
        },
      },
    })

    const existingNames = characters.map(c => c.name.toLowerCase())
    const existingRelationshipPairs = new Set<string>()
    
    characters.forEach(char => {
      char.relationshipsFrom?.forEach(rel => {
        const key = [char.name, rel.toCharacter.name].sort().join('|')
        existingRelationshipPairs.add(`${key}|${rel.relationship}`)
      })
      char.relationshipsTo?.forEach(rel => {
        const key = [rel.fromCharacter.name, char.name].sort().join('|')
        existingRelationshipPairs.add(`${key}|${rel.relationship}`)
      })
    })

    const systemPrompt = `你是一位专业的小说人物和关系分析师。请分析以下文本，识别出新出现的人物和人物关系。

请识别以下信息：
1. **新人物**：在文本中出现但之前未记录的人物
2. **新关系**：文本中新出现的人物关系

请以JSON格式输出：
{
  "newCharacters": [
    {
      "name": "人物姓名",
      "role": "可能的角色定位",
      "description": "简要描述",
      "context": "原文中的描述片段",
      "confidence": 0.0-1.0
    }
  ],
  "newRelationships": [
    {
      "character1": "人物1名字",
      "character2": "人物2名字",
      "relationship": "关系类型",
      "description": "关系描述",
      "context": "原文中的描述片段",
      "confidence": 0.0-1.0
    }
  ],
  "suggestions": ["建议1", "建议2"]
}

关系类型可以是：父亲、母亲、儿子、女儿、兄弟、姐妹、夫妻、恋人、朋友、敌人、导师、学生、上司、下属、搭档、同门、青梅竹马、养父、养女、宿敌、恩人、仇人、竞争者等，或你识别出的其他关系。

注意：
- 只输出真正出现的人物和关系
- confidence 表示你对这个判断的自信程度
- 如果没有发现新内容，返回空数组
- 确保关系类型清晰准确

请直接输出JSON，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请分析以下文本中的新人物和新关系：\n\n${text}` },
    ]

    try {
      this.openaiProvider.setApiKey(process.env.OPENAI_API_KEY || '')
      const result = await this.openaiProvider.chat({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        maxTokens: 2500,
      })

      const parsed = JSON.parse(result)

      const filteredCharacters = (parsed.newCharacters || []).filter((char: DetectedCharacter) => {
        const nameLower = char.name.toLowerCase()
        return !existingNames.some(existing => 
          existing.includes(nameLower) || nameLower.includes(existing)
        )
      })

      const filteredRelationships = (parsed.newRelationships || []).filter((rel: DetectedRelationship) => {
        const key = [rel.character1, rel.character2].sort().join('|')
        const fullKey = `${key}|${rel.relationship}`
        const reverseKey = `${key}|${rel.relationship}`
        return !existingRelationshipPairs.has(fullKey)
      })

      return {
        newCharacters: filteredCharacters,
        newRelationships: filteredRelationships,
        existingCharacters: characters.map(c => c.name),
        existingRelationships: Array.from(existingRelationshipPairs),
        suggestions: parsed.suggestions || [],
      }
    } catch (error) {
      console.error('综合分析失败:', error)
      return {
        newCharacters: [],
        newRelationships: [],
        existingCharacters: characters.map(c => c.name),
        existingRelationships: [],
        suggestions: [],
      }
    }
  }

  async generateCharacterProfile(
    description: string,
  ): Promise<{
    name: string
    role: string
    appearance: string
    personality: string
    background: string
    goals: string
    flaws: string
  }> {
    const systemPrompt = `你是一位专业的小说人物设定专家。请根据以下描述，生成一个完整的人物设定档案。

请生成包含以下字段的JSON：
{
  "name": "姓名",
  "role": "角色定位（protagonist/deuteragonist/antagonist/supporting/minor/mentor/love_interest/friend/rival/other）",
  "appearance": "外貌特征",
  "personality": "性格特点",
  "background": "背景故事",
  "goals": "主要目标",
  "flaws": "性格缺陷或弱点"
}

要求：
- 姓名要有特色，符合故事风格
- 角色定位要合理
- 性格设定要与背景故事一致
- 要有明显的优点和缺点
- 整体要有内在冲突和发展潜力

请直接输出JSON，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请根据以下描述生成人物设定：\n\n${description}` },
    ]

    try {
      this.openaiProvider.setApiKey(process.env.OPENAI_API_KEY || '')
      const result = await this.openaiProvider.chat({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        maxTokens: 2000,
      })

      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('生成人物档案失败:', error)
    }

    return {
      name: '',
      role: 'other',
      appearance: '',
      personality: '',
      background: '',
      goals: '',
      flaws: '',
    }
  }

  async suggestCharacterDetails(
    characterName: string,
    existingContext: string,
  ): Promise<{
    appearance?: string
    personality?: string
    background?: string
    goals?: string
    flaws?: string
  }> {
    const systemPrompt = `你是一位专业的小说人物设定专家。请根据已有的信息，为"${characterName}"这个角色补充细节设定。

请以JSON格式输出：
{
  "appearance": "外貌特征描述",
  "personality": "性格特点描述",
  "background": "背景故事描述",
  "goals": "主要目标描述",
  "flaws": "性格缺陷描述"
}

要求：
- 结合已有上下文
- 描述要具体生动
- 性格要有特点
- 缺陷要与优点形成对比

请直接输出JSON，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `已有信息：\n${existingContext}` },
    ]

    try {
      this.openaiProvider.setApiKey(process.env.OPENAI_API_KEY || '')
      const result = await this.openaiProvider.chat({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        maxTokens: 1500,
      })

      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('补充人物细节失败:', error)
    }

    return {}
  }

  async analyzeRelationships(
    projectId: string,
    text: string,
  ): Promise<Array<{
    character1: string
    character2: string
    relationship: string
    description?: string
    confidence: number
  }>> {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      select: { name: true },
    })

    const characterNames = characters.map(c => c.name)

    const systemPrompt = `你是一位专业的小说人物关系分析师。请分析以下文本，识别出人物之间的关系。

请识别以下信息：
1. 人物1
2. 人物2
3. 关系类型（朋友、敌人、恋人、家人等）
4. 关系描述
5. 判断置信度

请以JSON格式输出：
{
  "relationships": [
    {
      "character1": "人物1名字",
      "character2": "人物2名字",
      "relationship": "关系类型",
      "description": "关系描述",
      "confidence": 0.0-1.0
    }
  ]
}

请直接输出JSON，不要添加任何解释。`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请分析以下文本中的人物关系：\n\n${text}` },
    ]

    try {
      this.openaiProvider.setApiKey(process.env.OPENAI_API_KEY || '')
      const result = await this.openaiProvider.chat({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        maxTokens: 1500,
      })

      const parsed = JSON.parse(result)
      return parsed.relationships || []
    } catch (error) {
      console.error('分析人物关系失败:', error)
      return []
    }
  }
}
