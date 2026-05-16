# AI小说创作平台 - 技术设计文档

**项目名称：** NovelAI - AI辅助长篇小说创作平台  
**版本：** v1.0  
**日期：** 2026-05-16  
**状态：** 草稿

---

## 1. 项目概述

### 1.1 项目背景

长篇小说创作是一项复杂的系统工程，涉及故事结构规划、人物塑造、世界观构建、情节推进、文风统一等多维度挑战。传统写作工具缺乏对小说创作特殊需求的针对性支持，作者常常面临人物设定前后不一致、情节逻辑漏洞、伏笔遗忘等困扰。

随着大语言模型(LLM)能力的快速发展，AI已具备理解上下文、保持一致性、生成连贯文本的能力。本项目旨在构建一个专为长篇小说创作设计的AI辅助平台，帮助作者系统化管理创作素材，借助AI保持作品一致性，提升创作效率。

### 1.2 项目目标

1. **素材统一管理** - 建立完整的故事世界观、人物档案、场景设定库
2. **AI上下文追踪** - 确保AI在辅助写作时充分理解作品已有内容
3. **全方位AI辅助** - 覆盖构思、大纲、写作、润色、分析全流程
4. **一致性保障** - 自动检测人物性格、时间线、设定冲突
5. **灵活扩展** - 支持用户接入自有API Key，灵活选择AI模型

### 1.3 核心约束

- **应用形态：** Web应用，用户通过浏览器访问
- **用户类型：** 个人创作者，单用户本地数据管理
- **AI集成：** 用户自行提供API Key，系统不内置AI能力
- **数据存储：** 本地化优先，用户数据自主可控

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端层 (React Web)                    │
├──────────┬──────────┬──────────┬──────────┬──────────┤
│项目管理   │故事圣经   │写作中心   │AI助手    │系统设置   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
                           │
                    REST API / GraphQL
                           │
┌─────────────────────────────────────────────────────────────┐
│                      服务端层 (Node.js)                      │
├──────────┬──────────┬──────────┬──────────┬──────────┤
│业务逻辑层 │AI调度层  │上下文管理 │数据访问层 │认证授权   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
                           │
                    PostgreSQL + Prisma
```

### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + TypeScript | 类型安全，生态丰富 |
| UI组件库 | Tailwind CSS + shadcn/ui | 现代化设计，快速开发 |
| 状态管理 | React Query + Zustand | 服务端状态+本地状态分离 |
| 富文本编辑 | TipTap (基于ProseMirror) | 高度可定制的编辑器 |
| 后端框架 | NestJS | 模块化企业级框架 |
| ORM | Prisma | 类型安全的数据库操作 |
| 数据库 | PostgreSQL | 关系型数据存储 |
| AI集成 | LangChain.js | 统一的大模型调用接口 |
| 全文搜索 | PostgreSQL tsvector | 内置全文搜索能力 |
| 缓存层 | Redis (可选) | 热数据缓存 |

### 2.3 模块划分

| 模块 | 职责 | 核心功能 |
|------|------|---------|
| 项目管理 | 小说项目创建与管理 | 项目CRUD、多项目管理、项目导入导出 |
| 故事圣经 | 创作素材集中管理 | 世界观、人物、场景、情节设定管理 |
| 写作中心 | 章节内容创作 | 章节编辑、目录管理、实时保存 |
| AI助手 | AI能力调用 | 续写建议、一致性检查、分析工具 |
| 上下文管理 | AI上下文构建 | 素材聚合、摘要生成、上下文注入 |
| API配置 | AI密钥管理 | 多API Key管理、模型配置、成本统计 |
| 用户系统 | 认证与数据隔离 | 注册登录、数据隔离 |

---

## 3. 数据模型

### 3.1 核心实体关系

```
User (用户)
  └── Project (小说项目)
        ├── ProjectMeta (项目元信息)
        ├── WorldSetting (世界观设定)
        │     └── WorldSettingItem (设定项)
        ├── Character (人物)
        │     └── CharacterRelationship (人物关系)
        ├── Scene (场景)
        ├── Plot (情节)
        │     └── PlotPoint (情节点)
        ├── Chapter (章节)
        │     └── ChapterContent (章节内容)
        └── Material (素材库)
