# noviaAI Story System Integration Design

日期：2026-05-22

## 背景

GitHub AI 写作项目调研显示，成熟的长篇 AI 写作系统通常不是单次生成器，而是由 Story Bible、任务分解、长期记忆、审查门禁、提交链和投影层组成的创作工作流。

noviaAI 当前已有：

- React 章节编辑器、AI 续写、AI 视野、对话沙盒、世界观、角色、伏笔、时间线、大纲。
- NestJS + Prisma 后端。
- 初步 Story System：`StoryContract`、`StoryContextPack`、`StoryAgentRun`、`StoryAgentStep`、`ChapterCommit`。

本设计的目标是明确哪些外部项目设计可以融入现有系统，并把它们转换成 noviaAI 的产品和技术架构，不直接复制任何 GPL/AGPL 项目代码。

## 设计目标

1. 让 Story System 成为章节 AI 写作主链，而不是独立面板工具。
2. 让 accepted `ChapterCommit` 成为章节事实沉淀入口。
3. 让上下文构建从“拼接资料”升级为预算化、可解释的 `ContextPack`。
4. 让审查结果变成可阻断、可修复、可追踪的工作流节点。
5. 让长期记忆同时支持状态表和轻量图谱查询。
6. 保持作者控制：AI 可以建议、生成、修复，但不能绕过用户保存/提交决策。

## 可融入设计总览

| 来源项目/模式 | 融入 noviaAI 的能力 | 当前接入状态 | 设计策略 |
|---|---|---|---|
| webnovel-writer Contract-first | StoryContract、Preflight、ChapterCommit、runtime health | 已有雏形 | 扩展为所有写作入口的强制主链 |
| Long-Novel-GPT RAG 长篇上下文 | 章节/摘要/设定检索 | 部分已有 AI 视野 | 合并进 ContextPack，增加预算和检索理由 |
| graphify-novel Story Bible + Graph | StoryEntity、StoryRelation、StoryEvent | 未接入 | 用 Prisma 表做轻量图谱，后续可换图数据库 |
| WriteHERE 动态任务分解 | AgentRun/AgentStep 可暂停继续 | 已有雏形 | 固定主阶段，阶段内允许动态子任务 |
| novel-creator-skill 门禁/反向刹车 | ForbiddenZone、OverResolution、ReaderPull gate | 部分在 ReviewContract | 做成 ReviewIssue + RepairPlan |
| autonovel 审查/修订/导出链 | Review -> Repair -> Commit -> Export | 未完整接入 | 先做审查修复闭环，导出放后期 |
| Draftside 低打扰编辑器 | 选区工具、行内建议、commit diff | 部分有增强写作工具 | 接入 Story System 面板和正文定位 |

## 总体架构

```text
Author action
  -> Story Runtime
     -> refresh contracts
     -> preflight
     -> build context pack
     -> agent run / manual edit
     -> review
     -> repair plan
     -> chapter commit
     -> projections
  -> Editor feedback
```

### 数据分层

| 层 | 模型 | 说明 |
|---|---|---|
| 真源层 | `StoryContract`, `ChapterCommit`, `StoryEvent` | 可审计事实，不直接覆盖 |
| 投影层 | `ChapterSummary`, `CharacterState`, `WorldStateFact`, `OpenLoop`, `StoryEntity`, `StoryRelation` | 从 accepted commit 派生，可重算 |
| 运行层 | `StoryContextPack`, `StoryAgentRun`, `StoryAgentStep`, `ReviewReport`, `RepairPlan` | 支持暂停/继续、审查、修复 |
| 体验层 | Story 面板、AI 视野、编辑器标注、diff | 解释系统状态和辅助作者决策 |

## 核心流程设计

### 1. AI 续写主链

当前 `AiService.textComplete` 会独立构建风格提示和上下文。应改为：

```text
textComplete(projectId, chapterId, content)
  -> StorySystem.refreshContracts()
  -> StorySystem.preflight()
  -> if blocking: return structured blocking response
  -> StorySystem.buildContextPack()
  -> create StoryAgentRun(mode=FULL_WRITE)
  -> create StoryAgentStep(CONTEXT)
  -> call AI with ContextPack
  -> create StoryAgentStep(DRAFT)
  -> return draft to editor
```

