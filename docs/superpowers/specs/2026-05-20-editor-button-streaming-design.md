# 小说编辑器全面升级设计文档

## 概述

本设计文档描述了对Novel AI平台的三项核心改进：
1. 文本编辑器升级：从基础Textarea升级为富文本编辑器
2. 按钮样式统一：确保所有按钮使用统一的Button组件
3. AI生成流式效果：实现逐字输出的流式体验

## 1. 文本编辑器升级

### 1.1 技术选型

**编辑器框架**：TipTap（基于ProseMirror）

选择理由：
- React生态成熟，与现有技术栈完美兼容
- 插件架构，可扩展性强
- 支持富文本和Markdown快捷键
- 社区活跃，文档完善

**核心依赖**：
```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-character-count": "^2.x",
  "@tiptap/extension-highlight": "^2.x",
  "@tiptap/extension-typography": "^2.x"
}
```

### 1.2 功能设计

#### 富文本编辑
- **文本格式**：加粗、斜体、删除线、行内代码
- **块级元素**：标题（H1-H3）、段落、引用、代码块
- **列表**：有序列表、无序列表、任务列表
- **历史**：撤销/重做

#### Markdown快捷键
| 输入 | 转换结果 |
|------|----------|
| `# ` | H1标题 |
| `## ` | H2标题 |
| `### ` | H3标题 |
| `**文本**` | 加粗 |
| `*文本*` | 斜体 |
| `` `代码` `` | 行内代码 |
| `- ` | 无序列表 |
| `1. ` | 有序列表 |
| `> ` | 引用 |
| `---` | 分割线 |

#### 自动保存
- **触发时机**：内容变化后500ms（防抖）
- **视觉反馈**：标题栏显示"已保存"状态和时间
- **手动保存**：Ctrl+S快捷键
- **冲突处理**：保存时检测内容冲突，提示用户

#### 字数统计
- **显示内容**：字数、字符数（不含空格）、段落数
- **位置**：编辑器底部状态栏
- **实时更新**：内容变化时立即更新

#### 快捷键
| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存 |
| Ctrl+Z | 撤销 |
| Ctrl+Y / Ctrl+Shift+Z | 重做 |
| Ctrl+B | 加粗 |
| Ctrl+I | 斜体 |
| Ctrl+Shift+X | 删除线 |

#### 聚焦模式
- **触发方式**：点击聚焦模式按钮或快捷键
- **效果**：隐藏工具栏和侧边栏，只保留编辑区域
- **退出**：按Esc或再次点击聚焦模式按钮

### 1.3 组件设计

#### RichTextEditor组件

```typescript
interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
}
```

#### EditorToolbar组件

```typescript
interface EditorToolbarProps {
  editor: Editor | null
  className?: string
}
```

工具栏按钮分组：
1. **历史**：撤销、重做
2. **文本格式**：加粗、斜体、删除线、行内代码
3. **块级元素**：段落、标题、引用、代码块
4. **列表**：有序列表、无序列表
5. **其他**：聚焦模式

#### WordCount组件

```typescript
interface WordCountProps {
  content: string
  className?: string
}
```

显示格式：`1,234 字 | 5,678 字符 | 42 段`

### 1.4 数据流

```
用户输入 → TipTap Editor → onChange回调 → 父组件状态
                ↓
           自动保存（500ms防抖）
                ↓
           API调用保存
                ↓
           更新保存状态
```

### 1.5 文件结构

```
client/src/components/editor/
├── RichTextEditor.tsx      # 主编辑器组件
├── EditorToolbar.tsx       # 工具栏组件
├── WordCount.tsx           # 字数统计组件
├── editor.css              # 编辑器样式
└── extensions/             # 自定义扩展（如有）
```

---

## 2. 按钮样式统一

### 2.1 现状分析

**问题**：
1. ChapterManagement.tsx第261-278行直接使用`<button>`标签
2. 不同variant的视觉风格差异较大
3. 图标和文字的间距不统一

**目标**：
- 所有按钮使用统一的`<Button>`组件
- 保持视觉一致性
- 规范图标和文字的间距

### 2.2 Button组件规范

#### Variant定义

| Variant | 用途 | 样式 |
|---------|------|------|
| primary | 主要操作（保存、提交） | 渐变背景，白色文字，阴影 |
| secondary | 次要操作（取消、返回） | 灰色背景，深色文字 |
| outline | 边框操作（切换面板） | 透明背景，边框，hover时高亮 |
| ghost | 轻量操作（图标按钮） | 透明背景，hover时显示背景 |
| destructive | 危险操作（删除） | 红色背景，白色文字 |

#### Size定义

| Size | 用途 | 样式 |
|------|------|------|
| sm | 工具栏按钮、紧凑布局 | px-3 py-1.5 text-sm |
| md | 常规按钮 | px-4 py-2 text-base |
| lg | 大按钮、CTA | px-6 py-3 text-lg |

#### 图标规范

