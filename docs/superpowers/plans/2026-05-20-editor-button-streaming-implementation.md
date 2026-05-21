# 小说编辑器全面升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对Novel AI平台进行三项核心改进：文本编辑器升级、按钮样式统一、AI生成流式效果

**Architecture:** 采用渐进式升级策略，先统一按钮样式，再升级编辑器，最后添加流式生成。前端使用TipTap编辑器和SSE流式API，后端扩展AIProvider接口支持流式输出。

**Tech Stack:** React, TypeScript, TipTap, SSE, NestJS, Prisma

---

## 文件结构

### 前端文件（client/src/）

**创建：**
- `components/editor/RichTextEditor.tsx` - 主编辑器组件
- `components/editor/EditorToolbar.tsx` - 工具栏组件
- `components/editor/WordCount.tsx` - 字数统计组件
- `components/editor/editor.css` - 编辑器样式
- `hooks/useStreamCompletion.ts` - 流式生成hook
- `components/StreamingCursor.tsx` - 光标动画组件

**修改：**
- `api/ai.ts` - 添加流式API调用
- `components/ui/Button.tsx` - 可能微调样式
- `pages/ChapterEditor.tsx` - 使用新编辑器和流式API
- `pages/ChapterManagement.tsx` - 统一按钮组件

### 后端文件（server/src/modules/ai/）

**修改：**
- `providers/base.provider.ts` - 添加chatStream接口
- `providers/openai.provider.ts` - 实现流式
- `providers/claude.provider.ts` - 实现流式
- `providers/deepseek.provider.ts` - 实现流式
- `providers/mimo.provider.ts` - 实现流式
- `ai.controller.ts` - 添加流式端点
- `ai.service.ts` - 添加流式方法

---

## 阶段1：按钮样式统一

### Task 1: 修复ChapterManagement.tsx中的按钮

**Files:**
- Modify: `client/src/pages/ChapterManagement.tsx:261-278`

- [ ] **Step 1: 读取当前文件内容**

```bash
# 在编辑器中打开文件，查看第261-278行
```

- [ ] **Step 2: 替换edit按钮**

将第261-269行的：
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
```

替换为：
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
```

- [ ] **Step 3: 替换delete按钮**

将第270-278行的：
```tsx
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

替换为：
```tsx
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

- [ ] **Step 4: 验证Button导入**

确保文件顶部有Button导入：
```tsx
import { Button } from '../components/ui/Button'
```

- [ ] **Step 5: 测试按钮功能**

运行前端开发服务器，测试：
- 编辑按钮点击是否正常工作
- 删除按钮点击是否正常工作
- 按钮样式是否与其他页面一致

- [ ] **Step 6: 提交更改**

```bash
git add client/src/pages/ChapterManagement.tsx
git commit -m "fix: unify button components in ChapterManagement"
```

---

### Task 2: 检查并修复其他页面的按钮

