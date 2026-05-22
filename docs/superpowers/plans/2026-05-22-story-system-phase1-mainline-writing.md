# Story System Phase 1 Mainline Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make chapter AI writing use the Story System mainline by default: refresh contracts, preflight, build ContextPack, create AgentRun/AgentStep records, call AI with ContextPack, and return the draft to the editor.

**Architecture:** Add a `writeChapter` method and `/story-system/write` endpoint to the existing Story System module. The method orchestrates contracts, preflight, ContextPack, AgentRun, CONTEXT/DRAFT steps, and AI invocation. The chapter editor switches non-streaming AI continuation to this endpoint while preserving manual insertion and post-generation extraction.

**Tech Stack:** NestJS, Prisma, Jest, React 18, Vite, TypeScript, Axios.

---

## Files

- Modify: `server/src/modules/story-system/dto/story-system.dto.ts`
- Modify: `server/src/modules/story-system/story-system.service.ts`
- Modify: `server/src/modules/story-system/story-system.controller.ts`
- Modify: `server/src/modules/story-system/story-system.service.spec.ts`
- Modify: `client/src/api/story-system.ts`
- Modify: `client/src/pages/ChapterEditor.tsx`

## Task 1: Backend Mainline Write Endpoint

- [ ] Add failing Jest test in `server/src/modules/story-system/story-system.service.spec.ts`:
  - `writeChapter` refreshes contracts, preflights, builds ContextPack, creates AgentRun, records CONTEXT and DRAFT steps, calls `AiService.chat`, and returns `{ completion, runId, contextPackId, preflight }`.
  - blocking preflight returns `{ blocked: true, preflight }` and does not call AI.

- [ ] Run:

```bash
cd server && npm run test -- story-system.service.spec.ts
```

Expected: fails because `writeChapter` does not exist.

- [ ] Implement DTO:
  - `WriteChapterDto { content: string; instruction?: string; temperature?: number; maxTokens?: number }`

- [ ] Implement `StorySystemService.writeChapter`.

- [ ] Add controller route:

```text
POST /projects/:projectId/chapters/:chapterId/story-system/write
```

- [ ] Re-run focused test and full server tests.

## Task 2: Frontend API and Editor Switch

- [ ] Add `storySystemApi.writeChapter(projectId, chapterId, data)` to `client/src/api/story-system.ts`.

- [ ] Modify `ChapterEditor.handleAiWrite`:
  - Replace stream call with `storySystemApi.writeChapter`.
  - Show in-progress state using existing streaming result area.
  - If blocked, show blocking reasons.
  - On success, append returned completion through existing `appendAiText`.

- [ ] Keep stop button disabled for the non-streaming Story System request in this phase.

- [ ] Run:

```bash
cd client && npm run build
```

Expected: build succeeds, existing Vite chunk warning may remain.

## Task 3: Verification

- [ ] Run:

```bash
cd server && npm run test
cd server && npm run build
cd client && npm run build
cd server && npx prisma migrate status
git diff --check
```

Expected:

- Server tests pass.
- Server build passes.
- Client build passes.
- Prisma reports schema up to date.
- No whitespace errors.

