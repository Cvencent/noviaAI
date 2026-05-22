import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface ChapterReaderExperience {
  chapterId: string
  title: string
  order: number
  emotion: {
    tension: number
    valence: number
    dominantTone: string
  }
  readability: {
    characterCount: number
    sentenceCount: number
    averageSentenceLength: number
    paragraphCount: number
    dialogueRatio: number
    score: number
  }
}

export interface ReaderRisk {
  chapterId: string
  title: string
  category: 'PACING' | 'READABILITY' | 'CLICHE' | 'LOW_DIALOGUE' | 'LOW_TENSION'
  severity: 'NORMAL' | 'MINOR'
  message: string
}

@Injectable()
export class ReaderExperienceService {
  constructor(private prisma: PrismaService) {}

  async analyzeProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException('项目不存在')
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('没有权限访问此项目')
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { projectId },
      include: { contents: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    })
    const analyzed = chapters.map((chapter: any) => {
      const text = this.chapterText(chapter)
      return {
        chapterId: chapter.id,
        title: chapter.title,
        order: chapter.order,
        emotion: this.analyzeEmotion(text),
        readability: this.analyzeReadability(text),
      }
    })
    const risks = analyzed.flatMap((chapter) => this.findRisks(chapter, this.chapterText(chapters.find((item: any) => item.id === chapter.chapterId))))

    return {
      projectId,
      title: project.title,
      summary: {
        chapterCount: analyzed.length,
        averageReadabilityScore: this.average(analyzed.map((chapter) => chapter.readability.score)),
        averageTension: this.average(analyzed.map((chapter) => chapter.emotion.tension)),
        riskCount: risks.length,
      },
      chapters: analyzed,
      risks,
    }
  }

  private chapterText(chapter: any) {
    return (chapter?.contents || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((content: any) => content.content)
      .join('\n')
  }

  private analyzeReadability(text: string) {
    const clean = text.replace(/<[^>]*>/g, '').trim()
    const characterCount = clean.replace(/\s/g, '').length
    const sentences = clean.split(/[。！？!?]+/).map((item) => item.trim()).filter(Boolean)
    const paragraphs = clean.split(/\n+/).map((item) => item.trim()).filter(Boolean)
    const dialogueChars = (clean.match(/[“"「].+?[”"」]/g) || []).join('').length
    const sentenceCount = Math.max(1, sentences.length)
    const averageSentenceLength = Math.round(characterCount / sentenceCount)
    const dialogueRatio = characterCount ? Math.round((dialogueChars / characterCount) * 100) : 0
    const lengthPenalty = Math.min(45, Math.abs(averageSentenceLength - 24))
    const paragraphPenalty = paragraphs.length <= 1 && characterCount > 600 ? 15 : 0
    const score = Math.max(0, Math.min(100, 100 - lengthPenalty - paragraphPenalty))
    return {
      characterCount,
      sentenceCount,
      averageSentenceLength,
      paragraphCount: paragraphs.length,
      dialogueRatio,
      score,
    }
  }

  private analyzeEmotion(text: string) {
    const tensionWords = this.countMatches(text, ['紧张', '危险', '恐惧', '逼近', '沉默', '冷', '血', '质问', '威胁', '秘密'])
    const positiveWords = this.countMatches(text, ['笑', '温暖', '轻松', '希望', '安心', '明亮'])
    const negativeWords = this.countMatches(text, ['痛', '冷', '死', '怕', '恨', '黑', '沉默', '紧张'])
    const tension = Math.max(0, Math.min(100, 30 + tensionWords * 12 - positiveWords * 3))
    const valence = Math.max(-100, Math.min(100, positiveWords * 18 - negativeWords * 14))
    return {
      tension,
      valence,
      dominantTone: tension > 65 ? '高压' : valence > 20 ? '明亮' : valence < -20 ? '低沉' : '平稳',
    }
  }

  private findRisks(chapter: ChapterReaderExperience, text: string): ReaderRisk[] {
    const risks: ReaderRisk[] = []
    if (chapter.readability.averageSentenceLength > 55) {
      risks.push({
        chapterId: chapter.chapterId,
        title: chapter.title,
        category: 'READABILITY',
        severity: 'NORMAL',
        message: '平均句长偏长，阅读压力可能偏高。',
      })
    }
    if (chapter.readability.dialogueRatio < 5 && chapter.readability.characterCount > 800) {
      risks.push({
        chapterId: chapter.chapterId,
        title: chapter.title,
        category: 'LOW_DIALOGUE',
        severity: 'MINOR',
        message: '长篇叙述中对话比例偏低，场景活跃度可能不足。',
      })
    }
    if (chapter.emotion.tension < 35) {
      risks.push({
        chapterId: chapter.chapterId,
        title: chapter.title,
        category: 'LOW_TENSION',
        severity: 'MINOR',
        message: '本章张力偏低，注意是否承担过渡或信息整理功能。',
      })
    }
    const clicheHits = ['空气仿佛凝固', '命运齿轮', '事情变得复杂'].filter((phrase) => text.includes(phrase))
    if (clicheHits.length) {
      risks.push({
        chapterId: chapter.chapterId,
        title: chapter.title,
        category: 'CLICHE',
        severity: 'NORMAL',
        message: `检测到套路化表达：${clicheHits.join('、')}`,
      })
    }
    return risks
  }

  private countMatches(text: string, words: string[]) {
    return words.reduce((sum, word) => sum + (text.match(new RegExp(word, 'g')) || []).length, 0)
  }

  private average(values: number[]) {
    if (!values.length) return 0
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  }
}