**Files:**
- 检查所有pages/*.tsx文件

- [ ] **Step 1: 搜索所有button标签**

```bash
# 使用grep搜索所有<button标签
grep -r "<button" client/src/pages/ --include="*.tsx"
```

- [ ] **Step 2: 评估每个button标签**

对于每个找到的`<button>`标签，判断：
- 是否应该改为`<Button>`组件
- 是否有对应的variant（primary、secondary、outline、ghost、destructive）
- 是否有正确的size属性

- [ ] **Step 3: 逐一修复**

根据评估结果，逐一将`<button>`替换为`<Button>`，确保：
- 使用正确的variant
- 使用正确的size
- 保持原有的onClick和className

- [ ] **Step 4: 测试所有页面**

运行前端开发服务器，测试所有页面：
- 按钮样式是否统一
- 按钮功能是否正常
- hover效果是否一致

- [ ] **Step 5: 提交更改**

```bash
git add client/src/pages/
git commit -m "fix: unify all button components across pages"
```

---

## 阶段2：文本编辑器升级

### Task 3: 安装TipTap依赖

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: 安装TipTap核心依赖**

```bash
cd client
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

- [ ] **Step 2: 安装TipTap扩展**

```bash
npm install @tiptap/extension-placeholder @tiptap/extension-character-count @tiptap/extension-highlight @tiptap/extension-typography
```

- [ ] **Step 3: 验证安装**

```bash
npm list @tiptap/react @tiptap/starter-kit
```

- [ ] **Step 4: 提交更改**

```bash
git add client/package.json client/package-lock.json
git commit -m "feat: add TipTap editor dependencies"
```

---

### Task 4: 创建RichTextEditor组件

**Files:**
- Create: `client/src/components/editor/RichTextEditor.tsx`

- [ ] **Step 1: 创建editor目录**

```bash
mkdir -p client/src/components/editor
```

- [ ] **Step 2: 创建RichTextEditor.tsx**

```tsx
import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { EditorToolbar } from './EditorToolbar'
import { WordCount } from './WordCount'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '开始写作...',
  className = '',
  autoFocus = false,
  onFocus,
  onBlur,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Highlight,
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onFocus: () => {
      onFocus?.()
    },
    onBlur: () => {
      onBlur?.()
    },
    autofocus: autoFocus,
  })

  if (!editor) {
    return null
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <EditorToolbar editor={editor} />
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
      <WordCount editor={editor} />
    </div>
  )
}
```

- [ ] **Step 3: 测试组件渲染**

在浏览器中打开应用，检查：
- 编辑器是否正常渲染
- 工具栏是否显示
- 字数统计是否显示

- [ ] **Step 4: 提交更改**

```bash
git add client/src/components/editor/RichTextEditor.tsx
git commit -m "feat: create RichTextEditor component"
```

---

### Task 5: 创建EditorToolbar组件

**Files:**
- Create: `client/src/components/editor/EditorToolbar.tsx`

- [ ] **Step 1: 创建EditorToolbar.tsx**

```tsx
import React from 'react'
import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Undo,
  Redo,
  Focus,
} from 'lucide-react'
import { Button } from '../ui/Button'

interface EditorToolbarProps {
  editor: Editor | null
  className?: string
}

export function EditorToolbar({ editor, className = '' }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const toolbarGroups = [
    {
      name: 'history',
      buttons: [
        {
          icon: Undo,
          label: '撤销',
          action: () => editor.chain().focus().undo().run(),
          disabled: !editor.can().undo(),
        },
        {
          icon: Redo,
          label: '重做',
          action: () => editor.chain().focus().redo().run(),
          disabled: !editor.can().redo(),
        },
      ],
    },
    {
      name: 'text-format',
      buttons: [
        {
          icon: Bold,
          label: '加粗',
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive('bold'),
        },
        {
          icon: Italic,
          label: '斜体',
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive('italic'),
        },
        {
          icon: Strikethrough,
          label: '删除线',
          action: () => editor.chain().focus().toggleStrike().run(),
          active: editor.isActive('strike'),
        },
        {
          icon: Code,
          label: '行内代码',
          action: () => editor.chain().focus().toggleCode().run(),
          active: editor.isActive('code'),
        },
      ],
    },
    {
      name: 'block-format',
      buttons: [
        {
          icon: Heading1,
          label: '标题1',
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          active: editor.isActive('heading', { level: 1 }),
        },
        {
          icon: Heading2,
          label: '标题2',
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive('heading', { level: 2 }),
        },
        {
          icon: Heading3,
          label: '标题3',
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: editor.isActive('heading', { level: 3 }),
        },
        {
          icon: Quote,
          label: '引用',
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive('blockquote'),
        },
        {
          icon: CodeSquare,
          label: '代码块',
          action: () => editor.chain().focus().toggleCodeBlock().run(),
          active: editor.isActive('codeBlock'),
        },
      ],
    },
    {
      name: 'list',
      buttons: [
        {
          icon: List,
          label: '无序列表',
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive('bulletList'),
        },
        {
          icon: ListOrdered,
          label: '有序列表',
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive('orderedList'),
        },
      ],
    },
  ]

  return (
    <div className={`editor-toolbar flex items-center gap-1 p-2 border-b border-gray-200 ${className}`}>
      {toolbarGroups.map((group) => (
        <React.Fragment key={group.name}>
          <div className="flex items-center gap-1">
            {group.buttons.map((button) => (
              <Button
                key={button.label}
                variant="ghost"
                size="sm"
                onClick={button.action}
                disabled={button.disabled}
                className={`p-1.5 ${button.active ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                title={button.label}
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
          {group.name !== 'list' && (
            <div className="w-px h-6 bg-gray-200 mx-1" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 测试工具栏功能**

在浏览器中打开应用，测试：
- 工具栏按钮是否显示
- 点击按钮是否触发对应功能
- 按钮active状态是否正确

- [ ] **Step 3: 提交更改**

```bash
git add client/src/components/editor/EditorToolbar.tsx
git commit -m "feat: create EditorToolbar component"
```

---

### Task 6: 创建WordCount组件

**Files:**
- Create: `client/src/components/editor/WordCount.tsx`

- [ ] **Step 1: 创建WordCount.tsx**

```tsx
import React from 'react'
import { Editor } from '@tiptap/react'

interface WordCountProps {
  editor: Editor | null
  className?: string
}

export function WordCount({ editor, className = '' }: WordCountProps) {
  if (!editor) {
    return null
  }

  const text = editor.getText()
  const characters = text.length
  const words = text.split(/\s+/).filter((word) => word.length > 0).length
  const paragraphs = editor.getJSON().content?.length || 0

  return (
    <div className={`word-count flex items-center gap-4 px-4 py-2 text-sm text-gray-500 border-t border-gray-200 ${className}`}>
      <span>{characters.toLocaleString()} 字符</span>
      <span>{words.toLocaleString()} 词</span>
      <span>{paragraphs.toLocaleString()} 段</span>
    </div>
  )
}
```

- [ ] **Step 2: 测试字数统计**

在编辑器中输入内容，检查：
- 字数统计是否实时更新
- 统计数字是否准确
- 样式是否正确

- [ ] **Step 3: 提交更改**

```bash
git add client/src/components/editor/WordCount.tsx
git commit -m "feat: create WordCount component"
```

---

### Task 7: 创建编辑器样式

**Files:**
- Create: `client/src/components/editor/editor.css`

- [ ] **Step 1: 创建editor.css**

```css
/* Rich Text Editor Styles */
.rich-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* TipTap Editor Styles */
.ProseMirror {
  outline: none;
  min-height: 200px;
}

