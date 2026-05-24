import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { AiService } from '../ai/ai.service'
import { ProjectsService } from './projects.service'

@Injectable()
export class AiProjectGeneratorService {
  private projectSuggestionJobTasks = new Set<Promise<void>>()

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private projectsService: ProjectsService,
  ) {}

  async generateProject(userId: string, description: string): Promise<any> {
    const systemPrompt = `你是一个小说项目生成助手。根据用户的简短描述，生成完整的小说项目信息。

返回 JSON 格式：
{
  "title": "小说标题",
  "subtitle": "副标题",
  "synopsis": "故事大纲（200-300字）",
  "genre": "fantasy|romance|scifi|mystery|urban|historical|other",
  "tags": "标签1,标签2,标签3"
}

要求：
1. 标题要吸引人，符合题材
2. 副标题要简洁有力
3. 故事大纲要完整，包含起承转合
4. 题材要准确匹配
5. 标签要相关且有用

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId: 'temp',
      message: `${systemPrompt}\n\n用户描述：${description}`,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const projectData = JSON.parse(jsonMatch[0])
        return await this.projectsService.create(userId, projectData)
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`生成项目失败：${error.message}`)
    }
  }

  async generateCharacters(userId: string, projectId: string, count: number = 3): Promise<any[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new Error('项目不存在')
    }

    const systemPrompt = `你是一个角色生成助手。根据小说项目信息，生成 ${count} 个角色。

项目信息：
- 标题：${project.title}
- 类型：${project.genre}
- 大纲：${project.synopsis}

返回 JSON 数组格式：
[
  {
    "name": "角色名",
    "role": "主角/反派/配角/导师/盟友/其他",
    "appearance": "外貌描述",
    "personality": "性格特点",
    "background": "背景故事",
    "goals": "目标",
    "flaws": "缺陷"
  }
]

要求：
1. 角色要有鲜明的特点
2. 角色之间要有关系和冲突
3. 符合小说类型和背景
4. 角色发展要有潜力

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: systemPrompt,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const characters = JSON.parse(jsonMatch[0])
        const createdCharacters = []
        for (const char of characters) {
          const created = await this.prisma.character.create({
            data: {
              ...char,
              projectId,
            },
          })
          createdCharacters.push(created)
        }
        return createdCharacters
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`生成角色失败：${error.message}`)
    }
  }

  async generateWorldSettings(userId: string, projectId: string, count: number = 3): Promise<any[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new Error('项目不存在')
    }

    const systemPrompt = `你是一个世界观设定助手。根据小说项目信息，生成 ${count} 个世界观设定。

项目信息：
- 标题：${project.title}
- 类型：${project.genre}
- 大纲：${project.synopsis}

返回 JSON 数组格式：
[
  {
    "category": "地理|历史|文化|科技|魔法|社会|其他",
    "name": "设定名称",
    "description": "设定描述"
  }
]

要求：
1. 设定要与小说类型相符
2. 设定之间要有逻辑关系
3. 设定要能支撑故事发展
4. 描述要详细且有想象力

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: systemPrompt,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const settings = JSON.parse(jsonMatch[0])
        const createdSettings = []
        for (const setting of settings) {
          const created = await this.prisma.worldSetting.create({
            data: {
              ...setting,
              projectId,
            },
          })
          createdSettings.push(created)
        }
        return createdSettings
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`生成世界观设定失败：${error.message}`)
    }
  }

  async expandCharacter(userId: string, projectId: string, characterId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!project) {
      throw new Error('项目不存在')
    }
    if (!character) {
      throw new Error('角色不存在')
    }

    const systemPrompt = `你是一个角色深度开发助手。根据已有角色信息，补充和完善角色细节。

项目信息：
- 标题：${project.title}
- 类型：${project.genre}

已有角色信息：
- 姓名：${character.name}
- 角色定位：${character.role || ''}
- 外貌：${character.appearance || ''}
- 性格：${character.personality || ''}
- 背景：${character.background || ''}
- 目标：${character.goals || ''}

