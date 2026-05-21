# 风格一致性 & 剧情连续性保障系统

## 🎯 系统目标

解决长篇小说的两大核心挑战：
1. **风格一致性** - 保持叙事、对话、语言风格统一
2. **剧情连续性** - 伏笔呼应、时间线正确、人物状态连贯

---

## 📐 一、风格一致性保障

### 1.1 风格指南 (Writing Style Guide)

```typescript
{
  narrative: {
    perspective: 'third_person_limited',  // 叙事视角
    tense: 'past',                        // 时态
    voice: 'literary',                   // 文风
    tone: 'serious',                     // 语气
    pacing: 'moderate'                  // 节奏
  },
  language: {
    vocabulary_level: 'advanced',        // 词汇水平
    sentence_structure: 'complex',       // 句式
    dialogue_ratio: 0.3,                // 对话占比 30%
    description_type: 'sensory'          // 描写类型
  }
}
```

### 1.2 人物声音档案 (Character Voice Profile)

每个角色都有独特的对话风格：

```typescript
{
  characterName: '张三',
  speech_patterns: {
    sentence_length: 'short_abrupt',    // 说话简短急促
    formality: 'casual',                // 随意不正式
    education_level: 'educated',         // 受过教育
    common_phrases: ['老弟', '得嘞', '没问题']  // 口头禅
  },
  personality_markers: {
    traits: ['直率', '冲动', '重义气'],
    conflict_style: 'aggressive',       // 冲突时激进
    humor_sense: 'dry'                  // 冷幽默
  }
}
```

### 1.3 AI 写作时的风格控制

```python
# AI 收到风格提示：
"""
## 写作风格
- 视角：第三人称有限视角
- 语气：严肃认真，略带忧郁
- 节奏：章节前半部分缓慢铺垫，后半部分节奏加快
- 对话比例：30%（控制对话不要过多）

## 张三对话风格
- 句长：简短急促
- 口头禅："老弟"、"得嘞"
- 性格：直率冲动，重义气
- 不要让张三说文绉绉的话

## 李四对话风格
- 句长：冗长流畅
- 措辞：文雅含蓄
- 教育水平：学者级别
- 说话带有诗意
"""
```

---

## 🔗 二、剧情连续性保障

### 2.1 连续性记录 (Continuity Record)

每章自动记录：

```typescript
{
  chapterId: 'chapter_5',
  key_events: [
    '张三和李四在咖啡馆见面',
    '赵雪神秘出现',
    '揭示了十年前的往事'
  ],
  character_states: {
    '张三': '愤怒且困惑',
    '李四': '冷静但内心激动',
    '赵雪': '紧张不安'
  },
  locations: ['咖啡馆', '旧城区'],
  established_facts: [
    '张三和李四是表兄弟',
    '赵雪是李四的前女友',
    '父亲的遗产纠纷是矛盾根源'
  ],
  unresolved_threads: [
    '赵雪为什么要回来？',
    '十年前究竟发生了什么？'
  ],
  callbacks: [
    {
      reference: '第一章提到的老照片',
      source_chapter: 'chapter_1',
      reference_chapter: 'chapter_5'
    }
  ]
}
```

### 2.2 时间线追踪 (Timeline)

```typescript
// 故事内时间线
{
  events: [
    {
      timestamp: '第一章前10年',
      title: '父亲去世',
      chapterId: 'chapter_1'
    },
    {
      timestamp: '第一章前5年',
      title: '遗产纠纷',
      chapterId: 'chapter_2'
    },
    {
      timestamp: '现在（第5章）',
      title: '咖啡馆对峙',
      chapterId: 'chapter_5'
    }
  ]
}
```

### 2.3 伏笔管理系统

```typescript
// 伏笔追踪
{
  setup: {
    chapter: 1,
    content: '父亲留下了一封神秘的信'
  },
  promise: '这封信中藏有重大秘密',
  potential_fulfillment: [
    { chapter: 5, event: '信被打开' },
    { chapter: 10, event: '真相大白' }
  ],
  status: 'promised',  // promised | fulfilled | forgotten
  reminder: '第8章前必须兑现此伏笔'
}
```

---

## 🛠️ 三、智能写作上下文构建

### 3.1 AI 写作时的完整上下文

```python
# 系统自动构建：

## 一、写作风格指南
[从风格指南生成]

## 二、人物对话风格
[从人物声音档案生成]

## 三、剧情连续性回顾

### 最近3章关键事件
- 第2章：张三和李四因遗产问题发生争吵
- 第3章：赵雪突然出现，两人关系更加紧张
- 第4章：张三调查父亲的过往

### 人物当前状态
- 张三：愤怒、冲动，正在追查真相
- 李四：冷静克制，但内心有愧疚
- 赵雪：神秘、焦虑，似乎知道什么

### 地点
- 当前场景：老城咖啡馆
- 背景：城市中的复古风格咖啡馆，窗外是旧城区

### 待解决的悬念
1. 父亲的信里写了什么？
2. 赵雪为什么要离开十年？
3. 李四到底做了什么对不起张三的事？

## 四、写作要求
1. 保持严肃忧郁的语气
2. 张三说话要简短冲动
3. 要呼应第1章提到的"神秘信件"
4. 这一章要推进赵雪回归这条线

## 五、禁止事项
- 不要让张三突然变得很文雅
- 不要改变人物当前的情绪状态
- 不要引入未设定的人物
```

---

## 🎨 四、实时一致性检查

### 4.1 写作后的自动检查

