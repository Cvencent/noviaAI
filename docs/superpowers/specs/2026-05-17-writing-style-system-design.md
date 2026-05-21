# 写作风格系统 - 技术设计文档

**项目名称：** 写作风格系统（Writing Style System）
**版本：** v1.0
**日期：** 2026-05-17
**状态：** 待批准

---

## 1. 项目概述

### 1.1 项目背景

在AI辅助小说创作中，风格一致性和个性化是关键挑战。用户不仅仅需要AI续写内容，更希望AI能够模仿特定作家的写作风格，或者创造出独特的个人风格。

本系统旨在构建一个专业级的写作风格管理平台，提供风格预设、风格学习、风格微调、多风格融合、实时预览和深度分析等6大核心功能。

### 1.2 核心功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| A) 丰富预设库 | 新增20+中外知名作家风格 | P0 |
| B) 风格学习 | AI自动分析用户上传的文本，生成风格配置 | P0 |
| C) 风格微调 | 基础维度参数可调（对话比例、节奏、词汇、描述） | P0 |
| D) 多风格融合 | 智能融合2-3个风格，分析兼容性 | P0 |
| E) 实时预览 | 快速切换预览不同风格的重写效果 | P0 |
| F) 深度分析 | 文学史视角的风格分析与对比 | P0 |

---

## 2. 技术架构

### 2.1 模块结构

```
┌─────────────────────────────────────────────────────────────┐
│                   前端层 (React + TypeScript)               │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ WritingStyleSystem (主组件)                          │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ StylePresetBrowser    │ 风格预设浏览                  │  │
│  │ StyleLearner          │ 风格学习（AI分析+调整+确认）  │  │
│  │ StyleTuner            │ 风格微调（滑动条）            │  │
│  │ StyleFusion           │ 多风格智能融合                │  │
│  │ StylePreview          │ 快速切换预览                  │  │
│  │ StyleDeepAnalysis     │ 深度分析（文学史视角）        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                    REST API
                           │
┌─────────────────────────────────────────────────────────────┐
│                  后端层 (NestJS + Prisma)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ writing-styles 模块                                  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ analyze-text         │ 文本风格分析                    │  │
│  │ generate-prompt      │ 生成AI提示词                   │  │
│  │ fuse-styles          │ 风格融合                        │  │
│  │ rewrite-with-style   │ 风格重写预览                    │  │
│  │ deep-analyze         │ 深度风格分析                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                    SQLite (Prisma)
```

### 2.2 技术栈复用

| 技术 | 来源 | 说明 |
|------|------|------|
| React 18 + TypeScript | 现有 | 前端框架 |
| Tailwind CSS | 现有 | UI组件 |
| Zustand | 现有 | 状态管理 |
| React Query | 现有 | 服务端状态 |
| NestJS | 现有 | 后端框架 |
| Prisma | 现有 | ORM |
| SQLite | 现有 | 数据库 |
| AI Provider | 现有 | OpenAI/Claude/DeepSeek |

---

## 3. 数据模型设计

### 3.1 Prisma Schema 扩展

