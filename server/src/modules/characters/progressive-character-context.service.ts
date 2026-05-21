import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export enum CharacterPriority {
  CRITICAL = 'CRITICAL',   // 核心人物：主角、反派、导师 - 始终加载
  IMPORTANT = 'IMPORTANT', // 重要人物：配角、重要关系 - 按需加载
  MINOR = 'MINOR',        // 次要人物：路人、龙套 - 按需加载
}

export interface ProgressiveContextConfig {
  maxTokens: number
  priority: 'basic' | 'standard' | 'detailed'
  includeRelatedDepth: number
}

export interface CharacterRelevance {
  characterId: string
  characterName: string
  priority: CharacterPriority
  relevanceScore: number
  relationships: string[]
}

const PRIORITY_WEIGHTS = {
  [CharacterPriority.CRITICAL]: 100,
  [CharacterPriority.IMPORTANT]: 50,
  [CharacterPriority.MINOR]: 10,
}

const MAX_TOKEN_BUDGETS = {
  basic: 2000,
  standard: 4000,
  detailed: 8000,
}

@Injectable()
export class ProgressiveCharacterContextService {
  constructor(private prisma: PrismaService) {}

  async buildProgressiveCharacterContext(
    projectId: string,
    currentContent?: string,
    config?: Partial<ProgressiveContextConfig>,
  ): Promise<{
    context: string
    charactersLoaded: number
    totalCharacters: number
    truncated: boolean
  }> {
    const finalConfig = {
      maxTokens: config?.maxTokens || MAX_TOKEN_BUDGETS.standard,
      priority: config?.priority || 'standard',
      includeRelatedDepth: config?.includeRelatedDepth || 2,
    }

    const allCharacters = await this.prisma.character.findMany({
      where: { projectId },
      include: {
        relationshipsFrom: {
          include: {
            toCharacter: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        relationshipsTo: {
          include: {
            fromCharacter: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    })

    const totalCharacters = allCharacters.length

    if (totalCharacters === 0) {
      return {
        context: '',
        charactersLoaded: 0,
        totalCharacters: 0,
        truncated: false,
      }
    }

    const characterRelevanceList = await this.calculateCharacterRelevance(
      allCharacters,
      currentContent,
    )

    const sortedCharacters = characterRelevanceList
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    const context = this.buildContextFromSortedCharacters(
      sortedCharacters,
      finalConfig,
    )

    const estimatedTokens = this.estimateTokens(context)
    const truncated = estimatedTokens > finalConfig.maxTokens

    return {
      context,
      charactersLoaded: sortedCharacters.filter(
        (c) => this.getContextWeight(c, finalConfig) > 0,
      ).length,
      totalCharacters,
      truncated,
    }
  }

  private async calculateCharacterRelevance(
    characters: any[],
    currentContent?: string,
  ): Promise<CharacterRelevance[]> {
    const relevanceList: CharacterRelevance[] = []

    for (const char of characters) {
      const priority = this.determinePriority(char.role)

      let relevanceScore = PRIORITY_WEIGHTS[priority]

      if (currentContent) {
        const textRelevance = this.calculateTextRelevance(
          char,
          currentContent,
        )
        relevanceScore += textRelevance

        const relationshipRelevance = this.calculateRelationshipRelevance(
          char,
          characters,
          currentContent,
        )
        relevanceScore += relationshipRelevance
      }

      const relationships = this.extractRelationships(char)

      relevanceList.push({
        characterId: char.id,
        characterName: char.name,
        priority,
        relevanceScore,
        relationships,
      })
    }

    return relevanceList
  }

  private determinePriority(role?: string | null): CharacterPriority {
    if (!role) return CharacterPriority.IMPORTANT

    const criticalRoles = [
      'protagonist',
      'antagonist',
      'mentor',
      'deuteragonist',
    ]
    const importantRoles = [
      'love_interest',
      'rival',
      'supporting',
    ]

    if (criticalRoles.includes(role)) {
      return CharacterPriority.CRITICAL
    }
    if (importantRoles.includes(role)) {
      return CharacterPriority.IMPORTANT
    }
    return CharacterPriority.MINOR
  }

  private calculateTextRelevance(char: any, content: string): number {
    const charName = char.name
    const contentLower = content.toLowerCase()
    const nameLower = charName.toLowerCase()

    let score = 0

    const nameOccurrences = (
      contentLower.match(new RegExp(nameLower, 'g')) || []
    ).length
    score += nameOccurrences * 10

    if (char.appearance) {
      const appearanceMatches = char.appearance
        .split(/[,，、]/)
        .filter((trait: string) => contentLower.includes(trait.trim().toLowerCase()))
        .length
      score += appearanceMatches * 5
    }

    if (char.personality) {
      const personalityMatches = char.personality
        .split(/[,，、]/)
        .filter((trait: string) => contentLower.includes(trait.trim().toLowerCase()))
        .length
      score += personalityMatches * 3
    }

    return score
  }

  private calculateRelationshipRelevance(
    char: any,
    allCharacters: any[],
    content: string,
  ): number {
    let score = 0
    const contentLower = content.toLowerCase()

    const relatedCharacterIds = new Set<string>()

    char.relationshipsFrom?.forEach((rel: any) => {
      relatedCharacterIds.add(rel.toId)
      if (contentLower.includes(rel.toCharacter.name.toLowerCase())) {
        score += 5
      }
    })

    char.relationshipsTo?.forEach((rel: any) => {
      relatedCharacterIds.add(rel.fromId)
      if (contentLower.includes(rel.fromCharacter.name.toLowerCase())) {
        score += 5
      }
    })

    relatedCharacterIds.forEach((relatedId) => {
      const relatedChar = allCharacters.find((c) => c.id === relatedId)
      if (relatedChar && contentLower.includes(relatedChar.name.toLowerCase())) {
        score += 3
      }
    })

    return score
  }

  private extractRelationships(char: any): string[] {
    const relationships: string[] = []

    char.relationshipsFrom?.forEach((rel: any) => {
      relationships.push(
        `${char.name}是${rel.toCharacter.name}的${rel.relationship}`,
      )
    })

    char.relationshipsTo?.forEach((rel: any) => {
      relationships.push(
        `${rel.fromCharacter.name}是${char.name}的${rel.relationship}`,
      )
    })

    return relationships
  }

  private getContextWeight(
    relevance: CharacterRelevance,
    config: ProgressiveContextConfig,
  ): number {
    if (relevance.priority === CharacterPriority.CRITICAL) {
      return 1
    }

    switch (config.priority) {
      case 'basic':
        return relevance.priority === CharacterPriority.IMPORTANT ? 0.5 : 0
      case 'standard':
        return relevance.relevanceScore > 20 ? 0.8 : 0.3
      case 'detailed':
        return relevance.relevanceScore > 10 ? 1 : 0.6
      default:
        return 0.5
    }
  }

  private buildContextFromSortedCharacters(
    sortedCharacters: CharacterRelevance[],
    config: ProgressiveContextConfig,
  ): string {
    let context = '# 人物关系\n\n'
    let currentTokens = this.estimateTokens(context)
    const includedCharacters: string[] = []
    const includedRelationships: Set<string> = new Set()

    for (const charRelevance of sortedCharacters) {
      const weight = this.getContextWeight(charRelevance, config)
      if (weight === 0) continue

      const charDetails = this.getCharacterDetails(
        charRelevance.characterId,
        sortedCharacters,
      )

      const charContext = this.buildCharacterContext(charRelevance, charDetails, weight)
      const charTokens = this.estimateTokens(charContext)

      if (currentTokens + charTokens > config.maxTokens) {
        if (charRelevance.priority === CharacterPriority.CRITICAL) {
          const truncatedContext = this.buildTruncatedContext(charRelevance)
          if (currentTokens + this.estimateTokens(truncatedContext) <= config.maxTokens) {
            context += truncatedContext
            currentTokens += this.estimateTokens(truncatedContext)
            includedCharacters.push(charRelevance.characterName)
          }
        }
        continue
      }

      context += charContext
      currentTokens += charTokens
      includedCharacters.push(charRelevance.characterName)

      if (weight >= 0.8) {
        charRelevance.relationships.forEach((rel) => {
          includedRelationships.add(rel)
        })
      }
    }

    if (includedRelationships.size > 0) {
      context += '\n## 关键关系\n'
      for (const rel of includedRelationships) {
        context += `- ${rel}\n`
      }
    }

    return context
  }

  private getCharacterDetails(
    characterId: string,
    allCharacters: CharacterRelevance[],
  ): CharacterRelevance | undefined {
    return allCharacters.find((c) => c.characterId === characterId)
  }

  private buildCharacterContext(
    relevance: CharacterRelevance,
    details: CharacterRelevance | undefined,
    weight: number,
  ): string {
    let charContext = `## ${relevance.characterName}`

    if (relevance.priority === CharacterPriority.CRITICAL) {
      charContext += ' ⭐'
    }

    charContext += '\n'

    if (weight >= 0.8 && details) {
      charContext += `重要性：${this.getPriorityLabel(relevance.priority)}\n`
      charContext += `相关度评分：${relevance.relevanceScore}\n`

      if (details.relationships.length > 0) {
        charContext += `关系：${details.relationships.join('；')}\n`
      }
    } else if (weight >= 0.5 && details) {
      if (details.relationships.length > 0) {
        const topRelationships = details.relationships.slice(0, 3)
        charContext += `主要关系：${topRelationships.join('；')}\n`
      }
    } else {
      charContext += `(相关度较低)\n`
    }

    return charContext
  }

  private buildTruncatedContext(relevance: CharacterRelevance): string {
    return `## ${relevance.characterName} ⭐\n[核心人物，详细信息略]\n\n`
  }

  private getPriorityLabel(priority: CharacterPriority): string {
    switch (priority) {
      case CharacterPriority.CRITICAL:
        return '核心'
      case CharacterPriority.IMPORTANT:
        return '重要'
      case CharacterPriority.MINOR:
        return '次要'
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  async getCharacterHierarchy(
    projectId: string,
  ): Promise<{
    core: any[]
    important: any[]
    minor: any[]
  }> {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      include: {
        relationshipsFrom: true,
        relationshipsTo: true,
      },
    })

    const hierarchy = {
      core: [] as any[],
      important: [] as any[],
      minor: [] as any[],
    }

    for (const char of characters) {
      const priority = this.determinePriority(char.role)
      const charWithPriority = {
        ...char,
        priority,
        relationshipCount:
          (char.relationshipsFrom?.length || 0) +
          (char.relationshipsTo?.length || 0),
      }

      switch (priority) {
        case CharacterPriority.CRITICAL:
          hierarchy.core.push(charWithPriority)
          break
        case CharacterPriority.IMPORTANT:
          hierarchy.important.push(charWithPriority)
          break
        case CharacterPriority.MINOR:
          hierarchy.minor.push(charWithPriority)
          break
      }
    }

    hierarchy.core.sort((a, b) => b.relationshipCount - a.relationshipCount)
    hierarchy.important.sort((a, b) => b.relationshipCount - a.relationshipCount)

    return hierarchy
  }
}
