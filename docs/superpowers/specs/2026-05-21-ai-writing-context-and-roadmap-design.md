# AI 写作上下文统一、人味生成与后续能力路线图设计文档

| 项目 | 内容 |
| --- | --- |
| 项目名称 | Novel AI - AI 辅助长篇小说创作平台 |
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-21 |
| 状态 | 草稿 |
| 相关文档 | `2026-05-16-novel-ai-design.md`、`2026-05-17-writing-style-system-design.md`、`2026-05-20-editor-button-streaming-design.md` |

---

## 1. 文档目的

本文档定义 Novel AI 下一阶段的产品增强方向：以“上下文统一”和“去 AI 味”为主线，建立面向长篇小说创作的 AI 写作中枢，并将后续需要实现的重点优化点纳入统一路线图。

本设计覆盖以下能力：

1. 上下文统一与当前 AI 视野管理
2. 作者声音与角色语气一致性
3. 反 AI 味生成规则
4. 任务化生成质量控制
5. 智能大纲生成与结构分析
6. 角色对话模拟器
7. 情感曲线与读者体验分析
8. 智能素材库与灵感收集
9. 出版与导出增强
10. AI 角色扮演与剧情推演

本文档是后续实现工作的设计依据。实现时应拆分为多个独立实施计划，不应一次性大爆炸式开发。

---

## 2. 当前系统基础

### 2.1 已有能力

当前项目已经具备以下基础模块：

| 能力 | 当前状态 | 代表文件 |
| --- | --- | --- |
| 项目与章节管理 | 已有 | `server/src/modules/projects/`、`server/src/modules/chapters/` |
| 角色管理 | 已有 | `server/src/modules/characters/`、`client/src/pages/CharacterManagement.tsx` |
| 世界观管理 | 已有 | `server/src/modules/world-settings/`、`client/src/pages/WorldSettings.tsx` |
| 大纲管理 | 手动 CRUD 已有 | `server/src/modules/outlines/`、`client/src/pages/OutlineManagement.tsx` |
| 剧情线管理 | 手动 CRUD 已有 | `server/src/modules/plots/` |
| 场景管理 | 手动 CRUD 已有 | `server/src/modules/scenes/` |
| 转折点与时间线 | 手动 CRUD 已有 | `server/src/modules/turning-points/`、`server/src/modules/timeline/` |
| AI 续写 | 已有 | `server/src/modules/ai/ai.service.ts`、`client/src/hooks/useStreamCompletion.ts` |
| AI 助手 | 已有 | `server/src/modules/ai-assistant/`、`client/src/components/AiAssistant.tsx` |
| 写作风格系统 | 代码已有 | `server/src/modules/writing-styles/`、`client/src/components/WritingStyleSystem.tsx` |
| Lorebook | 代码已有 | `server/src/modules/writing-styles/lorebook.service.ts`、`client/src/components/LorebookManager.tsx` |
| 一致性检查 | 已有 | `server/src/modules/consistency-check/`、`client/src/pages/ConsistencyCheck.tsx` |
| Diff 确认 | 已有 | `client/src/components/ChangeConfirmationModal.tsx`、`client/src/components/editor/DiffHighlight.ts` |

### 2.2 当前关键缺口

1. `WritingStylesModule`、`PlotsModule`、`ScenesModule` 等模块存在代码，但需要确认是否已注册到 `server/src/app.module.ts`，否则相关接口不会生效。
2. 大纲、剧情、场景、时间线主要是手动管理，缺少 AI 自动生成、分析和建议。
3. 角色 `voice` 字段和 `CharacterVoiceProfile` 概念存在，但尚未形成完整对话模拟器。
4. Lorebook 偏结构化设定库，不是完整的素材/灵感库。
5. 当前导出主要是 JSON 导入导出，缺少 EPUB、PDF、DOCX、网文平台格式。
6. 缺少读者视角分析，例如情感曲线、可读性、弃书风险、高潮密度。
7. 缺少剧情沙盒、角色代理、what-if 推演等创新功能。

---

## 3. 核心问题判断

### 3.1 上下文统一的优先级

上下文统一由三类问题组成：

| 问题 | 优先级 | 原因 |
| --- | --- | --- |
| 人物性格前后不一致 | 最高 | 用户最容易感知，角色一旦 OOC，沉浸感立即破坏 |
| 情节细节遗忘 | 高 | 长篇创作中最常见，容易造成伏笔遗忘、事件断裂 |
| 世界观设定混乱 | 中高 | 对奇幻、科幻、玄幻、架空题材影响极大 |

