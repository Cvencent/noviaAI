import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Injectable as InjectableDecorator } from '@nestjs/common'

@InjectableDecorator()
export class WritingStylesService {
  constructor(private prisma: PrismaService) {}

  async analyzeText(text: string, userId: string) {
    const analysisPrompt = `请分析以下文本的写作风格特征：

${text}

请提取以下信息并以JSON格式返回：
1. narrative: 叙事特征（视角、时态、口吻、基调、节奏）
2. language: 语言特征（词汇难度、句式、段落长度、对话比例、描写侧重）
3. signature_elements: 标志性元素
4. theme_preferences: 主题偏好
5. suggested_prompt_template: 建议的核心风格要点

只返回JSON，不要有其他内容。`

    return {
      analysisPrompt,
      status: 'ready_for_ai_processing'
    }
  }

  async fuseStyles(styleIds: string[], userId: string, weights?: number[]) {
    const compatibilityAnalysis = this.analyzeStyleCompatibility(styleIds)
    
    return {
      fusedConfig: {
        id: `fused_${Date.now()}`,
        name: '融合风格',
        description: '多风格融合结果',
        compatibilityAnalysis,
        status: 'ready_for_ai_processing'
      },
      compatibilityAnalysis
    }
  }

  private analyzeStyleCompatibility(styleIds: string[]) {
    const conflicts: string[] = []
    const suggestions: string[] = []

    if (styleIds.length >= 2) {
      conflicts.push('不同风格的融合可能存在冲突')
      suggestions.push('建议以一个风格为主，另一个为辅')
      suggestions.push('在不同的叙事元素上可以采用不同风格的优点')
    }

    return {
      conflicts,
      suggestions,
      fusionStrategy: '智能融合 - 由AI根据具体风格特点生成最优融合方案'
    }
  }

  async rewriteWithStyles(text: string, styleIds: string[], userId: string) {
    const results: { [key: string]: string } = {}

    for (const styleId of styleIds) {
      results[styleId] = `【${styleId}风格重写】
请将以下文本以该风格重写：

${text}

---

（此为占位符，实际重写需要调用AI服务）`
    }

    return results
  }

  async deepAnalyzeStyle(styleId: string, userId: string, compareWith?: string[]) {
    return {
      literaryHistory: {
        period: '现代文学时期',
        school: '当代文学流派',
        position: '重要代表作品',
        influences: ['经典文学作品', '文学传统'],
        influenced: ['当代作家', '文学发展']
      },
      comparativeAnalysis: compareWith ? {
        comparison: '需要AI深度分析'
      } : undefined,
      status: 'ready_for_ai_processing'
    }
  }

  async saveCustomStyle(
    userId: string,
    name: string,
    config: string,
    sourceType: string,
    description?: string,
    icon?: string,
    sourceData?: string
  ) {
    return await this.prisma.customWritingStyle.create({
      data: {
        userId,
        name,
        description,
        icon,
        config,
        sourceType,
        sourceData,
        isPublic: false,
        useCount: 0
      }
    })
  }

  async getCustomStyles(userId: string) {
    return await this.prisma.customWritingStyle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getStyleHistory(userId: string, projectId?: string) {
    return await this.prisma.writingStyleHistory.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  }

  async recordStyleAction(
    userId: string,
    action: string,
    projectId?: string,
    styleId?: string,
    details?: string
  ) {
    return await this.prisma.writingStyleHistory.create({
      data: {
        userId,
        action,
        projectId,
        styleId,
        details
      }
    })
  }
}
