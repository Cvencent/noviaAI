import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface WritingStyleGuide {
  narrative: {
    perspective: 'first_person' | 'third_person_limited' | 'third_person_omniscient'
    tense: 'past' | 'present'
    voice: 'formal' | 'casual' | 'literary' | 'conversational'
    tone: 'humorous' | 'serious' | 'melancholic' | 'romantic' | 'action_oriented'
    pacing: 'slow' | 'moderate' | 'fast'
  }
  language: {
    vocabulary_level: 'simple' | 'intermediate' | 'advanced'
    sentence_structure: 'short' | 'mixed' | 'complex'
    paragraph_length: 'concise' | 'moderate' | 'descriptive'
    dialogue_ratio: number // 0-1, 建议对话占总内容的比例
    description_type: 'visual' | 'sensory' | 'emotional' | 'minimal'
  }
  formatting: {
    chapter_structure: 'conventional' | 'loose' | 'fragmented'
    scene_breaks: 'symbol' | 'space' | 'number'
    POV_switches: boolean
    flashbacks: 'frequent' | 'occasional' | 'rare'
  }
  genre_conventions: {
    expected_tropes: string[]
    taboo_subjects: string[]
    audience: 'young_adult' | 'new_adult' | 'adult' | 'all_ages'
  }
}

export interface CharacterVoiceProfile {
  characterId: string
  characterName: string
  speech_patterns: {
    vocabulary: string[]
    sentence_length: 'short_abrupt' | 'medium' | 'long_flowing'
    formality: 'very_formal' | 'casual' | 'slang' | 'mixed'
    filler_words: string[]
    speech_ticks: string[]
    common_phrases: string[]
    education_level: 'illiterate' | 'basic' | 'educated' | 'scholarly'
  }
  personality_markers: {
    traits: string[]
    emotional_expressions: Record<string, string[]>
    conflict_style: 'aggressive' | 'passive' | 'diplomatic' | 'avoidant'
    humor_sense: 'dry' | 'sarcastic' | 'warm' | 'none'
  }
  narrative_presence: {
    observation_style: string[]
    internal_monologue_length: 'minimal' | 'moderate' | 'extensive'
    emotional_verbosity: number // 0-10, 表达情感的详细程度
  }
}

export interface PlotThread {
  id: string
  title: string
  description: string
  status: 'setup' | 'rising' | 'climax' | 'resolution' | 'abandoned'
  importance: 'main' | 'subplot' | 'background'
  chapters: string[] // 涉及的章节ID
  milestones: {
    title: string
    description: string
    status: 'pending' | 'introduced' | 'developing' | 'resolved'
    chapterId?: string
  }[]
  promises: {
    setup: string
    fulfillment?: string
    status: 'promised' | 'fulfilled' | 'forgotten'
  }[]
  dependencies: string[] // 依赖的其他情节线
}

export interface TimelineEvent {
  id: string
  timestamp: string // 故事内时间
  title: string
  description: string
  chapterId?: string
  characters: string[]
  plotThreads: string[]
  significance: 'major' | 'minor' | 'background'
}

export interface ContinuityRecord {
  id: string
  chapterId: string
  content: string
  key_events: string[]
  character_states: Record<string, string>
  locations: string[]
  established_facts: string[]
  unresolved_threads: string[]
  callbacks: {
    reference: string
    source_chapter: string
    reference_chapter: string
  }[]
}

@Injectable()
export class WritingConsistencyService {
  constructor(private prisma: PrismaService) {}

  // 1. 风格指南管理
  // async getStyleGuide(projectId: string): Promise<WritingStyleGuide | null> {
  //   const project = await this.prisma.project.findUnique({
  //     where: { id: projectId },
  //     select: { styleGuide: true },
  //   })
  //   return project?.styleGuide as WritingStyleGuide | null
  // }

