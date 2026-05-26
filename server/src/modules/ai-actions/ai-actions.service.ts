import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCharacterDto, UpdateCharacterDto } from '../characters/dto'
import { CreateWorldSettingDto, UpdateWorldSettingDto } from '../world-settings/dto'
import { CreateChapterDto, UpdateChapterDto } from '../chapters/dto'
import { CreatePlotDto, UpdatePlotDto } from '../plots/dto'
import { CreateOutlineDto, UpdateOutlineDto } from '../outlines/dto'
import { CreateSceneDto } from '../scenes/dto'
import { CreateTimelineEventDto } from '../timeline/dto'
import { CreateTurningPointDto } from '../turning-points/dto'
import { CreateChekhovsGunDto } from '../chekhovs-guns/dto'
import { AIActionType } from './dto/ai-action.dto'

interface ActionParams {
  projectId: string
  userId: string
  [key: string]: any
}

@Injectable()
export class AIActionsService {
  constructor(private prisma: PrismaService) {}

  async executeAction(actionType: AIActionType, params: ActionParams): Promise<any> {
    const actionParams = this.normalizeActionParams(params)
    let result
    let message

    switch (actionType) {
      case AIActionType.CREATE_CHARACTER:
        result = await this.createCharacter(actionParams as any)
        message = '角色创建成功'
        break
      case AIActionType.UPDATE_CHARACTER:
        result = await this.updateCharacter(actionParams as any)
        message = '角色更新成功'
        break
      case AIActionType.DELETE_CHARACTER:
        result = await this.deleteCharacter(actionParams as any)
        message = '角色删除成功'
        break
      case AIActionType.ADD_RELATIONSHIP:
        result = await this.addRelationship(actionParams as any)
        message = '角色关系添加成功'
        break
      case AIActionType.CREATE_WORLD_SETTING:
        result = await this.createWorldSetting(actionParams as any)
        message = '世界观设定创建成功'
        break
      case AIActionType.UPDATE_WORLD_SETTING:
        result = await this.updateWorldSetting(actionParams as any)
        message = '世界观设定更新成功'
        break
      case AIActionType.DELETE_WORLD_SETTING:
        result = await this.deleteWorldSetting(actionParams as any)
        message = '世界观设定删除成功'
        break
      case AIActionType.CREATE_CHAPTER:
        result = await this.createChapter(actionParams as any)
        message = '章节创建成功'
        break
      case AIActionType.UPDATE_CHAPTER:
        result = await this.updateChapter(actionParams as any)
        message = '章节更新成功'
        break
      case AIActionType.DELETE_CHAPTER:
        result = await this.deleteChapter(actionParams as any)
        message = '章节删除成功'
        break
      case AIActionType.CREATE_PLOT:
        result = await this.createPlot(actionParams as any)
        message = '剧情线创建成功'
        break
      case AIActionType.CREATE_OUTLINE:
        result = await this.createOutline(actionParams as any)
        message = '大纲创建成功'
        break
      case AIActionType.CREATE_SCENE:
        result = await this.createScene(actionParams as any)
        message = '场景创建成功'
        break
      case AIActionType.CREATE_TIMELINE_EVENT:
        result = await this.createTimelineEvent(actionParams as any)
        message = '时间线事件创建成功'
        break
      case AIActionType.CREATE_TURNING_POINT:
        result = await this.createTurningPoint(actionParams as any)
        message = '转折点创建成功'
        break
      case AIActionType.CREATE_CHEKHOVS_GUN:
        result = await this.createChekhovsGun(actionParams as any)
        message = '伏笔创建成功'
        break
      default:
        throw new BadRequestException(`未知的操作类型: ${actionType}`)
    }

    return {
      success: true,
      actionType,
      result,
      message,
    }
  }

  private normalizeActionParams(params: ActionParams): ActionParams {
    const nestedParameters = params.parameters && typeof params.parameters === 'object'
      ? params.parameters
      : {}

    return {
      ...params,
      ...nestedParameters,
      projectId: params.projectId,
      userId: params.userId,
    }
  }

