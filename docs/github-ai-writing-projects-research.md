# GitHub AI 写作项目调研与 noviaAI 可借鉴设计

调研日期：2026-05-22

目标：从 GitHub 上的 AI 写作、长篇小说生成、Agent 写作工作流、RAG/知识图谱记忆、离线写作编辑器项目中提炼可用于 noviaAI 的系统设计和流程设计。本文只借鉴架构思想，不建议直接复制 GPL/AGPL 项目的代码或提示词。

## 结论摘要

最值得 noviaAI 吸收的方向不是“更强的一键生成”，而是把写作系统做成可追踪、可暂停、可审查、可回滚的创作工作流。

优先级最高的 5 个借鉴点：

1. **Story Bible / Contract 作为真源**：项目、卷、章节、审查规则要有结构化真源，正文生成只消费这些合同，不直接从零散 prompt 拼接。
2. **写作任务递归分解**：把“写一章”拆成目标、检索、草稿、审查、修复、提交、投影，而不是一次性让模型输出全文。
3. **Chapter Commit 主链**：章节写完后先生成可审计提交，只有 accepted commit 才更新摘要、人物状态、世界观状态、RAG 索引。
4. **知识图谱 + 状态表双层记忆**：状态表回答“现在是什么”，图谱回答“这些实体如何关联”。
5. **编辑器内低打扰 AI**：AI 应该贴着正文提供续写、改写、审查、替代表达和局部解释，而不是把作者赶进聊天窗口。

noviaAI 当前已经具备 React/Nest/Prisma、章节编辑器、角色/世界观/伏笔/AI 视野、持久化对话沙盒、Story System 初版。这份调研建议下一步把 Story System 从“可操作链路”升级成“真正驱动写作的主链”。

## 项目扫描

