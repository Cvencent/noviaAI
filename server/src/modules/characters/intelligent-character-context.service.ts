import { Injectable } from '@nestjs/common'
import { CharacterSearchService } from './character-search.service'
import { ProgressiveCharacterContextService } from './progressive-character-context.service'

export interface IntelligentContextRequest {
  projectId: string
  currentContent: string
  writingContext?: string
  options?: {
    maxTokens?: number
    includeIndirectRelations?: boolean
    detectCharacterMentions?: boolean
    autoExpandRelations?: boolean
  }
}

export interface CharacterContextForAI {
  characters: {
    id: string
    name: string
    role: string
    importance: 'core' | 'important' | 'minor'
    mentioned: boolean
    details: {
      personality?: string
      background?: string
      goals?: string
      flaws?: string
    }
    relations: {
      target: string
      relationship: string
      direction: 'outgoing' | 'incoming'
    }[]
  }[]
  impliedRelationships: {
    char1: string
    char2: string
    relationship: string
    context: string
  }[]
  knowledgeGaps: {
    type: 'missing_relation' | 'unknown_character' | 'contradiction'
    description: string
    suggestion: string
  }[]
  context: string
  tokenUsage: {
    estimated: number
    withinLimit: boolean
  }
}

@Injectable()
export class IntelligentCharacterContextService {
  constructor(
    private characterSearch: CharacterSearchService,
    private progressiveContext: ProgressiveCharacterContextService,
  ) {}

  async buildIntelligentContext(
    request: IntelligentContextRequest,
  ): Promise<CharacterContextForAI> {
    const {
      projectId,
      currentContent,
      writingContext,
      options = {},
    } = request

    const maxTokens = options.maxTokens || 4000
    const mentionedCharacters = new Set<string>()

    if (options.detectCharacterMentions !== false) {
      const mentioned = this.detectCharacterMentions(currentContent)
      mentioned.forEach(name => mentionedCharacters.add(name))
    }

    const allCharacters = await this.characterSearch.search(projectId, {
      type: 'by_role',
      params: { role: '' },
    }).then(r => r.characters)

    const characterContexts = await Promise.all(
      allCharacters.map(async (char) => {
        const isMentioned = mentionedCharacters.has(char.name)
        const isCore =
          char.role === 'protagonist' ||
          char.role === 'antagonist' ||
          char.role === 'mentor'

        let importance: 'core' | 'important' | 'minor' = 'minor'
        if (isCore) importance = 'core'
        else if (isMentioned || (char.relationshipsFrom?.length || 0) > 2) {
          importance = 'important'
        }

        const relations: { target: string; relationship: string; direction: 'outgoing' | 'incoming' }[] = []
        
        char.relationshipsFrom?.forEach((rel: any) => {
          relations.push({
            target: rel.toCharacter.name,
            relationship: rel.relationship,
            direction: 'outgoing',
          })
        })
        
        char.relationshipsTo?.forEach((rel: any) => {
          relations.push({
            target: rel.fromCharacter.name,
            relationship: rel.relationship,
            direction: 'incoming',
          })
        })

        return {
          id: char.id,
          name: char.name,
          role: char.role,
          importance,
          mentioned: isMentioned,
          details: {
            personality: char.personality,
            background: char.background,
            goals: char.goals,
            flaws: char.flaws,
          },
          relations,
        }
      }),
    )

    const sortedCharacters = characterContexts.sort((a, b) => {
      if (a.importance === 'core' && b.importance !== 'core') return -1
      if (b.importance === 'core' && a.importance !== 'core') return 1
      if (a.mentioned && !b.mentioned) return -1
      if (b.mentioned && !a.mentioned) return 1
      return b.relations.length - a.relations.length
    })

    const { context: progressiveCtx, charactersLoaded, totalCharacters } =
      await this.progressiveContext.buildProgressiveCharacterContext(
        projectId,
        currentContent,
        { maxTokens: maxTokens * 0.7 },
      )

    const impliedRelationships = this.detectImpliedRelationships(
      currentContent,
      characterContexts,
    )

    // TODO: 修复knowledgeGaps的类型问题
    // const knowledgeGaps = this.detectKnowledgeGaps(
    //   currentContent,
    //   characterContexts,
    // )
    const knowledgeGaps: any[] = []

    const finalContext = this.buildFinalContext(
      sortedCharacters,
      progressiveCtx,
      impliedRelationships,
      writingContext,
      maxTokens,
    )

    const estimatedTokens = this.estimateTokens(finalContext)

    return {
      characters: sortedCharacters,
      impliedRelationships,
      knowledgeGaps,
      context: finalContext,
      tokenUsage: {
        estimated: estimatedTokens,
        withinLimit: estimatedTokens <= maxTokens,
      },
    }
  }

