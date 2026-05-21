# AI Writing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the P0/P1 foundation from `docs/superpowers/specs/2026-05-21-ai-writing-context-and-roadmap-design.md`: wire existing modules, fix auth gaps, expose AI context, integrate Lorebook/style/voice/anti-AI rules, and add editor-facing context visibility.

**Architecture:** Implement this as a foundation slice, not the entire roadmap. Server work centers on activating existing Nest modules, extending `ContextBuilderService` into a richer context engine, and exposing a read-only context preview endpoint. Client work centers on Project Settings persistence and a Chapter Editor Context Viewer panel that consumes the new endpoint. Existing Diff/Enhanced Writing components are reused; deep multi-variant editing remains a later task after context preview is stable.

**Tech Stack:** NestJS 10, Prisma, Jest/ts-jest, React 18, Vite, TypeScript, Axios, TipTap, Tailwind CSS.

---

## Scope Boundaries

### In Scope

- Register existing backend modules needed by P0/P1.
- Replace hardcoded `temp-user` in enhanced-writing endpoints with authenticated user IDs.
- Add focused server unit tests for the changed backend behavior.
- Extend AI context assembly with Lorebook, outlines, turning points, timeline, writing style config, character voice, and anti-AI rules.
- Add a read-only context preview API used by the editor UI.
- Persist project writing style selection from Project Settings.
- Add an editor-side Context Viewer panel.
- Keep all changes small and reversible.

### Out of Scope

- Full intelligent outline generation.
- Roleplay simulation.
- Emotional curve analytics.
- EPUB/PDF/DOCX export.
- New database migrations unless an existing model cannot support the foundation behavior.
- Installing client test infrastructure unless explicitly approved later.

---

## File Structure

### Server Files

- Modify: `server/src/app.module.ts` — register missing modules.
- Modify: `server/src/modules/writing-styles/enhanced-writing.controller.ts` — use `@CurrentUser()`.
- Modify: `server/src/modules/writing-styles/enhanced-writing.service.ts` — preserve existing API, accept real user ID.
- Modify: `server/src/modules/ai/context-builder.service.ts` — add structured context sections and context preview data.
- Modify: `server/src/modules/ai/ai.service.ts` — use enriched context output consistently.
- Modify: `server/src/modules/ai/ai.controller.ts` — add `GET /ai/context-preview/:projectId`.
- Create: `server/src/modules/ai/dto/context-preview.dto.ts` — query DTO for chapter/current text preview.
- Create: `server/src/modules/ai/context-builder.service.spec.ts` — tests for enriched context assembly.
- Create: `server/src/modules/writing-styles/enhanced-writing.controller.spec.ts` — tests for authenticated user routing.
- Create: `server/src/modules/ai/ai.controller.spec.ts` — tests for context preview endpoint delegation.

### Client Files

- Modify: `client/src/api/ai.ts` — add context preview API function and types.
- Modify: `client/src/api/writing-styles.ts` — confirm project style config methods are exported and typed.
- Modify: `client/src/pages/ProjectSettings.tsx` — replace local-only style selection with persisted project style selector.
- Modify: `client/src/pages/ChapterEditor.tsx` — add Context Viewer panel and fetch preview.
- Create: `client/src/components/ContextViewer.tsx` — display AI-visible context sections.
- Create: `client/src/types/ai-context.ts` — shared client-side context preview types.

---

## Task 1: Register Foundation Modules

**Files:**
- Modify: `server/src/app.module.ts`
- Verify: `server/src/modules/writing-styles/writing-styles.module.ts`
- Verify: `server/src/modules/plots/plots.module.ts`
- Verify: `server/src/modules/scenes/scenes.module.ts`
- Verify: `server/src/modules/consistency/consistency.module.ts`

- [ ] **Step 1: Inspect current AppModule imports**

Confirm `server/src/app.module.ts` currently imports `ScenesModule` but does not include it in `@Module({ imports: [...] })`, and does not import `WritingStylesModule`, `PlotsModule`, or `ConsistencyModule`.