要求：

- 不再让续写入口绕过 Story System。
- 预检 blocking 时不调用模型，前端显示阻断原因。
- AI prompt 必须引用 ContextPack 的 section，而不是重新拼同类资料。
- 续写结果不自动覆盖正文，只返回给编辑器插入或 diff。

### 2. ChapterCommit 主链

保存正文不等于提交事实。用户保存章节只是更新草稿；用户执行“提交当前正文”时才进入 commit。

```text
createCommit(content)
  -> review
  -> fulfillment check
  -> extract facts
  -> accepted/rejected
  -> if accepted: apply projections
  -> if rejected: create repair plan
```

提交判定：

- 有 blocking review issue -> `REJECTED`
- 有 missed must-cover node -> `REJECTED`
- 命中 forbidden zone -> `REJECTED`
- 通过则 `ACCEPTED`

新增字段或模型：

- `ChapterCommit.blockingReasons`
- `ChapterCommit.repairPlanId`
- `ReviewReport`
- `ReviewIssue`
- `RepairPlan`

### 3. 投影链

accepted commit 后执行投影：

```text
ChapterCommit
  -> ChapterSummary
  -> StoryEvent
  -> StoryEntity / EntityMention
  -> StoryRelation
  -> CharacterState
  -> WorldStateFact
  -> OpenLoop
  -> Search/Vector index
```

第一阶段投影范围：

- 摘要：更新 `ChapterSummary` 和 `Chapter.summary`
- 事件：写入 `StoryEvent`
- 角色状态：写入 `CharacterState`
- 伏笔：写入或更新 `OpenLoop`

第二阶段再做：

- 世界状态事实
- 关系边自动更新
- 向量索引和 rerank
- 投影重算任务

### 4. ContextPack 预算化

现有 `StoryContextPack.sections` 需要从展示数据升级为模型输入调度。

每个 section 应包含：

```json
{
  "layer": "contract",
  "title": "章节合同",
  "priority": "critical",
  "source": "StoryContract",
  "reason": "本章目标和禁区必须进入 prompt",
  "items": [],
  "tokenEstimate": 320,
  "budget": 1200
}
```

默认预算：

- Contract：20%
- Working：25%
- Episodic：20%
- Semantic：20%
- Style：10%
- Warnings：5%

当超过预算时按优先级裁剪，并把裁剪项记录到 `warnings`，前端可解释“哪些没进入 AI 视野”。

### 5. 审查与修复闭环

审查不再只是文本报告，必须结构化。

`ReviewIssue` 字段：

- `category`: `FULFILLMENT | CONTINUITY | CHARACTER | WORLD | PACING | READER_PULL | STYLE`
- `severity`: `CRITICAL | NORMAL | MINOR`
- `blocking`: boolean
- `message`
- `evidence`
- `suggestion`
- `startOffset`, `endOffset`

`RepairPlan` 字段：

- `commitId`
- `status`: `OPEN | APPLIED | DISMISSED`
- `steps`: JSON array
- `targetRanges`: JSON array

修复流程：

```text
ReviewIssue(blocking=true)
  -> RepairPlan
  -> AgentStep(REPAIR)
  -> user applies patch
  -> re-review
  -> commit
```

### 6. 轻量图谱

不立即上图数据库，先用 Prisma 表：

- `StoryEntity`: canonical entity，包括角色、地点、物品、组织、概念、事件。
- `EntityMention`: 某实体在某章/某 commit 中出现。
- `StoryRelation`: entity-to-entity 关系边。
- `StoryEvent`: accepted commit 中抽取出的事件。
- `OpenLoop`: 伏笔、承诺、未解问题。

查询能力：

- 按实体查历史：这个角色/物品出现在哪些章节。
- 按关系查路径：A 和 B 如何相关。
- 查开放环：哪些伏笔未回收。
- 查事实来源：某个状态来自哪个 commit。

### 7. 前端体验

章节编辑器保留正文为中心，Story System 做右侧工作流面板。

应新增/调整：

