import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  ConsistencyCheckDto, 
  CheckCategory, 
  Severity,
  CreateCheckRuleDto,
  UpdateCheckRuleDto 
} from './dto/create-check.dto';

interface Issue {
  category: CheckCategory;
  severity: Severity;
  title: string;
  description: string;
  location?: {
    chapterId?: string;
    chapterTitle?: string;
    position?: string;
    content?: string;
  };
  suggestions: string[];
  confirmed: boolean;
}

export interface ReportData {
  issues: Issue[];
  summary: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  metadata: {
    checkedAt: string;
    contentLength: number;
    chaptersIncluded: string[];
    rulesApplied: string[];
  };
  [key: string]: any;
}

@Injectable()
export class ConsistencyCheckService {
  constructor(private prisma: PrismaService) {}

  async getDefaultRules(): Promise<CreateCheckRuleDto[]> {
    return [
      {
        category: CheckCategory.CHECK_CHARACTER,
        name: '人物外貌一致性',
        description: '检查人物外貌描述在全文中是否一致',
        isEnabled: true,
        severity: Severity.CRITICAL,
      },
      {
        category: CheckCategory.CHECK_CHARACTER,
        name: '人物性格一致性',
        description: '检查人物性格表现是否与其设定相符',
        isEnabled: true,
        severity: Severity.CRITICAL,
      },
      {
        category: CheckCategory.CHECK_CHARACTER,
        name: '人物能力一致性',
        description: '检查人物能力是否出现矛盾',
        isEnabled: true,
        severity: Severity.CRITICAL,
      },
      {
        category: CheckCategory.CHECK_TIMELINE,
        name: '时间线矛盾',
        description: '检查事件发生的时间顺序是否合理',
        isEnabled: true,
        severity: Severity.NORMAL,
      },
      {
        category: CheckCategory.CHECK_TIMELINE,
        name: '季节天气矛盾',
        description: '检查同一时间段的季节天气描述是否一致',
        isEnabled: true,
        severity: Severity.NORMAL,
      },
      {
        category: CheckCategory.CHECK_WORLD,
        name: '世界观规则冲突',
        description: '检查是否违反已建立的世界观规则',
        isEnabled: true,
        severity: Severity.CRITICAL,
      },
      {
        category: CheckCategory.CHECK_PLOT,
        name: '情节逻辑矛盾',
        description: '检查情节发展是否符合逻辑',
        isEnabled: true,
        severity: Severity.NORMAL,
      },
      {
        category: CheckCategory.CHECK_RELATIONSHIP,
        name: '人物关系冲突',
        description: '检查人物关系描述是否前后一致',
        isEnabled: true,
        severity: Severity.CRITICAL,
      },
      {
        category: CheckCategory.CHECK_GEOGRAPHY,
        name: '地理位置矛盾',
        description: '检查地点位置描述是否合理',
        isEnabled: true,
        severity: Severity.NORMAL,
      },
    ];
  }

  async getUserRules(userId: string): Promise<any[]> {
    const rules = await this.prisma.consistencyCheckRule.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    if (rules.length === 0) {
      const defaultRules = await this.getDefaultRules();
      for (const rule of defaultRules) {
        await this.prisma.consistencyCheckRule.create({
          data: {
            userId,
            category: rule.category,
            name: rule.name,
            description: rule.description,
            isEnabled: rule.isEnabled,
            severity: rule.severity,
          },
        });
      }
      return this.prisma.consistencyCheckRule.findMany({
        where: { userId },
        orderBy: { category: 'asc' },
      });
    }

    return rules;
  }

  async updateRule(userId: string, ruleId: string, dto: UpdateCheckRuleDto): Promise<any> {
    const rule = await this.prisma.consistencyCheckRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new BadRequestException('规则不存在');
    }