返回 JSON 格式，包含要更新的字段：
{
  "appearance": "更详细的外貌描述",
  "personality": "更详细的性格描述",
  "background": "更详细的背景故事",
  "goals": "更清晰的目标",
  "flaws": "角色缺陷",
  "arc": "角色发展弧线",
  "voice": "角色说话风格"
}

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: systemPrompt,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const updateData = JSON.parse(jsonMatch[0])
        return await this.prisma.character.update({
          where: { id: characterId },
          data: updateData,
        })
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`扩展角色失败：${error.message}`)
    }
  }

  async expandWorldSetting(userId: string, projectId: string, settingId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })
    const setting = await this.prisma.worldSetting.findUnique({
      where: { id: settingId },
      include: { items: true },
    })

    if (!project) {
      throw new Error('项目不存在')
    }
    if (!setting) {
      throw new Error('设定不存在')
    }

    const systemPrompt = `你是一个世界观设定深度开发助手。根据已有设定信息，补充和完善设定细节。

项目信息：
- 标题：${project.title}
- 类型：${project.genre}

已有设定信息：
- 分类：${setting.category}
- 名称：${setting.name}
- 描述：${setting.description || ''}

返回 JSON 格式，包含详细子项：
{
  "description": "更详细的描述",
  "items": [
    {
      "name": "子项名称1",
      "description": "子项详细描述"
    },
    {
      "name": "子项名称2",
      "description": "子项详细描述"
    }
  ]
}

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: systemPrompt,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const updateData = JSON.parse(jsonMatch[0])

        // 更新主设定描述
        const updatedSetting = await this.prisma.worldSetting.update({
          where: { id: settingId },
          data: {
            description: updateData.description,
          },
        })

        // 创建子项
        if (updateData.items && Array.isArray(updateData.items)) {
          for (const item of updateData.items) {
            await this.prisma.worldSettingItem.create({
              data: {
                ...item,
                settingId,
              },
            })
          }
        }

        return await this.prisma.worldSetting.findUnique({
          where: { id: settingId },
          include: { items: true },
        })
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`扩展设定失败：${error.message}`)
    }
  }

  async generateProjectSuggestions(userId: string, projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: true,
        worldSettings: true,
        chapters: {
          include: { contents: true },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        },
      },
    })

    if (!project) {
      throw new Error('项目不存在')
    }

    const charactersSummary = project.characters.length > 0
      ? project.characters.map(c => `- ${c.name}: ${c.role || ''}`).join('\n')
      : '暂无角色'

    const settingsSummary = project.worldSettings.length > 0
      ? project.worldSettings.map(s => `- ${s.category} - ${s.name}`).join('\n')
      : '暂无设定'

    const chaptersSummary = project.chapters.length > 0
      ? project.chapters.map(c => `- ${c.title} (${c.wordCount || 0}字)`).join('\n')
      : '暂无章节'

    const systemPrompt = `你是一个小说创作顾问。根据项目信息，给出创作建议。

项目信息：
- 标题：${project.title}
- 类型：${project.genre}
- 大纲：${project.synopsis}
- 字数：${project.wordCount || 0}

现有角色：
${charactersSummary}

现有设定：
${settingsSummary}

最近章节：
${chaptersSummary}

返回 JSON 格式的建议：
{
  "nextSteps": ["下一步建议1", "下一步建议2", "下一步建议3"],
  "contentSuggestions": ["内容建议1", "内容建议2"],
  "characterSuggestions": ["角色相关建议1", "角色相关建议2"],
  "worldSuggestions": ["世界观相关建议1", "世界观相关建议2"],
  "plotSuggestions": ["剧情发展建议1", "剧情发展建议2"]
}