设计结论：

> 系统应以角色一致性为核心，用剧情记忆和世界观规则作为上下文支撑层。

### 3.2 AI 味的主要来源

用户最讨厌的 AI 味通常不是语法错误，而是文本失去作者个性。

主要表现：

1. 套路化表达，例如“空气仿佛凝固”“命运齿轮开始转动”。
2. 过度正式，像作文、报告或说明文。
3. 缺乏个性，所有角色说话像同一个人。
4. 情绪解释过满，缺少动作、停顿和留白。
5. 段落结构过于工整，常见排比、总结、升华。

设计结论：

> 系统应提供作者声音档案、角色语气档案和反 AI 味规则，而不是只提供“更文学”“更生动”等泛化按钮。

### 3.3 效率瓶颈

当前最繁琐的操作不是单点功能，而是写作过程中的上下文切换：

1. 查找设定信息。
2. 判断 AI 是否读取到正确上下文。
3. 调整生成意图和参数。
4. 修改、比较、接受或拒绝 AI 生成内容。

设计结论：

> 应建立“上下文自动装配 + 当前 AI 视野 + 任务化生成 + Diff 审阅”的闭环。

---

## 4. 总体方案

推荐采用“上下文引擎 + 编辑器内 AI 写作面板 + 后续能力路线图”的组合方案。

### 4.1 总体架构

```text
┌──────────────────────────────────────────────┐
│                Chapter Editor                 │
│  ┌─────────────┐  ┌────────────────────────┐ │
│  │ 富文本正文   │  │ AI 写作面板             │ │
│  │ TipTap      │  │ - 当前 AI 视野           │ │
│  │ Diff 审阅   │  │ - 任务化生成             │ │
│  └─────────────┘  │ - 多版本候选             │ │
│                   │ - 质量检查               │ │
│                   └────────────────────────┘ │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│              Context Engine                   │
│  项目记忆 / 角色语气 / 剧情摘要 / 世界观      │
│  Lorebook / 时间线 / 伏笔 / 作者声音 / 禁用词 │
└──────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│              AI Provider Layer                │
│      OpenAI / Claude / DeepSeek / MiMo         │
└──────────────────────────────────────────────┘
```

### 4.2 核心模块

| 模块 | 目的 |
| --- | --- |
| Context Hub | 统一装配 AI 上下文 |
| Context Viewer | 展示本次 AI 实际读取内容 |
| Voice Profile | 作者声音档案 |
| Character Voice | 角色语气档案 |
| Anti-Slop Rules | 反 AI 味规则 |
| Task-based Generation | 续写、对话、场景、润色分任务生成 |
| Variant Review | 多版本候选与 Diff 审阅 |
| Quality Guard | 一致性、风格、AI 味、剧情风险检查 |

---

## 5. 上下文统一设计

### 5.1 上下文层级

每次生成应由以下上下文层组成：

| 层级 | 内容 | 注入策略 |
| --- | --- | --- |
| 全局项目记忆 | 项目标题、简介、类型、核心设定 | 始终注入 |
| 角色核心记忆 | 当前角色、被提及角色、关键关系 | 高优先级注入 |
| 剧情连续性记忆 | 当前章节摘要、前文摘要、当前剧情线 | 动态注入 |
| 世界观与 Lorebook | 地点、组织、物品、规则、禁忌 | 关键词/场景触发 |
| 作者声音 | 风格档案、句长、用词、禁用表达 | 始终或半始终注入 |
| 当前局部文本 | 光标前后文本、选中文本、用户指令 | 最高即时优先级 |

### 5.2 当前 AI 视野

在编辑器 AI 面板中提供“当前 AI 视野”。

展示内容：

1. 本次会注入哪些角色。
2. 本次会注入哪些世界观设定。
3. 本次命中了哪些 Lorebook 条目。
4. 本次使用了哪些章节摘要。
5. 当前作者声音和反 AI 味规则。
6. Token 预算估算。
7. 可手动固定或排除的上下文项。

示例：

```text
本次 AI 上下文

角色记忆：4 条
- 林澈：冷静克制，不主动示弱
- 沈遥：说话直接，讨厌隐喻

世界观：3 条
- 黑塔只能在雨夜开启
- 记忆交易不能逆转

剧情连续性：2 条
- 上一章林澈发现沈遥隐瞒身份
- 当前伏笔：陈牧留下的半枚钥匙尚未回收
```

---

## 6. 作者声音与角色语气