    return await this.prisma.consistencyCheckRule.update({
      where: { id: ruleId },
      data: dto,
    });
  }

  async performCheck(dto: ConsistencyCheckDto): Promise<ReportData> {
    const { projectId, chapterId, content, categories, incremental } = dto;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new BadRequestException('项目不存在');
    }

    const rules = await this.getUserRules(project.userId);
    const enabledRules = rules.filter(r => r.isEnabled);

    const context = await this.buildSmartContext(projectId, chapterId, content);

    const targetedCategories = categories || enabledRules.map(r => r.category);
    const filteredRules = enabledRules.filter(r => targetedCategories.includes(r.category));

    const issues: Issue[] = [];

    for (const rule of filteredRules) {
      const ruleIssues = await this.checkWithRule(rule, content, context);
      issues.push(...ruleIssues);
    }

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    for (const issue of issues) {
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    }

    const reportData: ReportData = {
      issues,
      summary: {
        total: issues.length,
        byCategory,
        bySeverity,
      },
      metadata: {
        checkedAt: new Date().toISOString(),
        contentLength: content.length,
        chaptersIncluded: context.chapters.map(c => c.title),
        rulesApplied: filteredRules.map(r => r.name),
      },
    };

    await this.prisma.consistencyCheckReport.create({
      data: {
        projectId,
        chapterId,
        content,
        reportData: JSON.stringify(reportData),
        totalIssues: issues.length,
        criticalCount: bySeverity[Severity.CRITICAL] || 0,
        normalCount: bySeverity[Severity.NORMAL] || 0,
        minorCount: bySeverity[Severity.MINOR] || 0,
      },
    });

    return reportData;
  }

  private async buildSmartContext(
    projectId: string, 
    currentChapterId?: string, 
    currentContent?: string
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        characters: {
          include: {
            appearances: true,
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
        },
        worldSettings: {
          include: { items: true },
        },
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            contents: {
              orderBy: { order: 'asc' },
            },
            summaries: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        plots: {
          include: {
            plotPoints: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!project) {
      return { chapters: [], characters: [], worldSettings: [], plots: [] };
    }

    let relevantCharacters = project.characters;
    let relevantChapters = project.chapters;

    if (currentChapterId) {
      const currentChapterIndex = project.chapters.findIndex(c => c.id === currentChapterId);
      
      relevantChapters = [
        ...project.chapters.slice(Math.max(0, currentChapterIndex - 3), currentChapterIndex),
        project.chapters[currentChapterIndex],
      ];

      const mentionedCharacters = await this.extractMentionedCharacters(
        currentContent || '',
        project.characters
      );
      relevantCharacters = project.characters.filter(
        c => mentionedCharacters.includes(c.id)
      );
    }

    return {
      chapters: relevantChapters,
      characters: relevantCharacters,
      worldSettings: project.worldSettings,
      plots: project.plots,
    };
  }

  private async extractMentionedCharacters(content: string, characters: any[]): Promise<string[]> {
    const mentioned: string[] = [];
    const contentLower = content.toLowerCase();

    for (const char of characters) {
      if (contentLower.includes(char.name.toLowerCase())) {
        mentioned.push(char.id);
      }
    }

    return mentioned;
  }

  private async checkWithRule(rule: any, content: string, context: any): Promise<Issue[]> {
    const issues: Issue[] = [];

    switch (rule.category) {
      case CheckCategory.CHECK_CHARACTER:
        return this.checkCharacterConsistency(content, context, rule);
      case CheckCategory.CHECK_TIMELINE:
        return this.checkTimelineConsistency(content, context, rule);
      case CheckCategory.CHECK_RELATIONSHIP:
        return this.checkRelationshipConsistency(content, context, rule);
      case CheckCategory.CHECK_WORLD:
        return this.checkWorldConsistency(content, context, rule);
      case CheckCategory.CHECK_GEOGRAPHY:
        return this.checkGeographyConsistency(content, context, rule);
      default:
        return [];
    }
  }

  private async checkCharacterConsistency(content: string, context: any, rule: any): Promise<Issue[]> {
    const issues: Issue[] = [];

    for (const char of context.characters) {
      const appearances = char.appearances || [];
      
      if (appearances.length > 1) {
        const descriptions = appearances.map((a: any) => a.description);
        
        for (let i = 1; i < descriptions.length; i++) {
          const hasInconsistency = await this.detectInconsistency(descriptions[0], descriptions[i]);
          
          if (hasInconsistency) {
            issues.push({
              category: CheckCategory.CHECK_CHARACTER,
              severity: rule.severity as Severity,
              title: `人物"${char.name}"的外貌描述不一致`,
              description: `第1次描述：${descriptions[0]}\n第${i + 1}次描述：${descriptions[i]}`,
              suggestions: [
                '统一使用相同的外貌特征描述',
                '如果外貌有变化，请在情节中给出合理的变化原因',
              ],
              confirmed: false,
            });
          }
        }
      }
    }

    return issues;
  }

  private async detectInconsistency(desc1: string, desc2: string): Promise<boolean> {
    const keyFeatures1 = this.extractKeyFeatures(desc1);
    const keyFeatures2 = this.extractKeyFeatures(desc2);

    for (const feature of ['发', '眼', '肤', '身', '高', '年']) {
      const has1 = keyFeatures1.some(f => f.includes(feature));
      const has2 = keyFeatures2.some(f => f.includes(feature));
      
      if (has1 && has2) {
        const match = keyFeatures1.some(f1 => 
          keyFeatures2.some(f2 => this.featuresMatch(f1, f2))
        );
        
        if (!match) return true;
      }
    }

    return false;
  }

  private extractKeyFeatures(description: string): string[] {
    const features: string[] = [];
    const patterns = [
      /黑发|棕发|金发|白发|红发|蓝发|紫发|绿发/,
      /黑眼|蓝眼|绿眼|棕眼|红眼|紫眼/,
      /白皮肤|黄皮肤|黑皮肤|古铜色/,
      /高|矮|中等身材|魁梧|瘦弱/,
      /年轻|年老|中年|少年|青年/,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) features.push(match[0]);
    }

    return features;
  }

  private featuresMatch(f1: string, f2: string): boolean {
    const hairColors = ['黑发', '棕发', '金发', '白发', '红发'];
    const eyeColors = ['黑眼', '蓝眼', '绿眼', '棕眼'];
    
    for (const color of [...hairColors, ...eyeColors]) {
      if (f1.includes(color) && f2.includes(color)) return true;
    }

    return f1 === f2;
  }

  private async checkTimelineConsistency(content: string, context: any, rule: any): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    const timePatterns = [
      /((?:上午|下午|早上|晚上|凌晨|傍晚|中午|午夜)(?:[一二三四五六七八九十百千万\d]+)?(?:点|时))/g,
      /((?:昨天|今天|明天|前天|后天|今日|翌日)(?:[一二三四五六七八九十百千万\d]+)?(?:日|天))/g,
      /((?:第?[一二三四五六七八九十百千万\d]+)(?:天|日|周|月|年|章|节|幕))/g,
    ];

    const timeMentions: Array<{ time: string; position: number }> = [];
    
    for (const pattern of timePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        timeMentions.push({
          time: match[1],
          position: match.index,
        });
      }
    }

    return issues;
  }

  private async checkRelationshipConsistency(content: string, context: any, rule: any): Promise<Issue[]> {
    const issues: Issue[] = [];

    for (const char of context.characters) {
      const relationships: string[] = [];

      for (const rel of char.relationshipsFrom || []) {
        relationships.push(`${char.name}是${rel.toCharacter.name}的${rel.relationship}`);
      }

      for (const rel of char.relationshipsTo || []) {
        relationships.push(`${rel.fromCharacter.name}是${char.name}的${rel.relationship}`);
      }

      if (relationships.length > 0) {
        const contentLower = content.toLowerCase();
        
        for (const rel of relationships) {
          const names = rel.match(/[\u4e00-\u9fa5]+/g) || [];
          
          for (const name of names) {
            if (name !== char.name && contentLower.includes(name.toLowerCase())) {
              const conflictPattern = this.detectRelationshipConflict(rel, content);
              if (conflictPattern) {
                issues.push({
                  category: CheckCategory.CHECK_RELATIONSHIP,
                  severity: rule.severity as Severity,
                  title: `人物关系可能存在矛盾`,
                  description: `${rel}\n在当前内容中发现：${conflictPattern}`,
                  suggestions: [
                    '检查人物关系描述是否正确',
                    '确认是否是同一人物还是重名',
                  ],
                  confirmed: false,
                });
              }
            }
          }
        }
      }
    }

    return issues;
  }

  private detectRelationshipConflict(relationship: string, content: string): string | null {
    const conflictTerms = ['父亲', '母亲', '儿子', '女儿', '兄弟', '姐妹', '夫妻', '恋人', '朋友', '敌人'];
    
    for (const term of conflictTerms) {
      if (content.includes(term)) {
        const relTerms = relationship.match(new RegExp(conflictTerms.join('|')));
        if (relTerms && !relTerms.includes(term)) {
          return `"${term}"与"${relTerms.join('')}"可能存在冲突`;
        }
      }
    }

    return null;
  }

  private async checkWorldConsistency(content: string, context: any, rule: any): Promise<Issue[]> {
    const issues: Issue[] = [];
    const worldSettings = context.worldSettings || [];

    for (const setting of worldSettings) {
      const settingName = setting.name || setting.category || '世界观设定';
      const items = setting.items || [];

      for (const item of items) {
        const itemName = item.name || '';
        const itemRules = item.description || item.content || '';

        if (!itemName || !itemRules) continue;

        const rulePatterns = this.extractWorldRules(itemRules);
        const contentLower = content.toLowerCase();

        for (const rulePattern of rulePatterns) {
          if (rulePattern.violation && contentLower.includes(rulePattern.violation.toLowerCase())) {
            const hasException = this.checkExceptionContext(content, rulePattern.violation, rulePattern.exception);
            
            if (!hasException) {
              issues.push({
                category: CheckCategory.CHECK_WORLD,
                severity: rule.severity as Severity,
                title: `违反世界观规则：${itemName}`,
                description: `设定规则：${itemRules}\n发现违规内容："${rulePattern.violation}"`,
                location: {
                  content: this.extractContextSnippet(content, rulePattern.violation),
                },
                suggestions: [
                  `检查"${rulePattern.violation}"是否符合${itemName}的设定`,
                  '如果情节需要例外，请在世界观设定中说明',
                  '考虑修改情节或调整世界观设定',
                ],
                confirmed: false,
              });
            }
          }
        }
      }

      if (items.length === 0 && setting.description) {
        const impliedRules = this.extractImpliedWorldRules(setting.description, content);
        issues.push(...impliedRules.map(ruleText => ({
          category: CheckCategory.CHECK_WORLD,
          severity: rule.severity as Severity,
          title: `可能违反世界观设定`,
          description: ruleText,
          suggestions: [
            '检查这段内容是否符合已建立的世界观',
            '如果是伏笔或转折，请确保有足够的铺垫',
          ],
          confirmed: false,
        })));
      }
    }

    return issues;
  }

  private extractWorldRules(text: string): Array<{ violation: string; exception?: string }> {
    const rules: Array<{ violation: string; exception?: string }> = [];
    
    const prohibitionPatterns = [
      /(?:不能|禁止|不许|不可|不允许)[^\n，。！？.!?]{0,50}/g,
      /(?:不能|禁止|不许|不可|不允许)[^\n，。！？.!?]{0,50}/,
    ];

    for (const pattern of prohibitionPatterns) {
      if (pattern instanceof RegExp && pattern.global) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          rules.push({ violation: match[0].replace(/^(?:不能|禁止|不许|不可|不允许)/, '') });
        }
      } else {
        const match = text.match(pattern);
        if (match) {
          rules.push({ violation: match[0].replace(/^(?:不能|禁止|不许|不可|不允许)/, '') });
        }
      }
    }

    return rules;
  }

  private extractImpliedWorldRules(description: string, content: string): string[] {
    const violations: string[] = [];
    const descLower = description.toLowerCase();

    const magicIndicators = ['魔法', '法术', '灵力', '真气', '斗气', '元气'];
    const techIndicators = ['科技', '机械', '电路', '芯片', 'AI'];
    
    for (const indicator of magicIndicators) {
      if (descLower.includes(indicator) && descLower.includes('不存在')) {
        if (content.includes('魔法') || content.includes('灵力') || content.includes('法术')) {
          violations.push(`世界观设定中"${indicator}"不存在，但内容中出现了相关描述`);
        }
      }
    }

    return violations;
  }

  private checkExceptionContext(content: string, violation: string, exception?: string): boolean {
    if (!exception) return false;
    
    const exceptionIndex = content.indexOf(exception);
    const violationIndex = content.indexOf(violation);
    
    if (exceptionIndex === -1 || violationIndex === -1) return false;
    
    const contextRange = 200;
    return Math.abs(exceptionIndex - violationIndex) < contextRange;
  }

  private extractContextSnippet(content: string, keyword: string, contextLength = 50): string {
    const index = content.indexOf(keyword);
    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + keyword.length + contextLength);
    
    return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
  }

  private async checkGeographyConsistency(content: string, context: any, rule: any): Promise<Issue[]> {
    const issues: Issue[] = [];
    const chapters = context.chapters || [];
    const contentLower = content.toLowerCase();

    const locationPatterns = [
      /(?:位于|坐落于|处于|建立在|在)([^，。！？.!?\n]{2,20})(?:的)?(?:北部|南部|东部|西部|北面|南面|东面|西面|上方|下方|左侧|右侧|附近|旁边)/g,
      /(?:从|到|前往|去)([^，。！？.!?\n]{2,20})/g,
    ];

    const locationMentions: Array<{ location: string; position: number; direction?: string }> = [];
    
    for (const pattern of locationPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const directionMatch = match[0].match(/(?:北部|南部|东部|西部|北面|南面|东面|西面)/);
        locationMentions.push({
          location: match[1] || match[2] || '',
          position: match.index,
          direction: directionMatch ? directionMatch[0] : undefined,
        });
      }
    }

    const establishedLocations = this.extractEstablishedLocations(chapters, content);
    
    for (const mention of locationMentions) {
      if (!mention.location) continue;

      const similarLocation = this.findSimilarLocation(mention.location, establishedLocations);
      
      if (similarLocation && similarLocation !== mention.location) {
        issues.push({
          category: CheckCategory.CHECK_GEOGRAPHY,
          severity: rule.severity as Severity,
          title: `地点名称不一致：${mention.location}`,
          description: `当前文本提到"${mention.location}"，但之前使用的是"${similarLocation}"`,
          location: {
            content: this.extractContextSnippet(content, mention.location),
          },
          suggestions: [
            '统一使用相同的地名',
            '如果是同一地点的不同称呼，请在首次出现时说明',
          ],
          confirmed: false,
        });
      }

      if (mention.direction) {
        const logicalError = this.checkDirectionLogic(mention.location, mention.direction, establishedLocations);
        if (logicalError) {
            issues.push({
              category: CheckCategory.CHECK_GEOGRAPHY,
              severity: Severity.MINOR,
              title: `地理位置描述可能不合理`,
            description: logicalError,
            location: {
              content: this.extractContextSnippet(content, mention.location),
            },
            suggestions: [
              '检查方位描述是否正确',
              '确认参照物和被描述对象的关系',
            ],
            confirmed: false,
          });
        }
      }
    }

    const locationRelations = this.extractLocationRelations(chapters);
    for (const relation of locationRelations) {
      if (this.detectLocationRelationConflict(relation, content)) {
        issues.push({
          category: CheckCategory.CHECK_GEOGRAPHY,
          severity: rule.severity as Severity,
          title: `地点关系冲突`,
          description: `${relation.loc1}和${relation.loc2}的关系描述不一致`,
          suggestions: [
            '检查两个地点之间的关系描述',
            '确认是否存在时间或情节导致的地点变化',
          ],
          confirmed: false,
        });
      }
    }

    return issues;
  }

  private extractEstablishedLocations(chapters: any[], currentContent: string): Map<string, { name: string; chapter: string; direction?: string }> {
    const locations = new Map<string, { name: string; chapter: string; direction?: string }>();

    const locationKeywords = /(?:城市|城镇|村庄|国家|地区|大陆|岛屿|山脉|河流|森林|平原|沙漠|海洋|建筑|宫殿|城堡|塔|门)/;
    
    for (const chapter of chapters) {
      const chapterTitle = chapter.title || `第${chapter.order}章`;
      
      if (chapter.contents) {
        for (const content of chapter.contents) {
          const text = content.content || '';
          const locationMatches = text.match(new RegExp(`([^\\s，。！？]{2,10})${locationKeywords.source}`, 'g'));
          
          if (locationMatches) {
            for (const match of locationMatches) {
              locations.set(match, { name: match, chapter: chapterTitle });
            }
          }
        }
      }
    }

    const currentMatches = currentContent.match(new RegExp(`([^\\s，。！？]{2,10})${locationKeywords.source}`, 'g'));
    if (currentMatches) {
      for (const match of currentMatches) {
        locations.set(match, { name: match, chapter: '当前章节' });
      }
    }

    return locations;
  }

  private findSimilarLocation(location: string, establishedLocations: Map<string, any>): string | null {
    const locationClean = location.replace(/[的之]/g, '');
    
    for (const [key] of establishedLocations) {
      const keyClean = key.replace(/[的之]/g, '');
      
      if (this.calculateSimilarity(locationClean, keyClean) > 0.7) {
        return key;
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const longerLength = longer.length;
    const editDistance = this.levenshteinDistance(longer, shorter);

    return (longerLength - editDistance) / longerLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2[i - 1] === str1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private checkDirectionLogic(location: string, direction: string, establishedLocations: Map<string, any>): string | null {
    const northTerms = ['北', '北部', '北面'];
    const southTerms = ['南', '南部', '南面'];
    const eastTerms = ['东', '东部', '东面'];
    const westTerms = ['西', '西部', '西面'];

    const locationLower = location.toLowerCase();
    
    for (const [key, data] of establishedLocations) {
      if (key.includes(location) || location.includes(key)) {
        const oppositeMap: Record<string, string[]> = {
          '北部': southTerms,
          '南部': northTerms,
          '东部': westTerms,
          '西部': eastTerms,
        };

        for (const term of oppositeMap[direction] || []) {
          if (key.includes(term)) {
            return `地点"${location}"的${direction}方向应该是${term}，但之前描述中出现了相反的方位`;
          }
        }
      }
    }

    return null;
  }

  private extractLocationRelations(chapters: any[]): Array<{ loc1: string; loc2: string; relation: string }> {
    const relations: Array<{ loc1: string; loc2: string; relation: string }> = [];

    for (const chapter of chapters) {
      if (chapter.contents) {
        for (const content of chapter.contents) {
          const text = content.content || '';
          const relationPatterns = [
            /(.{2,10})(?:位于|坐落于)(.{2,10})(?:的)(.{2,10})/g,
            /(.{2,10})(?:在)(.{2,10})(?:的)(.{2,10})/g,
          ];

          for (const pattern of relationPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
              relations.push({
                loc1: match[1],
                loc2: match[2],
                relation: match[3],
              });
            }
          }
        }
      }
    }

    return relations;
  }

  private detectLocationRelationConflict(relation: { loc1: string; loc2: string; relation: string }, content: string): boolean {
    const oppositeRelations: Record<string, string[]> = {
      '北': ['南'],
      '南': ['北'],
      '东': ['西'],
      '西': ['东'],
    };

    const conflictPattern = oppositeRelations[relation.relation];
    if (!conflictPattern) return false;

    for (const conflict of conflictPattern) {
      const regex = new RegExp(`${relation.loc1}.{0,10}(?:位于|在|).{0,10}${relation.loc2}.{0,10}${conflict}`);
      if (regex.test(content)) {
        return true;
      }
    }

    return false;
  }

  async getReports(projectId: string, limit = 10): Promise<any[]> {
    return await this.prisma.consistencyCheckReport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markReportReviewed(reportId: string): Promise<any> {
    return await this.prisma.consistencyCheckReport.update({
      where: { id: reportId },
      data: {
        isReviewed: true,
        reviewedAt: new Date(),
      },
    });
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.prisma.consistencyCheckReport.delete({
      where: { id: reportId },
    });
  }
}