要求：
1. 建议要具体、可操作
2. 根据项目实际情况给出建议
3. 要有优先级顺序

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: systemPrompt,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`生成建议失败：${error.message}`)
    }
  }

  async createProjectSuggestionJob(userId: string, projectId: string) {
    await this.ensureProjectAccess(userId, projectId)

    const job = await this.createSuggestionJobRecord({
      data: {
        projectId,
        status: 'RUNNING',
        input: JSON.stringify({ userId, projectId }),
        result: null,
        error: null,
      },
    })

    this.enqueueProjectSuggestionJob(userId, projectId, job.id)
    return job
  }

  async listProjectSuggestionJobs(userId: string, projectId: string) {
    await this.ensureProjectAccess(userId, projectId)

    return this.findSuggestionJobRecords({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  }

  async waitForIdleProjectSuggestionJobs() {
    await Promise.all([...this.projectSuggestionJobTasks])
  }

  private enqueueProjectSuggestionJob(userId: string, projectId: string, jobId: string) {
    const task = this.runProjectSuggestionJob(userId, projectId, jobId)
      .finally(() => {
        this.projectSuggestionJobTasks.delete(task)
      })
    this.projectSuggestionJobTasks.add(task)
  }

  private async runProjectSuggestionJob(userId: string, projectId: string, jobId: string) {
    try {
      const suggestions = await this.generateProjectSuggestions(userId, projectId)
      await this.updateSuggestionJobRecord({
        where: { id: jobId },
        data: {
          status: 'DONE',
          result: JSON.stringify(suggestions),
          error: null,
        },
      })
    } catch (error) {
      await this.updateSuggestionJobRecord({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'AI 建议生成失败',
        },
      })
    }
  }

  private async ensureProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new Error('项目不存在')
    }
    if (project.userId !== userId) {
      throw new Error('没有权限访问此项目')
    }
  }

  private async createSuggestionJobRecord(args: any) {
    const delegate = (this.prisma as any).projectAiSuggestionJob
    if (delegate) {
      return delegate.create(args)
    }

    const id = randomUUID()
    const now = new Date()
    await this.prisma.$executeRaw`
      INSERT INTO "ProjectAiSuggestionJob" ("id", "projectId", "status", "input", "result", "error", "updatedAt")
      VALUES (${id}, ${args.data.projectId}, ${args.data.status}, ${args.data.input}, ${args.data.result}, ${args.data.error}, ${now})
    `
    return {
      id,
      projectId: args.data.projectId,
      status: args.data.status,
      input: args.data.input,
      result: args.data.result,
      error: args.data.error,
      createdAt: now,
      updatedAt: now,
    }
  }

  private async findSuggestionJobRecords(args: any) {
    const delegate = (this.prisma as any).projectAiSuggestionJob
    if (delegate) {
      return delegate.findMany(args)
    }

    return this.prisma.$queryRaw`
      SELECT "id", "projectId", "status", "input", "result", "error", "createdAt", "updatedAt"
      FROM "ProjectAiSuggestionJob"
      WHERE "projectId" = ${args.where.projectId}
      ORDER BY "createdAt" DESC
      LIMIT ${args.take || 10}
    `
  }

  private async updateSuggestionJobRecord(args: any) {
    const delegate = (this.prisma as any).projectAiSuggestionJob
    if (delegate) {
      return delegate.update(args)
    }

    const now = new Date()
    await this.prisma.$executeRaw`
      UPDATE "ProjectAiSuggestionJob"
      SET "status" = ${args.data.status},
          "result" = ${args.data.result ?? null},
          "error" = ${args.data.error ?? null},
          "updatedAt" = ${now}
      WHERE "id" = ${args.where.id}
    `
    return { id: args.where.id, ...args.data, updatedAt: now }
  }

  async generateChapterOutline(userId: string, projectId: string, chapterId?: string, content?: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new Error('项目不存在')
    }

    const systemPrompt = `你是一个章节大纲生成助手。把文本内容分解成详细的大纲结构。

项目信息：
- 标题：${project.title}
- 类型：${project.genre}

${content ? `需要生成大纲的文本内容：\n${content}` : ''}

返回 JSON 格式的大纲：
{
  "title": "章节标题",
  "summary": "章节摘要",
  "scenes": [
    {
      "title": "场景标题",
      "location": "地点",
      "characters": ["角色1", "角色2"],
      "content": "场景内容描述",
      "purpose": "场景作用"
    }
  ]
}

要求：
1. 大纲要清晰、有逻辑
2. 每个场景要有明确的作用
3. 场景之间要有连贯的发展

只返回 JSON，不要有其他文字。`

    const result = await this.aiService.chat(userId, {
      projectId,
      message: systemPrompt,
      temperature: 0.7,
    })

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('无法解析 AI 生成的内容')
    } catch (error) {
      throw new Error(`生成大纲失败：${error.message}`)
    }
  }
}
