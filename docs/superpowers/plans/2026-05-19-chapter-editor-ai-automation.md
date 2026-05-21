# Chapter Editor AI Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chapter editor feel much more automatic: AI continuation should append, extract useful entities, and trigger conflict detection with fewer clicks; saving should also check for conflicts automatically; worldbook and character suggestions should be easier to apply.

**Architecture:** Keep the existing chapter editor page, but introduce a small orchestration layer around AI actions so they share one post-processing path. The editor will own a new auto-analysis flow that runs after AI continuation and after save, while the existing extraction modals become easier to confirm from one-click actions. Existing APIs stay mostly intact; the change is primarily in client-side coordination plus one small API response mapping fix that is already required for AI continuation.

**Tech Stack:** React + TypeScript, React Query, existing client API wrappers, existing NestJS AI endpoints, existing chapter/world/character APIs.

---

### Task 1: Normalize chapter editor AI action orchestration

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`
- Modify: `client/src/api/ai.ts`

- [ ] **Step 1: Write the failing expectation into the component flow**
  - Define a single post-AI helper path in `ChapterEditor.tsx` that can be reused by both manual AI continuation and any future auto-trigger.
  - Ensure the continuation flow reads `completion` from `aiApi.complete()` and not `result`.

- [ ] **Step 2: Implement the shared AI post-processing path**
  - After a successful continuation, append the new text, then run world extraction and character analysis in parallel.
  - If characters or relationships are detected, open the character relation modal; otherwise open the world element modal if world elements are detected.
  - Keep the existing modal structures, but route them through the same helper so the behavior is consistent.

- [ ] **Step 3: Verify the AI endpoint mapping**
  - `client/src/api/ai.ts` must call the same backend route used by `AiController.textComplete`.
  - Expected path: `/ai/text-complete`.

- [ ] **Step 4: Validate the chapter editor logic locally**
  - Run the client build or typecheck command used by this repo.
  - Open a chapter and click `AI 续写`; verify the new content appends and the follow-up extraction path runs.


### Task 2: Auto-run conflict checks after save and after AI continuation

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`
- Modify: `client/src/api/world-settings.ts` if any request options need to be normalized

- [ ] **Step 1: Add a save-after-check path**
  - After `chaptersApi.updateContent(...)` succeeds, automatically call `worldSettingsApi.detectConflicts(projectId, content)`.
  - Keep the manual `冲突检测` button as a direct escape hatch.

- [ ] **Step 2: Add a continuation-after-check path**
  - After AI continuation appends new text, automatically run conflict detection against the updated full chapter text.
  - If a conflict result returns `hasConflict: true`, open the existing conflict modal immediately.

- [ ] **Step 3: Make conflict feedback less interruptive**
  - If no conflicts are found, do not show a modal; update the UI state quietly.
  - If conflicts are found, keep the current modal but make it the default path rather than a manual-only action.

- [ ] **Step 4: Validate the auto-check path**
  - Save a chapter with known world content and confirm the detection API is called once after save.
  - Run AI continuation and confirm the conflict API runs on the updated content.


### Task 3: Reduce clicks for applying extracted world and character suggestions

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`
- Modify: `client/src/api/characters.ts`
- Modify: `client/src/api/world-settings.ts`

- [ ] **Step 1: Turn extraction results into one-click defaults**
  - When AI continuation yields new world elements, preselect them as today, but make the primary action an immediate `添加到世界观` flow.
  - When AI continuation yields new characters/relationships, keep the modal open but make the primary action apply the selected items without extra confirmation screens.

- [ ] **Step 2: Make relation application resilient**
  - Use the existing `charactersApi.create(...)`, `charactersApi.getAll(...)`, and `charactersApi.createRelationship(...)` calls, but keep them in one helper that handles both selected characters and selected relationships.
  - If a selected relation references a character that was just created in the same batch, resolve IDs after creation and before relationship creation.

- [ ] **Step 3: Add a small world-reference helper path**
  - Reuse the existing `insertSettingReference(setting)` behavior for world panel items.
  - Ensure extracted world elements can be inserted or converted into world settings with the least number of clicks possible.

- [ ] **Step 4: Verify application behavior**
  - Confirm the world element modal applies selected items in one click.
  - Confirm character and relationship suggestions can be accepted without re-entering data.


### Task 4: Make the chapter editor less button-heavy without removing power-user controls

**Files:**
- Modify: `client/src/pages/ChapterEditor.tsx`

- [ ] **Step 1: Reorder the header actions**
  - Keep `AI 续写`, `冲突检测`, and `保存`, but make AI continuation the visual primary action.
  - Keep world/lore/gun panels available, but move them behind clearer grouping so the main flow is easier to see.

- [ ] **Step 2: Add helper text for automatic behavior**
  - Add short inline text near the header actions explaining that AI continuation now auto-runs extraction and conflict checks.
  - Add a save hint that says save will also check for conflicts.

- [ ] **Step 3: Preserve manual escape hatches**
  - Do not remove any current buttons.
  - Manual conflict check and manual world panel remain available for power users.

- [ ] **Step 4: Sanity-check the UX in browser**
  - Open a chapter and verify the main actions read as a single obvious workflow.


### Task 5: Verify end-to-end chapter workflow

**Files:**
- No new code files; verify against `client/src/pages/ChapterEditor.tsx`, `client/src/api/ai.ts`, `client/src/api/world-settings.ts`, `client/src/api/characters.ts`

- [ ] **Step 1: Run the relevant validation command**
  - Use the repo’s normal client verification command or typecheck/build command.

- [ ] **Step 2: Browser-test the chapter page**
  - Open a chapter.
  - Click `AI 续写`.
  - Confirm the content changes, extraction modals appear when appropriate, and conflicts are auto-checked.

- [ ] **Step 3: Browser-test save-triggered conflict detection**
  - Change chapter text and click `保存`.
  - Confirm conflict detection runs automatically after save.

- [ ] **Step 4: Browser-test suggestion acceptance**
  - Accept a world element suggestion and a character suggestion.
  - Confirm the data appears in the relevant section without extra manual re-entry.