```

### 3.2 主要数据模型

#### Project (小说项目)
```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  subtitle?: string;
  synopsis: string; // 简介
  genre: Genre; // 类型
  tags: string[];
  status: ProjectStatus; // 构思/进行中/完结
  wordCount: number; // 总字数
  settings: ProjectSettings; // 项目级配置
  createdAt: Date;
  updatedAt: Date;
}
```

#### WorldSetting (世界观设定)
```typescript
interface WorldSetting {
  id: string;
  projectId: string;
  category: WorldCategory; // 地理/历史/政治/魔法体系/文化等
  items: WorldSettingItem[];
}

interface WorldSettingItem {
  id: string;
  name: string;
  description: string;
  details: Record<string, any>; // 自定义字段
  relatedCharacters: string[]; // 关联人物ID
  relatedScenes: string[]; // 关联场景ID
}
```

#### Character (人物)
```typescript
interface Character {
  id: string;
  projectId: string;
  name: string;
  role: CharacterRole; // 主角/配角/反派/路人
  avatar?: string; // 头像
  
  // 基础信息
  basicInfo: {
    age?: number;
    gender?: string;
    appearance: string; // 外貌描述
    personality: string; // 性格特征
    background: string; // 背景故事
  };
  
  // 创作信息
  creativeInfo: {
    goals: string; // 人物目标
    flaws: string; // 性格缺陷/弱点
    arc: string; // 成长弧光
    voice: string; // 说话风格/语调
  };
  
  // 元数据
  metadata: {
    firstAppearance: string; // 首次出场章节ID
    wordCount: number; // 该人物相关总字数
    appearanceCount: number; // 出场次数
  };
  
  relationships: CharacterRelationship[];
  createdAt: Date;
  updatedAt: Date;
}

interface CharacterRelationship {
  targetId: string; // 关联人物ID
  relationshipType: string; // 关系类型（父子/爱人/朋友/敌人等）
  description: string; // 关系描述
}
```

#### Chapter (章节)
```typescript
interface Chapter {
  id: string;
  projectId: string;
  parentId?: string; // 父章节，用于卷/篇结构
  title: string;
  order: number;
  status: ChapterStatus; // 草稿/修改中/完成
  wordCount: number;
  summary?: string; // 章节摘要
  
  // AI分析数据
  analysis: {
    characters: string[]; // 本章出场人物
    locations: string[]; // 本章涉及场景
    plotPoints: string[]; // 本章涉及情节点
    mood: string; // 本章情绪基调
    timeline: string; // 时间线位置
  };
  