- 图标大小：`w-4 h-4`（与文字对齐）
- 图标间距：`mr-2`（图标在左）或`ml-2`（图标在右）
- 图标颜色：继承按钮文字颜色

### 2.3 需要修改的文件

#### ChapterManagement.tsx

**修改位置**：第261-278行

**修改前**：
```tsx
<button
  onClick={(e) => {
    e.stopPropagation()
    openEditModal(chapter)
  }}
  className="p-1 text-gray-400 hover:text-blue-600"
>
  <Edit2 className="w-4 h-4" />
</button>
<button
  onClick={(e) => {
    e.stopPropagation()
    handleDeleteChapter(chapter)
  }}
  className="p-1 text-gray-400 hover:text-red-600"
>
  <Trash2 className="w-4 h-4" />
</button>
```

**修改后**：
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={(e) => {
    e.stopPropagation()
    openEditModal(chapter)
  }}
  className="p-1 text-gray-400 hover:text-blue-600"
>
  <Edit2 className="w-4 h-4" />
</Button>
<Button
  variant="ghost"
  size="sm"
  onClick={(e) => {
    e.stopPropagation()
    handleDeleteChapter(chapter)
  }}
  className="p-1 text-gray-400 hover:text-red-600"
>
  <Trash2 className="w-4 h-4" />
