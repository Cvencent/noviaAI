import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface CharacterQuery {
  type: 'by_name' | 'by_role' | 'by_relationship' | 'by_property' | 'path'
  params: {
    name?: string
    role?: string
    relationshipType?: string
    relationshipDirection?: 'from' | 'to' | 'both'
    targetCharacter?: string
    property?: {
      field: string
      value: string
    }
    pathStart?: string
    pathEnd?: string
    maxDepth?: number
  }
}

export interface QueryResult {
  characters: any[]
  relationships: any[]
  paths?: any[]
  explanation: string
}

@Injectable()
export class CharacterSearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    projectId: string,
    query: CharacterQuery,
  ): Promise<QueryResult> {
    switch (query.type) {
      case 'by_name':
        return this.searchByName(projectId, query.params.name!)
      case 'by_role':
        return this.searchByRole(projectId, query.params.role!)
      case 'by_relationship':
        return this.searchByRelationship(
          projectId,
          query.params.relationshipType!,
          query.params.relationshipDirection,
          query.params.targetCharacter,
        )
      case 'by_property':
        return this.searchByProperty(
          projectId,
          query.params.property!.field,
          query.params.property!.value,
        )
      case 'path':
        return this.findRelationshipPath(
          projectId,
          query.params.pathStart!,
          query.params.pathEnd!,
          query.params.maxDepth || 3,
        )
      default:
        throw new Error('Unknown query type')
    }
  }

  private async searchByName(
    projectId: string,
    name: string,
  ): Promise<QueryResult> {
    const characters = await this.prisma.character.findMany({
      where: {
        projectId,
        name: {
          contains: name,
        },
      },
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    return {
      characters,
      relationships: [],
      explanation: `找到了 ${characters.length} 个名字包含"${name}"的人物`,
    }
  }

  private async searchByRole(
    projectId: string,
    role: string,
  ): Promise<QueryResult> {
    const characters = await this.prisma.character.findMany({
      where: {
        projectId,
        role,
      },
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    return {
      characters,
      relationships: [],
      explanation: `找到了 ${characters.length} 个角色为"${role}"的人物`,
    }
  }

  private async searchByRelationship(
    projectId: string,
    relationshipType: string,
    direction?: 'from' | 'to' | 'both',
    targetCharacter?: string,
  ): Promise<QueryResult> {
    let relationships: any[] = []

    if (direction === 'from' || !direction) {
      const fromRels = await this.prisma.characterRelationship.findMany({
        where: {
          relationship: {
            contains: relationshipType,
          },
          fromCharacter: {
            projectId,
            ...(targetCharacter ? { name: { contains: targetCharacter } } : {}),
          },
        },
        include: {
          fromCharacter: true,
          toCharacter: true,
        },
      })
      relationships.push(...fromRels)
    }

    if (direction === 'to' || !direction) {
      const toRels = await this.prisma.characterRelationship.findMany({
        where: {
          relationship: {
            contains: relationshipType,
          },
          toCharacter: {
            projectId,
            ...(targetCharacter ? { name: { contains: targetCharacter } } : {}),
          },
        },
        include: {
          fromCharacter: true,
          toCharacter: true,
        },
      })
      relationships.push(...toRels)
    }

    const characterIds = new Set<string>()
    relationships.forEach((rel) => {
      characterIds.add(rel.fromId)
      characterIds.add(rel.toId)
    })

    const characters = await this.prisma.character.findMany({
      where: {
        id: { in: Array.from(characterIds) },
      },
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    return {
      characters,
      relationships,
      explanation: `找到了 ${relationships.length} 条"${relationshipType}"关系，涉及 ${characters.length} 个人物`,
    }
  }

  private async searchByProperty(
    projectId: string,
    field: string,
    value: string,
  ): Promise<QueryResult> {
    const whereClause: any = {
      projectId,
    }

    if (['appearance', 'personality', 'background', 'goals', 'flaws', 'voice'].includes(field)) {
      whereClause[field] = {
        contains: value,
      }
    }

    const characters = await this.prisma.character.findMany({
      where: whereClause,
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    return {
      characters,
      relationships: [],
      explanation: `在 "${field}" 字段中找到 ${characters.length} 个包含"${value}"的人物`,
    }
  }

  async findRelationshipPath(
    projectId: string,
    startName: string,
    endName: string,
    maxDepth: number = 3,
  ): Promise<QueryResult> {
    const startChar = await this.prisma.character.findFirst({
      where: { projectId, name: { contains: startName } },
    })

    const endChar = await this.prisma.character.findFirst({
      where: { projectId, name: { contains: endName } },
    })

    if (!startChar || !endChar) {
      return {
        characters: [],
        relationships: [],
        paths: [],
        explanation: '找不到起点或终点人物',
      }
    }

    const paths: Array<{
      path: any[]
      depth: number
    }> = []

    const visited = new Set<string>()
    const queue: Array<{ current: any; path: any[]; depth: number }> = [
      {
        current: startChar,
        path: [startChar],
        depth: 0,
      },
    ]

    while (queue.length > 0) {
      const { current, path, depth } = queue.shift()!

      if (depth >= maxDepth) continue
      if (visited.has(current.id)) continue
      visited.add(current.id)

      if (current.id === endChar.id) {
        paths.push({ path: [...path], depth })
        continue
      }

      const outgoingRels = await this.prisma.characterRelationship.findMany({
        where: { fromId: current.id },
        include: { toCharacter: true },
      })

      for (const rel of outgoingRels) {
        queue.push({
          current: rel.toCharacter,
          path: [...path, rel.toCharacter],
          depth: depth + 1,
        })
      }
    }

    const allCharacterIds = new Set<string>()
    paths.forEach((p) => {
      p.path.forEach((c) => allCharacterIds.add(c.id))
    })

    const characters = await this.prisma.character.findMany({
      where: { id: { in: Array.from(allCharacterIds) } },
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    return {
      characters,
      relationships: [],
      paths: paths.map((p) => ({
        path: p.path.map((c) => c.name).join(' → '),
        depth: p.depth,
      })),
      explanation:
        paths.length > 0
          ? `找到 ${paths.length} 条从"${startName}"到"${endName}"的关系路径`
          : `"${startName}"和"${endName}"之间没有找到关系路径`,
    }
  }

  async analyzeCharacterContext(
    projectId: string,
    characterName: string,
  ): Promise<{
    character: any
    directRelationships: any[]
    indirectRelationships: any[]
    groupInfo: any
    summary: string
  }> {
    const character = await this.prisma.character.findFirst({
      where: { projectId, name: { contains: characterName } },
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    if (!character) {
      return {
        character: null,
        directRelationships: [],
        indirectRelationships: [],
        groupInfo: null,
        summary: '未找到该人物',
      }
    }

    const directRelationships = [
      ...character.relationshipsFrom.map((r) => ({
        type: 'outgoing',
        target: r.toCharacter.name,
        relationship: r.relationship,
        description: r.description,
      })),
      ...character.relationshipsTo.map((r) => ({
        type: 'incoming',
        source: r.fromCharacter.name,
        relationship: r.relationship,
        description: r.description,
      })),
    ]

    const connectedIds = new Set<string>()
    directRelationships.forEach((r) => {
      if ('target' in r) connectedIds.add(r.target)
      if ('source' in r) connectedIds.add(r.source)
    })

    const indirectRelationships: any[] = []
    for (const rel of character.relationshipsFrom) {
      const secondDegree = await this.prisma.characterRelationship.findMany({
        where: { fromId: rel.toId },
        include: { toCharacter: true },
      })
      for (const r of secondDegree) {
        if (r.toId !== character.id && !connectedIds.has(r.toId)) {
          indirectRelationships.push({
            character: character.name,
            via: rel.toCharacter.name,
            target: r.toCharacter.name,
            relationship: r.relationship,
          })
        }
      }
    }

    const roleGroups = await this.groupByRole(projectId)
    const groupInfo = roleGroups.find(
      (g: any) =>
        g.role === character.role ||
        (character.role === 'protagonist' && g.role === 'protagonist'),
    )

    const summary = this.generateCharacterSummary(character, directRelationships)

    return {
      character,
      directRelationships,
      indirectRelationships,
      groupInfo,
      summary,
    }
  }

  private async groupByRole(projectId: string) {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      select: { role: true },
    })

    const roleCounts: Record<string, number> = {}
    characters.forEach((c) => {
      if (c.role) {
        roleCounts[c.role] = (roleCounts[c.role] || 0) + 1
      }
    })

    return Object.entries(roleCounts).map(([role, count]) => ({ role, count }))
  }

  private generateCharacterSummary(character: any, relationships: any[]): string {
    const parts: string[] = []

    parts.push(`${character.name}是一个${character.role || '未设定角色'}的角色`)

    if (character.personality) {
      parts.push(`性格特点：${character.personality}`)
    }

    if (character.background) {
      parts.push(`背景：${character.background}`)
    }

    if (relationships.length > 0) {
      const relDescriptions = relationships.slice(0, 3).map((r) => {
        if ('target' in r) return `与${r.target}是${r.relationship}`
        if ('source' in r) return `${r.source}是${r.relationship}`
        return ''
      })
      parts.push(`重要关系：${relDescriptions.join('、')}`)
    }

    return parts.join('。') + '。'
  }

  async buildMiniContext(
    projectId: string,
    characterNames: string[],
  ): Promise<string> {
    const characters = await this.prisma.character.findMany({
      where: {
        projectId,
        name: {
          in: characterNames,
        },
      },
      include: {
        relationshipsFrom: {
          include: { toCharacter: true },
        },
        relationshipsTo: {
          include: { fromCharacter: true },
        },
      },
    })

    let context = '# 人物关系上下文\n\n'

    for (const char of characters) {
      context += `## ${char.name} (${char.role || '未设定'})\n`

      if (char.personality) context += `- 性格：${char.personality}\n`
      if (char.background) context += `- 背景：${char.background}\n`

      const relationships: string[] = []
      char.relationshipsFrom.forEach((r) => {
        if (characterNames.includes(r.toCharacter.name)) {
          relationships.push(`→ ${r.toCharacter.name}: ${r.relationship}`)
        }
      })
      char.relationshipsTo.forEach((r) => {
        if (characterNames.includes(r.fromCharacter.name)) {
          relationships.push(`← ${r.fromCharacter.name}: ${r.relationship}`)
        }
      })

      if (relationships.length > 0) {
        context += `- 关联关系：\n${relationships.map((r) => `  ${r}`).join('\n')}\n`
      }

      context += '\n'
    }

    return context
  }
}
