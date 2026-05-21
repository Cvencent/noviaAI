import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AiService } from '../ai/ai.service'
import { ProjectsService } from './projects.service'

@Injectable()
export class AiProjectGeneratorService {
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
}