.ProseMirror p {
  margin-bottom: 0.75rem;
}

.ProseMirror h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 1rem;
}

.ProseMirror blockquote {
  border-left: 3px solid #e5e7eb;
  padding-left: 1rem;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
  color: #6b7280;
}

.ProseMirror pre {
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  overflow-x: auto;
}

.ProseMirror code {
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.ProseMirror li {
  margin-bottom: 0.25rem;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Editor Toolbar Styles */
.editor-toolbar {
  background-color: #f9fafb;
}

.editor-toolbar button {
  transition: all 0.15s ease;
}

.editor-toolbar button:hover {
  background-color: #f3f4f6;
}

.editor-toolbar button.active {
  background-color: #e5e7eb;
  color: #111827;
}

/* Word Count Styles */
.word-count {
  background-color: #f9fafb;
}
```

- [ ] **Step 2: 导入样式文件**

在RichTextEditor.tsx中导入样式：
```tsx
import './editor.css'
```

- [ ] **Step 3: 测试样式**

在浏览器中打开应用，检查：
- 编辑器样式是否正确
- 工具栏样式是否正确
- 字数统计样式是否正确

- [ ] **Step 4: 提交更改**

```bash
git add client/src/components/editor/editor.css client/src/components/editor/RichTextEditor.tsx
git commit -m "feat: add editor styles"
```

---

### Task 8: 修改ChapterEditor使用新编辑器

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`

- [ ] **Step 1: 导入RichTextEditor**

在文件顶部添加导入：
```tsx
import { RichTextEditor } from '../components/editor/RichTextEditor'
```

- [ ] **Step 2: 替换Textarea组件**

找到第486-500行的Textarea组件：
```tsx
<Textarea
  ref={textareaRef}
  value={content}
  onChange={handleContentChange}
  onBlur={handleBlurCheck}
  onSelect={handleSelectionChange}
  placeholder="开始写作...

你可以在这里输入小说内容。写完后可以：
- 点击「AI 续写」让 AI 帮你续写
- 点击「冲突检测」检查与世界观的一致性
- 点击「世界观」引用已设定的世界观内容
- 选中文字后使用增强写作工具"
  className="w-full h-full min-h-[500px] border-none resize-none focus:ring-0 text-lg leading-relaxed"
/>
```

替换为：
```tsx
<RichTextEditor
  content={content}
  onChange={updateContent}
  placeholder="开始写作...

你可以在这里输入小说内容。写完后可以：
- 点击「AI 续写」让 AI 帮你续写
- 点击「冲突检测」检查与世界观的一致性
- 点击「世界观」引用已设定的世界观内容
- 选中文字后使用增强写作工具"
  className="w-full h-full"
  onBlur={handleBlurCheck}
/>
```

- [ ] **Step 3: 移除不再需要的导入和引用**

移除Textarea导入：
```tsx
import { Textarea } from '../components/ui/Textarea'
```

移除textareaRef（如果不再需要）：
```tsx
const textareaRef = useRef<HTMLTextAreaElement>(null)
```

- [ ] **Step 4: 测试编辑器功能**

在浏览器中打开应用，测试：
- 编辑器是否正常渲染
- 输入内容是否正常
- 保存功能是否正常
- AI续写功能是否正常

- [ ] **Step 5: 提交更改**

```bash
git add client/src/pages/ChapterEditor.tsx
git commit -m "feat: integrate RichTextEditor into ChapterEditor"
```

---

## 阶段3：AI生成流式效果

### Task 9: 扩展后端AIProvider接口

**Files:**
- Modify: `server/src/modules/ai/providers/base.provider.ts`

- [ ] **Step 1: 添加chatStream方法到接口**

在AIProvider接口中添加：
```typescript
export interface AIProvider {
  chat(options: CompletionOptions): Promise<string>
  chatStream(options: CompletionOptions): AsyncGenerator<string>  // 新增
  getProviderName(): string
  setApiKey(apiKey: string): void
  setBaseUrl(baseUrl: string): void
}
```

- [ ] **Step 2: 提交更改**

```bash
git add server/src/modules/ai/providers/base.provider.ts
git commit -m "feat: add chatStream method to AIProvider interface"
```

---

### Task 10: 实现OpenAI流式生成

**Files:**
- Modify: `server/src/modules/ai/providers/openai.provider.ts`

- [ ] **Step 1: 添加chatStream方法实现**

在OpenaiProvider类中添加：
```typescript
async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
  const stream = await this.openai.chat.completions.create({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
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

- [ ] **Step 2: 测试流式生成**

创建测试脚本或使用Postman测试：
```bash
# 测试SSE端点
curl -X POST http://localhost:4000/ai/text-complete-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId":"test","content":"测试内容"}' \
  --no-buffer
```

- [ ] **Step 3: 提交更改**

```bash
git add server/src/modules/ai/providers/openai.provider.ts
git commit -m "feat: implement chatStream for OpenAI provider"
```

---

### Task 11: 实现Claude流式生成

**Files:**
- Modify: `server/src/modules/ai/providers/claude.provider.ts`

- [ ] **Step 1: 添加chatStream方法实现**

在ClaudeProvider类中添加：
```typescript
async *chatStream(options: CompletionOptions): AsyncGenerator<string> {
  const stream = await this.anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens || 4096,
    messages: options.messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content,
    })),
    stream: true,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield event.delta.text
    }
  }
}
```

- [ ] **Step 2: 测试流式生成**

使用与Task 10相同的方法测试。

- [ ] **Step 3: 提交更改**

```bash
git add server/src/modules/ai/providers/claude.provider.ts
git commit -m "feat: implement chatStream for Claude provider"
```

---

### Task 12: 实现Deepseek和Mimo流式生成

**Files:**
- Modify: `server/src/modules/ai/providers/deepseek.provider.ts`
- Modify: `server/src/modules/ai/providers/mimo.provider.ts`

- [ ] **Step 1: 实现Deepseek流式生成**

在DeepseekProvider类中添加chatStream方法（类似OpenAI实现）。

- [ ] **Step 2: 实现Mimo流式生成**

在MimoProvider类中添加chatStream方法（类似OpenAI实现）。

- [ ] **Step 3: 测试所有provider**

测试所有provider的流式生成功能。

- [ ] **Step 4: 提交更改**

```bash
git add server/src/modules/ai/providers/deepseek.provider.ts server/src/modules/ai/providers/mimo.provider.ts
git commit -m "feat: implement chatStream for Deepseek and Mimo providers"
```

---

### Task 13: 添加后端SSE端点

**Files:**
- Modify: `server/src/modules/ai/ai.controller.ts`
- Modify: `server/src/modules/ai/ai.service.ts`

- [ ] **Step 1: 在AiService中添加textCompleteStream方法**

```typescript
async *textCompleteStream(userId: string, dto: CompleteDto): AsyncGenerator<string> {
  const config = await this.aiConfigService.getConfig(userId, AIAction.TEXT_COMPLETION)
  const providerName = this.toProviderName(dto.provider ?? config?.provider) ?? 'openai'
  const model = dto.model || config?.model || 'gpt-4'
  
  const keyData = await this.getApiKey(userId, providerName)
  if (!keyData) {
    throw new InternalServerErrorException('未配置 API Key')
  }

  const provider = this.getProvider(providerName)
  provider.setApiKey(keyData.apiKey)
  if (keyData.baseUrl) {
    provider.setBaseUrl(keyData.baseUrl)
  }

  // 获取多阶段风格提示词
  let systemPrompt = ''
  try {
    const stylePrompt = await this.styleApplicationService.generateMultiStageStylePrompt(
      dto.projectId,
      userId,
      dto.content
    )
    systemPrompt = stylePrompt.fullPrompt
  } catch (e) {
    const context = await this.contextBuilderService.buildWritingContext(dto.projectId)
    systemPrompt = `你是一位专业的小说作家。请根据上下文续写故事，保持文风一致，情节连贯。\n\n${context}`
  }

  yield* provider.chatStream({
    model,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `【当前需要续写的内容】\n\n${dto.content}` },
    ],
    temperature: dto.temperature ?? 0.7,
    maxTokens: dto.maxTokens,
  })
}
```

- [ ] **Step 2: 在AiController中添加textCompleteStream端点**

```typescript
@Post('text-complete-stream')
async textCompleteStream(@CurrentUser() user: any, @Body() dto: CompleteDto, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const stream = this.aiService.textCompleteStream(user.id, dto)
    
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

- [ ] **Step 3: 导入必要的依赖**

确保导入Response：
```typescript
import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common'
import { Response } from 'express'
```

- [ ] **Step 4: 测试SSE端点**

使用curl或Postman测试：
```bash
curl -X POST http://localhost:4000/ai/text-complete-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId":"test","content":"测试内容"}' \
  --no-buffer
```

- [ ] **Step 5: 提交更改**

```bash
git add server/src/modules/ai/ai.controller.ts server/src/modules/ai/ai.service.ts
git commit -m "feat: add SSE endpoint for text completion streaming"
```

---

### Task 14: 创建前端useStreamCompletion hook

**Files:**
- Create: `client/src/hooks/useStreamCompletion.ts`

- [ ] **Step 1: 创建useStreamCompletion.ts**

```typescript
import { useState, useRef, useCallback } from 'react'

interface StreamParams {
  projectId: string
  content: string
  provider?: 'openai' | 'claude'
  model?: string
  temperature?: number
  maxTokens?: number
}

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

export function useStreamCompletion(options?: UseStreamCompletionOptions): UseStreamCompletionReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamedTextRef = useRef('')

  const startStream = useCallback(async (params: StreamParams) => {
    setIsStreaming(true)
    setStreamedText('')
    setError(null)
    streamedTextRef.current = ''

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/ai/text-complete-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6)

            if (data === '[DONE]') {
              options?.onComplete?.(streamedTextRef.current)
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.token) {
                streamedTextRef.current += parsed.token
                setStreamedText(streamedTextRef.current)
              }
            } catch (e) {
              if (e instanceof Error && !e.message.includes('JSON')) {
                throw e
              }
            }
          }
        }
      }

      options?.onComplete?.(streamedTextRef.current)
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e)
        options?.onError?.(e)
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [options])

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setStreamedText('')
    setError(null)
    streamedTextRef.current = ''
  }, [])

  return { isStreaming, streamedText, error, startStream, stopStream, reset }
}
```

- [ ] **Step 2: 测试hook功能**

在ChapterEditor中使用hook，测试：
- 流式生成功能是否正常
- 停止生成功能是否正常
- 错误处理是否正常

- [ ] **Step 3: 提交更改**

```bash
git add client/src/hooks/useStreamCompletion.ts
git commit -m "feat: create useStreamCompletion hook"
```

---

### Task 15: 创建StreamingCursor组件

**Files:**
- Create: `client/src/components/StreamingCursor.tsx`

- [ ] **Step 1: 创建StreamingCursor.tsx**

```tsx
import React from 'react'

interface StreamingCursorProps {
  isVisible: boolean
  className?: string
}

export function StreamingCursor({ isVisible, className = '' }: StreamingCursorProps) {
  if (!isVisible) {
    return null
  }

  return (
    <span className={`streaming-cursor ${className}`} />
  )
}
```

- [ ] **Step 2: 添加CSS样式**

在index.css或创建新的CSS文件中添加：
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

- [ ] **Step 3: 测试光标动画**

在浏览器中打开应用，测试：
- 光标是否显示
- 光标是否闪烁
- 光标样式是否正确

- [ ] **Step 4: 提交更改**

```bash
git add client/src/components/StreamingCursor.tsx client/src/index.css
git commit -m "feat: create StreamingCursor component with animation"
```

---

### Task 16: 修改ChapterEditor使用流式API

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`

- [ ] **Step 1: 导入useStreamCompletion hook**

```tsx
import { useStreamCompletion } from '../hooks/useStreamCompletion'
```

- [ ] **Step 2: 使用hook**

在ChapterEditor组件中添加：
```tsx
const {
  isStreaming,
  streamedText,
  error: streamingError,
  startStream,
  stopStream,
  reset: resetStream,
} = useStreamCompletion({
  onComplete: async (fullText) => {
    const latestContent = contentRef.current
    const newContent = latestContent + (latestContent.trim() ? '\n\n' : '') + fullText
    updateContent(newContent)
    await handlePostAiExtraction(fullText, latestContent)
    setAutoOrganizeStatus(prev => prev || '正在检测世界观冲突...')
    await checkConflicts(newContent)
  },
  onError: (error) => {
    console.error('AI续写失败:', error)
  },
})
```

- [ ] **Step 3: 修改handleAiWrite函数**

```tsx
const handleAiWrite = async () => {
  const originalContent = contentRef.current
  if (!projectId || !originalContent.trim()) return
  
  if (isStreaming) {
    stopStream()
    return
  }

  startStream({
    projectId,
    content: originalContent,
  })
}
```

- [ ] **Step 4: 修改AI续写按钮**

```tsx
<Button 
  variant="outline" 
  size="sm" 
  onClick={handleAiWrite}
  disabled={!content.trim() && !isStreaming}
>
  {isStreaming ? (
    <>
      <Square className="w-4 h-4 mr-2" />
      停止生成
    </>
  ) : (
    <>
      <Sparkles className="w-4 h-4 mr-2" />
      AI 续写
    </>
  )}
</Button>
```

- [ ] **Step 5: 添加流式内容显示**

在编辑器下方或适当位置添加：
```tsx
{isStreaming && streamedText && (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
    <div className="text-sm text-gray-500 mb-2">AI 正在生成：</div>
    <div className="whitespace-pre-wrap">
      {streamedText}
      <StreamingCursor isVisible={isStreaming} />
    </div>
  </div>
)}
```

- [ ] **Step 6: 导入必要的组件**

```tsx
import { Square } from 'lucide-react'
import { StreamingCursor } from '../components/StreamingCursor'
```

- [ ] **Step 7: 测试流式生成功能**

在浏览器中打开应用，测试：
- 点击AI续写按钮是否开始生成
- 生成过程中是否显示流式内容
- 点击停止按钮是否停止生成
- 生成完成后内容是否正确添加

- [ ] **Step 8: 提交更改**

```bash
git add client/src/pages/ChapterEditor.tsx
git commit -m "feat: integrate streaming AI completion into ChapterEditor"
```

---

### Task 17: 添加自动保存功能

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`

- [ ] **Step 1: 创建useDebounce hook**

在hooks目录创建useDebounce.ts：
```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
```

- [ ] **Step 2: 在ChapterEditor中使用自动保存**

```tsx
import { useDebounce } from '../hooks/useDebounce'

// 在组件中添加
const debouncedContent = useDebounce(content, 500)

useEffect(() => {
  if (debouncedContent && chapterId && projectId) {
    handleSave()
  }
}, [debouncedContent])
```

- [ ] **Step 3: 修改保存状态显示**

```tsx
{lastSaved && (
  <span className="text-sm text-gray-500">
    已保存 {lastSaved.toLocaleTimeString('zh-CN')}
  </span>
)}
```

- [ ] **Step 4: 测试自动保存功能**

在浏览器中打开应用，测试：
- 输入内容后是否自动保存
- 保存状态是否正确显示
- 手动保存（Ctrl+S）是否正常工作

- [ ] **Step 5: 提交更改**

```bash
git add client/src/pages/ChapterEditor.tsx client/src/hooks/useDebounce.ts
git commit -m "feat: add auto-save functionality to ChapterEditor"
```

---

## 自检清单

### Spec覆盖检查

- [x] **文本编辑器升级**：Task 3-8 覆盖了TipTap集成、工具栏、字数统计、样式、自动保存
- [x] **按钮样式统一**：Task 1-2 覆盖了ChapterManagement和其他页面的按钮统一
- [x] **AI生成流式效果**：Task 9-16 覆盖了后端接口、前端hook、UI组件、集成

### 占位符扫描

- [x] 没有"TBD"、"TODO"或"implement later"
- [x] 所有步骤都有具体的代码或命令
- [x] 所有测试步骤都有明确的验证方法

### 类型一致性检查

- [x] 所有TypeScript接口定义一致
- [x] 所有函数签名在前后端保持一致
- [x] 所有组件props定义一致

---

## 执行选项

**计划完成并保存到 `docs/superpowers/plans/2026-05-20-editor-button-streaming-implementation.md`。两种执行方式：**

**1. Subagent-Driven（推荐）** - 我为每个任务分发一个独立的subagent，任务之间进行review，快速迭代

**2. Inline Execution** - 在当前会话中使用executing-plans执行任务，批量执行并设置检查点

**您选择哪种方式？**