  async createCharacter(params: {
    projectId: string
    userId: string
    characterData: CreateCharacterDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    if (!params.characterData || !params.characterData.name) {
      throw new BadRequestException('角色名称不能为空')
    }

    const character = await this.prisma.character.create({
      data: {
        ...params.characterData,
        projectId: params.projectId,
      },
    })

    return character
  }

  async updateCharacter(params: {
    projectId: string
    userId: string
    characterId: string
    characterData: UpdateCharacterDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const character = await this.prisma.character.findUnique({
      where: { id: params.characterId },
    })

    if (!character) {
      throw new NotFoundException('角色不存在')
    }

    if (character.projectId !== params.projectId) {
      throw new ForbiddenException('没有权限修改此角色')
    }

    const updatedCharacter = await this.prisma.character.update({
      where: { id: params.characterId },
      data: params.characterData,
    })

    return updatedCharacter
  }

  async deleteCharacter(params: {
    projectId: string
    userId: string
    characterId: string
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const character = await this.prisma.character.findUnique({
      where: { id: params.characterId },
    })

    if (!character) {
      throw new NotFoundException('角色不存在')
    }

    if (character.projectId !== params.projectId) {
      throw new ForbiddenException('没有权限删除此角色')
    }

    await this.prisma.character.delete({
      where: { id: params.characterId },
    })

    return { id: params.characterId, deleted: true }
  }

  async addRelationship(params: {
    projectId: string
    userId: string
    fromCharacterId: string
    toCharacterId: string
    relationship: string
    description?: string
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    if (!params.fromCharacterId || !params.toCharacterId) {
      throw new BadRequestException('必须提供两个角色ID')
    }

    if (params.fromCharacterId === params.toCharacterId) {
      throw new BadRequestException('不能创建自身关系')
    }

    if (!params.relationship) {
      throw new BadRequestException('关系类型不能为空')
    }

    const [fromCharacter, toCharacter] = await Promise.all([
      this.prisma.character.findUnique({
        where: { id: params.fromCharacterId },
      }),
      this.prisma.character.findUnique({
        where: { id: params.toCharacterId },
      }),
    ])

    if (!fromCharacter || !toCharacter) {
      throw new NotFoundException('角色不存在')
    }

    if (fromCharacter.projectId !== params.projectId || toCharacter.projectId !== params.projectId) {
      throw new ForbiddenException('角色不属于当前项目')
    }

    const existingRelationship = await this.prisma.characterRelationship.findFirst({
      where: {
        fromId: params.fromCharacterId,
        toId: params.toCharacterId,
        relationship: params.relationship,
      },
    })

    if (existingRelationship) {
      throw new BadRequestException('关系已存在')
    }

    const relationship = await this.prisma.characterRelationship.create({
      data: {
        fromId: params.fromCharacterId,
        toId: params.toCharacterId,
        relationship: params.relationship,
        description: params.description,
      },
      include: {
        fromCharacter: {
          select: { id: true, name: true },
        },
        toCharacter: {
          select: { id: true, name: true },
        },
      },
    })

    return relationship
  }

  async createWorldSetting(params: {
    projectId: string
    userId: string
    worldSettingData: CreateWorldSettingDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    if (!params.worldSettingData || !params.worldSettingData.name || !params.worldSettingData.category) {
      throw new BadRequestException('设定名称和分类不能为空')
    }

    const worldSetting = await this.prisma.worldSetting.create({
      data: {
        ...params.worldSettingData,
        projectId: params.projectId,
        items: params.worldSettingData.items
          ? {
              create: params.worldSettingData.items.map((item: any) => ({
                name: item.name,
                description: item.description,
                details: item.details,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    })

    return worldSetting
  }

  async updateWorldSetting(params: {
    projectId: string
    userId: string
    worldSettingId: string
    worldSettingData: UpdateWorldSettingDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const worldSetting = await this.prisma.worldSetting.findUnique({
      where: { id: params.worldSettingId },
    })

    if (!worldSetting) {
      throw new NotFoundException('世界观设定不存在')
    }

    if (worldSetting.projectId !== params.projectId) {
      throw new ForbiddenException('没有权限修改此设定')
    }

    const updatedWorldSetting = await this.prisma.worldSetting.update({
      where: { id: params.worldSettingId },
      data: params.worldSettingData as any,
      include: {
        items: true,
      },
    })

    return updatedWorldSetting
  }

  async deleteWorldSetting(params: {
    projectId: string
    userId: string
    worldSettingId: string
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const worldSetting = await this.prisma.worldSetting.findUnique({
      where: { id: params.worldSettingId },
    })

    if (!worldSetting) {
      throw new NotFoundException('世界观设定不存在')
    }

    if (worldSetting.projectId !== params.projectId) {
      throw new ForbiddenException('没有权限删除此设定')
    }

    await this.prisma.worldSetting.delete({
      where: { id: params.worldSettingId },
    })

    return { id: params.worldSettingId, deleted: true }
  }

  async createChapter(params: {
    projectId: string
    userId: string
    chapterData: CreateChapterDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    if (!params.chapterData || !params.chapterData.title) {
      throw new BadRequestException('章节标题不能为空')
    }

    const lastChapter = await this.prisma.chapter.findFirst({
      where: { projectId: params.projectId },
      orderBy: { order: 'desc' },
    })

    const order = params.chapterData.order ?? (lastChapter ? lastChapter.order + 1 : 0)

    const chapter = await this.prisma.chapter.create({
      data: {
        ...params.chapterData,
        order,
        projectId: params.projectId,
      },
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return chapter
  }

  async updateChapter(params: {
    projectId: string
    userId: string
    chapterId: string
    chapterData: UpdateChapterDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: params.chapterId },
    })

    if (!chapter) {
      throw new NotFoundException('章节不存在')
    }

    if (chapter.projectId !== params.projectId) {
      throw new ForbiddenException('没有权限修改此章节')
    }

    const updatedChapter = await this.prisma.chapter.update({
      where: { id: params.chapterId },
      data: params.chapterData,
      include: {
        contents: {
          orderBy: { order: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return updatedChapter
  }

  async deleteChapter(params: {
    projectId: string
    userId: string
    chapterId: string
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: params.chapterId },
    })

    if (!chapter) {
      throw new NotFoundException('章节不存在')
    }

    if (chapter.projectId !== params.projectId) {
      throw new ForbiddenException('没有权限删除此章节')
    }

    const deletedOrder = chapter.order
    
    await this.prisma.chapter.delete({
      where: { id: params.chapterId },
    })

    await this.prisma.chapter.updateMany({
      where: {
        projectId: params.projectId,
        order: { gt: deletedOrder },
      },
      data: {
        order: { decrement: 1 },
      },
    })

    return { id: params.chapterId, deleted: true }
  }

  async createPlot(params: {
    projectId: string
    userId: string
    plotData: CreatePlotDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    if (!params.plotData || !params.plotData.title) {
      throw new BadRequestException('剧情线标题不能为空')
    }

    const plot = await this.prisma.plot.create({
      data: {
        ...params.plotData,
        projectId: params.projectId,
        plotPoints: (params.plotData as any).plotPoints
          ? {
              create: (params.plotData as any).plotPoints.map((point: any, index: number) => ({
                title: point.title,
                type: point.type || 'EVENT',
                description: point.description,
                order: point.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return plot
  }

  async createOutline(params: {
    projectId: string
    userId: string
    outlineData: CreateOutlineDto
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    if (!params.outlineData || !params.outlineData.title) {
      throw new BadRequestException('大纲标题不能为空')
    }

    const outline = await this.prisma.outline.create({
      data: {
        ...params.outlineData,
        projectId: params.projectId,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return outline
  }

  async createScene(params: {
    projectId: string
    userId: string
    sceneData: CreateSceneDto
  }) {
    await this.verifyProjectAccess(params.projectId, params.userId)

    if (!params.sceneData?.title) {
      throw new BadRequestException('场景标题不能为空')
    }

    const lastScene = await this.prisma.scene.findFirst({
      where: { projectId: params.projectId },
      orderBy: { order: 'desc' },
    })
    const order = params.sceneData.order ?? (lastScene ? lastScene.order + 1 : 0)

    return this.prisma.scene.create({
      data: {
        title: params.sceneData.title,
        summary: params.sceneData.summary,
        location: params.sceneData.location,
        timePeriod: params.sceneData.timePeriod,
        characters: params.sceneData.characters,
        content: params.sceneData.content,
        order,
        project: { connect: { id: params.projectId } },
      },
    })
  }

  async createTimelineEvent(params: {
    projectId: string
    userId: string
    timelineEventData: CreateTimelineEventDto
  }) {
    await this.verifyProjectAccess(params.projectId, params.userId)

    if (!params.timelineEventData?.title) {
      throw new BadRequestException('时间线事件标题不能为空')
    }

    const lastEvent = await this.prisma.timelineEvent.findFirst({
      where: { projectId: params.projectId },
      orderBy: { order: 'desc' },
    })
    const order = params.timelineEventData.order ?? (lastEvent ? lastEvent.order + 1 : 0)

    return this.prisma.timelineEvent.create({
      data: {
        ...params.timelineEventData,
        order,
        projectId: params.projectId,
      },
    })
  }

  async createTurningPoint(params: {
    projectId: string
    userId: string
    turningPointData: CreateTurningPointDto
  }) {
    await this.verifyProjectAccess(params.projectId, params.userId)

    if (!params.turningPointData?.title) {
      throw new BadRequestException('转折点标题不能为空')
    }

    const lastTurningPoint = await this.prisma.turningPoint.findFirst({
      where: { projectId: params.projectId },
      orderBy: { order: 'desc' },
    })
    const order = params.turningPointData.order ?? (lastTurningPoint ? lastTurningPoint.order + 1 : 0)

    return this.prisma.turningPoint.create({
      data: {
        ...params.turningPointData,
        order,
        projectId: params.projectId,
      },
    })
  }

  async createChekhovsGun(params: {
    projectId: string
    userId: string
    chekhovsGunData: CreateChekhovsGunDto
  }) {
    await this.verifyProjectAccess(params.projectId, params.userId)

    if (!params.chekhovsGunData?.name || !params.chekhovsGunData?.description || !params.chekhovsGunData?.setupText) {
      throw new BadRequestException('伏笔名称、描述和铺设文本不能为空')
    }

    return this.prisma.chekhovsGun.create({
      data: {
        ...params.chekhovsGunData,
        projectId: params.projectId,
      },
      include: {
        setupChapter: true,
        payoffChapter: true,
      },
    })
  }

  async analyzeAndSuggestActions(params: {
    projectId: string
    userId: string
    content: string
    context?: any
  }) {
    const project = await this.verifyProjectAccess(params.projectId, params.userId)
    
    const suggestions = await this.generateSuggestions(params.content, params.projectId)

    return {
      success: true,
      suggestions,
      context: await this.getContextForAI(params.projectId),
    }
  }

  private async generateSuggestions(content: string, projectId: string) {
    const suggestions: any[] = []
    const lowerContent = content.toLowerCase()

    const [characters, chapters, worldSettings, plots, outlines] = await Promise.all([
      this.prisma.character.findMany({ where: { projectId } }),
      this.prisma.chapter.findMany({ where: { projectId } }),
      this.prisma.worldSetting.findMany({ where: { projectId } }),
      this.prisma.plot.findMany({ where: { projectId } }),
      this.prisma.outline.findMany({ where: { projectId } }),
    ])

    if (lowerContent.includes('创建角色') || lowerContent.includes('添加角色') || 
        lowerContent.includes('新角色') || lowerContent.includes('主角') || 
        lowerContent.includes('配角') || lowerContent.includes('反派')) {
      suggestions.push({
        id: 'create-character-' + Date.now(),
        name: '创建新角色',
        description: '根据你的描述创建一个新角色',
        type: 'character',
        actionType: 'CREATE_CHARACTER',
        parameters: [
          { name: 'name', type: 'string', required: true, description: '角色名称', defaultValue: this.extractName(content) },
          { name: 'role', type: 'string', required: false, description: '角色定位', defaultValue: this.extractRole(content) },
          { name: 'personality', type: 'string', required: false, description: '性格特点' },
          { name: 'background', type: 'string', required: false, description: '背景故事' },
        ],
      })
    }

    if (lowerContent.includes('创建章节') || lowerContent.includes('添加章节') || 
        lowerContent.includes('新章节') || lowerContent.includes('写一章')) {
      suggestions.push({
        id: 'create-chapter-' + Date.now(),
        name: '创建新章节',
        description: '创建一个新的章节',
        type: 'plot',
        actionType: 'CREATE_CHAPTER',
        parameters: [
          { name: 'title', type: 'string', required: true, description: '章节标题', defaultValue: this.extractTitle(content) },
          { name: 'summary', type: 'string', required: false, description: '章节摘要' },
        ],
      })
    }

    if (lowerContent.includes('世界观') || lowerContent.includes('设定') || 
        lowerContent.includes('魔法') || lowerContent.includes('世界')) {
      suggestions.push({
        id: 'create-world-setting-' + Date.now(),
        name: '创建世界观设定',
        description: '添加新的世界观设定',
        type: 'setting',
        actionType: 'CREATE_WORLD_SETTING',
        parameters: [
          { name: 'category', type: 'string', required: true, description: '设定分类', defaultValue: 'GENERAL' },
          { name: 'name', type: 'string', required: true, description: '设定名称' },
          { name: 'description', type: 'string', required: false, description: '设定描述' },
        ],
      })
    }

    if (lowerContent.includes('关系') || lowerContent.includes('是') && 
        (lowerContent.includes('哥哥') || lowerContent.includes('弟弟') || 
         lowerContent.includes('姐姐') || lowerContent.includes('妹妹') ||
         lowerContent.includes('朋友') || lowerContent.includes('敌人'))) {
      if (characters.length >= 2) {
        suggestions.push({
          id: 'add-relationship-' + Date.now(),
          name: '添加角色关系',
          description: '在两个角色之间建立关系',
          type: 'character',
          actionType: 'ADD_RELATIONSHIP',
          parameters: [
            { name: 'fromCharacterId', type: 'string', required: true, description: '角色1', defaultValue: characters[0]?.id },
            { name: 'toCharacterId', type: 'string', required: true, description: '角色2', defaultValue: characters[1]?.id },
            { name: 'relationship', type: 'string', required: true, description: '关系类型', defaultValue: this.extractRelationship(content) },
            { name: 'description', type: 'string', required: false, description: '关系描述' },
          ],
        })
      }
    }

    if (lowerContent.includes('剧情') || lowerContent.includes('情节') || 
        lowerContent.includes('故事线')) {
      suggestions.push({
        id: 'create-plot-' + Date.now(),
        name: '创建剧情线',
        description: '创建一条新的剧情线',
        type: 'plot',
        actionType: 'CREATE_PLOT',
        parameters: [
          { name: 'title', type: 'string', required: true, description: '剧情线标题' },
          { name: 'description', type: 'string', required: false, description: '剧情线描述' },
        ],
      })
    }

    if (lowerContent.includes('大纲') || lowerContent.includes('结构')) {
      suggestions.push({
        id: 'create-outline-' + Date.now(),
        name: '创建大纲',
        description: '创建故事大纲',
        type: 'plot',
        actionType: 'CREATE_OUTLINE',
        parameters: [
          { name: 'title', type: 'string', required: true, description: '大纲标题' },
          { name: 'description', type: 'string', required: false, description: '大纲描述' },
          { name: 'structureType', type: 'string', required: false, description: '结构类型', defaultValue: 'FULL_BOOK' },
        ],
      })
    }

    if (suggestions.length === 0) {
      suggestions.push(
        {
          id: 'create-character-' + Date.now(),
          name: '创建新角色',
          description: '创建一个新的小说角色',
          type: 'character',
          actionType: 'CREATE_CHARACTER',
          parameters: [
            { name: 'name', type: 'string', required: true, description: '角色名称' },
            { name: 'role', type: 'string', required: false, description: '角色定位' },
          ],
        },
        {
          id: 'create-chapter-' + Date.now(),
          name: '创建新章节',
          description: '添加一个新章节',
          type: 'plot',
          actionType: 'CREATE_CHAPTER',
          parameters: [
            { name: 'title', type: 'string', required: true, description: '章节标题' },
          ],
        }
      )
    }

    return suggestions
  }

  private extractName(content: string): string | undefined {
    const patterns = [
      /叫["']?([^"'\s，。]+)["']?/,
      /名叫["']?([^"'\s，。]+)["']?/,
      /名为["']?([^"'\s，。]+)["']?/,
      /名字是["']?([^"'\s，。]+)["']?/,
    ]
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]) return match[1]
    }
    return undefined
  }

  private extractRole(content: string): string | undefined {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('主角')) return 'PROTAGONIST'
    if (lowerContent.includes('反派')) return 'ANTAGONIST'
    if (lowerContent.includes('配角')) return 'SUPPORTING'
    return undefined
  }

  private extractTitle(content: string): string | undefined {
    const patterns = [
      /标题是["']?([^"'\n]+)["']?/,
      /叫["']?([^"'\n]+)["']?/,
    ]
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]) return match[1]
    }
    return '新章节'
  }

  private extractRelationship(content: string): string {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('哥哥')) return 'BROTHER_OLDER'
    if (lowerContent.includes('弟弟')) return 'BROTHER_YOUNGER'
    if (lowerContent.includes('姐姐')) return 'SISTER_OLDER'
    if (lowerContent.includes('妹妹')) return 'SISTER_YOUNGER'
    if (lowerContent.includes('朋友')) return 'FRIEND'
    if (lowerContent.includes('敌人')) return 'ENEMY'
    if (lowerContent.includes('恋人')) return 'LOVER'
    if (lowerContent.includes('师徒')) return 'MASTER_STUDENT'
    return 'OTHER'
  }

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    return project
  }

  async getContextForAI(projectId: string) {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        role: true,
        personality: true,
      },
    })

    const chapters = await this.prisma.chapter.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        order: true,
        status: true,
        wordCount: true,
      },
      orderBy: { order: 'asc' },
    })

    const worldSettings = await this.prisma.worldSetting.findMany({
      where: { projectId },
      select: {
        id: true,
        category: true,
        name: true,
        description: true,
      },
    })

    const plots = await this.prisma.plot.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
      },
    })

    const outlines = await this.prisma.outline.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        description: true,
        structureType: true,
      },
    })

    return {
      characters,
      chapters,
      worldSettings,
      plots,
      outlines,
    }
  }
}