### 6.1 作者声音档案

作者声音档案从以下来源学习：

1. 用户已写章节。
2. 用户上传的样本文本。
3. 用户标记为“像我”的 AI 输出。
4. 用户标记为“不像我”的 AI 输出。

分析维度：

| 维度 | 示例 |
| --- | --- |
| 句子节奏 | 平均句长、长短句变化、断句习惯 |
| 用词偏好 | 口语/书面、动词密度、形容词密度 |
| 描写习惯 | 动作、心理、感官、环境、留白 |
| 对话习惯 | 对话占比、短句比例、潜台词密度 |
| 修辞习惯 | 比喻、象征、排比、诗性表达 |
| 禁用倾向 | 不喜欢宏大升华、不喜欢套路句 |

### 6.2 角色语气档案

每个角色应维护独立语气档案。

字段建议：

```typescript
interface CharacterVoiceProfile {
  characterId: string
  sentenceLength: 'short' | 'medium' | 'long' | 'mixed'
  directness: number
  humorLevel: number
  sarcasmLevel: number
  emotionalDisclosure: number
  vocabularyLevel: 'plain' | 'literary' | 'technical' | 'archaic'
  catchphrases: string[]
  forbiddenPhrases: string[]
  speechRules: string[]
}
```

角色语气必须用于：

1. 生成对话。
2. 续写角色互动。
3. 修改角色台词。
4. 检查角色 OOC。
5. 生成角色心理描写。

---

## 7. 反 AI 味规则

### 7.1 默认规则

系统提供默认反 AI 味规则：

1. 避免总结式升华。
2. 避免模板化转折。
3. 减少抽象形容词。
4. 减少通用氛围句。
5. 减少过度工整的排比结构。
6. 减少直接解释情绪。
7. 保留适度口语毛刺和不完美节奏。

### 7.2 用户控制

用户不需要调整 temperature、top_p，而是调整写作语言参数：

```text
AI 味控制

[ ] 避免套路化句式
[ ] 减少解释性心理描写
[ ] 减少宏大抽象词
[ ] 减少排比和总结句
[ ] 保留口语毛刺
[ ] 增加具体细节
[ ] 更像作者原文
```

强度：

| 强度 | 行为 |
| --- | --- |
| 轻度 | 仅提示风险 |
| 中度 | 生成时约束 |
| 重度 | 生成后自动标记并建议替换 |

---

## 8. 任务化生成质量控制

### 8.1 支持任务

| 任务 | 主要上下文 | 质量重点 |
| --- | --- | --- |
| 续写剧情 | 当前章节、剧情线、角色、世界观、作者声音 | 不跑偏、不忘前文、不 OOC |
| 生成对话 | 角色语气、关系、场景目标、冲突 | 声音区分、潜台词、自然度 |
| 场景描写 | 地点、氛围、感官、节奏 | 具体画面、避免空泛 |
| 润色文字 | 原文、作者声音、禁用表达 | 保留原意和个人声音 |

### 8.2 多版本候选

每次生成可返回 1-3 个候选版本：

1. 稳妥版：严格承接当前文本。
2. 戏剧版：加强冲突和张力。
3. 克制版：更像作者原文，少修饰。

用户可对候选进行：

- 悬停预览
- 并排比较
- 局部接受
- 局部拒绝
- 继续追问修改

现有 `DiffHighlight` 和 `ChangeConfirmationModal` 可作为基础。

---

## 9. 后续能力路线图

以下模块是后续需要实现的重点能力，按优先级和依赖关系拆分。

---

## 10. 智能大纲生成与结构分析

### 10.1 当前状态

已有手动大纲管理：

- `server/src/modules/outlines/`
- `client/src/pages/OutlineManagement.tsx`
- `Outline` 与 `OutlineItem` 数据模型

`OutlineItem` 已包含 goal、conflict、outcome、povCharacter、estimatedWords 等字段，适合作为 AI 大纲生成的目标结构。

### 10.2 目标能力

#### 10.2.1 AI 自动生成大纲

支持基于项目简介生成完整故事大纲：

1. 三幕式。
2. 英雄之旅。
3. 起承转合。
4. Save the Cat 15 节拍。
5. 七点故事结构。

生成内容包括：

- 故事主线
- 分卷结构
- 章节标题
- 每章目标
- 每章冲突
- 每章结尾钩子
- POV 角色
- 预计字数

#### 10.2.2 结构健康度分析

分析维度：