- AI 续写按钮走 Story System，并能显示预检阻断。
- Story 面板显示 health、contracts、ContextPack、Agent steps、commits、repair plan。
- 文本上标注 blocking issue 位置。
- commit 前显示当前正文与最近 accepted commit 的 diff。
- rejected commit 显示“修复并重审”按钮。
- AI 视野和 Story ContextPack 合并展示，避免两个相似上下文系统并存。

## API 设计

现有 Story System API 保留，新增：

```text
POST /projects/:projectId/chapters/:chapterId/story-system/write
POST /projects/:projectId/chapters/:chapterId/story-system/repair
GET  /projects/:projectId/chapters/:chapterId/story-system/review-reports
GET  /projects/:projectId/chapters/:chapterId/story-system/repair-plans
GET  /projects/:projectId/story-graph/entities
GET  /projects/:projectId/story-graph/entities/:id
GET  /projects/:projectId/story-graph/open-loops
GET  /projects/:projectId/story-graph/path?from=&to=
POST /projects/:projectId/story-system/projections/rebuild
```

`write` 端点用于替代直接 `textComplete` 的章节生成路径。旧 `textComplete` 可以保留给自由写作，但章节编辑器默认使用 `story-system/write`。

## 错误处理

- 合同缺失：自动刷新一次，仍缺失则 blocking。
- 章节正文为空：允许生成草稿，但不允许 commit。
- AI 调用失败：AgentStep 标记 `FAILED`，Run 标记 `PAUSED` 或 `FAILED`，允许从失败步骤重试。
- 投影失败：Commit 保持 accepted，但 `projectionStatus` 标记 failed，允许单独重跑投影。
- 审查 rejected：不覆盖正文，不更新投影，只创建 repair plan。
- 用户忽略 issue：需要记录 override reason，后续审查作为 source trace。

## 测试策略

后端测试：

- StorySystemService：合同刷新、预检、ContextPack 预算裁剪、AgentRun 暂停/继续、commit accepted/rejected、投影失败隔离。
- ProjectionService：accepted commit 生成 event、character state、open loop。
- ReviewService：blocking issue、位置定位、repair plan。
- GraphService：实体查询、关系查询、开放环查询。

前端测试/构建：

- StorySystemPanel 能展示 health、preflight、ContextPack、commits。
- 预检阻断时续写按钮不调用 AI。
- rejected commit 显示修复计划。

验收命令：

```bash
cd server && npm run test
cd server && npm run build
cd client && npm run build
cd server && npx prisma migrate status
```

## 分阶段落地

### Phase 1：主链接管章节续写

- `AiService.textComplete` 或新增 `StoryWritingService.writeChapter` 接入 Story System。
- ContextPack 成为 prompt 输入。
- AgentRun 记录 CONTEXT/DRAFT。
- 前端 AI 续写改走 Story System。

### Phase 2：审查和修复闭环

- 新增 ReviewReport、ReviewIssue、RepairPlan。
- rejected commit 生成 repair plan。
- Story 面板显示 issue 和修复按钮。

### Phase 3：事件和状态投影

- 新增 StoryEvent、CharacterState、OpenLoop。
- accepted commit 投影到摘要、事件、角色状态、伏笔。
- health 显示投影状态。

### Phase 4：轻量图谱

- 新增 StoryEntity、EntityMention、StoryRelation。
- 提供实体历史、开放环、关系路径 API。
- 前端新增图谱/问答入口。

### Phase 5：导出和全书级审查

- 全书结构审查。
- 风格统一检查。
- Markdown/ePub/PDF 导出。
- 封面、简介、卖点生成。

## 不纳入本设计的内容

- 不直接复制外部项目代码、提示词和模板。
- 不引入 Neo4j 等重型图数据库作为第一阶段依赖。
- 不让 AI 自动覆盖作者正文。
- 不把完全自动出书作为默认工作流。
- 不在本阶段实现复杂商业出版工具链。

## 成功标准

1. 章节续写默认经过 Story System 主链。
2. 每次 AI 写作都有可恢复的 AgentRun/AgentStep。
3. 每次事实沉淀都有 ChapterCommit。
4. rejected commit 能给出结构化原因和修复计划。
5. accepted commit 能投影到摘要、事件、角色状态和开放环。
6. 前端能解释 AI 使用了哪些上下文、哪些被裁剪、为什么阻断。