- [ ] **Step 2: Add missing imports**

Modify the top of `server/src/app.module.ts` to include:

```ts
import { PlotsModule } from './modules/plots/plots.module'
import { WritingStylesModule } from './modules/writing-styles/writing-styles.module'
import { ConsistencyModule } from './modules/consistency/consistency.module'
```

- [ ] **Step 3: Register modules in the imports array**

Add these existing modules to `@Module({ imports: [...] })` after nearby feature modules:

```ts
    ScenesModule,
    PlotsModule,
    WritingStylesModule,
    ConsistencyModule,
```

The final imports array must contain `ScenesModule`, `PlotsModule`, `WritingStylesModule`, and `ConsistencyModule` exactly once.

- [ ] **Step 4: Build server**

Run:

```powershell
npm run build
```

from `server/`.

Expected: build succeeds, or any failure is unrelated missing dependency already present before this task. If dependency injection fails because of circular module imports, fix by checking existing providers and exports before proceeding.

---

## Task 2: Fix Enhanced Writing Auth User Routing

**Files:**
- Modify: `server/src/modules/writing-styles/enhanced-writing.controller.ts`
- Create: `server/src/modules/writing-styles/enhanced-writing.controller.spec.ts`

- [ ] **Step 1: Write controller unit test**

Create `server/src/modules/writing-styles/enhanced-writing.controller.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing'
import { EnhancedWritingController } from './enhanced-writing.controller'
import { EnhancedWritingService } from './enhanced-writing.service'

describe('EnhancedWritingController', () => {
  let controller: EnhancedWritingController
  const service = {
    showDontTell: jest.fn(),
    enhanceDescription: jest.fn(),
    rewrite: jest.fn(),
    brainstorm: jest.fn(),
    generateDialogue: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnhancedWritingController],
      providers: [{ provide: EnhancedWritingService, useValue: service }],
    }).compile()

    controller = module.get(EnhancedWritingController)
  })

  it('passes authenticated user id to showDontTell', async () => {
    service.showDontTell.mockResolvedValue({ result: 'shown' })

    await controller.showDontTell({ text: '她很害怕' }, { id: 'user-1' })

    expect(service.showDontTell).toHaveBeenCalledWith('她很害怕', 'user-1', { text: '她很害怕' })
  })

  it('passes authenticated user id to enhanceDescription', async () => {
    service.enhanceDescription.mockResolvedValue({ result: 'enhanced' })


    await controller.enhanceDescription({ text: '雨夜', focus: 'atmosphere' }, { id: 'user-2' })

    expect(service.enhanceDescription).toHaveBeenCalledWith('雨夜', 'user-2', {
      text: '雨夜',
      focus: 'atmosphere',
    })
  })

  it('passes authenticated user id to rewrite', async () => {
    service.rewrite.mockResolvedValue({ versions: [] })

    await controller.rewrite({ text: '原文', style: 'concise' }, { id: 'user-3' })

    expect(service.rewrite).toHaveBeenCalledWith('原文', 'user-3', {
      text: '原文',
      style: 'concise',
    })
  })

  it('passes authenticated user id to brainstorm', async () => {
    service.brainstorm.mockResolvedValue({ ideas: [] })

    await controller.brainstorm({ prompt: '下一章', type: 'plot' }, { id: 'user-4' })

    expect(service.brainstorm).toHaveBeenCalledWith('下一章', 'user-4', {
      prompt: '下一章',
      type: 'plot',
    })
  })

  it('passes authenticated user id to generateDialogue', async () => {
    service.generateDialogue.mockResolvedValue({ dialogue: '...' })

    await controller.generateDialogue(
      { context: '雨夜重逢', characterNames: ['林澈', '沈遥'] },
      { id: 'user-5' },
    )

    expect(service.generateDialogue).toHaveBeenCalledWith(
      '雨夜重逢',
      ['林澈', '沈遥'],
      'user-5',
      { context: '雨夜重逢', characterNames: ['林澈', '沈遥'] },
    )
  })
})
```