| 维度 | 指标 |
| --- | --- |
| 节奏分布 | 高潮/低谷分布、Act 长度比例 |
| 人物出场 | 每章角色出现频率、角色缺席异常 |
| 情节线完整性 | 主线/支线是否有开端、推进、回收 |
| 伏笔回收率 | setup/payoff 数量、最长未回收伏笔 |
| 转折点位置 | Midpoint、Climax 是否过早或过晚 |

#### 10.2.3 智能章节建议

根据当前大纲和已写内容提示：

1. 下一章应该写什么。
2. 当前剧情是否拖沓。
3. 当前剧情是否推进过快。
4. 哪条支线太久没有出现。
5. 哪个角色需要再次出场。

### 10.3 数据模型建议

```typescript
interface StoryStructureTemplate {
  id: string
  name: 'three_act' | 'hero_journey' | 'kishotenketsu' | 'save_the_cat' | 'seven_point'
  beats: StoryBeatTemplate[]
}

interface StoryBeatTemplate {
  name: string
  description: string
  targetPosition: number
  required: boolean
}

interface StructureHealthReport {
  projectId: string
  templateId: string
  coverageScore: number
  pacingScore: number
  missingBeats: string[]
  overloadedBeats: string[]
  suggestions: string[]
}
```

### 10.4 价值

1. 帮助新手作者建立故事框架。
2. 避免剧情失控。
3. 提升整体叙事质量。
4. 将手动大纲管理升级为 AI 辅助结构设计。

---

## 11. 角色对话模拟器

### 11.1 当前状态

已有基础：

- `Character.voice` 字段。
- `CharacterVoiceProfile` 概念。
- `EnhancedWritingService.generateDialogue()`。
- AIAction 中已有 `DIALOGUE_GENERATION`。

当前缺口：

1. 对话生成未充分使用角色语气档案。
2. 没有多角色自动对话模拟。
3. 没有对话场景沙盒。
4. 没有 OOC 检测。

### 11.2 目标能力

#### 11.2.1 角色 AI 代理

每个角色拥有独立 AI 人格。

角色代理由以下内容组成：

1. 角色设定。
2. 性格与目标。
3. 当前秘密。
4. 与其他角色关系。
5. 说话方式。
6. 当前情绪状态。
7. 当前知道和不知道的信息。

#### 11.2.2 对话场景沙盒

用户设置：

- 参与角色
- 场景地点
- 当前冲突
- 对话目标
- 情绪基调
- 是否允许角色暴露秘密
- 对话长度

AI 自动演绎对话，作者可以：

1. 暂停。
2. 插入指令。
3. 修改某个角色目标。
4. 要求某个角色更强势或更沉默。
5. 将满意片段插入章节。

#### 11.2.3 对话风格一致性

检测内容：

1. 角色是否说了不符合身份的话。
2. 是否使用了不该出现的词汇。
3. 语气是否与当前关系匹配。
4. 是否过度解释心理。
5. 是否所有角色声音趋同。

### 11.3 价值

1. 解决对话写作难题。
2. 保持角色语言风格一致。
3. 激发人物冲突和灵感。
4. 让角色不只是设定卡，而是可互动的创作伙伴。

---

## 12. 情感曲线与读者体验分析

### 12.1 当前状态

已有基础：

- `TurningPoint.emotionalShift` 字段。
- 一致性检查模块。
- 写作风格 pacing 参数。

当前缺口：

1. 没有全书情感曲线。
2. 没有读者视角分析。
3. 没有可读性评分。
4. 没有弃书风险预测。

### 12.2 目标能力

#### 12.2.1 情感曲线可视化

系统分析每章或每个场景的情绪基调：

- 紧张
- 轻松
- 悲伤
- 欢乐
- 压抑
- 期待
- 恐惧
- 愤怒

展示：

1. 全书情感曲线。
2. 单章情绪波动。
3. 高潮与低谷位置。
4. 与目标曲线对比。

可参考六种经典情感弧：

1. Rags to Riches。
2. Tragedy。
3. Man in a Hole。
4. Icarus。
5. Cinderella。
6. Oedipus。

#### 12.2.2 可读性分析

指标：

| 指标 | 用途 |
| --- | --- |
| 平均句长 | 判断是否冗长 |
| 句长波动 | 判断节奏是否机械 |
| 段落密度 | 判断阅读压力 |
| 对话比例 | 判断场景活跃度 |
| 词汇难度 | 判断是否过于艰涩 |
| 重复词 | 判断语言贫乏或刻意 |