需要在 [schema.prisma](file:///f:/code/server/prisma/schema.prisma) 中新增以下表：

```prisma
model CustomWritingStyle {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  icon        String?

  // 风格配置（JSON格式，与WritingStylePreset类型一致）
  config      Json

  // 来源信息
  sourceType  StyleSourceType // PRESET | LEARNED | FUSED | TUNED
  sourceData  Json?           // 来源详情

  // 元数据
  isPublic    Boolean  @default(false)
  useCount    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关系
  user        User     @relation(fields: [userId], references: [id])
  history     WritingStyleHistory[]
}

enum StyleSourceType {
  PRESET
  LEARNED
  FUSED
  TUNED
}

model WritingStyleFusion {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?

  // 融合的风格
  styles      Json     // { styleId: string, weight: number }[]

  // 融合结果
  resultConfig Json

  // AI分析记录
  compatibilityAnalysis Json?

  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model WritingStyleHistory {
  id          String   @id @default(cuid())
  userId      String
  projectId   String?
  styleId     String?
  action      StyleActionType // SELECT | FUSE | LEARN | TUNE | PREVIEW
  details     Json?

  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  project     Project? @relation(fields: [projectId], references: [id])
  style       CustomWritingStyle? @relation(fields: [styleId], references: [id])
}

enum StyleActionType {
  SELECT
  FUSE
  LEARN
  TUNE
  PREVIEW
}
```

### 3.2 WritingStylePreset 类型增强

[writing-styles.ts](file:///f:/code/client/src/types/writing-styles.ts) 已有的类型已很完善，只需微调：

```typescript
// 新增：深度分析字段
interface WritingStylePreset {
  // ... 现有字段

  // 深度分析（由AI动态生成）
  deepAnalysis?: {
    literaryHistory: {
      period: string;           // 文学时期
      school: string;           // 文学流派
      position: string;         // 文学史地位
      influences: string[];     // 受谁影响
      influenced: string[];     // 影响了谁
    };
    comparativeAnalysis: {
      [styleId: string]: {
        similarity: number;     // 相似度 0-1
        similarities: string[]; // 相似点
        differences: string[];  // 差异点
      };
    };
  };
}
```

---

## 4. 功能模块详细设计

### 4.1 A) 丰富预设库

#### 4.1.1 新增风格列表

| 分类 | 作家/风格 |
|------|----------|
| **中文经典** | 金庸、古龙、鲁迅、张爱玲、钱钟书、王小波 |
| **科幻作家** | 刘慈欣、阿西莫夫、菲利普·K·迪克、郝景芳 |
| **悬疑推理** | 东野圭吾、阿加莎·克里斯蒂、柯南·道尔、紫金陈 |
| **文艺抒情** | 村上春树、余华、汪曾祺、沈从文、川端康成 |
| **其他补充** | 托尔金（史诗奇幻）、J.K.罗琳（儿童奇幻）、雷·布拉德伯里（诗意科幻） |

#### 4.1.2 数据结构

每个风格需要完整填写所有字段，确保质量：
- 详细的标志性特征
- 3段代表性例文
- 具体的修辞偏好
- 明确的节奏模式

---

### 4.2 B) 风格学习功能（三者结合）

#### 4.2.1 工作流程

```
用户上传文本
    ↓
[步骤1] AI全自动分析
    - 提取核心风格特征
    - 生成初步配置
    - 显示分析结果
    ↓
[步骤2] 可视化调整
    - 4个滑动条微调
    - 实时预览提示词
    ↓
[步骤3] 引导式确认
    - 3-5个问题问卷
    - 确认风格定位
    ↓
[步骤4] 保存风格
    - 命名 + 描述
    - 保存到个人库
```

#### 4.2.2 引导式问卷设计

示例问题：
1. "这段文字的节奏是：慢节奏细腻 / 中等节奏 / 快节奏紧凑"
2. "这段文字更偏向：对话驱动 / 描写驱动 / 两者平衡"
3. "这段文字的词汇风格：简单直白 / 中等难度 / 华丽复杂"
4. "这段文字的描写方式：极简留白 / 视觉画面 / 多感官丰富"

#### 4.2.3 后端接口

```typescript
// POST /api/v1/writing-styles/analyze
interface AnalyzeTextRequest {
  text: string;
}

interface AnalyzeTextResponse {
  preliminaryConfig: WritingStylePreset;
  analysisNotes: string[]; // AI的分析说明
  suggestedQuestions: string[]; // 建议确认的问题
}
```

---

### 4.3 C) 风格微调系统（基础维度）

#### 4.3.1 4个核心滑动条

| 参数 | 范围 | 说明 |
|------|------|------|
| 对话比例 | 0% - 100% | 对话与叙述的比例 |
| 节奏快慢 | 0 - 100 | 0=极慢，100=极快 |
| 词汇难度 | 0 - 100 | 0=极简，100=极复杂 |
| 描述详细度 | 0 - 100 | 0=极简洁，100=极丰富 |

#### 4.3.2 交互设计

- 每个滑动条配有即时反馈（如节奏滑动时显示示例短句）
- 实时更新右侧的AI提示词预览
- 提供"重置为预设"按钮
- 提供"另存为新风格"按钮

---

### 4.4 D) 多风格融合（智能融合）

#### 4.4.1 工作流程

```
选择2-3个风格
    ↓
AI分析兼容性
    - 检测冲突点
    - 提供融合建议
    - 生成融合配置
    ↓
用户确认/调整
    - 可以微调融合权重
    - 可以调整融合策略
    ↓
保存融合结果
    - 命名新风格
    - 保存到个人库
```

#### 4.4.2 兼容性分析示例

```
融合：海明威 + 马尔克斯

⚠️ 检测到潜在冲突：
- 海明威：极简、克制、冰山理论
- 马尔克斯：华丽、魔幻、细节丰富

💡 融合建议：
- 叙事视角：第三人称限知（海明威）为主，偶尔切换到全知（马尔克斯）
- 描写方式：视觉画面（海明威）+ 魔幻意象点缀（马尔克斯）
- 节奏：中等节奏，张弛有度
```

#### 4.4.3 后端接口

```typescript
// POST /api/v1/writing-styles/fuse
interface FuseStylesRequest {
  styles: { id: string; weight: number }[];
}

interface FuseStylesResponse {
  fusedConfig: WritingStylePreset;
  compatibilityAnalysis: {
    conflicts: string[];
    suggestions: string[];
    fusionStrategy: string;
  };
}
```

---

### 4.5 E) 实时预览（快速切换）

#### 4.5.1 界面设计

```
┌─────────────────────────────────────────────┐
│  输入要重写的文本：                          │
│  ┌─────────────────────────────────────┐  │
│  │ 这里是用户输入的原文...              │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  选择要预览的风格：                          │
│  [海明威] [马尔克斯] [金庸] [刘慈欣] ...     │
│                                             │
│  [生成预览]                                 │
│                                             │
└─────────────────────────────────────────────┘
       ↓（生成后）
┌─────────────────────────────────────────────┐
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 海明威  │ │ 马尔克斯│ │ 金庸    │ ...  │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ （海明威风格的重写结果）             │  │
│  │ 老人放下钓索，慢慢坐下...           │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  [应用此风格]                              │
└─────────────────────────────────────────────┘
```

#### 4.5.2 后端接口

```typescript
// POST /api/v1/writing-styles/rewrite
interface RewriteWithStyleRequest {
  text: string;
  styleIds: string[];
}

interface RewriteWithStyleResponse {
  [styleId: string]: string;
}
```

---

### 4.6 F) 深度分析（文学史视角）

#### 4.6.1 分析内容结构

```
┌─────────────────────────────────────────────┐
│  马尔克斯风格深度分析                       │
├─────────────────────────────────────────────┤
│  📚 文学史定位                              │
│  - 时期：魔幻现实主义鼎盛期（1960-1980）    │
│  - 流派：魔幻现实主义、拉美文学爆炸        │
│  - 地位：诺贝尔文学奖得主，拉美文学代表     │
│  - 影响：受福克纳、卡夫卡影响               │
│  - 影响了：莫言、伊莎贝尔·阿连德等          │
│                                             │
│  🎯 标志性特征                              │
│  - 时间循环叙事                             │
│  - 魔幻元素自然融入现实                     │
│  - 家族史诗结构                             │
│                                             │
│  🔍 对比分析（与其他风格）                   │
│  ┌─────────────────────────────────────┐   │
│  │ 海明威 vs 马尔克斯                   │   │
│  │ 相似度：35%                          │   │
│  │ 相似点：都关注人物命运                │   │
│  │ 差异点：简洁 vs 华丽，克制 vs 张扬   │   │
│  └─────────────────────────────────────┘   │
│  [查看更多对比...]                         │
└─────────────────────────────────────────────┘
```

#### 4.6.2 后端接口

```typescript
// POST /api/v1/writing-styles/deep-analyze
interface DeepAnalyzeStyleRequest {
  styleId: string;
  compareWith?: string[]; // 可选，要对比的风格ID
}

interface DeepAnalyzeStyleResponse {
  literaryHistory: {
    period: string;
    school: string;
    position: string;
    influences: string[];
    influenced: string[];
  };
  comparativeAnalysis?: {
    [styleId: string]: {
      similarity: number;
      similarities: string[];
      differences: string[];
    };
  };
}
```

---

## 5. API接口设计

### 5.1 完整API结构

```
/api/v1/writing-styles
├── GET  /presets                    # 获取所有预设风格
├── GET  /presets/:id                # 获取单个预设
├── POST /analyze                    # 分析文本，生成风格
├── POST /fuse                       # 融合多个风格
├── POST /rewrite                    # 风格重写预览
├── POST /deep-analyze               # 深度风格分析
├── GET  /custom                     # 获取用户自定义风格
├── POST /custom                     # 保存自定义风格
├── PUT  /custom/:id                 # 更新自定义风格
├── DELETE /custom/:id               # 删除自定义风格
└── GET  /history                    # 获取风格使用历史
```

### 5.2 核心接口详解

#### 5.2.1 分析文本接口
```typescript
// POST /api/v1/writing-styles/analyze
interface AnalyzeTextRequest {
  text: string;
}

interface AnalyzeTextResponse {
  preliminaryConfig: WritingStylePreset;
  analysisNotes: string[];
  suggestedQuestions: string[];
}
```

#### 5.2.2 风格融合接口
```typescript
// POST /api/v1/writing-styles/fuse
interface FuseStylesRequest {
  styles: { id: string; weight: number }[];
}

interface FuseStylesResponse {
  fusedConfig: WritingStylePreset;
  compatibilityAnalysis: {
    conflicts: string[];
    suggestions: string[];
    fusionStrategy: string;
  };
}
```

#### 5.2.3 风格重写接口
```typescript
// POST /api/v1/writing-styles/rewrite
interface RewriteWithStyleRequest {
  text: string;
  styleIds: string[];
}

interface RewriteWithStyleResponse {
  [styleId: string]: string;
}
```

#### 5.2.4 深度分析接口
```typescript
// POST /api/v1/writing-styles/deep-analyze
interface DeepAnalyzeStyleRequest {
  styleId: string;
  compareWith?: string[];
}

interface DeepAnalyzeStyleResponse {
  literaryHistory: {
    period: string;
    school: string;
    position: string;
    influences: string[];
    influenced: string[];
  };
  comparativeAnalysis?: {
    [styleId: string]: {
      similarity: number;
      similarities: string[];
      differences: string[];
    };
  };
}
```

---

## 6. 实现计划

### Phase 1: 第一阶段（核心功能）
- [ ] 扩展预设库（新增20+风格）
- [ ] 风格微调系统（4个滑动条）
- [ ] 实时预览功能（快速切换）
- [ ] 数据库迁移（新增表）
- [ ] 后端基础API（预设、重写）

### Phase 2: 第二阶段（高级功能）
- [ ] 风格学习功能（三者结合）
- [ ] 多风格智能融合
- [ ] 深度分析功能
- [ ] 自定义风格管理
- [ ] 历史记录追踪

---

## 7. 与现有系统集成

### 7.1 与写作编辑器集成

在 [ChapterEditor](file:///f:/code/client/src/pages/ChapterEditor.tsx) 中：
- 增加"写作风格"按钮，打开风格选择器
- 选择的风格自动应用到AI续写提示词中
- 在编辑器侧边栏显示当前风格信息

### 7.2 与AI服务集成

在 [ai.service.ts](file:///f:/code/server/src/modules/ai/ai.service.ts) 中：
- 扩展 `generateStylePrompt` 函数
- 新增风格分析、融合、重写方法
- 复用现有的AI Provider（OpenAI/Claude/DeepSeek）

---

## 附录

### A. 参考资料
- [Writing Style Transfer with LLMs](https://arxiv.org/...)
- [Literary Style Analysis](https://...)
- [现有的写作风格系统](https://...)

### B. 术语表
| 术语 | 定义 |
|------|------|
| 风格预设 | 预置的知名作家写作风格配置 |
| 风格学习 | AI分析用户文本，提取风格特征 |
| 风格融合 | 混合多个风格，创造新风格 |
| 冰山理论 | 海明威的写作理论，只露出水面1/8 |

---

**文档版本历史**
| 版本 | 日期 | 修改内容 |
|------|------|---------|
| v0.1 | 2026-05-17 | 初始版本，完整设计方案 |