- [ ] **Step 2: Run focused test and confirm failure**

Run from `server/`:

```powershell
npm test -- enhanced-writing.controller.spec.ts
```

Expected before implementation: test fails because controller signatures do not accept `user` and call service with `temp-user`.

- [ ] **Step 3: Update controller signatures**

Modify `server/src/modules/writing-styles/enhanced-writing.controller.ts` to import `CurrentUser`:

```ts
import { CurrentUser } from '../auth/decorators/current-user.decorator'
```

Then change each endpoint signature from:

```ts
async showDontTell(@Body() body: ShowDontTellDto) {
```

to:

```ts
async showDontTell(@Body() body: ShowDontTellDto, @CurrentUser() user: { id: string }) {
```

and replace every `'temp-user'` argument with `user.id`.

Apply the same pattern to `enhanceDescription`, `rewrite`, `brainstorm`, and `generateDialogue`.

- [ ] **Step 4: Run focused test and build**

Run from `server/`:

```powershell
npm test -- enhanced-writing.controller.spec.ts
npm run build
```

Expected: focused test passes and server builds.

---

## Task 3: Add Structured Context Preview DTO and Types

**Files:**
- Create: `server/src/modules/ai/dto/context-preview.dto.ts`
- Modify: `server/src/modules/ai/context-builder.service.ts`

- [ ] **Step 1: Create preview query DTO**

Create `server/src/modules/ai/dto/context-preview.dto.ts`:

```ts
import { IsOptional, IsString } from 'class-validator'

export class ContextPreviewQueryDto {
  @IsOptional()
  @IsString()
  chapterId?: string

  @IsOptional()
  @IsString()
  currentText?: string
}
```

- [ ] **Step 2: Add exported interfaces in ContextBuilderService**

At the top of `server/src/modules/ai/context-builder.service.ts`, add interfaces:

```ts
export interface ContextPreviewSection {
  id: string
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string
  items: string[]
  tokenEstimate: number
}

export interface ContextPreview {
  projectId: string
  chapterId?: string
  sections: ContextPreviewSection[]
  totalTokenEstimate: number
  warnings: string[]
}
```

- [ ] **Step 3: Add small private token estimator**

Inside `ContextBuilderService`, add:

```ts
private estimateTokens(text: string): number {
  return Math.ceil(text.length / 2)
}
```

This is intentionally approximate for Chinese text and preview UI. Do not add a tokenizer dependency in this task.

---

## Task 4: Extend ContextBuilderService with Foundation Context Preview

**Files:**
- Modify: `server/src/modules/ai/context-builder.service.ts`
- Create: `server/src/modules/ai/context-builder.service.spec.ts`

- [ ] **Step 1: Write service tests for preview sections**

Create `server/src/modules/ai/context-builder.service.spec.ts` with mocked Prisma and character context services. Include at least these tests:

