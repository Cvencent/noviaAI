import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { WRITING_STYLE_PRESETS } from './writing-style-presets'
import { DEFAULT_ANTI_AI_RULES } from '../../common/constants/anti-ai-rules'

export interface StyleApplicationConfig {
  presetId?: string
  customStyleId?: string
  fusedStyleIds?: string[]
  tuningParams?: {
    dialogueRatio: number
    pacing: number
    vocabularyLevel: number
    descriptionDetail: number
  }
  useContextLearning?: boolean
  adaptationStrength?: number
}

export interface MultiStageStylePrompt {
  stage1_system: string
  stage2_exampleAnalysis: string
  stage3_styleRules: string
  stage4_writingGuidance: string
  fullPrompt: string
}

@Injectable()
export class StyleApplicationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 核心功能：为项目生成多阶段风格提示词
   * 这比简单的一段文本要复杂得多
   */
  async generateMultiStageStylePrompt(
    projectId: string,
    userId: string,
    currentContent?: string,
  ): Promise<MultiStageStylePrompt> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { chapters: { include: { contents: true } } },
    })

    if (!project) {
      throw new InternalServerErrorException('项目不存在')
    }

    // 解析风格配置
    let styleConfig: StyleApplicationConfig = {}
    if (project.writingStyleConfig) {
      try {
        styleConfig = JSON.parse(project.writingStyleConfig)
      } catch (e) {
        console.warn('风格配置解析失败，使用默认值')
      }
    }

    // 获取基础风格
    let baseStyle = null
    if (styleConfig.presetId) {
      baseStyle = WRITING_STYLE_PRESETS.find((s) => s.id === styleConfig.presetId)
    }

    if (styleConfig.customStyleId) {
      const customStyle = await this.prisma.customWritingStyle.findUnique({
        where: { id: styleConfig.customStyleId },
      })
      if (customStyle) {
        try {
          baseStyle = JSON.parse(customStyle.config)
        } catch (e) {
          console.warn('自定义风格解析失败')
        }
      }
    }

    // 如果没有找到，使用默认风格
    if (!baseStyle) {
      baseStyle = WRITING_STYLE_PRESETS[0] // 海明威风格作为默认
    }

    // 从历史文本学习风格（如果启用）
    const learnedStyleContext = styleConfig.useContextLearning
      ? await this.learnFromProjectHistory(project)
      : ''

    // 构建多阶段提示词
    const stage1_system = this.buildStage1SystemPrompt(baseStyle, project)
    const stage2_exampleAnalysis = this.buildStage2ExampleAnalysis(
      baseStyle,
      learnedStyleContext,
    )
    const stage3_styleRules = this.buildStage3StyleRules(baseStyle, styleConfig)
    const stage4_writingGuidance = this.buildStage4WritingGuidance(
      baseStyle,
      project,
    )

    const antiAiRules = DEFAULT_ANTI_AI_RULES.map((rule) => `- ${rule}`).join('\n')

    const fullPrompt = `${stage1_system}\n\n${stage2_exampleAnalysis}\n\n${stage3_styleRules}\n\n${stage4_writingGuidance}\n\n## 反 AI 味约束\n${antiAiRules}`

    return {
      stage1_system,
      stage2_exampleAnalysis,
      stage3_styleRules,
      stage4_writingGuidance,
      fullPrompt,
    }
  }

  /**
   * 阶段1：系统角色设定
   */
  private buildStage1SystemPrompt(style: any, project: any): string {
    return `【系统设定】
你是一位专业的${style.category}作家，擅长${style.name}风格的创作。

你的任务：根据提供的上下文和风格要求，续写或创作小说内容。

核心原则：
1. 严格遵循指定的写作风格
2. 保持与已有内容的连贯性
3. 注重人物性格的一致性
4. 情节推进要自然合理

项目信息：
- 标题：${project.title}
- 类型：${project.genre}
- 简介：${project.synopsis}`
  }

  /**
   * 阶段2：范例分析与风格内化
   * 这是让AI真正理解风格的关键部分
   */
  private buildStage2ExampleAnalysis(
    style: any,
    learnedContext: string,
  ): string {
    let examplesSection = ''

    if (style.exampleTexts && style.exampleTexts.length > 0) {
      examplesSection = style.exampleTexts
        .map(
          (text: string, index: number) => `
【范例 ${index + 1}】
${text}

【风格解析】
- 视角：${style.narrative.perspective}
- 语言：${style.language.vocabulary_level}词汇，${style.language.sentence_structure}句式
- 特征：${style.style_analysis.signature_elements?.join('、') || '无'}`,
        )
        .join('\n\n')
    }

    return `【风格范例分析】
请仔细分析以下范例，理解这种风格的精髓：

${examplesSection}

${
  learnedContext
    ? `【从项目历史中学到的风格特征】
${learnedContext}`
    : ''
}

重要提示：不要直接复制范例内容，而是学习其写作手法和风格特征。`
  }

  /**
   * 阶段3：严格的风格规则清单
   * 可量化的规则让AI更容易遵循
   */
  private buildStage3StyleRules(
    style: any,
    config: StyleApplicationConfig,
  ): string {
    const tuning = config.tuningParams || {
      dialogueRatio: style.language.dialogue_ratio || 0.4,
      pacing: 50,
      vocabularyLevel: 50,
      descriptionDetail: 50,
    }

    return `【风格规则清单 - 必须严格遵守】

▌叙事规则
1. 视角：${this.getPerspectiveText(style.narrative.perspective)}
2. 时态：${this.getTenseText(style.narrative.tense)}
3. 口吻：${this.getVoiceText(style.narrative.voice)}
4. 基调：${style.narrative.tone?.join('、') || '中性'}
5. 节奏：${this.getPacingText(tuning.pacing)}

▌语言规则
1. 词汇难度：${this.getVocabText(tuning.vocabularyLevel)}
2. 句式结构：${this.getSentenceText(style.language.sentence_structure)}
3. 段落长度：${this.getParagraphText(style.language.paragraph_length)}
4. 对话比例：约${Math.round(tuning.dialogueRatio * 100)}%对话，${Math.round((1 - tuning.dialogueRatio) * 100)}%叙述
5. 描写侧重：${this.getDescriptionText(tuning.descriptionDetail)}
6. 用词偏好：${style.language.diction?.join('、') || '无特殊偏好'}
7. 修辞手法：${style.language.figurative_language?.join('、') || '适度使用'}

▌标志性特征
${
  style.style_analysis.signature_elements
    ?.map((el: string, i: number) => `${i + 1}. ${el}`)
    .join('\n') || '无特定标志性特征'
}

▌禁忌事项
- 避免：${style.genre_conventions.taboo_subjects?.join('、') || '无特定禁忌'}
- 不要偏离：${style.name}风格的核心特征`
  }

  /**
   * 阶段4：写作指导与执行策略
   */
  private buildStage4WritingGuidance(style: any, project: any): string {
    return `【写作执行策略】

▌步骤1：先理解上下文
- 阅读已有内容，理解情节进展
- 分析人物状态和关系
- 把握当前场景的氛围

▌步骤2：规划本段内容
- 确定本段的叙事目标
- 规划情节的推进节奏
- 考虑人物的行动和对话

▌步骤3：按照风格创作
- 应用前面的所有风格规则
- 保持与范例一致的语气
- 注意标志性特征的体现

▌步骤4：检查与优化
- 检查视角是否一致
- 确认语言风格匹配
- 验证情节逻辑连贯

【核心风格要点】
${style.prompt_template || '保持风格一致性'}

【最终要求】
你的输出应该是：
1. 完全符合${style.name}风格
2. 与项目上下文连贯
3. 具有可读性和吸引力
4. 可以直接用于小说正文`
  }

  /**
   * 从项目历史中学习风格
   * 这是让AI模仿用户自己写作风格的关键
   */
  private async learnFromProjectHistory(project: any): Promise<string> {
    // 获取最近的章节内容
    const recentContents = project.chapters
      ?.flatMap((chapter: any) =>
        chapter.contents?.map((content: any) => content.content),
      )
      .slice(-3) // 取最近3段
      .join('\n\n---\n\n')

    if (!recentContents || recentContents.length < 100) {
      return ''
    }

    return `从你已经写的内容中，我观察到以下风格特征（请继续保持）：

【已有内容样本】
${recentContents.substring(0, 2000)}...

【请保持一致】
- 继续使用你已有的叙事视角
- 保持相似的句子长度和段落结构
- 延续已建立的人物语气和对话风格
- 维持一贯的节奏和氛围`
  }

  /**
   * 保存项目的风格配置
   */
  async saveProjectStyleConfig(
    projectId: string,
    userId: string,
    config: StyleApplicationConfig,
  ) {
    return await this.prisma.project.update({
      where: { id: projectId },
      data: {
        writingStyleConfig: JSON.stringify(config),
        currentWritingStyleId: config.presetId || config.customStyleId,
      },
    })
  }

  /**
   * 获取项目的风格配置
   */
  async getProjectStyleConfig(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return null
    }

    if (!project.writingStyleConfig) {
      return { presetId: 'hemingway' } // 默认海明威
    }

    try {
      return JSON.parse(project.writingStyleConfig) as StyleApplicationConfig
    } catch {
      return { presetId: 'hemingway' }
    }
  }

  // 辅助方法
  private getPerspectiveText(p: string): string {
    const map: Record<string, string> = {
      first_person: '第一人称（我/我们），代入感强',
      third_person_limited: '第三人称限知，跟随主要人物视角',
      third_person_omniscient: '第三人称全知，可切换视角',
    }
    return map[p] || p
  }

  private getTenseText(t: string): string {
    const map: Record<string, string> = {
      past: '过去时',
      present: '现在时',
      mixed: '混合时态',
    }
    return map[t] || t
  }

  private getVoiceText(v: string): string {
    const map: Record<string, string> = {
      casual: '随意口语化',
      literary: '文学化',
      formal: '正式严肃',
      conversational: '对话感强',
      poetic: '诗意化',
    }
    return map[v] || v
  }

  private getPacingText(v: number): string {
    if (v < 33) return '缓慢细腻，注重描写和铺垫'
    if (v < 66) return '中等节奏，张弛有度'
    return '快速紧凑，情节推进迅速'
  }

  private getVocabText(v: number): string {
    if (v < 33) return '简单易懂，口语化词汇'
    if (v < 66) return '中等难度，通用词汇为主'
    return '高级丰富，多样化表达'
  }

  private getSentenceText(s: string): string {
    const map: Record<string, string> = {
      short: '短句为主，简洁有力',
      mixed: '长短句结合，富于变化',
      complex: '复杂长句，结构精巧',
      flowing: '行云流水，自然流畅',
    }
    return map[s] || s
  }

  private getParagraphText(p: string): string {
    const map: Record<string, string> = {
      concise: '简短精炼，1-3句话',
      moderate: '中等长度，4-8句话',
      descriptive: '详细描写，段落较长',
      epic: '史诗级段落，篇幅宏大',
    }
    return map[p] || p
  }

  private getDescriptionText(v: number): string {
    if (v < 33) return '极简留白，留给读者想象'
    if (v < 66) return '视觉描写为主，画面感强'
    return '丰富细节，多种感官描写'
  }
}