```typescript
// AI 续写完成后的检查

checkConsistency(newContent) {
  const issues = []

  // 1. 风格检查
  if (avgSentenceLength > 50) {
    issues.push({
      type: 'style_violation',
      severity: 'warning',
      message: '句长偏长，与整体风格不符'
    })
  }

  if (dialogueRatio > 0.5) {
    issues.push({
      type: 'style_violation',
      severity: 'warning', 
      message: '对话比例过高(60%)，建议增加描写'
    })
  }

  // 2. 连续性检查
  const previousStates = getCharacterStates('chapter_4')
  for (const [name, newState] of currentStates) {
    if (previousStates[name] !== newState) {
      if (!justifiedTransition(previousStates[name], newState)) {
        issues.push({
          type: 'continuity_error',
          severity: 'error',
          message: `${name}状态突变：${previousStates[name]} → ${newState}，缺乏过渡`
        })
      }
    }
  }

  // 3. 人物声音检查
  if (hasCharacterSpeaking('张三', '长达200字的抒情独白')) {
    issues.push({
      type: 'character_voice_violation',
      severity: 'error',
      message: '张三不会说这么文绉绉的话'
    })
  }

  return issues
}
```

### 4.2 检查报告

```json
{
  "chapter": 5,
  "timestamp": "2026-05-17",
  "issues": [
    {
      "type": "character_voice_violation",
      "severity": "error",
      "location": "第3段",
      "content": "张三缓缓说道...",
      "problem": "张三说话简短，不会用'缓缓说道'",
      "suggestion": "改为：张三闷声道..."
    },
    {
      "type": "continuity_error",
      "severity": "warning",
      "location": "第5段",
      "content": "李四露出了微笑",
      "problem": "第4章设定李四内心有愧疚，突然微笑显得突兀",
      "suggestion": "需要铺垫：内心挣扎后勉强挤出微笑"
    }
  ],
  "summary": {
    "total_issues": 2,
    "errors": 1,
    "warnings": 1,
    "can_proceed": true
  }
}
```

---

## 📊 五、数据模型

### 5.1 数据库 Schema 扩展

```prisma
model Project {
  // ... existing fields
  styleGuide Json?  // WritingStyleGuide
  continuityRecords ContinuityRecord[]
}

model Chapter {
  // ... existing fields
  summary Json?              // ContinuityRecord
  timelinePosition String?   // 故事内时间
  establishedFacts String[]  // 本章建立的事实
}

model Character {
  // ... existing fields
  voiceProfile Json?  // CharacterVoiceProfile
  speakingPatterns String[]  // 口头禅、常用语
}

model PlotThread {
  // ... existing fields
  status String              // setup | rising | climax | resolution
  promises Promise[]         // 伏笔列表
  checkpoints String[]       // 关键检查点
}
```

---

## 🚀 六、使用流程

### 6.1 项目初始化时

```typescript
// 1. 用户设定风格指南
await consistencyService.updateStyleGuide(projectId, {
  narrative: {
    perspective: 'third_person_limited',
    tone: 'serious'
  },
  language: {
    dialogue_ratio: 0.3
  }
})

// 2. AI 分析人物声音
const voiceProfiles = await consistencyService.buildCharacterVoiceProfiles(projectId)
```

### 6.2 AI 写作时

```typescript
// 1. 构建完整上下文
const context = await consistencyService.buildComprehensiveWritingContext(
  projectId,
  currentChapterId,
  '推进张三和李四的对峙剧情'
)

// 2. 传入 AI 进行写作
const result = await aiService.write({
  system: context,
  user: writingPrompt
})

// 3. 自动创建连续性记录
await consistencyService.createContinuityRecord(
  projectId,
  chapterId,
  result.content,
  previousContinuity
)
```

### 6.3 写作后检查

```typescript
// 1. 一致性检查
const issues = await consistencyService.checkConsistency(
  projectId,
  newContent,
  previousContent
)

// 2. 显示问题给用户
if (issues.length > 0) {
  showConsistencyReport(issues)
}
```

---

## 🎯 七、核心优势

### ✅ 风格一致
- **统一视角**：不会突然切换到第一人称
- **统一语气**：不会从幽默突然变严肃
- **统一节奏**：不会从缓慢突然变快
- **人物声音**：每个角色的对话都独特

### ✅ 剧情连贯
- **伏笔管理**：自动追踪所有伏笔，到期提醒
- **人物状态**：记录并检查状态变化
- **事实一致**：不会前后矛盾
- **时间线**：清晰的故事时间追踪

### ✅ 质量保障
- **实时检查**：写作后立即发现问题
- **智能建议**：提供修改建议而非只报错
- **可回溯**：可以查看任何章节的连续性记录

---

## 💡 实际效果

**写作前**：
```
用户：续写第5章
```

**系统自动提供**：
```
📝 写作指南
├── 风格：第三人称有限视角，严肃语气
├── 人物：张三(冲动简短)、李四(文雅含蓄)
├── 回顾：第2-4章的关键事件
├── 状态：张三愤怒、李四内疚
├── 伏笔：第1章的神秘信件待揭开
└── 目标：推进对峙剧情

⚠️ 注意事项
├── 张三不要文绉绉
├── 李四的微笑要有铺垫
└── 呼应第1章的信件
```

**写作后检查**：
```
✅ 通过检查
├── 风格一致 ✓
├── 人物声音符合 ✓
├── 伏笔呼应成功 ✓
└── 无连续性问题 ✓

📊 统计
├── 字数：2500
├── 句长：适中
├── 对话比例：32% ✓
└── 人物状态：连贯 ✓
```

---

## 🎯 总结

这个系统让 AI **真正理解**：
1. **怎样写**：统一风格、人物声音
2. **写什么**：连贯剧情、呼应前文
3. **对不对**：实时检查、自动纠错

就像有一个**专业的编辑团队**在背后把关！