  // async updateStyleGuide(
  //   projectId: string,
  //   guide: Partial<WritingStyleGuide>,
  // ): Promise<WritingStyleGuide> {
  //   const existing = await this.getStyleGuide(projectId)
  //   const merged = { ...existing, ...guide } as WritingStyleGuide
  //
  //   await this.prisma.project.update({
  //     where: { id: projectId },
  //     data: { styleGuide: merged },
  //   })
  //   return merged
  // }

  // 2. 人物声音档案
  async buildCharacterVoiceProfiles(projectId: string): Promise<CharacterVoiceProfile[]> {
    const characters = await this.prisma.character.findMany({
      where: { projectId },
    })

    const profiles: CharacterVoiceProfile[] = []

    for (const char of characters) {
      const profile: CharacterVoiceProfile = {
        characterId: char.id,
        characterName: char.name,
        speech_patterns: {
          vocabulary: this.extractVocabFromText(char.voice || ''),
          sentence_length: this.determineSentenceLength(char.background || ''),
          formality: this.determineFormality(char.role || ''),
          filler_words: [],
          speech_ticks: [],
          common_phrases: [],
          education_level: this.determineEducation(char.background || ''),
        },
        personality_markers: {
          traits: char.personality?.split(/[,，、]/).filter(Boolean) || [],
          emotional_expressions: {},
          conflict_style: 'diplomatic',
          humor_sense: 'none',
        },
        narrative_presence: {
          observation_style: [],
          internal_monologue_length: 'moderate',
          emotional_verbosity: 5,
        },
      }

      profiles.push(profile)
    }

    return profiles
  }