```ts
import { ContextBuilderService } from './context-builder.service'

describe('ContextBuilderService', () => {
  const prisma = {
    project: { findFirst: jest.fn() },
    worldSetting: { findMany: jest.fn() },
    plot: { findMany: jest.fn() },
    chapter: { findMany: jest.fn(), findFirst: jest.fn() },
    loreEntry: { findMany: jest.fn() },
    chekhovsGun: { findMany: jest.fn() },
    outline: { findMany: jest.fn() },
    turningPoint: { findMany: jest.fn() },
    timelineEvent: { findMany: jest.fn() },
    writingStyleConfig: { findUnique: jest.fn() },
    character: { findMany: jest.fn() },
  }

  const progressiveCharacterContext = {
    buildContext: jest.fn(),
  }

  let service: ContextBuilderService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ContextBuilderService(prisma as any, progressiveCharacterContext as any)
  })

  it('builds preview sections for project, lore, structure, style, and anti-AI rules', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p1', title: '黑塔', description: '雨夜开启的塔', genre: '奇幻' })
    prisma.worldSetting.findMany.mockResolvedValue([])
    prisma.plot.findMany.mockResolvedValue([])
    prisma.chapter.findMany.mockResolvedValue([])
    prisma.chapter.findFirst.mockResolvedValue(null)
    prisma.loreEntry.findMany.mockResolvedValue([{ name: '黑塔', content: '只能在雨夜开启', keywords: '黑塔,雨夜', priority: 10 }])
    prisma.chekhovsGun.findMany.mockResolvedValue([{ name: '半枚钥匙', description: '尚未回收', status: 'SETUP' }])
    prisma.outline.findMany.mockResolvedValue([{ title: '第一卷', items: [{ title: '雨夜入塔', goal: '进入黑塔' }] }])
    prisma.turningPoint.findMany.mockResolvedValue([{ title: '身份揭露', type: 'CHARACTER_REVEAL', description: '沈遥隐瞒身份' }])
    prisma.timelineEvent.findMany.mockResolvedValue([{ title: '黑塔开启', timeLabel: '第一夜', description: '雨夜' }])
    prisma.writingStyleConfig.findUnique.mockResolvedValue({ styleId: 'concise', tuningParams: { pacing: 'fast' } })
    prisma.character.findMany.mockResolvedValue([{ name: '沈遥', voice: '短句，直接，不解释情绪' }])

    const preview = await service.buildContextPreview('p1', 'user-1', { chapterId: 'c1', currentText: '黑塔在雨夜出现。' })

    expect(preview.projectId).toBe('p1')
    expect(preview.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(['project', 'lorebook', 'structure', 'style', 'character-voice', 'anti-ai-rules']),
    )
    expect(preview.totalTokenEstimate).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Add `buildContextPreview` method**

Implement this public method on `ContextBuilderService`:

```ts
async buildContextPreview(
  projectId: string,
  userId: string,
  options: { chapterId?: string; currentText?: string } = {},
): Promise<ContextPreview> {
  // Fetch only user-owned project data.
  // Build sections for project, characters, lorebook, structure, style, character voice, and anti-AI rules.
}
```

Required behavior:

1. Fetch project with ownership guard: `prisma.project.findFirst({ where: { id: projectId, userId } })`.
2. If no project exists, throw `NotFoundException`.
3. Add a `project` section from project title, genre, description.
4. Fetch matching Lorebook entries from `loreEntry.findMany({ where: { projectId } })`, then filter in memory by keyword match against `options.currentText` if provided. If no current text is provided, include top priority entries.
5. Fetch Chekhov's guns, outlines, turning points, and timeline events for a `structure` section.
6. Fetch writing style config from `writingStyleConfig.findUnique({ where: { projectId } })` for a `style` section.
7. Fetch characters with non-empty `voice` and include a `character-voice` section.
8. Always include an `anti-ai-rules` section with default rules from the design doc.

Use compact strings in section `items`. Do not expose raw provider prompts or API keys.

- [ ] **Step 3: Run focused test**

Run from `server/`:

```powershell
npm test -- context-builder.service.spec.ts
```

Expected: test passes.

---

## Task 5: Add Context Preview API Endpoint

**Files:**
- Modify: `server/src/modules/ai/ai.controller.ts`
- Create: `server/src/modules/ai/ai.controller.spec.ts`

- [ ] **Step 1: Write controller test**

Create `server/src/modules/ai/ai.controller.spec.ts` with a test that calls `getContextPreview('project-1', { chapterId: 'chapter-1' }, { id: 'user-1' })` and expects `contextBuilderService.buildContextPreview('project-1', 'user-1', { chapterId: 'chapter-1' })`.

- [ ] **Step 2: Inject ContextBuilderService into AiController if not already available**

Update constructor in `ai.controller.ts`:

```ts
constructor(
  private readonly aiService: AiService,
  private readonly contextBuilderService: ContextBuilderService,
) {}
```

Import `ContextBuilderService` and `ContextPreviewQueryDto`.

- [ ] **Step 3: Add endpoint**

Add method:

```ts
@UseGuards(JwtAuthGuard)
@Get('context-preview/:projectId')
async getContextPreview(
  @Param('projectId') projectId: string,
  @Query() query: ContextPreviewQueryDto,
  @CurrentUser() user: { id: string },
) {
  return this.contextBuilderService.buildContextPreview(projectId, user.id, query)
}
```

- [ ] **Step 4: Run focused test and build**

Run from `server/`:

```powershell
npm test -- ai.controller.spec.ts
npm run build
```

Expected: focused test passes and server builds.

---

## Task 6: Enrich AI Text Completion Prompt with Context Foundation

**Files:**
- Modify: `server/src/modules/ai/context-builder.service.ts`
- Modify: `server/src/modules/ai/ai.service.ts`

- [ ] **Step 1: Add `formatContextPreviewForPrompt` helper**

In `ContextBuilderService`, add:

```ts
formatContextPreviewForPrompt(preview: ContextPreview): string {
  return preview.sections
    .filter((section) => section.items.length > 0)
    .map((section) => `## ${section.title}\n${section.items.map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n')
}
```

- [ ] **Step 2: Use preview formatting in text completion**

In `AiService.textComplete()` and `AiService.textCompleteStream()` where prompt/context is assembled, append the formatted context preview after existing style/context text.

Do not delete existing `StyleApplicationService.generateMultiStageStylePrompt()` behavior. The foundation context should supplement current prompt assembly.

- [ ] **Step 3: Preserve backwards compatibility**

If context preview building fails for non-critical reasons, log the error and fall back to existing behavior. Do not break AI completion entirely because of preview enrichment.

- [ ] **Step 4: Build server**

Run from `server/`:

```powershell
npm run build
```

Expected: build succeeds.

---

## Task 7: Add Client Context Preview Types and API

**Files:**
- Create: `client/src/types/ai-context.ts`
- Modify: `client/src/api/ai.ts`

- [ ] **Step 1: Create client types**

Create `client/src/types/ai-context.ts`:

```ts
export type ContextPriority = 'critical' | 'high' | 'medium' | 'low'

export interface ContextPreviewSection {
  id: string
  title: string
  priority: ContextPriority
  source: string
  items: string[]
  tokenEstimate: number
}

export interface ContextPreview {
  projectId: string
  chapterId?: string
  sections: ContextPreviewSection[]
  totalTokenEstimate: number
  warnings: string[]
}
```

- [ ] **Step 2: Add API function**

Modify `client/src/api/ai.ts` to import `ContextPreview` and add:

```ts
async getContextPreview(projectId: string, params?: { chapterId?: string; currentText?: string }): Promise<ContextPreview> {
  const response = await apiClient.get(`/ai/context-preview/${projectId}`, { params })
  return response.data
}
```

Use the existing exported API object style in `client/src/api/ai.ts`.

- [ ] **Step 3: Build client**

Run from `client/`:

```powershell
npm run build
```

Expected: TypeScript build succeeds.

---

## Task 8: Add Context Viewer Component

**Files:**
- Create: `client/src/components/ContextViewer.tsx`

- [ ] **Step 1: Create component**

Create `client/src/components/ContextViewer.tsx`:

```tsx
import { ChevronDown, ChevronRight, Eye, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { ContextPreview, ContextPreviewSection } from '@/types/ai-context'
import { Button } from './ui/Button'

interface ContextViewerProps {
  preview: ContextPreview | null
  isLoading?: boolean
  onRefresh?: () => void
}

const priorityLabels: Record<ContextPreviewSection['priority'], string> = {
  critical: '关键',
  high: '高',
  medium: '中',
  low: '低',
}

const priorityClassNames: Record<ContextPreviewSection['priority'], string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-700',
}

export function ContextViewer({ preview, isLoading, onRefresh }: ContextViewerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }))
  }

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-gray-900">当前 AI 视野</h3>
            <p className="text-xs text-gray-500">展示本次生成可能读取的上下文</p>
          </div>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {!preview && !isLoading && (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          暂无上下文预览。点击刷新后查看 AI 会读取的设定、角色、剧情和风格信息。
        </div>
      )}

      {preview && (
        <>
          <div className="text-xs text-gray-500">
            预估上下文：{preview.totalTokenEstimate.toLocaleString()} tokens
          </div>

          {preview.warnings.length > 0 && (
            <div className="bg-yellow-50 text-yellow-800 text-sm rounded-lg p-3 space-y-1">
              {preview.warnings.map((warning) => (
                <div key={warning}>• {warning}</div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {preview.sections.map((section) => {
              const isOpen = openSections[section.id] ?? true
              const Icon = isOpen ? ChevronDown : ChevronRight

              return (
                <div key={section.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm text-gray-900">{section.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityClassNames[section.priority]}`}>
                        {priorityLabels[section.priority]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{section.tokenEstimate} tokens</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 py-2 space-y-2">
                      <div className="text-xs text-gray-400">来源：{section.source}</div>
                      {section.items.length > 0 ? (
                        <ul className="space-y-1 text-sm text-gray-700">
                          {section.items.map((item, index) => (
                            <li key={`${section.id}-${index}`} className="leading-relaxed">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-400">暂无命中的上下文</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build client**

Run from `client/`:

```powershell
npm run build
```

Expected: build succeeds.

---

## Task 9: Integrate Context Viewer into ChapterEditor

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`

- [ ] **Step 1: Add imports**

Import:

```tsx
import { ContextViewer } from '@/components/ContextViewer'
import type { ContextPreview } from '@/types/ai-context'
```

- [ ] **Step 2: Add state**

Inside `ChapterEditor`, add state near other state declarations:

```tsx
const [contextPreview, setContextPreview] = useState<ContextPreview | null>(null)
const [isLoadingContextPreview, setIsLoadingContextPreview] = useState(false)
```

- [ ] **Step 3: Add loader function**

Add function:

```tsx
const loadContextPreview = async () => {
  if (!projectId) return
  setIsLoadingContextPreview(true)
  try {
    const preview = await aiApi.getContextPreview(projectId, {
      chapterId,
      currentText: editor?.getText?.() || '',
    })
    setContextPreview(preview)
  } catch (error) {
    console.error('加载 AI 上下文预览失败:', error)
  } finally {
    setIsLoadingContextPreview(false)
  }
}
```

Use the existing editor access pattern in `ChapterEditor`; if the editor instance variable has a different name, use the existing TipTap instance identifier.

- [ ] **Step 4: Trigger initial load**

Add an effect that calls `loadContextPreview()` once chapter data is loaded:

```tsx
useEffect(() => {
  if (projectId && chapterId) {
    loadContextPreview()
  }
}, [projectId, chapterId])
```

- [ ] **Step 5: Render ContextViewer in the existing side panel area**

Place:

```tsx
<ContextViewer
  preview={contextPreview}
  isLoading={isLoadingContextPreview}
  onRefresh={loadContextPreview}
/>
```

near existing Lorebook/Chekhov/world panels so it does not disrupt the editor layout.

- [ ] **Step 6: Build client**

Run from `client/`:

```powershell
npm run build
```

Expected: build succeeds.

---

## Task 10: Persist Project Writing Style in ProjectSettings

**Files:**
- Modify: `client/src/pages/ProjectSettings.tsx`

- [ ] **Step 1: Replace local-only style-selection path**

Remove the local-only handler that logs `Selected style` and contains the existing comment saying the style should be saved to the backend.

- [ ] **Step 2: Use existing ProjectStyleSelector**

Import and render `ProjectStyleSelector` in the writing style card:

```tsx
import { ProjectStyleSelector } from '@/components/ProjectStyleSelector'
```

Render it with the current `projectId`:

```tsx
{projectId && <ProjectStyleSelector projectId={projectId} />}
```

If the current `ProjectStyleSelector` API differs, follow its actual props exactly and do not duplicate style persistence logic in ProjectSettings.

- [ ] **Step 3: Remove dead modal state if no longer needed**

Delete unused `showStyleSelector`, `selectedStyle`, and `WritingStyleSelector` imports/state if `ProjectStyleSelector` replaces them completely.

- [ ] **Step 4: Build client**

Run from `client/`:

```powershell
npm run build
```

Expected: build succeeds.

---

## Task 11: Add Anti-AI Rules to Style Prompt Foundation

**Files:**
- Modify: `server/src/modules/writing-styles/style-application.service.ts`
- Modify: `server/src/modules/ai/context-builder.service.ts`

- [ ] **Step 1: Add default rule list**

In `style-application.service.ts`, add a private readonly list:

```ts
private readonly defaultAntiAiRules = [
  '避免总结式升华，例如“这一刻，他终于明白”。',
  '避免模板化转折，例如“然而，他不知道的是”。',
  '减少空泛形容词，优先使用具体动作和可感知细节。',
  '减少“空气凝固”“命运齿轮转动”等通用氛围句。',
  '减少过度工整的排比结构，保留自然节奏。',
  '减少直接解释情绪，优先通过动作、停顿和选择表达。',
]
```

- [ ] **Step 2: Append rules to generated style prompt**

Where `generateMultiStageStylePrompt()` builds the final prompt, append:

```ts
const antiAiRules = this.defaultAntiAiRules.map((rule) => `- ${rule}`).join('\n')
```

and include a section:

```text
## 反 AI 味约束
${antiAiRules}
```

- [ ] **Step 3: Keep ContextBuilderService anti-AI section in sync**

Ensure the context preview anti-AI section uses the same wording. If duplication feels risky, extract a shared exported constant only inside server code. Do not create a new package.

- [ ] **Step 4: Build server**

Run from `server/`:

```powershell
npm run build
```

Expected: build succeeds.

---

## Task 12: Verification Pass

**Files:**
- All changed files

- [ ] **Step 1: Run server focused tests**

Run from `server/`:

```powershell
npm test -- enhanced-writing.controller.spec.ts
npm test -- context-builder.service.spec.ts
npm test -- ai.controller.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run server build**

Run from `server/`:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Run client build**

Run from `client/`:

```powershell
npm run build
```

Expected: TypeScript and Vite build succeeds.

- [ ] **Step 4: Run LSP diagnostics on changed files**

Run diagnostics on:

- `server/src/app.module.ts`
- `server/src/modules/writing-styles/enhanced-writing.controller.ts`
- `server/src/modules/ai/context-builder.service.ts`
- `server/src/modules/ai/ai.controller.ts`
- `server/src/modules/writing-styles/style-application.service.ts`
- `client/src/api/ai.ts`
- `client/src/components/ContextViewer.tsx`
- `client/src/pages/ChapterEditor.tsx`
- `client/src/pages/ProjectSettings.tsx`

Expected: no diagnostics caused by this implementation.

---

## Self-Review

### Spec Coverage

- P0 module registration: Task 1.
- P0 EnhancedWritingController auth bug: Task 2.
- P0 Lorebook/Enhanced Writing/Writing Style workflow foundation: Tasks 1, 6, 10, 11.
- P0 ChapterEditor current AI vision: Tasks 7, 8, 9.
- P1 Context Engine: Tasks 3, 4, 5, 6.
- P1 Author voice/character voice foundation: Task 4 includes style and character voice sections using existing data; full profile persistence is deferred.
- P1 Anti-AI rules: Task 11.
- P1 Multi-version/Diff review: Existing components are preserved; full variant workflow is intentionally deferred after Context Viewer because the spec scope is too large for the foundation slice.

### Known Deferred Work

- Full structured AuthorVoiceProfile persistence.
- Full CharacterVoiceProfile persistence beyond existing `Character.voice`.
- Enhanced Writing provider routing through `AIConfigService` and `ApiKeysService`.
- Client test infrastructure with Vitest.
- Full multi-variant inline accept/reject workflow.

These are deferred to avoid making the first foundation slice too broad.

### Placeholder Scan

This plan intentionally contains no placeholder markers. All deferred work is explicitly listed under Known Deferred Work.

### Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-21-ai-writing-foundation.md`. Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.
