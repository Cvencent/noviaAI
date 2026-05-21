# Novel Structure Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add long-form novel structure management: full-book outlines, chapter detailed outlines, turning points, and story timeline events.

**Architecture:** Extend the existing NestJS + Prisma backend with three project-scoped modules (`outlines`, `turning-points`, `timeline`). Extend the React frontend with matching API clients and project workspace pages using the existing sidebar, UI primitives, and `/projects/:projectId/*` routing pattern.

**Tech Stack:** NestJS, Prisma, SQLite, React 18, TypeScript, Tailwind CSS, Axios, React Router.

---

## File Structure

### Backend

- Modify: `server/prisma/schema.prisma`
  - Add project relations: `outlines`, `turningPoints`, `timelineEvents`.
  - Add models: `Outline`, `OutlineItem`, `TurningPoint`, `TimelineEvent`.
- Modify: `server/src/app.module.ts`
  - Register `OutlinesModule`, `TurningPointsModule`, `TimelineModule`.
- Create: `server/src/modules/outlines/outlines.module.ts`
- Create: `server/src/modules/outlines/outlines.controller.ts`
- Create: `server/src/modules/outlines/outlines.service.ts`
- Create: `server/src/modules/outlines/dto/index.ts`
- Create: `server/src/modules/outlines/dto/outline.dto.ts`
- Create: `server/src/modules/outlines/dto/outline-item.dto.ts`
- Create: `server/src/modules/turning-points/turning-points.module.ts`
- Create: `server/src/modules/turning-points/turning-points.controller.ts`
- Create: `server/src/modules/turning-points/turning-points.service.ts`
- Create: `server/src/modules/turning-points/dto/index.ts`
- Create: `server/src/modules/turning-points/dto/turning-point.dto.ts`
- Create: `server/src/modules/timeline/timeline.module.ts`
- Create: `server/src/modules/timeline/timeline.controller.ts`
- Create: `server/src/modules/timeline/timeline.service.ts`
- Create: `server/src/modules/timeline/dto/index.ts`
- Create: `server/src/modules/timeline/dto/timeline-event.dto.ts`

### Frontend

- Create: `client/src/api/outlines.ts`
- Create: `client/src/api/turning-points.ts`
- Create: `client/src/api/timeline.ts`
- Create: `client/src/pages/OutlineManagement.tsx`
- Create: `client/src/pages/TurningPointManagement.tsx`
- Create: `client/src/pages/TimelineManagement.tsx`
- Modify: `client/src/App.tsx`
  - Add nested workspace routes: `outlines`, `turning-points`, `timeline`.
- Modify: `client/src/pages/ProjectWorkspace.tsx`
  - Add sidebar navigation items.

---

## Data Model Design

### Outline

Represents a full-book outline or volume/arc outline.

Fields:
- `id`, `projectId`, `title`, `description`, `structureType`, `status`, `order`, timestamps.
- Child items: `OutlineItem[]`.

### OutlineItem

Represents chapter-level detailed outline items or nested structural beats.

Fields:
- `id`, `outlineId`, optional `chapterId`, optional `parentId`.
- `title`, `summary`, `goal`, `conflict`, `outcome`, `povCharacter`, `location`, `estimatedWords`, `order`, timestamps.

### TurningPoint

Represents major plot turns.

Fields:
- `id`, `projectId`, optional `chapterId`.
- `title`, `type`, `description`, `impact`, `emotionalShift`, `position`, `order`, timestamps.

### TimelineEvent

Represents story-world chronology.

Fields:
- `id`, `projectId`, optional `chapterId`.
- `title`, `eventDate`, `timeLabel`, `description`, `location`, `characters`, `importance`, `order`, timestamps.

---

## Task 1: Backend schema and Prisma client

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] Add relation fields to `Project`:

```prisma
outlines       Outline[]
turningPoints  TurningPoint[]
timelineEvents TimelineEvent[]
```