  // 3. 生成风格提示词
  async generateStylePrompt(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { writingStyleConfig: true },
    })

    if (project?.writingStyleConfig) {
      try {
        const guide = JSON.parse(project.writingStyleConfig) as WritingStyleGuide
        let prompt = '# 写作风格指南\n\n'

        // 叙事风格
        if (guide.narrative) {
          prompt += '## 叙事风格\n'
          if (guide.narrative.perspective) {
            prompt += `- 视角：${this.getPerspectiveLabel(guide.narrative.perspective)}\n`
          }
          if (guide.narrative.tense) {
            prompt += `- 时态：${guide.narrative.tense === 'past' ? '过去时' : '现在时'}\n`
          }
          if (guide.narrative.tone) {
            prompt += `- 语气：${this.getToneLabel(guide.narrative.tone)}\n`
          }
          if (guide.narrative.pacing) {
            prompt += `- 节奏：${this.getPacingLabel(guide.narrative.pacing)}\n`
          }
          prompt += '\n'
        }

        // 语言特点
        if (guide.language) {
          prompt += '## 语言特点\n'
          if (guide.language.vocabulary_level) {
            prompt += `- 词汇水平：${this.getVocabLevelLabel(guide.language.vocabulary_level)}\n`
          }
          if (guide.language.sentence_structure) {
            prompt += `- 句式：${this.getSentenceStructureLabel(guide.language.sentence_structure)}\n`
          }
          if (guide.language.paragraph_length) {
            prompt += `- 段落：${guide.language.paragraph_length === 'concise' ? '简洁' : guide.language.paragraph_length === 'descriptive' ? '详细' : '适中'}\n`
          }
          if (guide.language.dialogue_ratio !== undefined) {
            prompt += `- 对话比例：${Math.round(guide.language.dialogue_ratio * 100)}%\n`
          }
          prompt += '\n'
        }

        // 格式化要求
        if (guide.formatting) {
          prompt += '## 格式化\n'
          if (guide.formatting.chapter_structure) {
            prompt += `- 章节结构：${guide.formatting.chapter_structure === 'conventional' ? '传统' : guide.formatting.chapter_structure === 'loose' ? '松散' : '碎片化'}\n`
          }
          if (guide.formatting.POV_switches !== undefined) {
            prompt += `- 视角切换：${guide.formatting.POV_switches ? '允许' : '不允许'}\n`
          }
          if (guide.formatting.flashbacks) {
            prompt += `- 倒叙使用：${this.getFlashbackLabel(guide.formatting.flashbacks)}\n`
          }
        }

        return prompt.trim() || '请保持一致的叙事风格。'
      } catch {
        // 解析失败，返回默认
      }
    }

    return '请保持一致的叙事风格。'
  }

  // 4. 生成人物对话风格提示
  async generateCharacterVoicePrompts(projectId: string): Promise<string> {
    const profiles = await this.buildCharacterVoiceProfiles(projectId)

    let prompt = '# 人物对话风格\n\n'

    for (const profile of profiles) {
      prompt += `## ${profile.characterName}\n`
      prompt += `- 句长：${this.getSentenceLengthLabel(profile.speech_patterns.sentence_length)}\n`
      prompt += `- 正式程度：${this.getFormalityLabel(profile.speech_patterns.formality)}\n`
      prompt += `- 教育水平：${this.getEducationLabel(profile.speech_patterns.education_level)}\n`

      if (profile.speech_patterns.common_phrases.length > 0) {
        prompt += `- 常用语：${profile.speech_patterns.common_phrases.join('、')}\n`
      }

      if (profile.personality_markers.traits.length > 0) {
        prompt += `- 性格特点：${profile.personality_markers.traits.join('、')}\n`
      }

      prompt += '\n'
    }

    return prompt
  }

  // 5. 情节线追踪
  async getPlotThreads(projectId: string): Promise<PlotThread[]> {
    const plots = await this.prisma.plot.findMany({
      where: { projectId },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return plots.map((plot) => ({
      id: plot.id,
      title: plot.title,
      description: plot.description || '',
      status: plot.status as any,
      importance: 'main',
      chapters: [],
      milestones: plot.plotPoints.map((pp) => ({
        title: pp.title,
        description: pp.description || '',
        status: 'pending',
      })),
      promises: [],
      dependencies: [],
    }))
  }

  // 6. 连续性记录
  async createContinuityRecord(
    projectId: string,
    chapterId: string,
    content: string,
    previousRecord?: ContinuityRecord,
  ): Promise<ContinuityRecord> {
    const keyEvents = this.extractKeyEvents(content)
    const characterStates = this.extractCharacterStates(content)
    const locations = this.extractLocations(content)
    const establishedFacts = this.extractFacts(content)

    const unresolvedThreads = previousRecord
      ? await this.getUnresolvedThreads(projectId, chapterId)
      : []

    const callbacks: ContinuityRecord['callbacks'] = []

    if (previousRecord) {
      for (const fact of establishedFacts) {
        if (previousRecord.established_facts.includes(fact)) {
          callbacks.push({
            reference: fact,
            source_chapter: previousRecord.chapterId,
            reference_chapter: chapterId,
          })
        }
      }
    }

    const record: ContinuityRecord = {
      id: `${chapterId}-continuity`,
      chapterId,
      content: content.slice(0, 1000), // 只保存前1000字符作为摘要
      key_events: keyEvents,
      character_states: characterStates,
      locations,
      established_facts: establishedFacts,
      unresolved_threads: unresolvedThreads,
      callbacks,
    }

    await this.prisma.chapter.update({
      where: { id: chapterId },
      data: { summary: JSON.stringify(record) },
    })

    return record
  }

  async getPreviousContinuity(
    projectId: string,
    beforeChapterId: string,
  ): Promise<ContinuityRecord | null> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: beforeChapterId },
      select: { summary: true },
    })

    if (!chapter?.summary) return null

    try {
      return JSON.parse(chapter.summary)
    } catch {
      return null
    }
  }

  // 7. 生成连续性上下文
  async buildContinuityContext(
    projectId: string,
    currentChapterId?: string,
  ): Promise<string> {
    let context = '# 剧情连续性上下文\n\n'

    // 获取前几章的连续性记录
    const chapters = await this.prisma.chapter.findMany({
      where: {
        projectId,
        ...(currentChapterId
          ? { order: { lt: 0 } } // 需要找到当前章节之前的所有章节
          : {}),
      },
      orderBy: { order: 'asc' },
      take: 5,
      select: { id: true, summary: true, title: true },
    })

    if (chapters.length > 0) {
      context += '## 最近章节回顾\n'
      for (const chapter of chapters.slice(-3)) {
        if (chapter.summary) {
          try {
            const record: ContinuityRecord = JSON.parse(chapter.summary)
            context += `### ${chapter.title}\n`
            context += `- 关键事件：${record.key_events.slice(0, 3).join('、')}\n`
            context += `- 人物状态：${Object.entries(record.character_states)
              .slice(0, 3)
              .map(([name, state]) => `${name}：${state}`)
              .join('；')}\n`
            context += `- 涉及地点：${record.locations.slice(0, 2).join('、')}\n`

            if (record.callbacks.length > 0) {
              context += `- 呼应前文：${record.callbacks.length}处\n`
            }
            context += '\n'
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 获取情节线状态
    const plotThreads = await this.getPlotThreads(projectId)
    if (plotThreads.length > 0) {
      context += '## 情节线状态\n'
      for (const thread of plotThreads.slice(0, 3)) {
        context += `- ${thread.title}：${thread.status}\n`
      }
      context += '\n'
    }

    // 未解之谜
    context += '## 待解决的悬念\n'
    const allUnresolved: string[] = []
    for (const chapter of chapters) {
      if (chapter.summary) {
        try {
          const record: ContinuityRecord = JSON.parse(chapter.summary)
          allUnresolved.push(...record.unresolved_threads)
        } catch (e) {
          // 忽略
        }
      }
    }

    if (allUnresolved.length > 0) {
      for (const unresolved of [...new Set(allUnresolved)].slice(0, 5)) {
        context += `- ${unresolved}\n`
      }
    } else {
      context += '（暂无待解决悬念）\n'
    }

    return context
  }

  // 8. 一致性检查
  async checkConsistency(
    projectId: string,
    newContent: string,
    previousContent?: string,
  ): Promise<{
    styleViolations: string[]
    continuityIssues: string[]
    characterInconsistencies: string[]
    suggestions: string[]
  }> {
    const violations: string[] = []
    const continuityIssues: string[] = []
    const characterInconsistencies: string[] = []
    const suggestions: string[] = []

    // 获取风格指南
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { writingStyleConfig: true },
    })

    if (project?.writingStyleConfig) {
      try {
        const guide = JSON.parse(project.writingStyleConfig) as WritingStyleGuide
        if (guide.language) {
          // 检查句长
          const avgSentenceLength = this.calculateAverageSentenceLength(newContent)
          if (guide.language.sentence_structure === 'short' && avgSentenceLength > 20) {
            violations.push('句子偏长，建议使用更多短句')
            suggestions.push('尝试使用更多简短的句子来增强节奏感')
          } else if (guide.language.sentence_structure === 'complex' && avgSentenceLength < 15) {
            violations.push('句子偏短，建议使用更复杂的长句')
          }

          // 检查对话比例
          if (guide.language.dialogue_ratio !== undefined) {
            const dialogueRatio = this.calculateDialogueRatio(newContent)
            const targetRatio = guide.language.dialogue_ratio
            if (Math.abs(dialogueRatio - targetRatio) > 0.2) {
              violations.push(
                `对话比例为${Math.round(dialogueRatio * 100)}%，与目标${Math.round(targetRatio * 100)}%差距较大`,
              )
            }
          }
        }
      } catch {
        // 解析失败，跳过风格检查
      }
    }

    // 检查人物一致性
    if (previousContent) {
      const previousStates = this.extractCharacterStates(previousContent)
      const newStates = this.extractCharacterStates(newContent)

      for (const [charName, newState] of Object.entries(newStates)) {
        if (previousStates[charName] && previousStates[charName] !== newState) {
          characterInconsistencies.push(
            `${charName}的状态似乎发生了变化：之前是"${previousStates[charName]}"，现在是"${newState}"`,
          )
          suggestions.push(`确认${charName}的状态变化是否合理`)
        }
      }
    }

    // 检查伏笔呼应
    if (previousContent) {
      const establishedFacts = this.extractFacts(previousContent)
      for (const fact of establishedFacts) {
        if (newContent.includes(fact) && !previousContent.includes(fact)) {
          // 这是一个新建立的事实
        }
      }
    }

    return {
      styleViolations: violations,
      continuityIssues,
      characterInconsistencies,
      suggestions,
    }
  }

  // 9. 生成综合写作上下文
  async buildComprehensiveWritingContext(
    projectId: string,
    currentChapterId?: string,
    writingGoal?: string,
  ): Promise<string> {
    const sections: string[] = []

    // 1. 风格指南
    const stylePrompt = await this.generateStylePrompt(projectId)
    sections.push(stylePrompt)

    // 2. 人物对话风格
    const voicePrompts = await this.generateCharacterVoicePrompts(projectId)
    sections.push(voicePrompts)

    // 3. 连续性上下文
    const continuityContext = await this.buildContinuityContext(
      projectId,
      currentChapterId,
    )
    sections.push(continuityContext)

    // 4. 写作目标
    if (writingGoal) {
      sections.push(`# 本次写作目标\n\n${writingGoal}\n`)
    }

    return sections.join('\n\n')
  }

  // ========== 辅助方法 ==========

  private extractKeyEvents(content: string): string[] {
    const events: string[] = []
    const patterns = [
      /(?:突然|没想到|结果|最后|终于|突然之间)([^。]+)/g,
      /([^，]+)决定([^。]+)/g,
      /(.{5,15})和(.{5,15})发生/g,
    ]

    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        events.push(...matches.slice(0, 3))
      }
    }

    return [...new Set(events)].slice(0, 5)
  }

  private extractCharacterStates(content: string): Record<string, string> {
    const states: Record<string, string> = {}
    const patterns = [
      /([A-Z\u4e00-\u9fa5]{2,4})(?:感到|觉得|显得|看起来)([^。，]+)/g,
      /([A-Z\u4e00-\u9fa5]{2,4})(?:的心情|的情绪)([^。，]+)/g,
    ]

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        states[match[1]] = match[2]
      }
    }

    return states
  }

  private extractLocations(content: string): string[] {
    const locations: string[] = []
    const patterns = [
      /(?:在|来到|走进|来到)([^，。]+?)(?:的|里|中|上)/g,
      /(?:地点|场景|位置)(?:：|:)([^。，]+)/g,
    ]

    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        locations.push(
          ...matches
            .map((m) => m.replace(/^(?:在|来到|走进|来到)/, ''))
            .filter((m) => m.length > 1 && m.length < 20),
        )
      }
    }

    return [...new Set(locations)].slice(0, 5)
  }

  private extractFacts(content: string): string[] {
    const facts: string[] = []
    const patterns = [
      /(?:原来|事实上|实际上|据悉)([^。]+)/g,
      /(?:发现|揭示|揭露)([^。]+)是([^。]+)/g,
    ]

    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        facts.push(...matches.slice(0, 3))
      }
    }

    return [...new Set(facts)].slice(0, 10)
  }

  private async getUnresolvedThreads(
    projectId: string,
    currentChapterId: string,
  ): Promise<string[]> {
    const plots = await this.prisma.plot.findMany({
      where: { projectId },
      include: {
        plotPoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    const unresolved: string[] = []
    plots.forEach(plot => {
      const unresolvedPoints = plot.plotPoints.filter(pp => !pp.description?.includes('已解决') && !pp.description?.includes('完成'))
      unresolvedPoints.forEach(point => {
        unresolved.push(`${plot.title}: ${point.title}`)
      })
    })
    return unresolved
  }

  private calculateAverageSentenceLength(text: string): number {
    const sentences = text.split(/[。！？.!?]+/).filter(Boolean)
    if (sentences.length === 0) return 0
    const totalLength = sentences.reduce((sum, s) => sum + s.length, 0)
    return totalLength / sentences.length
  }

  private calculateDialogueRatio(text: string): number {
    const dialogues = text.match(/"[^"]*"|"[^"]*"|『[^』]*』/g)
    if (!dialogues) return 0
    const dialogueLength = dialogues.join('').length
    return dialogueLength / text.length
  }

  private extractVocabFromText(text: string): string[] {
    return text
      .split(/[,，、。\s]+/)
      .filter((w) => w.length > 1 && w.length < 10)
      .slice(0, 20)
  }

  private determineSentenceLength(text: string): 'short_abrupt' | 'medium' | 'long_flowing' {
    const words = text.split(/\s+/).length
    if (words < 50) return 'short_abrupt'
    if (words < 150) return 'medium'
    return 'long_flowing'
  }

  private determineFormality(role: string): 'very_formal' | 'casual' | 'slang' | 'mixed' {
    const formalRoles = ['mentor', 'elder', 'royalty']
    const informalRoles = ['friend', 'sibling', 'youth']
    if (formalRoles.includes(role)) return 'very_formal'
    if (informalRoles.includes(role)) return 'casual'
    return 'mixed'
  }

  private determineEducation(text: string): 'illiterate' | 'basic' | 'educated' | 'scholarly' {
    const eduTerms = ['大学|学院|博士|硕士|学者|教授']
    const basicTerms = ['学校|读书|学习']
    const scholarlyTerms = ['研究|学术|理论']
    if (scholarlyTerms.some((t) => text.includes(t))) return 'scholarly'
    if (eduTerms.some((t) => text.includes(t))) return 'educated'
    if (basicTerms.some((t) => text.includes(t))) return 'basic'
    return 'illiterate'
  }

  private getPerspectiveLabel(p: string): string {
    const labels: Record<string, string> = {
      first_person: '第一人称',
      third_person_limited: '第三人称有限视角',
      third_limited: '第三人称有限视角',
      third_person_omniscient: '第三人称全知视角',
    }
    return labels[p] || p
  }

  private getToneLabel(t: string): string {
    const labels: Record<string, string> = {
      humorous: '幽默轻松',
      serious: '严肃认真',
      melancholic: '忧郁感伤',
      romantic: '浪漫温馨',
      action_oriented: '紧张刺激',
      neutral: '中性',
    }
    return labels[t] || t
  }

  private getPacingLabel(p: string): string {
    const labels: Record<string, string> = {
      slow: '缓慢细腻',
      moderate: '节奏适中',
      fast: '节奏紧凑',
    }
    return labels[p] || p
  }

  private getVocabLevelLabel(l: string): string {
    const labels: Record<string, string> = {
      simple: '简单易懂',
      intermediate: '中等难度',
      advanced: '文学性强',
      literary: '文学性强',
    }
    return labels[l] || l
  }

  private getSentenceStructureLabel(s: string): string {
    const labels: Record<string, string> = {
      short: '短句为主',
      mixed: '长短句结合',
      varied: '长短句结合',
      complex: '复合句为主',
    }
    return labels[s] || s
  }

  private getFlashbackLabel(f: string): string {
    const labels: Record<string, string> = {
      frequent: '经常使用',
      occasional: '偶尔使用',
      rare: '很少使用',
    }
    return labels[f] || f
  }

  private getSentenceLengthLabel(l: string): string {
    const labels: Record<string, string> = {
      short_abrupt: '简短急促',
      medium: '中等长度',
      long_flowing: '冗长流畅',
    }
    return labels[l] || l
  }

  private getFormalityLabel(f: string): string {
    const labels: Record<string, string> = {
      very_formal: '非常正式',
      casual: '轻松随意',
      slang: '口语化',
      mixed: '混合风格',
    }
    return labels[f] || f
  }

  private getEducationLabel(e: string): string {
    const labels: Record<string, string> = {
      illiterate: '文盲',
      basic: '基础教育',
      educated: '受过教育',
      scholarly: '学者水平',
    }
    return labels[e] || e
  }
}
