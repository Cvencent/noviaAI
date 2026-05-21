import { Injectable } from '@nestjs/common'
import { CharacterSearchService } from './character-search.service'

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPToolCall {
  tool: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  tool: string
  result: any
  success: boolean
  error?: string
}

@Injectable()
export class CharacterMCPServerService {
  private tools: MCPTool[]

  constructor(private characterSearch: CharacterSearchService) {
    this.tools = this.registerTools()
  }

  private registerTools(): MCPTool[] {
    return [
      {
        name: 'search_character_by_name',
        description: '根据姓名搜索人物。可以模糊匹配人物名称。',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '人物姓名（支持模糊匹配）',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'search_character_by_role',
        description: '根据角色类型搜索人物，如主角、反派、导师等。',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: '角色类型：protagonist（主角）、antagonist（反派）、mentor（导师）、supporting（配角）等',
              enum: ['protagonist', 'antagonist', 'mentor', 'supporting', 'minor', 'love_interest', 'friend', 'rival', 'other'],
            },
          },
          required: ['role'],
        },
      },
      {
        name: 'search_character_by_relationship',
        description: '搜索具有特定关系的人物，如"父亲"、"朋友"、"敌人"等。',
        inputSchema: {
          type: 'object',
          properties: {
            relationshipType: {
              type: 'string',
              description: '关系类型：父亲、母亲、儿子、女儿、兄弟、姐妹、夫妻、恋人、朋友、敌人、导师、学生等',
            },
            direction: {
              type: 'string',
              description: '关系方向：from（作为关系发起方）、to（作为关系接收方）、both（双向）',
              enum: ['from', 'to', 'both'],
              default: 'both',
            },
          },
          required: ['relationshipType'],
        },
      },
      {
        name: 'search_character_by_property',
        description: '根据人物属性搜索，如外貌特征、性格特点、背景故事等。',
        inputSchema: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: '属性字段：appearance（外貌）、personality（性格）、background（背景）、goals（目标）、flaws（缺陷）',
              enum: ['appearance', 'personality', 'background', 'goals', 'flaws', 'voice'],
            },
            value: {
              type: 'string',
              description: '要搜索的关键词',
            },
          },
          required: ['field', 'value'],
        },
      },
      {
        name: 'find_relationship_path',
        description: '查找两个人物之间的关系路径，可以知道他们通过什么关系连接。',
        inputSchema: {
          type: 'object',
          properties: {
            startName: {
              type: 'string',
              description: '起点人物姓名',
            },
            endName: {
              type: 'string',
              description: '终点人物姓名',
            },
            maxDepth: {
              type: 'number',
              description: '最大搜索深度（默认3）',
              default: 3,
            },
          },
          required: ['startName', 'endName'],
        },
      },
      {
        name: 'get_character_context',
        description: '获取某个人物的详细信息和上下文，包括直接关系和间接关系。',
        inputSchema: {
          type: 'object',
          properties: {
            characterName: {
              type: 'string',
              description: '人物姓名',
            },
          },
          required: ['characterName'],
        },
      },
      {
        name: 'get_characters_involved',
        description: '获取一段文本中涉及的所有人物及其关系。',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '要分析的文本内容',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'build_relationship_context',
        description: '为指定的若干人物构建精简的关系上下文，用于 AI 写作时提供参考。',
        inputSchema: {
          type: 'object',
          properties: {
            characterNames: {
              type: 'array',
              items: { type: 'string' },
              description: '人物姓名列表',
            },
          },
          required: ['characterNames'],
        },
      },
    ]
  }

  getTools(): MCPTool[] {
    return this.tools
  }

  async executeToolCall(
    projectId: string,
    toolCall: MCPToolCall,
  ): Promise<MCPToolResult> {
    try {
      let result: any

      switch (toolCall.tool) {
        case 'search_character_by_name':
          result = await this.characterSearch.search(projectId, {
            type: 'by_name',
            params: { name: toolCall.arguments.name },
          })
          break

        case 'search_character_by_role':
          result = await this.characterSearch.search(projectId, {
            type: 'by_role',
            params: { role: toolCall.arguments.role },
          })
          break

        case 'search_character_by_relationship':
          result = await this.characterSearch.search(projectId, {
            type: 'by_relationship',
            params: {
              relationshipType: toolCall.arguments.relationshipType,
              relationshipDirection: toolCall.arguments.direction || 'both',
            },
          })
          break

        case 'search_character_by_property':
          result = await this.characterSearch.search(projectId, {
            type: 'by_property',
            params: {
              property: {
                field: toolCall.arguments.field,
                value: toolCall.arguments.value,
              },
            },
          })
          break

        case 'find_relationship_path':
          result = await this.characterSearch.findRelationshipPath(
            projectId,
            toolCall.arguments.startName,
            toolCall.arguments.endName,
            toolCall.arguments.maxDepth || 3,
          )
          break

        case 'get_character_context':
          result = await this.characterSearch.analyzeCharacterContext(
            projectId,
            toolCall.arguments.characterName,
          )
          break

        case 'get_characters_involved':
          result = await this.extractCharactersFromText(
            projectId,
            toolCall.arguments.text,
          )
          break

        case 'build_relationship_context':
          result = await this.characterSearch.buildMiniContext(
            projectId,
            toolCall.arguments.characterNames,
          )
          break

        default:
          throw new Error(`Unknown tool: ${toolCall.tool}`)
      }

      return {
        tool: toolCall.tool,
        result,
        success: true,
      }
    } catch (error) {
      return {
        tool: toolCall.tool,
        result: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async extractCharactersFromText(
    projectId: string,
    text: string,
  ): Promise<{
    mentionedCharacters: any[]
    impliedRelationships: any[]
    context: string
  }> {
    const namePattern = /[A-Z\u4e00-\u9fa5][a-z\u4e00-\u9fa5]{1,10}/g
    const potentialNames = text.match(namePattern) || []

    const mentionedCharacters: any[] = []
    const mentionedNames = new Set<string>()

    for (const name of potentialNames) {
      if (mentionedNames.has(name)) continue

      const result = await this.characterSearch.search(projectId, {
        type: 'by_name',
        params: { name },
      })

      if (result.characters.length > 0) {
        mentionedCharacters.push(...result.characters)
        mentionedNames.add(name)
      }
    }

    const impliedRelationships: any[] = []
    for (let i = 0; i < mentionedCharacters.length; i++) {
      for (let j = i + 1; j < mentionedCharacters.length; j++) {
        const char1 = mentionedCharacters[i]
        const char2 = mentionedCharacters[j]

        const rel1 = char1.relationshipsFrom?.find(
          (r: any) => r.toId === char2.id,
        )
        const rel2 = char1.relationshipsTo?.find(
          (r: any) => r.fromId === char2.id,
        )

        if (rel1) {
          impliedRelationships.push({
            from: char1.name,
            to: char2.name,
            relationship: rel1.relationship,
            description: rel1.description,
          })
        } else if (rel2) {
          impliedRelationships.push({
            from: char2.name,
            to: char1.name,
            relationship: rel2.relationship,
            description: rel2.description,
          })
        }
      }
    }

    const context = await this.characterSearch.buildMiniContext(
      projectId,
      mentionedCharacters.map((c) => c.name),
    )

    return {
      mentionedCharacters,
      impliedRelationships,
      context,
    }
  }

  async executeMultipleToolCalls(
    projectId: string,
    toolCalls: MCPToolCall[],
  ): Promise<MCPToolResult[]> {
    const results = await Promise.all(
      toolCalls.map((call) => this.executeToolCall(projectId, call)),
    )
    return results
  }

  generateSystemPrompt(): string {
    return `你是一个专业的人物关系分析助手。你有以下工具可以使用：

1. search_character_by_name - 根据姓名搜索人物
2. search_character_by_role - 根据角色类型搜索
3. search_character_by_relationship - 搜索特定关系的人物
4. search_character_by_property - 根据属性搜索
5. find_relationship_path - 查找两个人物之间的关系路径
6. get_character_context - 获取人物详细信息和上下文
7. get_characters_involved - 分析文本中涉及的人物
8. build_relationship_context - 构建精简的关系上下文

使用这些工具可以帮助你：
- 理解人物之间的关系网络
- 查找特定人物的背景和关系
- 发现人物之间的隐藏联系
- 在写作时提供准确的人物信息

请根据需要主动使用这些工具来获取相关信息。`
  }
}
