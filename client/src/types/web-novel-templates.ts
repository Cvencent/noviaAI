export type WebNovelTemplateCategory =
  | 'xuanhuan'
  | 'xianxia'
  | 'urban'
  | 'wuxia'
  | 'mystery'
  | 'romance'
  | 'sci_fi'
  | 'custom'

export interface WebNovelTemplatePromptBlocks {
  system: string
  contract: string
  pacing: string
  taboo: string
  chapter: string
}

export interface WebNovelTemplate {
  id: string
  name: string
  aliases: string[]
  category: WebNovelTemplateCategory
  description: string
  hooks: string[]
  pacingRules: string[]
  tabooRules: string[]
  chapterGoals: string[]
  promptBlocks: WebNovelTemplatePromptBlocks
}

const WEB_NOVEL_TEMPLATES: WebNovelTemplate[] = [
  {
    id: 'shuangwen-system',
    name: '爽文/系统流',
    aliases: ['爽文', '系统流', '打脸升级', '金手指'],
    category: 'xuanhuan',
    description: '金手指开挂、快节奏升级、打脸装逼一条龙。',
    hooks: ['渴望钩', '危机钩', '情绪钩'],
    pacingRules: ['每章至少有一次可感知推进', '章节结尾保留明确期待', '过渡章最多连续 2 章'],
    tabooRules: ['不要长时间停留在设定解释', '不要无限制使用金手指', '不要让爽点缺少前后对比'],
    chapterGoals: ['制造明确目标', '兑现能力或资源', '留下下一章钩子'],
    promptBlocks: {
      system: '按爽文/系统流写作：强钩子、快推进、强反馈，让读者持续获得期待与兑现。',
      contract: '本章必须完成一次明确推进，能让读者感知升级、奖励、打脸或局势反转。',
      pacing: '事件密度高，段落偏短，尽量把信息拆成可读的小块，并在结尾留下期待。',
      taboo: '禁止大段设定讲解；禁止一章内把主线秘密全说完；金手指必须有代价、限制或冷却。',
      chapter: '写出爽点、压力点和下一章钩子，让本章读完后还有继续读下去的欲望。',
    },
  },
  {
    id: 'xianxia',
    name: '修仙/玄幻',
    aliases: ['玄幻', '修仙', '修真', '升级流'],
    category: 'xianxia',
    description: '逆天改命、残酷法则、机缘与争斗并存。',
    hooks: ['危机钩', '渴望钩', '选择钩'],
    pacingRules: ['境界或资源变化要可感知', '设定服务冲突而不是压过剧情', '铺垫章也要留下未解问题'],
    tabooRules: ['不要只讲世界观不推进人物', '不要让突破没有代价', '不要提前解决终局矛盾'],
    chapterGoals: ['推进境界或资源线', '强化世界规则', '制造下一步争斗'],
    promptBlocks: {
      system: '按修仙/玄幻写作：突出境界、资源、法则与强弱秩序，兼顾机缘和压迫感。',
      contract: '本章必须体现主角目标与世界规则之间的张力，并推进一次修行、争夺或身份变化。',
      pacing: '允许少量铺垫，但每章要有资源、信息、能力或关系上的微兑现。',
      taboo: '禁止堆设定；禁止突破无代价；禁止让角色绕开既有世界硬规则。',
      chapter: '结尾留下一个更高层级的威胁、选择或机缘，让升级链条清晰延续。',
    },
  },
  {
    id: 'urban-suspense',
    name: '都市悬疑',
    aliases: ['都市推理', '现实悬疑', '悬疑脑洞'],
    category: 'urban',
    description: '现实压力、信息差、暗线推进和人物关系并行。',
    hooks: ['异常事件', '熟人反转', '隐藏身份'],
    pacingRules: ['每章保留至少一个未解问题', '线索和误导交替出现', '反转必须有依据'],
    tabooRules: ['不要让主角过早看穿一切', '不要一次性说破悬念', '不要让角色工具化'],
    chapterGoals: ['增加怀疑对象', '推进调查', '留下未解问题'],
    promptBlocks: {
      system: '按都市悬疑写作：让日常现实与谜团自然交织，用信息差驱动阅读。',
      contract: '本章必须保留至少一个未解问题，同时给出一个新的观察角度或证据变化。',
      pacing: '线索、误导、情绪压力交替出现，避免平铺直叙的解释。',
      taboo: '不要强行解释谜底；不要让主角凭空全知；不要让关键线索没有前文依据。',
      chapter: '让人物关系推动悬疑，结尾留下一句能让人停不住的钩子。',
    },
  },
  {
    id: 'rules-mystery',
    name: '规则怪谈',
    aliases: ['怪谈', '规则悬疑', '生存规则'],
    category: 'mystery',
    description: '诡异规则、生存推理、反杀怪谈。',
    hooks: ['规则违背', '生存倒计时', '认知反转'],
    pacingRules: ['规则必须逐步验证', '每章至少一次规则压力', '逻辑完整优先于爽点密度'],
    tabooRules: ['不要无代价破规则', '不要把规则写成装饰', '不要靠偶然解决生死局'],
    chapterGoals: ['展示规则代价', '验证或推翻一条认知', '制造下一轮生存选择'],
    promptBlocks: {
      system: '按规则怪谈写作：规则要可被观察、验证、误读和反杀，保持诡异压迫感。',
      contract: '本章必须让角色面对一条规则的代价、漏洞或误导，并推进生存推理。',
      pacing: '用观察、试探、误判和后果推进，不要一次性解释完整规则体系。',
      taboo: '禁止让规则随意失效；禁止纯靠巧合逃生；禁止提前公开全部真相。',
      chapter: '结尾让读者意识到：刚刚理解的规则可能只对了一半。',
    },
  },
  {
    id: 'romance',
    name: '言情/甜宠',
    aliases: ['言情', '甜宠', '现言', '恋爱喜剧'],
    category: 'romance',
    description: '情感互动、关系推进、心动与虐心交织。',
    hooks: ['情绪钩', '渴望钩', '选择钩'],
    pacingRules: ['感情线不能长时间断档', '关系每章至少前进半步', '误会要有节奏地收放'],
    tabooRules: ['不要让角色只会发糖', '不要把情感冲突写死', '不要用解释代替互动'],
    chapterGoals: ['推进关系', '制造情绪波动', '保留下次互动期待'],
    promptBlocks: {
      system: '按言情/甜宠写作：重点是人物互动的温度、节奏和关系张力。',
      contract: '本章必须让关系往前走半步，同时留一点没说透的情绪。',
      pacing: '场景切换轻巧，台词自然，情绪变化要可感知。',
      taboo: '不要过度煽情；不要让角色变成单一功能；不要靠误会无限拖延。',
      chapter: '收束时留一个让人会心一笑或心头一动的尾句。',
    },
  },
  {
    id: 'classic-mystery',
    name: '悬疑/推理',
    aliases: ['推理', '本格推理', '密室', '逻辑悬案'],
    category: 'mystery',
    description: '谜题驱动、逻辑推演、真相一步步揭示。',
    hooks: ['悬念钩', '危机钩', '选择钩'],
    pacingRules: ['信息必须可追踪', '伏笔必须能回收', '解释建立在证据上'],
    tabooRules: ['不要先给结论再补证据', '不要让推理全靠偶然', '不要过早泄底'],
    chapterGoals: ['增加线索密度', '制造误导', '推进推理链条'],
    promptBlocks: {
      system: '按悬疑/推理写作：核心是证据、逻辑、误导和回收。',
      contract: '本章必须新增至少一个关键线索、反证或误导，并维持推理公平性。',
      pacing: '用观察、对话、推理段落推进，不要一口气把谜底端上来。',
      taboo: '不要无证据推翻前文；不要让真相靠巧合；不要过早泄底。',
      chapter: '结尾必须让读者意识到：真相还差一步，但方向已经变了。',
    },
  },
]

export function getWebNovelTemplates(): WebNovelTemplate[] {
  return WEB_NOVEL_TEMPLATES
}

export function getWebNovelTemplate(id: string): WebNovelTemplate | undefined {
  return WEB_NOVEL_TEMPLATES.find((template) => template.id === id)
}

export function resolveTemplateInput(input: string): WebNovelTemplate | undefined {
  const normalized = input.trim().toLowerCase()
  return WEB_NOVEL_TEMPLATES.find((template) => {
    if (template.id === normalized) return true
    if (template.name.toLowerCase() === normalized) return true
    return template.aliases.some((alias) => alias.toLowerCase() === normalized)
  })
}