中文场景下优先使用自定义指标，不直接照搬英文 Flesch-Kincaid。

#### 12.2.3 读者兴趣点预测

预测：

1. 哪些章节可能平淡。
2. 哪些章节信息密度过高。
3. 高潮章节是否足够精彩。
4. 过渡章节是否拖沓。
5. 主角是否长期缺乏主动行动。

### 12.3 价值

1. 从读者角度优化作品。
2. 提升作品吸引力。
3. 减少弃书率。
4. 帮助作者理解“哪里不好看”。

---

## 13. 智能素材库与灵感收集

### 13.1 当前状态

已有 Lorebook：

- `LoreEntry` 支持分类、关键词、优先级、触发条件。
- `LoreUsage` 支持使用记录。
- `LorebookManager` 支持前端管理。

当前缺口：

1. Lorebook 偏设定库，不是灵感库。
2. 不支持图片、链接、PDF、网页资料。
3. 缺少灵感与章节/角色/场景的弱关联。
4. 缺少写作时智能推荐素材。

### 13.2 目标能力

#### 13.2.1 灵感收集器

支持快速记录：

1. 文字片段。
2. 图片。
3. 链接。
4. PDF 摘录。
5. 对话灵感。
6. 场景灵感。
7. 人设灵感。

每条素材支持：

- 标签
- 来源
- 关联角色
- 关联章节
- 关联世界观
- 使用状态
- AI 摘要

#### 13.2.2 素材智能推荐

写作时自动推荐：

1. 当前场景可用设定。
2. 相关角色资料。
3. 尚未使用的伏笔。
4. 可插入的灵感片段。
5. 与当前地点相关的素材。

#### 13.2.3 外部资料整合

支持导入：

- 网页
- PDF
- Markdown
- 纯文本
- 图片说明

AI 自动提取：

1. 关键事实。
2. 可用设定。
3. 人物原型。
4. 场景素材。
5. 可转为 Lorebook 的条目。

### 13.3 价值

1. 减少查找资料时间。
2. 避免遗忘重要设定。
3. 将灵感从“零散笔记”转为“可被 AI 使用的创作资产”。

---

## 14. 出版与导出增强

### 14.1 当前状态

当前已有项目 JSON 导入导出：

- `GET /projects/:id/export`
- `POST /projects/import`

缺少正式出版格式。

### 14.2 目标能力

#### 14.2.1 多格式导出

支持：

| 格式 | 用途 | 技术建议 |
| --- | --- | --- |
| Markdown | 内部规范格式、便于版本管理 | 章节合并生成 |
| EPUB | 电子书 | `epub-editor-ts`、Pandoc |
| PDF | 打印、投稿、样章 | Puppeteer 或 PDFKit |
| DOCX | Word 编辑、投稿 | `docx` 或 Pandoc |
| HTML | 网页预览 | 编辑器 HTML 渲染 |
| 网文平台格式 | 起点、晋江等 | 平台模板化导出 |

#### 14.2.2 自动排版

支持：

1. 章节标题样式。
2. 段落首行缩进。
3. 空行规范。
4. 分隔符自动添加。
5. 目录自动生成。
6. 字体和页边距模板。

#### 14.2.3 出版前检查

检查：

1. 敏感词。
2. 错别字。
3. 标点规范。
4. 重复章节标题。
5. 空章节。
6. 字数统计。
7. 未回收伏笔。
8. 未完成剧情线。

### 14.3 价值

1. 简化出版流程。
2. 提升作品专业度。
3. 适配不同平台投稿和发布要求。

---

## 15. AI 角色扮演与剧情推演

### 15.1 当前状态

已有基础：

- AI Assistant。
- 角色搜索和上下文服务。
- Plot 与 PlotPoint。
- Chekhov's Gun 模型。
- Brainstorm 功能。

当前缺口：

1. 没有剧情沙盒。
2. 没有 what-if 分支模拟。
3. 没有角色代理自动决策。
4. 没有分支剧情对比。

### 15.2 目标能力

#### 15.2.1 剧情沙盒模拟

用户设定：

1. 初始条件。
2. 参与角色。
3. 场景地点。
4. 冲突目标。
5. 限制规则。
6. 模拟步数。

AI 模拟：

1. 角色行动。
2. 角色对话。
3. 情绪变化。
4. 关系变化。
5. 剧情后果。

#### 15.2.2 “如果……会怎样”模拟

示例：

```text
如果沈遥在第 5 章提前发现林澈的秘密，会怎样？
```

系统输出：

