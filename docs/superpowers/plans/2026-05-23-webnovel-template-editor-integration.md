# Webnovel Template Editor Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a switchable web-novel template layer inside the chapter editor so templates can inject prompt guidance into writing, repair, and context building flows.

**Architecture:** Keep templates as a separate domain from general writing-style presets. Store them in a dedicated template catalog on the client and expose them through a small story/template API on the server so the chapter editor can select a project default and a chapter override. The editor will preview the active template, pass its rendered prompt blocks into Story System calls, and show which template is currently driving the generation.

**Tech Stack:** React 18 + TypeScript, Vite, NestJS, Prisma, React Query, existing `story-system` and `writing-styles` modules.

---

### Task 1: Define the web-novel template catalog and API shape

**Files:**
- Create: `client/src/types/web-novel-templates.ts`
- Create: `client/src/api/web-novel-templates.ts`
- Modify: `client/src/pages/ChapterEditor.tsx`
- Modify: `client/src/components/StorySystemPanel.tsx`

- [ ] **Step 1: Write the template data model and a starter catalog**

```ts
export interface WebNovelTemplate {
  id: string
  name: string
  aliases: string[]
  category: 'xuanhuan' | 'xianxia' | 'urban' | 'wuxia' | 'mystery' | 'romance' | 'sci_fi' | 'custom'
  description: string
  hooks: string[]
  pacingRules: string[]
  tabooRules: string[]
  chapterGoals: string[]
  promptBlocks: {
    system: string
    contract: string
    pacing: string
    taboo: string
    chapter: string
  }
}
```

Include a first-pass catalog with a small set of high-signal templates that match the current product, such as `xuanhuan`, `urban-suspense`, `wuxia`, `romantic-dramedy`, and `classic-mystery`.

- [ ] **Step 2: Add a client helper for loading and resolving templates**

```ts
export function getWebNovelTemplates(): WebNovelTemplate[]
export function getWebNovelTemplate(id: string): WebNovelTemplate | undefined
export function resolveTemplateInput(input: string): WebNovelTemplate | undefined
```

- [ ] **Step 3: Add a compact API wrapper for future server-backed persistence**

```ts
export const webNovelTemplatesApi = {
  list: async (): Promise<WebNovelTemplate[]>,
  getProjectTemplate: async (projectId: string): Promise<{ projectTemplateId: string | null; chapterTemplateId: string | null }>,
  saveProjectTemplate: async (projectId: string, data: { projectTemplateId: string | null; chapterTemplateId: string | null }): Promise<void>,
}
```

- [ ] **Step 4: Sanity-check the new data against the editor call sites**

Run: `cd client && npm run build`
Expected: TypeScript still compiles after the new template types are wired into imports.

### Task 2: Add template selection and preview to the chapter editor

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`
- Create: `client/src/components/WebNovelTemplateSwitcher.tsx`
- Modify: `client/src/components/StorySystemPanel.tsx`

- [ ] **Step 1: Write the editor-side state and props for template selection**

```ts
const [activeTemplateId, setActiveTemplateId] = useState<string>('xuanhuan')
const [chapterTemplateId, setChapterTemplateId] = useState<string | null>(null)
const activeTemplate = getWebNovelTemplate(chapterTemplateId || activeTemplateId)
```

- [ ] **Step 2: Add a dedicated template switcher next to the existing story controls**

The switcher should show:
- the current template name
- a short template preview
- a default/project override toggle
- a chapter override dropdown
- a read-only prompt preview for the active template

- [ ] **Step 3: Render template state inside the Story System panel**

Show the active template in the `overview` tab and add a small “prompt blocks” preview section so the user can see which blocks will be injected before they run `write`, `repair`, or `preflight`.

- [ ] **Step 4: Verify the editor UI does not regress**

Run: `cd client && npm run build`
Expected: no missing prop/type errors in `ChapterEditor`, `StorySystemPanel`, or the new switcher component.

### Task 3: Inject templates into write, repair, and context-pack flows

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`
- Modify: `client/src/api/story-system.ts`
- Modify: `server/src/modules/story-system/story-system.service.ts`
- Modify: `server/src/modules/ai/context-builder.service.ts`

- [ ] **Step 1: Extend the client story-system request payloads with template identifiers**

```ts
writeChapter(projectId, chapterId, {
  content,
  templateId: activeTemplate.id,
  chapterTemplateId,
})
```

Apply the same pattern to `repairChapter`, `startRun`, and any other entry that already carries instruction metadata.

- [ ] **Step 2: Add a server-side template resolver in the story system**

The server should accept the template id, resolve it from the shared catalog, and turn it into a prompt bundle that can be appended to the existing Story System context instead of replacing it.

- [ ] **Step 3: Inject template blocks into context-pack assembly**

The context pack should gain a dedicated `webNovelTemplate` section so the user can see:
- template identity
- chapter goal
- pacing rule
- taboo rule
- prompt block budget

- [ ] **Step 4: Extend preflight to surface template conflicts**

If the selected template clashes with project genre or chapter state, return a structured warning instead of silently ignoring it.

- [ ] **Step 5: Run focused server tests for the new payload and injection path**

Run:
`cd server && npm run test -- story-system.service.spec.ts`

Expected: the Story System still writes, repairs, and reviews correctly when a template id is present or omitted.

### Task 4: Add persistence for project default and chapter override

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/src/modules/web-novel-templates/web-novel-templates.controller.ts`
- Create: `server/src/modules/web-novel-templates/web-novel-templates.service.ts`
- Create: `server/src/modules/web-novel-templates/web-novel-templates.module.ts`
- Modify: `server/src/app.module.ts`
- Modify: `client/src/api/web-novel-templates.ts`

- [ ] **Step 1: Add project-level fields for template defaults**

Add nullable fields that store the default template id and the chapter override policy. Keep them simple and string-backed so the catalog can evolve without a migration for every new template.

- [ ] **Step 2: Expose tiny CRUD endpoints for template preferences**

Add:
- `GET /projects/:projectId/web-novel-template`
- `PUT /projects/:projectId/web-novel-template`

These endpoints should only read and write the project’s template preference, not mutate the catalog.

- [ ] **Step 3: Register the new module in the app**

Wire the module into `AppModule` so the endpoints are live.

- [ ] **Step 4: Regenerate Prisma client and confirm the new fields compile**

Run:
`cd server && npm run prisma:generate`
`cd server && npm run build`

Expected: the new project template fields are available in the client and the server builds cleanly.

### Task 5: Verify end-to-end editor behavior

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`
- Modify: `client/src/components/StorySystemPanel.tsx`
- Modify: `client/src/api/story-system.ts`
- Modify: `server/src/modules/story-system/story-system.service.spec.ts`
- Modify: `server/src/modules/ai/context-builder.service.spec.ts`

- [ ] **Step 1: Add a test that proves template selection changes the generated prompt blocks**

Assert that the selected template appears in the context pack and in the write request payload.

- [ ] **Step 2: Add a test for chapter override precedence**

The chapter template should win over the project default when both are present.

- [ ] **Step 3: Add a test for the no-template fallback path**

If no template is configured, the editor should keep using the current Story System behavior.

- [ ] **Step 4: Run the full verification pass**

Run:
`cd server && npm run test`
`cd server && npm run build`
`cd client && npm run build`

Expected: all tests and builds pass with the new template layer in place.