  private detectCharacterMentions(text: string): string[] {
    const mentions: string[] = []
    const patterns = [
      /([A-Z][a-z]+(?:[A-Z][a-z]+)+)/g,
      /([\u4e00-\u9fa5]{2,4})(?:说|道|想|认为|觉得|告诉|对|给|和|与|同|跟)/g,
    ]

    patterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) {
        mentions.push(...matches.map((m) => m.trim()).filter((m) => m.length >= 2))
      }
    })

    return [...new Set(mentions)]
  }

  private detectImpliedRelationships(
    text: string,
    characters: any[],
  ): { char1: string; char2: string; relationship: string; context: string }[] {
    const implied: { char1: string; char2: string; relationship: string; context: string }[] = []

    const interactionPatterns = [
      { pattern: /(\S+)和(\S+)吵架/g, relationship: '争吵' },
      { pattern: /(\S+)对(\S+)发火/g, relationship: '敌对' },
      { pattern: /(\S+)向(\S+)求助/g, relationship: '求助关系' },
      { pattern: /(\S+)和(\S+)拥抱/g, relationship: '亲密' },
      { pattern: /(\S+)对(\S+)微笑/g, relationship: '友善' },
    ]

    for (const { pattern, relationship } of interactionPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        const char1 = match[1]
        const char2 = match[2]

        const char1Exists = characters.some((c) => c.name.includes(char1))
        const char2Exists = characters.some((c) => c.name.includes(char2))

        if (char1Exists && char2Exists) {
          const existingRel = characters.find(
            (c) => c.name.includes(char1),
          )?.relations.some((r: any) =>
            characters.find((c) => c.name.includes(char2))?.name.includes(r.target),
          )

          if (!existingRel) {
            implied.push({
              char1,
              char2,
              relationship,
              context: match[0],
            })
          }
        }
      }
    }

    return implied
  }

  private detectKnowledgeGaps(
    text: string,
    characters: any[],
  ): { type: string; description: string; suggestion: string }[] {
    const gaps: { type: string; description: string; suggestion: string }[] = []

    const mentionedNames = this.detectCharacterMentions(text)
    for (const name of mentionedNames) {
      const char = characters.find((c) => c.name.includes(name))
      if (!char) {
        gaps.push({
          type: 'unknown_character',
          description: `文本中提到"${name}"，但该人物尚未创建`,
          suggestion: `建议添加新人物"${name}"，或确认是否是指现有人物`,
        })
      }
    }

    for (const char of characters) {
      if (
        (char.relationshipsFrom?.length || 0) === 0 &&
        (char.relationshipsTo?.length || 0) === 0 &&
        char.role === 'protagonist'
      ) {
        gaps.push({
          type: 'missing_relation',
          description: `"${char.name}"是主角但没有任何关系设定`,
          suggestion: '建议为主角添加家人、朋友或导师等关系',
        })
      }
    }

    return gaps
  }

  private buildFinalContext(
    characters: any[],
    progressiveContext: string,
    impliedRelationships: any[],
    writingContext?: string,
    maxTokens?: number,
  ): string {
    let context = '# 人物关系上下文\n\n'

    context += '## 核心人物（写作时优先参考）\n\n'
    const coreChars = characters.filter((c) => c.importance === 'core')
    for (const char of coreChars.slice(0, 5)) {
      context += this.formatCharacterBrief(char)
    }

    if (coreChars.length > 5) {
      context += `\n> 还有 ${coreChars.length - 5} 个核心人物...\n`
    }

    context += '\n## 本次相关人物\n\n'
    const mentionedChars = characters.filter((c) => c.mentioned)
    if (mentionedChars.length > 0) {
      for (const char of mentionedChars.slice(0, 10)) {
        context += this.formatCharacterBrief(char)
      }
    } else {
      const importantChars = characters.filter((c) => c.importance === 'important')
      for (const char of importantChars.slice(0, 5)) {
        context += this.formatCharacterBrief(char)
      }
    }

    if (impliedRelationships.length > 0) {
      context += '\n## 文本中的隐含关系\n\n'
      for (const rel of impliedRelationships) {
        context += `- ${rel.char1} 和 ${rel.char2}：${rel.relationship}\n`
        context += `  （依据：${rel.context}）\n`
      }
    }

    if (progressiveContext) {
      context += '\n## 完整人物关系网\n\n'
      context += progressiveContext
    }

    if (writingContext) {
      context += '\n## 写作要求\n\n'
      context += writingContext
    }

    return context
  }

  private formatCharacterBrief(char: any): string {
    let text = `### ${char.name}`
    if (char.role) text += ` (${this.getRoleLabel(char.role)})`
    text += '\n'

    if (char.details.personality) {
      text += `- 性格：${char.details.personality}\n`
    }
    if (char.details.background) {
      text += `- 背景：${char.details.background.slice(0, 100)}${char.details.background.length > 100 ? '...' : ''}\n`
    }

    if (char.relations.length > 0) {
      text += `- 关系：\n`
      for (const rel of char.relations.slice(0, 3)) {
        const arrow = rel.direction === 'outgoing' ? '→' : '←'
        text += `  ${arrow} ${rel.target}：${rel.relationship}\n`
      }
    }

    text += '\n'
    return text
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      protagonist: '主角',
      antagonist: '反派',
      mentor: '导师',
      supporting: '配角',
      minor: '次要',
      love_interest: '恋人',
      friend: '朋友',
      rival: '对手',
    }
    return labels[role] || role
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}