</Button>
```

#### 其他文件检查

需要检查所有页面，确保没有遗漏的`<button>`标签：
- 使用grep搜索`<button`标签
- 逐一评估是否需要改为`<Button>`
- 特别关注：Modal、Dropdown、Tooltip等组件中的按钮

### 2.4 样式微调（可选）

如果需要让不同variant更协调，可以微调Button组件：

```typescript
const variants = {
  primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-md hover:shadow-lg focus:ring-indigo-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
  outline: 'border-2 border-gray-200 bg-transparent text-gray-700 hover:border-indigo-500 hover:text-indigo-600 focus:ring-indigo-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
  destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
}
```

保持现有样式不变，只修复不一致的地方。

---

## 3. AI生成流式效果

### 3.1 技术选型

**流式协议**：SSE（Server-Sent Events）

选择理由：
- 单向通信，适合AI生成场景
- 浏览器原生支持（EventSource API）
- 自动重连，可靠性高
- 无需额外依赖

**备选方案**：WebSocket（如果需要双向通信）

### 3.2 后端设计

#### AIProvider接口扩展

```typescript
export interface AIProvider {
  chat(options: CompletionOptions): Promise<string>
  chatStream(options: CompletionOptions): AsyncGenerator<string>  // 新增
  getProviderName(): string
  setApiKey(apiKey: string): void
  setBaseUrl(baseUrl: string): void
}
```

#### 新端点

**路径**：`POST /ai/text-complete-stream`

**请求体**：与`/ai/text-complete`相同

**响应**：SSE流，格式如下：
```
data: {"token": "你"}
data: {"token": "好"}
data: {"token": "，"}
data: {"token": "世"}
data: {"token": "界"}
data: [DONE]
```

**错误处理**：
```
data: {"error": "API key invalid"}
data: [DONE]
```

#### 各Provider实现

**OpenAI**：
```typescript
async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
  const stream = await this.openai.chat.completions.create({
    model: options.model,
    messages: options.messages,
    stream: true,
  })
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}
```

**Claude**：
```typescript
async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
  const stream = await this.anthropic.messages.create({
    model: options.model,
    messages: options.messages,
    stream: true,
  })
  
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield event.delta.text
    }
  }
}
```

#### Controller实现

```typescript
@Post('text-complete-stream')
async textCompleteStream(@CurrentUser() user: any, @Body() dto: CompleteDto, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  
  try {
    const stream = await this.aiService.textCompleteStream(user.id, dto)
    
    for await (const token of stream) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`)
    }
    
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  }
}
```

### 3.3 前端设计

#### useStreamCompletion Hook

```typescript
interface UseStreamCompletionOptions {
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

interface UseStreamCompletionReturn {
  isStreaming: boolean
  streamedText: string
  error: Error | null
  startStream: (params: StreamParams) => void
  stopStream: () => void
  reset: () => void
}

function useStreamCompletion(options?: UseStreamCompletionOptions): UseStreamCompletionReturn
```

#### 实现逻辑

```typescript
function useStreamCompletion(options?: UseStreamCompletionOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const startStream = async (params: StreamParams) => {
    setIsStreaming(true)
    setStreamedText('')
    setError(null)
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const response = await fetch('/ai/text-complete-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: abortController.signal,
      })
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No reader available')
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              options?.onComplete?.(streamedText)
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.token) {
                setStreamedText(prev => prev + parsed.token)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e)
        options?.onError?.(e)
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }
  
  const stopStream = () => {
    abortControllerRef.current?.abort()
  }
  
  const reset = () => {
    setStreamedText('')
    setError(null)
  }
  
  return { isStreaming, streamedText, error, startStream, stopStream, reset }
}
```

#### 打字机效果

```typescript
function useTypewriter(text: string, speed: number = 30) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  useEffect(() => {
    if (!text) {
      setDisplayText('')
      return
    }
    
    setIsTyping(true)
    let index = 0
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, speed)
    
    return () => clearInterval(timer)
  }, [text, speed])
  
  return { displayText, isTyping }
}
```

#### 光标动画CSS

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  margin-left: 2px;
  animation: blink 0.7s infinite;
  vertical-align: text-bottom;
}
```

### 3.4 UI状态设计

#### 生成中状态

```tsx
<div className="relative">
  <div className="streaming-content">
    {streamedText}
    {isStreaming && <span className="streaming-cursor" />}
  </div>
  
  <Button
    variant="outline"
    size="sm"
    onClick={stopStream}
    disabled={!isStreaming}
  >
    <Square className="w-4 h-4 mr-2" />
    停止生成
  </Button>
</div>
```

#### 生成完成状态

```tsx
<div>
  <div className="content">
    {finalContent}
  </div>
  
  <Button
    variant="outline"
    size="sm"
    onClick={handleAiWrite}
    disabled={isAiWriting || !content.trim()}
  >
    <Sparkles className="w-4 h-4 mr-2" />
    AI 续写
  </Button>
</div>
```

#### 生成错误状态

```tsx
{error && (
  <div className="error-message text-red-600 text-sm mt-2">
    生成失败：{error.message}
  </div>
)}
```

### 3.5 数据流

```
用户点击"AI续写"
        ↓
调用startStream()
        ↓
fetch SSE端点
        ↓
逐个接收token
        ↓
更新streamedText状态
        ↓
UI逐字显示 + 光标动画
        ↓
收到[DONE]信号
        ↓
触发onComplete回调
        ↓
更新最终内容
```

### 3.6 文件结构

```
client/src/
├── hooks/
│   └── useStreamCompletion.ts  # 流式生成hook
├── components/
│   └── StreamingCursor.tsx     # 光标动画组件
└── api/
    └── ai.ts                   # 添加流式API调用

server/src/modules/ai/
├── providers/
│   ├── base.provider.ts        # 添加chatStream接口
│   ├── openai.provider.ts      # 实现流式
│   ├── claude.provider.ts      # 实现流式
│   ├── deepseek.provider.ts    # 实现流式
│   └── mimo.provider.ts        # 实现流式
├── ai.controller.ts            # 添加流式端点
└── ai.service.ts               # 添加流式方法
```

---

## 4. 实施顺序

建议按以下顺序实施：

### 阶段1：按钮样式统一（1-2天）
- 修复ChapterManagement.tsx中的`<button>`标签
- 检查其他页面，确保一致性
- 测试所有按钮功能

### 阶段2：文本编辑器升级（3-5天）
- 安装TipTap依赖
- 创建RichTextEditor组件
- 创建EditorToolbar组件
- 创建WordCount组件
- 替换ChapterEditor中的Textarea
- 实现自动保存
- 测试所有编辑功能

### 阶段3：AI生成流式效果（3-5天）
- 后端：扩展AIProvider接口
- 后端：实现各Provider的chatStream方法
- 后端：添加SSE端点
- 前端：创建useStreamCompletion hook
- 前端：修改ChapterEditor使用流式API
- 前端：添加打字机效果和光标动画
- 测试流式生成功能

**总预计时间**：7-12天

---

## 5. 风险和缓解措施

### 风险1：TipTap集成复杂度
- **风险**：TipTap可能与现有样式或功能冲突
- **缓解**：先在独立分支开发，充分测试后再合并

### 风险2：流式生成稳定性
- **风险**：SSE连接可能不稳定，导致生成中断
- **缓解**：实现自动重连机制，保留已生成的内容

### 风险3：性能影响
- **风险**：富文本编辑器可能影响性能
- **缓解**：使用虚拟滚动（如果内容很长），优化渲染

### 风险4：移动端兼容性
- **风险**：富文本编辑器在移动端可能体验不佳
- **缓解**：移动端回退到Textarea，或优化移动端UI

---

## 6. 测试计划

### 单元测试
- RichTextEditor组件测试
- EditorToolbar组件测试
- useStreamCompletion hook测试
- Button组件测试

### 集成测试
- 编辑器与自动保存的集成
- 流式生成与UI的集成
- 按钮与各功能的集成

### E2E测试
- 完整的写作流程测试
- AI续写流程测试
- 保存和加载流程测试

---

## 7. 未来扩展

### 短期扩展（1-3个月）
- 支持更多Markdown语法
- 添加图片插入功能
- 支持导出为Markdown/Word格式

### 中期扩展（3-6个月）
- 协作编辑（基于Yjs）
- 版本历史
- 评论和批注

### 长期扩展（6个月+）
- AI辅助写作（续写、改写、扩写）
- 智能提示和自动补全
- 多语言支持
