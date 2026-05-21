export interface WritingStylePreset {
  id: string
  name: string
  description: string
  icon: string
  category: 'fiction' | 'fantasy' | 'mystery' | 'romance' | 'sci_fi' | 'literary' | 'classic' | 'web_novel' | 'chinese_classic'

  narrative: {
    perspective: 'first_person' | 'third_person_limited' | 'third_person_omniscient'
    tense: 'past' | 'present' | 'mixed'
    voice: 'casual' | 'literary' | 'formal' | 'conversational' | 'poetic'
    tone: string[]
    pacing: 'slow' | 'moderate' | 'fast' | 'variable'
  }

  language: {
    vocabulary_level: 'simple' | 'intermediate' | 'advanced' | 'scholarly'
    sentence_structure: 'short' | 'mixed' | 'complex' | 'flowing'
    paragraph_length: 'concise' | 'moderate' | 'descriptive' | 'epic'
    dialogue_ratio: number
    description_type: 'visual' | 'sensory' | 'emotional' | 'minimal' | 'rich'
    diction: string[]
    figurative_language: string[]
  }

  formatting: {
    chapter_structure: 'conventional' | 'loose' | 'fragmented' | 'episodic'
    scene_breaks: 'symbol' | 'space' | 'number' | 'none'
    POV_switches: boolean
    flashbacks: 'frequent' | 'occasional' | 'rare' | 'none'
    prologue_epilogue: boolean
  }

  genre_conventions: {
    expected_tropes: string[]
    taboo_subjects: string[]
    audience: 'young_adult' | 'new_adult' | 'adult' | 'all_ages'
  }

  style_analysis: {
    signature_elements: string[]
    narrative_techniques: string[]
    character_focus: string
    theme_preferences: string[]
    emotional_resonance: string
    pacing_pattern: string
  }

  example_texts: string[]
  recommended_genres: string[]
  prompt_template: string
}