  content?: ChapterContent;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. 功能模块详细设计

### 4.1 项目管理模块

#### 4.1.1 功能列表
- 项目列表展示（卡片形式，支持缩略图）
- 新建小说项目
- 项目基本信息编辑
- 项目删除（需二次确认）
- 项目导入（支持JSON格式）
- 项目导出（支持JSON、Markdown）
- 项目搜索与筛选

#### 4.1.2 用户界面
- 项目列表页：卡片网格布局
  - 项目封面图（可自定义或自动生成）
  - 项目标题、类型标签
  - 字数统计、完成度
  - 最近更新时间
- 项目详情页：
  - 项目概览面板
  - 快速导航到各子模块
  - 全局AI上下文查看入口

### 4.2 故事圣经模块

故事圣经是整个系统的创作素材库，是AI保持一致性的数据基础。

#### 4.2.1 世界观设定

**功能：**
- 多维度分类管理
  - 地理：国家、城市、建筑、自然景观
  - 历史：重大事件、时间线、势力变迁
  - 政治：政体、势力、组织、规则法律
  - 魔法/科技：体系设定、技能、装备、科技水平
  - 文化：民俗、节日、语言、禁忌
- 每个设定条目支持：
  - 名称、描述
  - 分类标签
  - 自定义扩展字段
  - 关联人物、场景、情节
- AI辅助功能：
  - 基于已有设定扩展新设定
  - 设定冲突检测
  - 设定一致性分析

**数据结构：**
```
WorldSetting
├── 地理 (Geography)
│   ├── 世界地图概念
│   ├── 国家和地区
│   ├── 重要城市
│   └── 自然景观
├── 历史 (History)
│   ├── 纪年方式
│   ├── 重大事件
│   └── 势力变迁
├── 政治 (Politics)
│   ├── 政体结构
│   ├── 势力组织
│   └── 法律法规
├── 魔法/科技 (Magic/Tech)
│   ├── 力量体系
│   ├── 等级划分
│   ├── 道具装备
│   └── 科技水平
└── 文化 (Culture)
    ├── 民俗习惯
    ├── 宗教信仰
    ├── 节日庆典
    └── 语言文字
```

#### 4.2.2 人物档案

**功能：**
- 标准人物卡片模板
  - 姓名、性别、年龄
  - 外貌描述（AI辅助生成）
  - 性格特征（多维度标签）
  - 背景故事
  - 人物目标
  - 性格缺陷/弱点
  - 成长弧光
  - 说话风格/语调
- 关系网络管理
  - 关系类型定义
  - 关系图可视化
  - 关系动态变化追踪
- 出场追踪
  - 首次出场章节
  - 出场章节列表
  - 出场次数统计
  - 本章相关字数统计

**AI辅助功能：**
- 基于简单描述生成完整人物设定
- 性格一致性检查
- 关系逻辑建议
- 人物对比分析（相似角色检测）

#### 4.2.3 场景档案

**功能：**
- 场景卡片管理
  - 场景名称、地理位置
  - 环境描述
  - 氛围基调
  - 重要程度标记
- 场景关联
  - 关联人物（谁在此场景活动）
  - 关联情节（此场景发生的事件）
  - 关联章节（场景出现在哪些章节）
- 场景变化追踪
  - 不同时间段同一场景的描述变化

#### 4.2.4 情节架构

**功能：**
- 结构模板
  - 三幕式结构
  - 四幕式结构
  - 五幕结构
  - 自定义结构
- 情节点管理
  - 情节点列表
  - 情节点描述
  - 情节点类型（开端/发展/高潮/转折/结局）
  - 关联章节
- 伏笔追踪
  - 伏笔标记
  - 伏笔回收章节
  - 伏笔状态（埋下/回收/未回收）

**AI辅助功能：**
- 情节冲突分析
- 节奏建议
- 伏笔遗漏提醒
- 情节类型建议

### 4.3 写作中心模块

#### 4.3.1 章节管理

**功能：**
- 树形目录结构
  - 支持多级层次（卷>篇>章>节）
  - 拖拽排序
  - 折叠/展开
- 章节状态管理
  - 草稿 / 修改中 / 完成
  - 章节字数统计
  - 预计/实际阅读时长
- 章节操作
  - 新建章节
  - 批量创建（按模板）
  - 合并/拆分章节
  - 删除章节（保留历史）

#### 4.3.2 写作编辑器

**核心特性：**
- 富文本编辑
  - Markdown语法支持
  - 常用格式工具栏
  - 快捷键支持
- 沉浸式写作体验
  - 专注模式（全屏）
  - 打字机模式（当前行居中）
  - 夜间模式
- 实时辅助
  - 字数统计（当前/章节/项目）
  - 写作时长统计
  - 自动保存（每30秒）
- 侧边栏辅助
  - 人物快速引用
  - 场景快速插入
  - 设定值引用
- 上下文感知
  - 当前章节关联人物/场景高亮
  - 前文摘要快速查看
  - AI写作建议悬浮

#### 4.3.3 章节分析

**功能：**
- 章节概览
  - 字数统计
  - 段落数
  - 对话比例
  - 描写密度
- 内容分析
  - 出场人物识别
  - 涉及场景识别
  - 涉及情节识别
  - 情绪曲线分析
- 写作质量
  - 重复词汇检测
  - 句式复杂度分析
  - 可读性评分

### 4.4 AI助手模块

#### 4.4.1 写作辅助

**续写建议**
- 触发方式：快捷键 / 点击按钮
- 功能：根据当前上下文续写下一段
- 参数控制：字数、风格、方向
- 上下文注入：自动包含前文摘要、相关人物设定

**场景扩写**
- 输入：场景关键词/简短描述
- 输出：详细的场景描写
- 可调节：详细程度、氛围基调

**对话生成**
- 输入：说话人物、场景、目的
- 输出：符合人物性格的对话
- 支持：多轮对话生成

**描写润色**
- 输入：原文段落
- 输出：润色后的版本
- 可选：更文学/更直白/更紧张

#### 4.4.2 一致性检查

**人物一致性检查**
- 检查项：
  - 当前章节的人物行为是否与设定一致
  - 人物说话风格是否统一
  - 人物外貌描述是否前后矛盾
- 报告形式：问题列表 + 对应原文 + 建议修改

**时间线检查**
- 检查项：
  - 事件时间顺序是否合理
  - 季节/天气描述是否合理
  - 年龄计算是否正确
- 可视化：时间线图表

**设定冲突检测**
- 检查项：
  - 当前内容是否与世界观设定矛盾
  - 能力/规则使用是否合理
- 报告形式：冲突点列表 + 设定来源 + 建议

#### 4.4.3 分析工具

**章节分析报告**
- 生成内容：
  - 本章摘要
  - 主要情节点
  - 人物动态变化
  - 伏笔埋设情况
  - 写作建议

**人物出场分析**
- 出场频率统计
- 情感变化追踪
- 人物关系演变

**整体作品分析**
- 结构完整性评估
- 节奏分析
- 伏笔覆盖率
- 重复元素检测

### 4.5 API配置模块

#### 4.5.1 API Key管理

**功能：**
- 添加API Key
  - 支持服务商：OpenAI、Claude (Anthropic)、DeepSeek、本地模型等
  - Key加密存储
  - 标签管理
- Key状态监控
  - 余额查询（API支持时）
  - 错误频率统计
  - 健康检查
- 多Key管理
  - 主Key / 备用Key
  - 按模型分配

#### 4.5.2 模型配置

**配置项：**
- 默认模型选择
- 模型参数配置
  - Temperature
  - Max tokens
  - Top P
- 系统提示词模板
- 上下文长度设置

#### 4.5.3 成本统计

**功能：**
- 实时消费统计
- 按项目分类统计
- 按功能分类统计（写作/检查/分析）
- 消费趋势图表

---

## 5. AI上下文管理机制

### 5.1 上下文构建策略

长篇小说（通常10万字以上）远超单次AI调用的上下文限制，需要精心设计上下文管理机制。

### 5.2 上下文分层

```
┌─────────────────────────────────────┐
│         全局上下文 (Project Level)    │
│  项目简介 + 核心设定 + 主要人物简介     │
├─────────────────────────────────────┤
│       章节上下文 (Chapter Level)       │
│  章节大纲 + 前几章摘要 + 本章前文       │
├─────────────────────────────────────┤
│       实时上下文 (Session Level)       │
│  当前写作位置 + 最近对话历史           │
└─────────────────────────────────────┘
```

### 5.3 上下文注入流程

1. **素材提取**：根据当前写作位置，提取相关人物、场景、设定
2. **摘要生成**：对提取的素材进行压缩摘要
3. **优先级排序**：按相关性排序上下文片段
4. **Token预算分配**：全局/章节/实时按比例分配
5. **注入组装**：拼接成完整提示词

### 5.4 摘要管理

- **章节摘要**：每章完成后自动生成摘要，存储于数据库
- **动态更新**：章节修改后更新相关摘要
- **摘要策略**：
  - 前10章：完整摘要
  - 11-50章：中等压缩摘要
  - 50章以上：高度压缩摘要 + 关键事件列表

---

## 6. API接口设计

### 6.1 REST API结构

```
/api/v1
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /logout
│
├── /projects
│   ├── GET /                    # 获取项目列表
│   ├── POST /                   # 创建项目
│   ├── GET /:id                # 获取项目详情
│   ├── PUT /:id                # 更新项目
│   ├── DELETE /:id             # 删除项目
│   ├── POST /:id/export        # 导出项目
│   └── POST /import            # 导入项目
│
├── /projects/:id
│   ├── /world-settings         # 世界观设定
│   ├── /characters             # 人物管理
│   ├── /scenes                 # 场景管理
│   ├── /plots                  # 情节管理
│   ├── /chapters               # 章节管理
│   └── /materials              # 素材库
│
├── /ai
│   ├── POST /complete          # 续写
│   ├── POST /expand            # 扩写
│   ├── POST /dialogue          # 对话生成
│   ├── POST /polish            # 润色
│   ├── POST /check/consistency # 一致性检查
│   ├── POST /analyze/chapter  # 章节分析
│   └── POST /summarize         # 摘要生成
│
└── /settings
    ├── /api-keys               # API Key管理
    ├── /models                 # 模型配置
    └── /preferences            # 用户偏好
```

### 6.2 主要接口示例

#### 续写接口
```typescript
// POST /api/v1/ai/complete
interface CompleteRequest {
  projectId: string;
  chapterId: string;
  context: {
    precedingText: string;    // 前文（截取最后N字）
    chapterSummary: string;    // 本章摘要
    relatedCharacters: string[]; // 相关人物ID列表
    relatedSettings: string[];   // 相关设定ID列表
  };
  params: {
    maxTokens?: number;
    temperature?: number;
    style?: 'narrative' | 'dialogue' | 'descriptive';
  };
}
```

#### 一致性检查接口
```typescript
// POST /api/v1/ai/check/consistency
interface ConsistencyCheckRequest {
  projectId: string;
  chapterId: string;
  checkTypes: ('character' | 'timeline' | 'setting')[];
}
```

---

## 7. 安全设计

### 7.1 认证授权
- JWT Token认证
- Token刷新机制
- 项目级权限控制（未来多用户协作预留）

### 7.2 API Key安全
- AES-256加密存储
- Key使用记录审计
- 异常调用检测

### 7.3 数据安全
- 敏感数据加密存储
- SQL注入防护
- XSS防护
- CORS配置

---

## 8. 性能优化

### 8.1 前端优化
- 代码分割（路由级）
- 组件懒加载
- 虚拟列表（长章节）
- 编辑器性能优化

### 8.2 后端优化
- 数据库索引优化
- Redis缓存热点数据
- AI调用结果缓存
- 分页与无限滚动

### 8.3 AI调用优化
- 请求去重
- 流式响应（打字机效果）
- 并发限制
- 失败重试机制

---

## 9. 部署方案

### 9.1 基础设施
- 前端：Vercel / Netlify（静态部署）
- 后端：Railway / Render / 独立服务器
- 数据库：Supabase / Neon（PostgreSQL云服务）

### 9.2 环境配置
```
# 前端环境变量
VITE_API_BASE_URL=https://api.novelai.example.com
VITE_APP_NAME=NovelAI

# 后端环境变量
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

---

## 10. 里程碑规划

### Phase 1: 核心框架
- [ ] 项目基础架构搭建
- [ ] 数据库设计与实现
- [ ] 基础用户认证
- [ ] 项目管理CRUD

### Phase 2: 故事圣经
- [ ] 世界观设定模块
- [ ] 人物档案模块
- [ ] 场景档案模块
- [ ] 情节架构模块

### Phase 3: 写作中心
- [ ] 章节管理
- [ ] 富文本编辑器
- [ ] 实时保存
- [ ] 上下文感知

### Phase 4: AI集成
- [ ] API配置管理
- [ ] AI上下文构建
- [ ] 写作辅助功能
- [ ] 一致性检查

### Phase 5: 完善与优化
- [ ] 用户体验优化
- [ ] 性能优化
- [ ] 移动端适配
- [ ] 数据导出完善

---

## 附录

### A. 参考资料
- Novel Crafter - AI fiction writing platform
- 蛙趣拼文 - AI小说写作工具
- 墨狐AI - 小说写作助手
- LangChain.js Documentation
- TipTap Editor Documentation

### B. 术语表
| 术语 | 定义 |
|------|------|
| 故事圣经 | Story Bible，创作素材库，包含世界观、人物、设定等 |
| 上下文管理 | AI调用时管理相关背景信息的技术 |
| Token | AI模型的最小处理单位 |
| 一致性检查 | 自动检测作品中逻辑矛盾的功能 |

---

**文档版本历史**
| 版本 | 日期 | 修改内容 |
|------|------|---------|
| v0.1 | 2026-05-16 | 初始版本 |
