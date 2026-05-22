import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AiService } from '../ai/ai.service'
import { AIAction } from '../ai-config/dto/create-ai-config.dto'
import { ContinueDialogueSessionDto, CreateDialogueSessionDto } from './dto'

export interface ParsedDialogueMessage {
  speaker?: string
  content?: string
}

interface ParsedQualityIssue {
  category: string
  severity: string
  message: string
  speaker?: string
  evidence?: string
}

@Injectable()
export class DialogueSessionsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async create(userId: string, projectId: string, dto: CreateDialogueSessionDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }
    if (dto.characterIds.length < 2) {
      throw new BadRequestException('至少选择两个角色')
    }

    const uniqueCharacterIds = [...new Set(dto.characterIds)]
    const characters = await this.prisma.character.findMany({
      where: {
        projectId,
        id: { in: uniqueCharacterIds },
      },
    })

    if (characters.length !== uniqueCharacterIds.length) {
      throw new BadRequestException('参与角色必须属于当前项目')
    }

    return this.prisma.dialogueSession.create({
      data: {
        projectId,
        chapterId: dto.chapterId,
        title: dto.title,
        location: dto.location,
        conflict: dto.conflict,
        goal: dto.goal,
        mood: dto.mood,
        allowSecretReveal: dto.allowSecretReveal ?? false,
        length: dto.length || 'medium',
        status: 'ACTIVE',
        characterIds: uniqueCharacterIds.join(','),
        currentTurn: 0,
      },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async findAll(userId: string, projectId: string, chapterId?: string) {
    await this.assertProjectAccess(userId, projectId)
    return this.prisma.dialogueSession.findMany({
      where: {
        projectId,
        ...(chapterId ? { chapterId } : {}),
      },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findOne(userId: string, projectId: string, sessionId: string) {
    const session = await this.prisma.dialogueSession.findFirst({
      where: { id: sessionId, projectId },
      include: {
        project: true,
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!session) {
      throw new NotFoundException('对话会话不存在')
    }
    if (session.project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此对话会话')
    }
    return session
  }

  async continueSession(
    userId: string,
    projectId: string,
    sessionId: string,
    dto: ContinueDialogueSessionDto,
  ) {
    const session = await this.findOne(userId, projectId, sessionId)
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('只有进行中的会话可以继续')
    }

    const characterIds = this.parseCharacterIds(session.characterIds)
    const characters = await this.prisma.character.findMany({
      where: {
        projectId,
        id: { in: characterIds },
      },
      include: {
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
    const prompt = this.buildContinuePrompt(session, characters, dto)

    const aiResult = await this.aiService.chat(userId, {
      projectId,
      message: prompt,
      temperature: 0.8,
      action: AIAction.DIALOGUE_GENERATION,
    })
    const parsed = this.parseAiDialogue(aiResult.response)
    const lastMessage = await this.prisma.dialogueMessage.findFirst({
      where: { sessionId },
      orderBy: { order: 'desc' },
    })
    let nextOrder = lastMessage ? lastMessage.order + 1 : 0
    const metadata = parsed.oocWarnings.length > 0
      ? JSON.stringify({ oocWarnings: parsed.oocWarnings })
      : undefined

    const messagesToCreate = []
    if (dto.instruction?.trim()) {
      messagesToCreate.push({
        sessionId,
        speaker: '作者指令',
        content: dto.instruction.trim(),
        type: 'INSTRUCTION',
        order: nextOrder,
        metadata: undefined,
      })
      nextOrder += 1
    }

    for (const message of parsed.messages) {
      messagesToCreate.push({
        sessionId,
        speaker: this.normalizeText(message.speaker, '旁白'),
        content: this.normalizeText(message.content, ''),
        type: 'DIALOGUE',
        order: nextOrder,
        metadata,
      })
      nextOrder += 1
    }

    const validMessages = messagesToCreate.filter((message) => message.content.length > 0)
    if (validMessages.length === 0) {
      throw new BadRequestException('AI 未返回可用对话')
    }

    await this.prisma.dialogueMessage.createMany({ data: validMessages })
    await this.createQualityReport(projectId, session.id, parsed.oocWarnings)

    return this.prisma.dialogueSession.update({
      where: { id: sessionId },
      data: {
        currentTurn: session.currentTurn + 1,
        lastInstruction: dto.instruction?.trim() || session.lastInstruction,
      },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async listQualityReports(userId: string, projectId: string, sessionId: string) {
    await this.findOne(userId, projectId, sessionId)
    return this.prisma.dialogueQualityReport.findMany({
      where: { projectId, sessionId },
      include: { issues: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async improveFromQualityReport(
    userId: string,
    projectId: string,
    sessionId: string,
    dto: { instruction?: string },
  ) {
    const session = await this.findOne(userId, projectId, sessionId)
    const characterIds = this.parseCharacterIds(session.characterIds)
    const [characters, reports] = await Promise.all([
      this.prisma.character.findMany({
        where: { projectId, id: { in: characterIds } },
        include: {
          relationshipsFrom: {
            include: { toCharacter: { select: { id: true, name: true } } },
          },
          relationshipsTo: {
            include: { fromCharacter: { select: { id: true, name: true } } },
          },
        },
      }),
      this.prisma.dialogueQualityReport.findMany({
        where: { projectId, sessionId },
        include: { issues: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
    ])
    const issues = reports[0]?.issues || []
    const prompt = `${this.buildContinuePrompt(session, characters, {
      instruction: dto.instruction,
      rounds: 2,
    })}

质量问题：
${issues.map((issue: any) => `- [${issue.category}/${issue.severity}] ${issue.message}`).join('\n') || '- 暂无质量问题，请加强角色差异和冲突推进。'}

请只返回改写候选 JSON，不要保存，不要解释。`
    const aiResult = await this.aiService.chat(userId, {
      projectId,
      message: prompt,
      temperature: 0.75,
      action: AIAction.DIALOGUE_GENERATION,
    })
    return this.parseAiDialogue(aiResult.response)
  }

  async pause(userId: string, projectId: string, sessionId: string) {
    await this.findOne(userId, projectId, sessionId)
    return this.prisma.dialogueSession.update({
      where: { id: sessionId },
      data: { status: 'PAUSED' },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async resume(userId: string, projectId: string, sessionId: string) {
    await this.findOne(userId, projectId, sessionId)
    return this.prisma.dialogueSession.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE' },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async remove(userId: string, projectId: string, sessionId: string) {
    await this.findOne(userId, projectId, sessionId)
    await this.prisma.dialogueSession.delete({ where: { id: sessionId } })
    return { message: '对话会话已删除' }
  }

  private async assertProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }
    return project
  }

  private buildContinuePrompt(session: any, characters: any[], dto: ContinueDialogueSessionDto) {
    const characterProfiles = characters
      .map((character) => {
        const relationships = [
          ...(character.relationshipsFrom || []).map(
            (rel) => `${character.name} -> ${rel.toCharacter.name}: ${rel.relationship}${rel.description ? `，${rel.description}` : ''}`,
          ),
          ...(character.relationshipsTo || []).map(
            (rel) => `${rel.fromCharacter.name} -> ${character.name}: ${rel.relationship}${rel.description ? `，${rel.description}` : ''}`,
          ),
        ]
        return `## ${character.name}
- 身份：${character.role || '未设定'}
- 性格：${character.personality || '未设定'}
- 目标：${character.goals || '未设定'}
- 缺陷：${character.flaws || '未设定'}
- 说话方式：${character.voice || '未设定'}
- 关系：${relationships.length > 0 ? relationships.join('；') : '未设定'}`
      })
      .join('\n\n')
    const history = session.messages
      .map((message) => `${message.speaker}：${message.content}`)
      .join('\n')
    const rounds = dto.rounds || 2

    return `你是小说角色对话沙盒。请让角色像拥有独立目标和语气的人一样继续对话。

会话：
- 标题：${session.title}
- 地点：${session.location || '未指定'}
- 当前冲突：${session.conflict}
- 对话目标：${session.goal}
- 情绪基调：${session.mood || '未指定'}
- 是否允许暴露秘密：${session.allowSecretReveal ? '允许' : '不允许'}
- 对话长度：${session.length}
- 本次生成轮数：${rounds}
- 作者最新指令：${dto.instruction || '无'}

角色档案：
${characterProfiles}

已有对话：
${history || '暂无'}

请只返回 JSON，不要 Markdown，不要解释：
{
  "messages": [
    { "speaker": "角色名", "content": "台词或少量动作描写" }
  ],
  "oocWarnings": ["如果有角色语气偏离、声音趋同或信息越界，写出简短提醒；没有则返回空数组"]
}

要求：
1. messages 数量控制在 ${rounds * 2} 到 ${rounds * 3} 条。
2. 只能使用参与角色作为 speaker，必要时可用“旁白”写极短动作。
3. 每个角色必须遵守自己的说话方式、目标和缺陷。
4. 对话要推进冲突，不要写成说明文。`
  }

  private parseAiDialogue(response: string): {
    messages: ParsedDialogueMessage[]
    oocWarnings: string[]
  } {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        messages: [{ speaker: '旁白', content: response.trim() }],
        oocWarnings: [],
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        oocWarnings: Array.isArray(parsed.oocWarnings) ? parsed.oocWarnings : [],
      }
    } catch {
      return {
        messages: [{ speaker: '旁白', content: response.trim() }],
        oocWarnings: ['AI 返回格式不是标准 JSON，已作为旁白文本保存。'],
      }
    }
  }

  private async createQualityReport(projectId: string, sessionId: string, warnings: string[]) {
    const issues = this.normalizeQualityIssues(warnings)
    const report = await this.prisma.dialogueQualityReport.create({
      data: {
        projectId,
        sessionId,
        status: issues.length ? 'WARN' : 'PASS',
        summary: issues.length ? `${issues.length} 个对话质量提醒` : '未发现明显对话质量问题',
      },
    })
    if (issues.length) {
      await this.prisma.dialogueQualityIssue.createMany({
        data: issues.map((issue) => ({
          reportId: report.id,
          category: issue.category,
          severity: issue.severity,
          message: issue.message,
          speaker: issue.speaker,
          evidence: issue.evidence,
        })),
      })
    }
    return report
  }

  private normalizeQualityIssues(warnings: string[]): ParsedQualityIssue[] {
    return warnings
      .filter((warning) => warning.trim().length > 0)
      .map((warning) => ({
        category: this.inferQualityCategory(warning),
        severity: /泄密|越界|严重|OOC/.test(warning) ? 'CRITICAL' : 'NORMAL',
        message: warning,
      }))
  }

  private inferQualityCategory(warning: string) {
    if (/泄密|秘密|越界/.test(warning)) return 'SECRET_LEAK'
    if (/趋同|声音|语气相似/.test(warning)) return 'VOICE_SIMILARITY'
    if (/冲突|推进/.test(warning)) return 'LOW_CONFLICT'
    if (/格式|JSON/.test(warning)) return 'FORMAT'
    return 'OOC'
  }

  private parseCharacterIds(value: string) {
    return value
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  }

  private normalizeText(value: unknown, fallback: string) {
    if (typeof value !== 'string') {
      return fallback
    }
    const trimmed = value.trim()
    return trimmed || fallback
  }
}