1. 对主线影响。
2. 对角色关系影响。
3. 对伏笔影响。
4. 对后续章节结构影响。
5. 可能产生的 3 个剧情分支。

#### 15.2.3 角色决策顾问

输入特定情境，系统分析角色合理选择：

1. 符合性格的选择。
2. 符合目标的选择。
3. 符合关系的选择。
4. 不合理但有戏剧性的选择。
5. OOC 风险。

### 15.3 数据模型建议

```typescript
interface PlotSimulation {
  id: string
  projectId: string
  title: string
  initialCondition: string
  involvedCharacterIds: string[]
  constraints: string[]
  branches: PlotSimulationBranch[]
}

interface PlotSimulationBranch {
  id: string
  simulationId: string
  summary: string
  consequences: string[]
  affectedCharacters: string[]
  affectedPlotlines: string[]
  oocRisks: string[]
  recommended: boolean
}
```

### 15.4 价值

1. 解决“不知道怎么写下去”的困境。
2. 保持角色行为逻辑性。
3. 探索更多剧情可能性。
4. 让作者在真正写入正文前先试错。

---

## 16. 优先级与实施顺序

### 16.1 P0：先修通已有能力

1. 确认并注册 `WritingStylesModule`、`PlotsModule`、`ScenesModule`。
2. 修复 EnhancedWritingController 中临时 userId 问题。
3. 将 Lorebook、Enhanced Writing、Writing Style 接入真实工作流。
4. 在 ChapterEditor 中增加当前 AI 视野。

### 16.2 P1：上下文与质量中枢

1. Context Engine 统一装配上下文。
2. 作者声音档案。
3. 角色语气档案。
4. 反 AI 味规则。
5. 多版本候选与 Diff 审阅。

### 16.3 P2：结构与对话增强

1. AI 大纲生成。
2. 结构健康度分析。
3. 智能章节建议。
4. 角色对话模拟器。
5. 对话 OOC 检测。

### 16.4 P3：读者体验与素材库

1. 情感曲线可视化。
2. 可读性分析。
3. 读者兴趣点预测。
4. 智能素材库。
5. 外部资料导入。

### 16.5 P4：出版与剧情沙盒

1. EPUB/PDF/DOCX 导出。
2. 出版前检查。
3. 剧情沙盒模拟。
4. What-if 分支推演。
5. 角色决策顾问。

---

## 17. 风险与约束

### 17.1 技术风险

1. 上下文过长导致成本和延迟上升。
2. 角色代理模拟可能产生不可控内容。
3. 情感曲线和读者兴趣预测存在主观性。
4. 中文可读性指标不能直接照搬英文公式。
5. 多格式导出需要处理编辑器内容到标准格式的转换。

### 17.2 产品风险

1. 功能过多导致作者写作时分心。
2. 分析结果如果太“评判”，可能打击创作积极性。
3. AI 建议不能覆盖作者个人审美。
4. 角色模拟不能替代作者决策，只能作为辅助。

### 17.3 设计原则

1. 写作优先，分析其次。
2. AI 给建议，不替作者定稿。
3. 所有自动生成内容必须可预览、可拒绝、可撤销。
4. 技术参数应转译成写作者能理解的语言。
5. 长期目标是增强作者声音，而不是统一成平台声音。

---

## 18. 参考资料

### 18.1 内部文档

1. `docs/superpowers/specs/2026-05-16-novel-ai-design.md`
2. `docs/superpowers/specs/2026-05-17-writing-style-system-design.md`
3. `docs/superpowers/specs/2026-05-20-editor-button-streaming-design.md`
4. `docs/superpowers/plans/2026-05-18-主流AI写作系统功能调研.md`

### 18.2 外部参考

1. NovelCrafter Codex / Progressions / Plan Tab
2. Sudowrite Story Bible / Outline / Describe / Rewrite
3. NovelAI Lorebook / Memory / Author's Note
4. Reagan et al. Emotional Arcs of Stories
5. Matthew Jockers Syuzhet
6. Generative Agents: Interactive Simulacra of Human Behavior
7. Ink branching narrative language
8. Pandoc document conversion
9. `docx` TypeScript library
10. EPUB generation libraries such as `epub-editor-ts`

---

## 19. 版本历史

| 版本 | 日期 | 修改内容 |
| --- | --- | --- |
| v1.0 | 2026-05-21 | 创建上下文统一、人味生成与后续能力路线图设计文档，纳入智能大纲、对话模拟、情感曲线、素材库、导出出版、剧情推演等后续优化点 |