| 项目 | 定位 | 最值得借鉴 | 主要风险 |
|---|---|---|---|
| [Long-Novel-GPT](https://github.com/MaoXiaoYuZ/Long-Novel-GPT) | LLM + RAG 长篇小说 Agent | 自上而下：大纲 -> 章节 -> 正文；导入已有小说后拆书、检索片段、同步更新纲要 | 偏生成器，交互式创作和审查门禁不够细 |
| [WriteHERE](https://github.com/principia-ai/WriteHERE) | 递归规划长文写作框架 | 动态任务分解，实时调整写作路径，展示 agent 思考过程 | 更偏研究框架，产品落地要简化 |
| [autonovel](https://github.com/NousResearch/autonovel) | 自主小说生产流水线 | Foundation -> Draft -> Review -> Revision -> Export 的完整出版链；modify/evaluate/keep-discard 循环 | 自动化程度过高，容易牺牲作者控制感 |
| [graphify-novel](https://github.com/Anshler/graphify-novel) | 知识图谱写作助手 | Story Bible 是真源，graph 是关系层；支持 query/path/status/thread | 图谱工程成本较高，需要分阶段接入 |
| [webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer) | 长篇网文 Claude/Codex 技能体系 | Contract-first、ChapterCommit、preflight、projection、runtime health | GPLv3，不能直接拷贝代码或模板 |
| [novel-creator-skill](https://github.com/leenbj/novel-creator-skill) | 中文长篇小说技能 | 五步质量门禁、RAG 检索、知识图谱、章节锚点、跨 Agent 审核、反向刹车 | GPL/技能式文件体系，不适合直接搬进 SaaS 后端 |
| [Novel-Claude](https://github.com/wzxsph/Novel-Claude) | 工业级网文生成技能 | 微内核 + 插件、上下文隔离、RAG memory、MCP-like skills | 需要进一步源码核验；技能架构和 noviaAI 产品形态不同 |
| [RecurrentGPT](https://github.com/aiwaves-cn/RecurrentGPT) | 任意长文本递归生成 | 自然语言短期/长期记忆，每步生成下段和下一步计划 | GPL-3.0；偏段落级生成，不是完整小说生产系统 |
| [LibriScribe](https://github.com/guerra2fernando/libriscribe) | 多 Agent 图书创作助手 | 概念、提纲、角色、世界观、章节、编辑、质检、导出分工清晰 | 书籍泛化系统，网文节奏和连载追读设计不足 |
| [StoryCraftr](https://github.com/raestrada/storycraftr) | CLI 图书创作工具 | 多 provider 配置、Ollama/OpenRouter/OpenAI 支持、项目级配置文件 | CLI 体验不能直接替代 Web 产品体验 |
| [GPTAuthor](https://github.com/dylanhogg/gptauthor) | 多章节故事 CLI | 人类先审 synopsis，再逐章生成；用前章控制 token | 机制简单，缺少长期状态和一致性闭环 |
| [Draftside](https://draftside.ai/) | 离线 AI 写作编辑器 | 浏览器本地 AI、低打扰补全、选区改写、私密 vault | Chrome Gemini Nano 生态限制，长篇记忆能力弱 |
| [AI-Novel-Writing-Assistant](https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant) | AI Native 长篇小说系统 | Agent、世界观、写法引擎、RAG、整本生产工作流 | AGPL/商用授权限制，项目快速变化中 |

## 可借鉴的系统设计

### 1. 真源与投影分离

来自 webnovel-writer、graphify-novel、Long-Novel-GPT。

建议 noviaAI 明确三层数据：

| 层 | 数据 | 作用 |
|---|---|---|
| 真源层 | StoryContract、ChapterCommit、StoryEvent | 可审计事实，不随便覆盖 |
| 投影层 | ChapterSummary、CharacterState、WorldState、OpenLoop、VectorIndex | 方便读取、可重算 |
| 体验层 | ContextPack、AgentRun、编辑器状态、面板提示 | 服务当前写作流程 |

当前已新增 `StoryContract`、`StoryContextPack`、`StoryAgentRun`、`StoryAgentStep`、`ChapterCommit`。下一步应补 `StoryEvent`、`CharacterStateProjection`、`WorldStateProjection`、`OpenLoopProjection`，让 commit 不只投影摘要，还能驱动人物和世界状态。

### 2. Story Bible + Knowledge Graph 双轨

graphify-novel 的核心启发是：Bible 和 Graph 不是替代关系。

- Bible/状态表回答：角色当前在哪里、目标是什么、关系状态是什么、世界规则是什么。
- Graph 回答：角色、地点、事件、伏笔之间有哪些隐含连接，某个线索能追到哪些章节。

noviaAI 可以这样做：

```text
ChapterCommit.acceptedEvents
  -> StoryEvent
  -> EntityMention
  -> RelationshipEdge
  -> CharacterStateProjection / WorldStateProjection / OpenLoopProjection
```

短期不必上复杂图数据库。Prisma + SQLite/Postgres 表就能先做：

- `StoryEntity`
- `StoryRelation`
- `StoryEvent`
- `EntityMention`
- `OpenLoop`

后续如果需要复杂路径查询，再接 Neo4j、Kuzu、SQLite recursive CTE 或 pgvector/GraphRAG。

### 3. 动态任务分解

WriteHERE 的重要价值是“不预设固定工作流”，而是让 agent 根据任务动态拆解。但产品落地不能无限自由，否则难以恢复和审计。

建议采用“固定主阶段 + 阶段内动态子任务”：

```text
CONTEXT
  - refresh contracts
  - build context pack
  - preflight
DRAFT
  - plan scenes
  - write beats
  - compose chapter
REVIEW
  - fulfillment review
  - consistency review
  - prose review
REPAIR
  - fix blocking issues
EXTRACT
  - extract events/states/entities
COMMIT
  - accepted/rejected
  - projections
```

这样既能保持 WriteHERE 的适应性，又能保留 noviaAI 当前 StoryAgentRun 的可暂停/继续模型。

### 4. 章节门禁与反向刹车

novel-creator-skill 强调“禁止门禁失败后继续写作”和“非终局章节禁止解决主线核心冲突”。这对网文尤其重要，因为 AI 常倾向于过快解释秘密、解决冲突、让人物和解。

建议增加几类可配置门禁：

- **Fulfillment Gate**：必须覆盖节点是否完成。
- **Forbidden Zone Gate**：本章禁区是否被写进正文。
- **Continuity Gate**：时间、地点、人物状态是否冲突。
- **Reader Pull Gate**：章末是否保留钩子或开放问题。
- **Over-resolution Gate**：是否提前解决主线秘密。

当前 `ChapterCommit` 已有 accepted/rejected，可继续把 rejected 原因结构化为 `blockingReasons` 和 `repairPlan`。

### 5. 低上下文策略

多个项目都在绕开“把整本书塞进 prompt”的路线。RecurrentGPT 用短期/长期自然语言记忆；novel-creator-skill 限制写前读取文件数；Long-Novel-GPT 用 RAG 检索相关片段。

noviaAI 的 ContextPack 应该从“展示上下文”升级为“预算化上下文调度器”：

| 层 | 默认预算 | 内容 |
|---|---:|---|
| Contract | 20% | 本章目标、必须节点、禁区、审查规则 |
| Working | 25% | 当前正文、上 3-5 章摘要 |
| Episodic | 20% | 最近事件、最近状态变化、近期伏笔 |
| Semantic | 20% | 相关角色、世界规则、设定簿 |
| Style | 10% | 风格配置、角色 voice |
| Warnings | 5% | 歧义、冲突、缺失项 |

每一项都应有 `source`、`priority`、`reason`、`tokenEstimate`，方便前端解释“AI 为什么看到这些”。

### 6. 编辑器体验：AI 在正文旁边，不在正文上面

Draftside 的启发是：AI 不要打断写作流。noviaAI 当前已有章节编辑器、AI 视野、对话沙盒、Story 面板，下一步应更细：

- 选区右键/浮动工具：改写、扩写、压缩、换语气、角色声音检查。
- 行内 ghost suggestion：只在作者停顿时出现。
- 审查标注：blocking issue 直接定位到文本位置。
- Commit diff：accepted commit 保存正文快照，前端可比较当前正文与上次 accepted commit。
- AI 行为可见：展示 AgentStep，但默认折叠，避免信息噪音。

## 对 noviaAI 的具体路线建议

### Phase A：把 Story System 变成真正主链

目标：所有章节 AI 写作都走 Story System，而不是只有面板按钮。

建议任务：

1. 续写前自动执行 `refreshContracts -> preflight -> buildContextPack`。
2. AI 续写 prompt 改为消费 ContextPack，而不是另起一套上下文。
3. 续写完成后自动创建 `StoryAgentRun` 和 `StoryAgentStep`。
4. 保存章节时允许用户创建 `ChapterCommit`。
5. rejected commit 在编辑器中显示修复清单。

### Phase B：事件抽取和投影

目标：让 accepted commit 驱动人物、世界、伏笔、摘要和检索索引。

建议新增：

- `StoryEvent`
- `StoryEntity`
- `StoryRelation`
- `CharacterState`
- `WorldStateFact`
- `OpenLoop`
- `ProjectionJob`

投影规则：

```text
ChapterCommit(ACCEPTED)
  -> events
  -> character state
  -> world state
  -> open loops
  -> summaries
  -> search/vector index
```

### Phase C：审查和修复闭环

目标：不只是“检查问题”，而是能自动生成修复计划并继续 agent loop。

建议新增：

- `ReviewReport`
- `ReviewIssue`
- `RepairPlan`
- `RepairAttempt`

流程：

```text
review -> blocking issues -> repair plan -> patch draft -> re-review -> commit
```

### Phase D：图谱查询和作者问答

目标：让作者能问“这个伏笔什么时候埋的”“某角色为什么知道这件事”“A 和 B 有什么关系”。

建议先做 SQL 图谱：

- `/story-graph/query`
- `/story-graph/path`
- `/story-graph/entity/:id`
- `/story-graph/open-loops`

前端入口可以放在项目工作台和章节编辑器右侧。

### Phase E：出版/导出流水线

autonovel 和 LibriScribe 的远期价值在出版链：

- 全书结构审查
- 风格统一
- 章节合并/拆分建议
- Markdown/ePub/PDF 导出
- 封面/简介/卖点生成

这不是当前最急，但适合成为 noviaAI 的差异化后期能力。

## 不建议直接照搬的部分

1. **不要照搬 GPL/AGPL 项目代码**：webnovel-writer、RecurrentGPT、AI-Novel-Writing-Assistant、部分中文 skill 项目都有强约束许可证或商用限制。
2. **不要做完全自动出书作为主体验**：autonovel 很适合研究和 demo，但 noviaAI 更应强调作者控制。
3. **不要一开始上复杂图数据库**：先用 Prisma 表和投影跑通，再评估图数据库。
4. **不要把所有上下文都塞进 prompt**：长期会贵、慢、不可解释。
5. **不要让多 Agent 直接互相聊天写正文**：需要通过 `AgentStep`、artifact、review gate 交接，避免污染正文。

## 推荐的近期实现清单

按收益/成本排序：

1. 将 `AiService.textComplete` 接入 Story System ContextPack。
2. 为 `ChapterCommit` 增加 `blockingReasons`、`repairPlan` 字段或关联表。
3. 新增 `StoryEvent`，从 commit 中持久化 accepted events。
4. 新增 `CharacterState` 和 `OpenLoop` 两个投影，先不做完整世界状态。
5. 在 `StorySystemPanel` 中显示 issue 定位和 repair plan。
6. 增加“创建 commit 前 diff”。
7. 增加 project-level runtime health 页面。
8. 增加 ContextPack token budget 和检索理由。
9. 增加图谱查询最小 API。
10. 增加模型无关 provider 配置体验，参考 StoryCraftr 的 provider/endpoint/config 分离。

## 参考链接

- [Long-Novel-GPT](https://github.com/MaoXiaoYuZ/Long-Novel-GPT)
- [WriteHERE](https://github.com/principia-ai/WriteHERE)
- [autonovel](https://github.com/NousResearch/autonovel)
- [graphify-novel](https://github.com/Anshler/graphify-novel)
- [webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer)
- [novel-creator-skill](https://github.com/leenbj/novel-creator-skill)
- [Novel-Claude](https://github.com/wzxsph/Novel-Claude)
- [RecurrentGPT](https://github.com/aiwaves-cn/RecurrentGPT)
- [LibriScribe](https://github.com/guerra2fernando/libriscribe)
- [StoryCraftr](https://github.com/raestrada/storycraftr)
- [GPTAuthor](https://github.com/dylanhogg/gptauthor)
- [Draftside](https://draftside.ai/)
- [AI-Novel-Writing-Assistant](https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant)