export const WRITING_STYLE_PRESETS: WritingStylePreset[] = [
  {
    id: 'hemingway',
    name: '海明威风格',
    description: '冰山理论、简洁含蓄、短句有力、情感克制',
    icon: '📖',
    category: 'classic',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'casual',
      tone: ['克制', '冷静', '简洁', '阳刚', '压抑'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'simple',
      sentence_structure: 'short',
      paragraph_length: 'concise',
      dialogue_ratio: 0.5,
      description_type: 'visual',
      diction: ['日常词汇', '动词优先', '名词精准', '少用形容词'],
      figurative_language: ['明喻', '低调陈述', '象征', '留白']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['硬汉主角', '战争背景', '酒吧喝酒', '死亡思考'],
      taboo_subjects: ['过度情感描写', '华丽辞藻', '心理分析'],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['冰山理论(7/8在水下)', '重复用词', '对话驱动', '具体细节', '硬汉准则'],
      narrative_techniques: ['限知视角', '客观叙述', '省略技巧', '结局开放'],
      character_focus: '行动而非内心',
      theme_preferences: ['尊严', '勇气', '死亡', '失落', '男子气概'],
      emotional_resonance: '压抑中的力量',
      pacing_pattern: '沉稳有力,张弛有度'
    },
    example_texts: [
      '老人放下钓索,慢慢坐下。这一天很长,他什么也没钓到。不着急,他想。海还是海,明天会更好。',
      '他看着海。风从西边吹来,带着咸腥的味道。云层很低,压在海面上。他知道,要变天了。',
      '"我不干了,"他说。"就这样吧。"她没说话,只是看着他。他站起身,走了出去。'
    ],
    recommended_genres: ['文学小说', '战争故事', '短篇小说'],
    prompt_template: '记住:用最简洁的语言表达最深沉的情感。让行动说话,让细节说话,把7/8的内容藏在水面下。避免任何华丽辞藻和心理分析,用客观、冷静、克制的语气叙述。'
  },
  {
    id: 'marquez',
    name: '马尔克斯风格',
    description: '魔幻现实主义、时间循环、家族史诗、魔幻与现实交织',
    icon: '🪶',
    category: 'classic',
    narrative: {
      perspective: 'third_person_omniscient',
      tense: 'past',
      voice: 'literary',
      tone: ['魔幻', '宿命', '幽默', '忧郁', '怀旧'],
      pacing: 'slow'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.25,
      description_type: 'sensory',
      diction: ['华丽辞藻', '丰富修饰', '色彩词汇', '时间词汇'],
      figurative_language: ['夸张', '隐喻', '象征', '魔幻意象', '循环叙事']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'symbol',
      POV_switches: true,
      flashbacks: 'frequent',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['百年孤独', '家族诅咒', '黄色蝴蝶', '雨'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['魔幻与现实无缝融合', '时间循环', '家族史诗', '标志性意象', '宿命感'],
      narrative_techniques: ['循环叙事', '预叙', '追叙', '全知视角', '丰富细节'],
      character_focus: '家族命运与个人悲剧',
      theme_preferences: ['孤独', '宿命', '时间', '爱情', '家族'],
      emotional_resonance: '魔幻中的深刻忧伤',
      pacing_pattern: '缓慢流淌,如时间长河'
    },
    example_texts: [
      '多年以后,奥雷里亚诺上校站在行刑队面前,准会想起父亲带他去参观冰块的那个遥远的下午。',
      '当时,马孔多是个二十户人家的村庄,一座座土房都盖在河岸上,河水清澈,沿着遍布石头的河床流去。',
      '雨下了四年十一个月零两天。不是连绵不断的雨,而是时断时续的雨,从不停歇。'
    ],
    recommended_genres: ['魔幻现实主义', '家族史诗', '魔幻小说'],
    prompt_template: '记住:让魔幻元素自然融入日常生活,仿佛它们一直都在那里。时间不是线性的,过去、现在、未来可以同时存在。创造丰富的感官细节,让读者能看到、听到、闻到、尝到、触到那个世界。'
  },
  {
    id: 'jin_yong',
    name: '金庸风格',
    description: '武侠宗师、江湖侠义、招式描写、人物丰满',
    icon: '⚔️',
    category: 'chinese_classic',
    narrative: {
      perspective: 'third_person_omniscient',
      tense: 'past',
      voice: 'literary',
      tone: ['豪迈', '侠义', '柔情', '江湖', '古典'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'mixed',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.4,
      description_type: 'sensory',
      diction: ['武侠术语', '古典词汇', '招式名称', '门派名称', '诗词引用'],
      figurative_language: ['对仗', '比喻', '排比', '引用诗词', '象征']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: true,
      flashbacks: 'occasional',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['比武招亲', '门派争斗', '掉崖奇遇', '秘籍宝典', '侠客行侠'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['精彩武打描写', '侠义精神', '爱情缠绵', '历史背景', '人物成长'],
      narrative_techniques: ['章回体', '伏笔千里', '人物群像', '历史融入', '诗词点缀'],
      character_focus: '侠客的成长与情感',
      theme_preferences: ['侠义', '爱情', '忠义', '成长', '江湖规矩'],
      emotional_resonance: '豪迈中见柔情',
      pacing_pattern: '张弛有度,高潮迭起'
    },
    example_texts: [
      '但见那少年身形一晃,剑尖已刺向对手咽喉。那人侧身闪避,反手一掌拍出,掌风呼呼,威力惊人。',
      '"问世间,情是何物,直教生死相许。"她轻声道,眼中泛起泪光。',
      '华山之巅,两人相对而立。剑光闪烁,如银蛇吐信;掌风呼啸,似虎啸山林。'
    ],
    recommended_genres: ['武侠小说', '江湖传奇', '侠客故事'],
    prompt_template: '记住:武打描写要精彩纷呈,招式名称要有意境。侠客要有担当,有情有义。爱情要缠绵悱恻,家国情怀要厚重深沉。善用诗词典故,增添文化底蕴。'
  },
  {
    id: 'gu_long',
    name: '古龙风格',
    description: '浪子武侠、悬念迭起、简洁有力、意境深远',
    icon: '🌙',
    category: 'chinese_classic',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'poetic',
      tone: ['洒脱', '孤独', '神秘', '浪漫', '冷峻'],
      pacing: 'fast'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'short',
      paragraph_length: 'concise',
      dialogue_ratio: 0.55,
      description_type: 'minimal',
      diction: ['短句', '意境词', '留白', '对话为主'],
      figurative_language: ['象征', '留白', '意境描写', '短句并列']
    },
    formatting: {
      chapter_structure: 'loose',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'rare',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['浪子', '酒', '剑', '孤独高手', '悬疑推理'],
      taboo_subjects: ['过长描写', '复杂招式', '拖沓情节'],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['短句分节', '意境渲染', '悬念设置', '对话哲理', '浪子形象'],
      narrative_techniques: ['悬念递进', '对话推进', '意境留白', '快速节奏'],
      character_focus: '浪子剑客的内心世界',
      theme_preferences: ['孤独', '自由', '友情', '酒', '剑道'],
      emotional_resonance: '寂寞中见热血',
      pacing_pattern: '快节奏推进,悬念丛生'
    },
    example_texts: [
      '酒。剑。女人。这是他生命中永恒的三样东西。',
      '他没有说话,只是喝了口酒。酒是烈的,人心更烈。',
      '"你来了。""我来了。""你不该来。""可我已经来了。"'
    ],
    recommended_genres: ['武侠小说', '悬疑武侠', '浪子传奇'],
    prompt_template: '记住:能用一句话说完的,绝不用两句。多用意境,少用描写。对话要有弦外之音,一句抵一万句。浪子永远是孤独的,但孤独中也有一腔热血。'
  },
  {
    id: 'lu_xun',
    name: '鲁迅风格',
    description: '深刻犀利、讽刺批判、文白夹杂、唤醒国民',
    icon: '🖋️',
    category: 'chinese_classic',
    narrative: {
      perspective: 'third_person_omniscient',
      tense: 'past',
      voice: 'formal',
      tone: ['深刻', '讽刺', '冷峻', '批判', '忧愤'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.35,
      description_type: 'emotional',
      diction: ['文白夹杂', '犀利词汇', '讽刺用语', '深刻比喻'],
      figurative_language: ['讽刺', '反讽', '隐喻', '象征', '对比']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: true,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['批判现实', '国民性', '社会讽刺', '知识分子的困境'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['犀利讽刺', '深刻批判', '文白相间', '白描手法', '警句名言'],
      narrative_techniques: ['白描', '讽刺', '对比', '夹叙夹议', '画龙点睛'],
      character_focus: '普通人的精神困境',
      theme_preferences: ['批判', '国民性', '社会黑暗', '知识分子', '民族命运'],
      emotional_resonance: '冷峻中的深刻关怀',
      pacing_pattern: '沉稳有力,发人深省'
    },
    example_texts: [
      '孔乙己是站着喝酒而穿长衫的唯一的人。他身材高大;青白脸色,皱纹间常夹些伤痕。',
      '"大约孔乙己的确死了。"掌柜也说过,一面寻思,一面又提起那永远新鲜的十九个钱。',
      '我从此便觉得医学并非一件紧要事,凡是愚弱的国民,即使体格如何健全,如何茁壮,也只能做毫无意义的示众的材料和看客。'
    ],
    recommended_genres: ['讽刺小说', '社会批判', '短篇小说'],
    prompt_template: '记住:笔锋要犀利,讽刺要深刻。善用白描,寥寥几笔便勾勒出人物灵魂。文白夹杂要自然,警句名言要有分量。批判是为了唤醒,冷漠是为了点燃热血。'
  },
  {
    id: 'zhang_aiying',
    name: '张爱玲风格',
    description: '苍凉华丽、心理细腻、市井女性、时代悲歌',
    icon: '🌸',
    category: 'chinese_classic',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'literary',
      tone: ['苍凉', '华丽', '细腻', '冷漠', '感伤'],
      pacing: 'slow'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.3,
      description_type: 'sensory',
      diction: ['华丽词汇', '色彩描写', '服饰细节', '心理词汇'],
      figurative_language: ['比喻', '通感', '象征', '色彩渲染', '细节堆砌']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'frequent',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['爱情悲剧', '大家庭', '女性困境', '时代变迁'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['华丽意象', '细腻心理', '色彩描写', '服饰细节', '苍凉底色'],
      narrative_techniques: ['心理描写', '意象叠加', '对比反讽', '细节刻画'],
      character_focus: '女性的心理世界',
      theme_preferences: ['爱情', '女性命运', '时代悲歌', '人性苍凉', '繁华背后的虚空'],
      emotional_resonance: '华丽中的苍凉',
      pacing_pattern: '缓慢细腻,意蕴悠长'
    },
    example_texts: [
      '她的声音像银铃,轻轻一碰,便碎了一地。',
      '三十年前的上海,一个有月亮的晚上,我们也许会想着:如果当初......可是人生若只如初见。',
      '她站在镜前,看着自己。旗袍是葱绿色的,绣着银线牡丹。三十岁,女人最好的年华,也是最坏的年华。'
    ],
    recommended_genres: ['言情小说', '女性文学', '时代悲歌'],
    prompt_template: '记住:意象要华丽,心理要细腻。色彩是情绪,服饰是命运。繁华背后是苍凉,热闹底下是虚空。女性视角要柔中带刚,看透却不说透。'
  },
  {
    id: 'wang_xiaobo',
    name: '王小波风格',
    description: '黑色幽默、反讽戏谑、性爱描写、思想深度',
    icon: '😏',
    category: 'chinese_classic',
    narrative: {
      perspective: 'first_person',
      tense: 'past',
      voice: 'casual',
      tone: ['幽默', '戏谑', '自由', '智慧', '浪漫'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.45,
      description_type: 'emotional',
      diction: ['口语化', '幽默词汇', '性描写', '哲学词汇'],
      figurative_language: ['反讽', '戏谑', '黑色幽默', '荒诞']
    },
    formatting: {
      chapter_structure: 'loose',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['黑色幽默', '性爱描写', '知识分子', '荒诞现实'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['黑色幽默', '性描写大胆', '思想性', '反讽戏谑', '浪漫主义'],
      narrative_techniques: ['第一人称', '荒诞叙事', '思想实验', '幽默对话'],
      character_focus: '知识分子的内心与身体',
      theme_preferences: ['自由', '性爱', '智慧', '反叛', '浪漫'],
      emotional_resonance: '戏谑中的深情',
      pacing_pattern: '轻松幽默,发人深省'
    },
    example_texts: [
      '那一天我二十一岁,在我一生的黄金时代。我有好多奢望。我想爱,想吃,还想在一瞬间变成天上半明半暗的云。',
      '"我呀,从小就想要一辆摩托车!""结果呢?""结果我成了一名卡车司机。"',
      '这个故事是一个寓言,它告诉我们:人活着最重要的是有趣,而不是正确。'
    ],
    recommended_genres: ['黑色幽默', '知识分子小说', '荒诞现实主义'],
    prompt_template: '记住:幽默是最好的武器,反讽是最利的刀。性爱不是禁忌,是生命力的象征。思想要深刻,但表达要轻松。让读者笑着流泪,是最高境界。'
  },
  {
    id: 'liu_cixin',
    name: '刘慈欣风格',
    description: '硬科幻、宏大叙事、工程思维、人类命运',
    icon: '🚀',
    category: 'sci_fi',
    narrative: {
      perspective: 'third_person_omniscient',
      tense: 'past',
      voice: 'formal',
      tone: ['宏大', '冷峻', '理性', '壮丽', '悲壮'],
      pacing: 'slow'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.25,
      description_type: 'sensory',
      diction: ['科学术语', '物理词汇', '宏大词汇', '工程术语'],
      figurative_language: ['宏大比喻', '科学隐喻', '象征', '排比']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: true,
      flashbacks: 'occasional',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['宏大叙事', '宇宙尺度', '人类命运', '科技奇观'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['硬科幻设定', '宏大叙事', '工程思维', '宇宙视角', '人类命运思考'],
      narrative_techniques: ['多线叙事', '宏大场景', '科学推演', '思想实验'],
      character_focus: '人类整体与个体命运',
      theme_preferences: ['宇宙', '人类命运', '科技', '黑暗森林', '生存'],
      emotional_resonance: '宇宙的冷酷与人性的温暖',
      pacing_pattern: '前期缓慢铺垫,后期爆发高潮'
    },
    example_texts: [
      '三体舰队将在四百年后抵达太阳系。人类,用四百年的时间去准备一场必然到来的战争。',
      '物理学不存在了。这个认知像一把钥匙,打开了潘多拉的魔盒。',
      '他站在月球基地的控制室里,透过巨大的玻璃窗,看着那颗蓝色的星球。人类的所有战争、爱情、阴谋,都在那颗小小的尘埃上上演。'
    ],
    recommended_genres: ['硬科幻', '太空歌剧', '宇宙探索'],
    prompt_template: '记住:科学是骨骼,想象是血肉。设定要有科学依据,哪怕是幻想的科学。叙事要有宇宙尺度,思考人类命运。个人情感要服从宏大叙事,但不能缺席。'
  },
  {
    id: 'asimov',
    name: '阿西莫夫风格',
    description: '机器人三定律、逻辑推理、社会结构、理性探索',
    icon: '🤖',
    category: 'sci_fi',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'formal',
      tone: ['理性', '逻辑', '冷静', '学术', '深邃'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.4,
      description_type: 'visual',
      diction: ['逻辑术语', '科学词汇', '哲学词汇', '机器人术语'],
      figurative_language: ['逻辑推演', '假设验证', '象征', '类比']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: true,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['机器人', '推理', '帝国', '基地'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['机器人三定律', '逻辑推理', '社会结构', '心理史学', '银河帝国'],
      narrative_techniques: ['逻辑推演', '推理破案', '思想实验', '场景描写'],
      character_focus: '侦探与科学家的智慧',
      theme_preferences: ['机器人', '逻辑', '人类社会', '帝国兴衰', '文明演进'],
      emotional_resonance: '理性中的温情',
      pacing_pattern: '稳扎稳打,逻辑递进'
    },
    example_texts: [
      '第一定律:机器人不得伤害人类,或因不作为而使人类受到伤害。第二定律:机器人必须服从人类的命令,除非该命令与第一定律冲突。',
      '谢顿数十年心血建立的基地,难道就这样毁于一旦吗?不,绝不会。心理史学的预测从未失败过。',
      '他闭上眼睛,在脑海中构建着这个复杂案件的逻辑链条。每一个人都是变量,每一个动机都是方程。'
    ],
    recommended_genres: ['硬科幻', '推理科幻', '未来史诗'],
    prompt_template: '记住:逻辑是核心,推理是手段。机器人不只是机器,是哲学的载体。社会结构要有深度,银河帝国要有层次。让读者在思考中享受阅读的乐趣。'
  },
  {
    id: 'philip_k_dick',
    name: '菲利普·K·迪克风格',
    description: '赛博朋克先驱、现实模糊、药物文化、存在主义',
    icon: '💊',
    category: 'sci_fi',
    narrative: {
      perspective: 'first_person',
      tense: 'present',
      voice: 'casual',
      tone: ['迷幻', '偏执', '存在主义', '冷酷', '黑色'],
      pacing: 'fast'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'short',
      paragraph_length: 'concise',
      dialogue_ratio: 0.5,
      description_type: 'visual',
      diction: ['迷幻词汇', '药物术语', '消费主义', '广告语言'],
      figurative_language: ['意识流', '现实模糊', '象征', '黑色幽默']
    },
    formatting: {
      chapter_structure: 'fragmented',
      scene_breaks: 'symbol',
      POV_switches: false,
      flashbacks: 'frequent',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['药物', '偏执', '现实vs幻觉', '企业统治', '反英雄'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['现实与幻觉模糊', '偏执叙事', '药物文化', '消费主义批判', '存在主义'],
      narrative_techniques: ['意识流', '现实切换', '偏执视角', '黑色幽默'],
      character_focus: '普通人在异化世界中的挣扎',
      theme_preferences: ['现实本质', '身份认同', '消费主义', '技术异化', '存在主义'],
      emotional_resonance: '偏执中的恐惧与渴望',
      pacing_pattern: '快速紧张,悬念丛生'
    },
    example_texts: [
      '我真的在服用这种药吗?还是说这整个生活,都是一场精心设计的幻觉?',
      '广告牌上的女人在微笑,但她的眼睛是空洞的。就像这座城市里的每一个人。',
      '"这不是真实的,"他告诉自己,"但这又有什么关系呢?真实的定义,本身就是一个谎言。"'
    ],
    recommended_genres: ['赛博朋克', '反乌托邦', '黑色科幻'],
    prompt_template: '记住:现实是最大的谜题。药物不是逃避,是认知的扩展。消费主义是怪兽,企业是怪物。偏执是最好的生存策略,也是最深的陷阱。让读者分不清真假。'
  },
  {
    id: 'agatha_christie',
    name: '阿加莎·克里斯蒂风格',
    description: '古典推理、乡间别墅、每个人都有嫌疑、意想不到的凶手',
    icon: '🔍',
    category: 'mystery',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'literary',
      tone: ['优雅', '悬疑', '古典', '讽刺', '冷静'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.45,
      description_type: 'visual',
      diction: ['优雅词汇', '社交用语', '暗示性语言', '推理术语'],
      figurative_language: ['暗示', '双关', '象征', '对比']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: true,
      flashbacks: 'rare',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['乡间别墅', '暴风雪山庄', '每个人都有嫌疑', '最后的反转'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['每个人都有嫌疑', '最后反转', '心理博弈', '优雅叙事', '红鲱鱼'],
      narrative_techniques: ['误导读者', '心理描写', '对话推进', '伏笔设置'],
      character_focus: '凶手与侦探的智力博弈',
      theme_preferences: ['正义', '人性黑暗', '社会讽刺', '智力游戏'],
      emotional_resonance: '优雅中的惊悚',
      pacing_pattern: '层层递进,最后爆发'
    },
    example_texts: [
      '十个客人,十种罪恶。十个小印第安人,一个接一个地死去。',
      '"每个人都有秘密,"波洛说,"问题是,哪些秘密会杀人?"',
      '乡间别墅里,看似平静的晚宴上,一个可怕的罪行正在酝酿。每个人都有动机,每个人都有机会。'
    ],
    recommended_genres: ['古典推理', '乡间别墅', '暴风雪山庄'],
    prompt_template: '记住:每个人都有嫌疑,每个人都在演戏。误导读者是艺术,伏笔要巧妙。凶手要意想不到,但又在情理之中。波洛式的优雅,不仅是风格,更是智慧。'
  },
  {
    id: 'keigo_higashino',
    name: '东野圭吾风格',
    description: '社会派推理、情感纠葛、复杂人性、悲情结局',
    icon: '😢',
    category: 'mystery',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'literary',
      tone: ['压抑', '悲伤', '深刻', '社会', '人性'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.4,
      description_type: 'emotional',
      diction: ['平实语言', '情感词汇', '社会观察', '人性描写'],
      figurative_language: ['象征', '对比', '隐喻', '白描']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: true,
      flashbacks: 'frequent',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['社会派', '悲剧', '人性黑暗', '亲子关系'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['社会问题', '情感纠葛', '复杂人性', '悲情结局', '意想不到的动机'],
      narrative_techniques: ['多视角', '情感描写', '社会批判', '动机揭示'],
      character_focus: '普通人在极端情况下的选择',
      theme_preferences: ['人性', '社会问题', '亲情', '救赎', '悲剧'],
      emotional_resonance: '悲情中的深度思考',
      pacing_pattern: '缓慢铺垫,情感爆发'
    },
    example_texts: [
      '"我杀了他,"她说,"为了保护我所爱的人。""但你知道,这是犯罪。""是的。但如果是重来一次,我依然会这么做。"',
      '石神看着眼前的尸体,知道一切都将改变。但为了她,值得。',
      '这不是一个简单的案件,而是一个关于爱与绝望的故事。真相往往比谎言更加残忍。'
    ],
    recommended_genres: ['社会派推理', '人性悬疑', '悲情推理'],
    prompt_template: '记住:推理不是炫技,是揭示人性。动机要深刻,情感要真实。社会问题是背景,人性是核心。结局不一定要正义,但一定要真实。让读者在震撼中反思。'
  },
  {
    id: 'haruki_murakami',
    name: '村上春树风格',
    description: '都市孤独、爵士乐、神秘元素、意识流',
    icon: '🎷',
    category: 'literary',
    narrative: {
      perspective: 'first_person',
      tense: 'present',
      voice: 'casual',
      tone: ['孤独', '疏离', '神秘', '都市', '怀旧'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.35,
      description_type: 'sensory',
      diction: ['日常词汇', '爵士乐', '美国文化', '都市意象'],
      figurative_language: ['象征', '意识流', '通感', '超现实']
    },
    formatting: {
      chapter_structure: 'loose',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['孤独', '爵士乐', '神秘事件', '都市生活'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['都市孤独', '爵士乐与文学', '神秘元素', '西方文化', '性描写'],
      narrative_techniques: ['第一人称', '意识流', '超现实', '日常描写'],
      character_focus: '都市人的内心世界',
      theme_preferences: ['孤独', '疏离', '记忆', '丧失', '寻找'],
      emotional_resonance: '孤独中的温暖',
      pacing_pattern: '缓慢流淌,韵味悠长'
    },
    example_texts: [
      '我一直以为,人生是一场寻找。但找了三十年,才发现我们要找的,或许根本不存在。',
      '爵士乐在酒吧里流淌,我喝着威士忌,等待着某个永远不会发生的事。',
      '她喜欢吃黄油吐司,喜欢听七十年代的摇滚。这座城市里,每个人都带着自己的小宇宙。'
    ],
    recommended_genres: ['都市文学', '存在主义', '超现实主义'],
    prompt_template: '记住:孤独是常态,疏离是保护。爵士乐是灵魂,威士忌是伙伴。神秘不是谜题,是氛围。日常中见超现实,平凡中见深意。让读者在阅读中找到自己的影子。'
  },
  {
    id: 'yu_hua',
    name: '余华风格',
    description: '苦难叙事、黑色幽默、暴力描写、荒诞现实',
    icon: '📕',
    category: 'literary',
    narrative: {
      perspective: 'first_person',
      tense: 'past',
      voice: 'casual',
      tone: ['苦难', '黑色幽默', '荒诞', '冷峻', '温情'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'short',
      paragraph_length: 'concise',
      dialogue_ratio: 0.4,
      description_type: 'visual',
      diction: ['口语化', '苦难词汇', '暴力描写', '朴实语言'],
      figurative_language: ['白描', '黑色幽默', '对比', '象征']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['苦难', '死亡', '黑色幽默', '家庭悲剧'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['苦难叙事', '黑色幽默', '暴力与温情', '白描手法', '重复节奏'],
      narrative_techniques: ['第一人称', '苦难叙事', '黑色幽默', '重复'],
      character_focus: '普通人在苦难中的生存',
      theme_preferences: ['苦难', '生存', '死亡', '家庭', '历史'],
      emotional_resonance: '苦难中的温情与坚强',
      pacing_pattern: '沉稳有力,悲中带笑'
    },
    example_texts: [
      '我看着父亲被人打,但我笑了。不是因为高兴,是因为除了笑,我不知道还能做什么。',
      '活着,是为了活着本身,而不是为了活着之外的任何事物。',
      '那头老牛知道自己在耕地,我也知道我活着。日子一天天过去,人就这么过来了。'
    ],
    recommended_genres: ['现实主义', '苦难文学', '黑色幽默'],
    prompt_template: '记住:苦难不是卖惨,是生命的底色。黑色幽默是最好的武器,让沉重的故事变得可读。白描是最有力的武器,不多一字,不少一字。活着就是胜利,这就是余华。'
  },
  {
    id: 'wang_zengqi',
    name: '汪曾祺风格',
    description: '诗意散文、美食描写、人间烟火、恬淡悠远',
    icon: '🍜',
    category: 'literary',
    narrative: {
      perspective: 'first_person',
      tense: 'past',
      voice: 'poetic',
      tone: ['恬淡', '诗意', '温情', '怀旧', '人间烟火'],
      pacing: 'slow'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'flowing',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.2,
      description_type: 'sensory',
      diction: ['诗意词汇', '美食术语', '方言', '古典意象'],
      figurative_language: ['通感', '白描', '意境', '借景抒情']
    },
    formatting: {
      chapter_structure: 'loose',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['美食', '故乡', '旧时光', '人间温情'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['美食描写', '诗意语言', '人间烟火', '故乡情怀', '平淡中有深意'],
      narrative_techniques: ['散文笔法', '情景交融', '白描', '细节刻画'],
      character_focus: '日常生活中的美好',
      theme_preferences: ['美食', '故乡', '人情', '传统文化', '生活的诗意'],
      emotional_resonance: '平淡中的深情',
      pacing_pattern: '缓慢悠闲,韵味悠长'
    },
    example_texts: [
      '高邮的咸鸭蛋,蛋黄是红的,油汪汪的,入口即化。这种滋味,再也找不到了。',
      '春天的花园里,玉兰开了,白得晃眼。风一吹,花瓣就落了下来,落在青石板上。',
      '泡一壶茶,听一段戏,看窗外云卷云舒。这大概就是最理想的生活了吧。'
    ],
    recommended_genres: ['散文', '美食文学', '怀旧文学'],
    prompt_template: '记住:生活处处有诗意,一茶一饭皆文章。美食不只是食物,是文化和记忆。故乡不只是地方,是情感的寄托。白描见功夫,平淡出真章。让读者在平凡中发现美。'
  },
  {
    id: 'tian_can_tu_dou',
    name: '天蚕土豆风格',
    description: '升级流爽文、退婚流、莫欺少年穷、修炼体系清晰',
    icon: '🔥',
    category: 'web_novel',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'present',
      voice: 'conversational',
      tone: ['热血', '霸气', '爽快', '打脸', '逆袭'],
      pacing: 'fast'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.45,
      description_type: 'visual',
      diction: ['热血词汇', '修炼术语', '装逼词汇', '数字精确'],
      figurative_language: ['夸张', '比喻', '排比', '对比', '象征']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['退婚', '戒指里的老爷爷', '莫欺少年穷', '升级', '打脸'],
      taboo_subjects: [],
      audience: 'young_adult'
    },
    style_analysis: {
      signature_elements: ['清晰的修炼体系', '等级明确', '打脸节奏', '金手指', '莫欺少年穷'],
      narrative_techniques: ['单线叙事', '悬念设置', '节奏把控', '情绪调动', '期待感营造'],
      character_focus: '主角成长与逆袭',
      theme_preferences: ['成长', '复仇', '尊严', '力量', '友情'],
      emotional_resonance: '热血沸腾的爽快感',
      pacing_pattern: '快速推进,每章有爆点'
    },
    example_texts: [
      '萧炎站在测试场上,感受着体内的斗气在慢慢增长。三年的废物时间,他受够了!',
      '纳兰嫣然,今日之辱,他日必当百倍奉还!萧炎握了握拳头,骨节嘎嘎作响。',
      '药老的声音在他脑海里响起:"小炎子,莫急,该来的总会来的。"萧炎嘴角上扬,眼中闪过一丝锋芒。'
    ],
    recommended_genres: ['玄幻', '修仙', '升级爽文', '逆袭文'],
    prompt_template: '记住:修炼体系要清晰明确,等级一目了然。主角要从底层崛起,通过努力和金手指不断变强。打脸要及时,装逼要到位,让读者看得爽。节奏要快,每章都要有进展。'
  },
  {
    id: 'zi_jin_chen',
    name: '紫金陈风格',
    description: '悬疑推理、社会派、现实题材、人性探讨',
    icon: '🔎',
    category: 'web_novel',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'conversational',
      tone: ['悬疑', '紧张', '现实', '社会', '冷峻'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'concise',
      dialogue_ratio: 0.45,
      description_type: 'visual',
      diction: ['平实语言', '现实细节', '社会观察', '法律术语'],
      figurative_language: ['现实主义', '对比', '反讽', '象征', '留白']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'number',
      POV_switches: true,
      flashbacks: 'frequent',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['悬疑', '推理', '社会派', '坏小孩', '隐秘角落'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['社会现实反映', '人性深度挖掘', '悬疑层层递进', '反转出人意料', '法律与道德困境'],
      narrative_techniques: ['多线叙事', 'POV切换', '伏笔埋设', '节奏把控', '真实感营造'],
      character_focus: '普通人在极端情况下的选择',
      theme_preferences: ['人性', '社会', '正义', '家庭', '成长'],
      emotional_resonance: '现实的沉重与人性的复杂',
      pacing_pattern: '层层递进,悬念渐浓'
    },
    example_texts: [
      '严良看着眼前的案件资料,眉头紧锁。这个案子,不简单。',
      '看似普通的凶杀案,背后却隐藏着可怕的真相。他想起了那个孩子,那个眼神里藏着秘密的孩子。',
      '严良叹了口气,人性啊,总是让人无法揣测。他必须查清楚,这一切的真相到底是什么。'
    ],
    recommended_genres: ['悬疑推理', '社会派', '现实题材', '犯罪小说'],
    prompt_template: '记住:关注社会现实,挖掘人性的复杂性。悬疑设置要合理,逻辑要严密,反转要出人意料但又在情理之中。人物要真实可信,不是非黑即白,而是有血有肉的普通人。'
  },
  {
    id: 'epic_fantasy',
    name: '史诗奇幻',
    description: '宏大叙事、丰富世界观、史诗感强烈',
    icon: '🏰',
    category: 'fantasy',
    narrative: {
      perspective: 'third_person_omniscient',
      tense: 'past',
      voice: 'literary',
      tone: ['庄严', '史诗', '冒险', '悲壮', '希望'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.25,
      description_type: 'sensory',
      diction: ['史诗词汇', '古老词汇', '宏大描述', '自然意象'],
      figurative_language: ['宏大比喻', '象征', '排比', '拟人', '史诗修辞']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'symbol',
      POV_switches: true,
      flashbacks: 'occasional',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['预言', '魔法物品', '英雄旅程', '古老传说'],
      taboo_subjects: [],
      audience: 'adult'
    },
    style_analysis: {
      signature_elements: ['宏大世界观', '多线叙事', '史诗感', '完整魔法体系', '历史纵深'],
      narrative_techniques: ['全知视角', 'POV切换', '世界构建', '历史融入', '象征手法'],
      character_focus: '英雄成长与命运抉择',
      theme_preferences: ['命运', '勇气', '牺牲', '希望', '正邪'],
      emotional_resonance: '史诗般的悲壮与希望',
      pacing_pattern: '宏大叙事,张弛有度'
    },
    example_texts: [
      '当黎明的第一缕阳光洒在霜雪覆盖的群山之巅时,伊利亚知道,改变世界的时刻即将到来。',
      '北风带着远古的低语,穿过残破的城堡塔楼,仿佛在诉说着早已被遗忘的传说。',
      '骑士长紧握剑柄,目光坚毅地眺望着东方——那里,黑云正在聚集,古老的威胁正在苏醒。'
    ],
    recommended_genres: ['史诗奇幻', '剑与魔法', '黑暗奇幻'],
    prompt_template: '记住:世界观要宏大完整,历史纵深要丰富。叙事要有史诗感,语言要庄严有力。多线叙事,从不同视角展现事件。英雄不是完美的,要有挣扎,有成长。'
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '霓虹都市、科技泛滥、人性反思、高科技低生活',
    icon: '🌃',
    category: 'sci_fi',
    narrative: {
      perspective: 'first_person',
      tense: 'present',
      voice: 'casual',
      tone: ['愤世嫉俗', '紧张', '冷酷', '迷幻', '反乌托邦'],
      pacing: 'fast'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'short',
      paragraph_length: 'concise',
      dialogue_ratio: 0.35,
      description_type: 'visual',
      diction: ['科技词汇', '霓虹词汇', '街头黑话', '未来俚语'],
      figurative_language: ['科技隐喻', '霓虹意象', '反讽', '对比', '迷幻修辞']
    },
    formatting: {
      chapter_structure: 'fragmented',
      scene_breaks: 'symbol',
      POV_switches: true,
      flashbacks: 'frequent',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['人体改造', '企业霸权', '虚拟空间', '霓虹灯光', '雨'],
      taboo_subjects: [],
      audience: 'new_adult'
    },
    style_analysis: {
      signature_elements: ['霓虹灯光', '雨', '人体改造', '企业统治', '虚拟与现实模糊'],
      narrative_techniques: ['碎片化叙事', '快速切换', '氛围营造', '信息轰炸', '感官过载'],
      character_focus: '边缘人在高科技世界中的挣扎',
      theme_preferences: ['人性', '科技', '自由', '身份', '记忆'],
      emotional_resonance: '高科技世界中的人性失落',
      pacing_pattern: '快速刺激,如霓虹闪烁'
    },
    example_texts: [
      '霓虹灯在雨中闪烁,映照出我脸上的电路接口。',
      '我连接上数据网络,信息如水流般涌过。这次的任务很简单:窃取一份记忆备份。',
      '但在新沧市,没有什么是简单的——尤其是当你的客户是最危险的企业之一时。'
    ],
    recommended_genres: ['赛博朋克', '近未来', '反乌托邦', '科幻惊悚'],
    prompt_template: '记住:高科技,低生活。霓虹灯光与阴暗小巷的对比。人体改造,数字空间,企业霸权。语言要有未来感,但又要充满街头气息。节奏要快,视觉感要强,让读者看到那个五光十色又黑暗的未来都市。'
  },
  {
    id: 'tolkien',
    name: '托尔金风格',
    description: '奇幻文学之父、语言创造、史诗世界观、中土世界',
    icon: '🗡️',
    category: 'fantasy',
    narrative: {
      perspective: 'third_person_omniscient',
      tense: 'past',
      voice: 'literary',
      tone: ['史诗', '庄严', '古老', '神话', '冒险'],
      pacing: 'slow'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'complex',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.2,
      description_type: 'sensory',
      diction: ['古老英语', '精灵语', '史诗词汇', '地理名称'],
      figurative_language: ['古英语风格', '重复', '仪式化', '象征']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'symbol',
      POV_switches: true,
      flashbacks: 'occasional',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['戒指', '远征', '精灵', '戒灵', '古老传说'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['语言创造', '完整世界', '古老语气', '地理描写', '家谱式叙事'],
      narrative_techniques: ['全知视角', '古老语气', '世界构建', '仪式化', '重复'],
      character_focus: '英雄的使命与成长',
      theme_preferences: ['勇气', '牺牲', '友谊', '古老智慧', '善恶对抗'],
      emotional_resonance: '古老传说的庄严',
      pacing_pattern: '缓慢庄严,史诗画卷'
    },
    example_texts: [
      '至尊戒,至强之戒。它是邪恶的,也是诱惑的。在弗罗多的旅程中,他将面对难以想象的考验。',
      '精灵的语言如流水般清澈,古老的歌曲中藏着远古的智慧。比尔博听得入了迷。',
      '灰港的船帆升起,载着精灵的歌声,驶向西方那片永恒的彼岸。'
    ],
    recommended_genres: ['史诗奇幻', '中土世界', '英雄奇幻'],
    prompt_template: '记住:语言是灵魂,自己创造的语言要有内在逻辑。世界要有深度,历史要有层次。叙事要有古老传说的味道,庄严而庄重。善恶分明,但灰色地带更有魅力。篇幅长,耐心铺陈。'
  },
  {
    id: 'jk_rowling',
    name: 'J.K.罗琳风格',
    description: '儿童奇幻、幽默温暖、成长主题、细节丰富',
    icon: '🪄',
    category: 'fantasy',
    narrative: {
      perspective: 'third_person_limited',
      tense: 'past',
      voice: 'literary',
      tone: ['幽默', '温暖', '冒险', '神秘', '成长'],
      pacing: 'moderate'
    },
    language: {
      vocabulary_level: 'intermediate',
      sentence_structure: 'mixed',
      paragraph_length: 'moderate',
      dialogue_ratio: 0.5,
      description_type: 'visual',
      diction: ['魔法术语', '幽默词汇', '校园用语', '儿童用语'],
      figurative_language: ['幽默比喻', '象征', '双关', '细节堆砌']
    },
    formatting: {
      chapter_structure: 'conventional',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'occasional',
      prologue_epilogue: true
    },
    genre_conventions: {
      expected_tropes: ['魔法学校', '成长', '友谊', '神秘事件', '大反派'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['幽默温暖', '校园生活', '细节伏笔', '人物成长', '悬念递进'],
      narrative_techniques: ['限知视角', '幽默对话', '细节埋伏笔', '人物塑造', '悬念'],
      character_focus: '儿童的成长与友情',
      theme_preferences: ['成长', '友谊', '勇气', '选择', '爱与牺牲'],
      emotional_resonance: '温暖中的感动',
      pacing_pattern: '趣味性强,高潮迭起'
    },
    example_texts: [
      '德思礼先生是一家零件工厂的老板,但他最讨厌的,就是他那神秘莫测的外甥哈利波特。',
      '"你是一个巫师,哈利。"海格说,他的声音因为激动而颤抖。',
      '分院帽落在哈利头上,一个声音响起:"啊,困难啊......有勇气,有野心......去斯莱特林吧,你会成就大业。"'
    ],
    recommended_genres: ['儿童奇幻', '校园奇幻', '成长故事'],
    prompt_template: '记住:幽默是糖衣,温暖是内核。每个细节都可能是伏笔,要精心设计。人物要有成长,从稚嫩到成熟。善恶要分明,但反派也要有魅力。用童真的眼睛看世界,魔法无处不在。'
  },
  {
    id: 'ray_bradbury',
    name: '雷·布拉德伯里风格',
    description: '诗意科幻、怀旧氛围、情感丰富、浪漫主义',
    icon: '✨',
    category: 'sci_fi',
    narrative: {
      perspective: 'first_person',
      tense: 'past',
      voice: 'poetic',
      tone: ['怀旧', '诗意', '浪漫', '感伤', '温情'],
      pacing: 'slow'
    },
    language: {
      vocabulary_level: 'advanced',
      sentence_structure: 'flowing',
      paragraph_length: 'descriptive',
      dialogue_ratio: 0.25,
      description_type: 'sensory',
      diction: ['诗意词汇', '色彩描写', '感官意象', '怀旧词汇'],
      figurative_language: ['通感', '意象叠加', '象征', '诗意的比喻']
    },
    formatting: {
      chapter_structure: 'loose',
      scene_breaks: 'space',
      POV_switches: false,
      flashbacks: 'frequent',
      prologue_epilogue: false
    },
    genre_conventions: {
      expected_tropes: ['怀旧', '诗意描写', '火箭与记忆', '成长的失落'],
      taboo_subjects: [],
      audience: 'all_ages'
    },
    style_analysis: {
      signature_elements: ['诗意语言', '怀旧情感', '色彩描写', '感官丰富', '浪漫想象'],
      narrative_techniques: ['诗意叙事', '感官描写', '意象叠加', '情感流动'],
      character_focus: '人的情感与记忆',
      theme_preferences: ['记忆', '怀旧', '成长', '想象', '美与消逝'],
      emotional_resonance: '诗意中的深深感动',
      pacing_pattern: '如诗如画,缓缓流淌'
    },
    example_texts: [
      '火箭的银光划过夜空,像一只银色的鹤,载着他的童年记忆,消失在星海之中。',
      '壁炉里的火焰在跳舞,映照着每个人的脸。他们笑着,谈论着,不知道这就是他们最后的夏天。',
      '十月,枫叶红了。风中有燃烧的味道,甜而略带伤感。这是收获的季节,也是告别的季节。'
    ],
    recommended_genres: ['诗意科幻', '怀旧文学', '浪漫主义'],
    prompt_template: '记住:科学是翅膀,诗意是灵魂。色彩是情感,感官是记忆。用孩子的眼睛看未来,用诗人的语言写科幻。怀旧不是逃避,是珍惜。让读者在美的享受中思考人生。'
  }
]

export function getStylePreset(id: string): WritingStylePreset | undefined {
  return WRITING_STYLE_PRESETS.find(style => style.id === id)
}

export function getStylesByCategory(category: string): WritingStylePreset[] {
  if (category === 'all') return WRITING_STYLE_PRESETS
  return WRITING_STYLE_PRESETS.filter(style => style.category === category)
}

export const CATEGORY_NAMES: Record<string, string> = {
  fiction: '小说',
  fantasy: '奇幻',
  mystery: '悬疑',
  romance: '言情',
  sci_fi: '科幻',
  literary: '文学',
  classic: '经典作家',
  chinese_classic: '中国经典',
  web_novel: '网文作家'
}

export const CATEGORIES = ['all', 'fiction', 'fantasy', 'mystery', 'romance', 'sci_fi', 'literary', 'classic', 'chinese_classic', 'web_novel']