- [ ] Add the `Outline`, `OutlineItem`, `TurningPoint`, and `TimelineEvent` models.

- [ ] Run from `server/`:

```bash
npx prisma generate
```

Expected: Prisma Client generation succeeds.

---

## Task 2: Backend outlines module

**Files:**
- Create: `server/src/modules/outlines/*`

- [ ] Implement CRUD endpoints:
  - `GET /projects/:projectId/outlines`
  - `GET /projects/:projectId/outlines/:id`
  - `POST /projects/:projectId/outlines`
  - `PUT /projects/:projectId/outlines/:id`
  - `DELETE /projects/:projectId/outlines/:id`
- [ ] Implement outline item endpoints:
  - `POST /projects/:projectId/outlines/:id/items`
  - `PUT /projects/:projectId/outlines/:outlineId/items/:itemId`
  - `DELETE /projects/:projectId/outlines/:outlineId/items/:itemId`
  - `PUT /projects/:projectId/outlines/:id/items/reorder`
- [ ] Use `JwtAuthGuard` and existing Chinese error-message style.

---

## Task 3: Backend turning points module

**Files:**
- Create: `server/src/modules/turning-points/*`

- [ ] Implement endpoints:
  - `GET /projects/:projectId/turning-points`
  - `GET /projects/:projectId/turning-points/:id`
  - `POST /projects/:projectId/turning-points`
  - `PUT /projects/:projectId/turning-points/:id`
  - `DELETE /projects/:projectId/turning-points/:id`
  - `PUT /projects/:projectId/turning-points/reorder`

---

## Task 4: Backend timeline module

**Files:**
- Create: `server/src/modules/timeline/*`

- [ ] Implement endpoints:
  - `GET /projects/:projectId/timeline`
  - `GET /projects/:projectId/timeline/:id`
  - `POST /projects/:projectId/timeline`
  - `PUT /projects/:projectId/timeline/:id`
  - `DELETE /projects/:projectId/timeline/:id`
  - `PUT /projects/:projectId/timeline/reorder`

---

## Task 5: Frontend API clients

**Files:**
- Create: `client/src/api/outlines.ts`
- Create: `client/src/api/turning-points.ts`
- Create: `client/src/api/timeline.ts`

- [ ] Follow `client/src/api/plots.ts` style.
- [ ] Export DTO interfaces and object-style API clients.
- [ ] Use paths nested under `/projects/${projectId}/...`.

---

## Task 6: Frontend management pages

**Files:**
- Create: `client/src/pages/OutlineManagement.tsx`
- Create: `client/src/pages/TurningPointManagement.tsx`
- Create: `client/src/pages/TimelineManagement.tsx`

- [ ] Follow `PlotManagement.tsx` and `ChapterManagement.tsx` visual conventions.
- [ ] Use existing `Button`, `Card`, `Modal`, `Input`, `Select`, `Textarea` components.
- [ ] Support create, edit, delete, loading, empty state.
- [ ] Outlines page must support adding/editing/deleting outline items.
- [ ] Turning points page must visually group by turning point type.
- [ ] Timeline page must display ordered chronological/story events.

---

## Task 7: Routing and navigation

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/ProjectWorkspace.tsx`

- [ ] Add routes:

```tsx
<Route path="outlines" element={<OutlineManagement />} />
<Route path="turning-points" element={<TurningPointManagement />} />
<Route path="timeline" element={<TimelineManagement />} />
```

- [ ] Add sidebar items:
  - `大纲`
  - `转折点`
  - `时间线`

---

## Task 8: Verification

- [ ] Run backend diagnostics/build from `server/`.
- [ ] Run frontend diagnostics/build from `client/`.
- [ ] Verify new routes compile.
- [ ] Verify Prisma Client generated successfully.

---

## Self-Review

- Spec coverage: full-book outline, chapter detailed outline, turning points, and timeline are covered.
- Placeholder scan: no TBD/fill-later placeholders.
- Type consistency: route names and API client names match backend resource names.
