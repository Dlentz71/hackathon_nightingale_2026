# Implementation Plan: Project & Task Management

> **Spec**: `.claude/specs/project-task-management.md`
> **Status**: Pending Approval

---

## Phase 0 — Project Scaffolding

1. Scaffold Vite + React + TypeScript app in `app/` directory
2. Install core dependencies: `zustand`, `@tanstack/react-query` (for future use)
3. Install and configure Tailwind CSS v3
4. Install and configure shadcn/ui (New York style, neutral base color)
5. Add shadcn/ui components: `button`, `badge`, `card`, `dialog`, `sheet`, `input`, `textarea`, `select`, `checkbox`, `progress`, `separator`, `tooltip`, `command` (for multi-select)
6. Install Recharts
7. Install Vitest + React Testing Library + jsdom
8. Configure path alias `@/` → `src/`
9. Copy `seed-data.json` into `app/src/data/`

---

## Phase 1 — Foundation

10. `src/types/index.ts` — TypeScript interfaces for `Project`, `Task`, `TeamMember`, `Assignment`, `User`, `TshirtSize`, `TaskStatus`, `ProjectStatus`, `Priority`
11. `src/lib/constants.ts` — `TSHIRT_HOURS`, `PROJECT_STATUS_LABELS`, `TASK_STATUS_LABELS`, `PRIORITY_LABELS`, `PRIORITY_ORDER`
12. `src/lib/utils.ts` — `cn()` Tailwind class merging utility
13. `src/lib/rbac.ts` — `can(user, action)` RBAC helper covering all write operations
14. `src/store/useAuthStore.ts` — Zustand store for active user (mock session, no real auth)
15. `src/store/useProjectStore.ts` — Zustand `persist` store: projects + tasks. Actions: `createProject`, `updateProject`, `deleteProject`, `createTask`, `updateTask`, `deleteTask`, `bulkDeleteTasks`
16. `src/store/useTeamStore.ts` — Zustand `persist` store: team members
17. `src/store/useAssignmentStore.ts` — Zustand `persist` store: assignments
18. `src/data/seed.ts` — Hydrates all stores from `seed-data.json` on first boot (only if localStorage is empty)

---

## Phase 2 — App Shell

19. `src/App.tsx` — Root layout: left sidebar + main content area with view switching
20. `src/components/layout/Sidebar.tsx` — Left nav with tabs: Dashboard | Projects | Team | Capacity. Active tab indicator, keyboard accessible
21. `src/components/layout/UserSwitcher.tsx` — Dropdown to switch active user (demo RBAC). Shows current user name and role badge
22. `src/main.tsx` — Entry point, mounts App, runs seed hydration

---

## Phase 3 — Projects View

23. `src/components/projects/StatusBadge.tsx` — Reusable badge for project/task status with accessible colour + icon (not colour alone)
24. `src/components/projects/PriorityIndicator.tsx` — Reusable priority badge (High/Medium/Low) with icon
25. `src/components/projects/TaskRow.tsx` — Single task row: name, size badge, status badge, priority, dependency badge ("blocked by N"), checkbox (admin bulk select)
26. `src/components/projects/TaskList.tsx` — Expandable inline panel: search input + status/priority filter dropdowns + task rows + empty state CTA
27. `src/components/projects/ProjectCard.tsx` — Card: name, status badge, priority, start/end dates, task status breakdown (`X done · Y in progress · Z todo`), progress bar, expand/collapse task list, edit/delete actions (role-gated)
28. `src/components/projects/ProjectGrid.tsx` — Responsive card grid with filter bar (status/priority) + sort controls (name/startDate/priority asc/desc)
29. `src/components/projects/ProjectDrawer.tsx` — shadcn `Sheet` for create/edit project. Fields: name, description, startDate, targetEndDate, priority. Inline validation, duplicate name check (case-insensitive)
30. `src/components/projects/TaskDrawer.tsx` — shadcn `Sheet` for create/edit task. Fields: name, description, t-shirt size, priority, status, dependencies (multi-select of other tasks in same project)
31. `src/components/projects/DeleteConfirmDialog.tsx` — Reusable shadcn `Dialog` for single-item delete and bulk delete warning
32. `src/views/ProjectsView.tsx` — Top-level view: renders `ProjectGrid`, handles drawer open/close state, bulk selection state

---

## Phase 4 — Business Logic

33. `src/lib/projectRules.ts` — Pure functions:
    - `canDeleteProject(project, tasks, assignments)` → `{ allowed: boolean, blockedBy: string[] }`
    - `canTransitionProjectStatus(project, tasks, nextStatus, user)` → `{ allowed: boolean, reason?: string }`
    - `canMoveTaskToInProgress(task, allTasks)` → `{ allowed: boolean, blockedBy: string[] }`
    - `getUnmetDependencies(task, allTasks)` → `Task[]`
    - `getTaskStatusBreakdown(tasks)` → `{ done: number, inProgress: number, todo: number, blocked: number }`
    - `getProjectProgress(tasks)` → `number` (0–100)

---

## Phase 5 — Tests

34. `src/lib/projectRules.test.ts` — Unit tests for all pure functions in `projectRules.ts`
35. `src/lib/rbac.test.ts` — Unit tests for `can()` helper covering all role/action combinations
36. `src/store/useProjectStore.test.ts` — Tests for duplicate name check, delete blocking, cascade delete

---

## Phase 6 — Validation

37. Run `npm run lint` — fix all ESLint + TypeScript errors
38. Run `npm run build` — fix all build errors
39. Run `npm run test` — all tests green

---

## Files to Create (39 total)

```
app/
├── src/
│   ├── types/index.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── rbac.ts
│   │   ├── rbac.test.ts
│   │   ├── projectRules.ts
│   │   └── projectRules.test.ts
│   ├── store/
│   │   ├── useAuthStore.ts
│   │   ├── useProjectStore.ts
│   │   ├── useProjectStore.test.ts
│   │   ├── useTeamStore.ts
│   │   └── useAssignmentStore.ts
│   ├── data/
│   │   ├── seed-data.json   (copied from repo root)
│   │   └── seed.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── UserSwitcher.tsx
│   │   └── projects/
│   │       ├── StatusBadge.tsx
│   │       ├── PriorityIndicator.tsx
│   │       ├── TaskRow.tsx
│   │       ├── TaskList.tsx
│   │       ├── ProjectCard.tsx
│   │       ├── ProjectGrid.tsx
│   │       ├── ProjectDrawer.tsx
│   │       ├── TaskDrawer.tsx
│   │       └── DeleteConfirmDialog.tsx
│   ├── views/
│   │   └── ProjectsView.tsx
│   ├── App.tsx
│   └── main.tsx
```

---

## Risks & Unknowns

- **shadcn/ui multi-select**: No built-in multi-select component — will use `Command` + `Popover` pattern (standard shadcn pattern for this)
- **Zustand persist + seed hydration**: Must check `hasHydrated` before running seed to avoid overwriting user changes on hot reload
- **WCAG focus trap**: shadcn `Sheet` and `Dialog` handle this natively via Radix UI — verify keyboard navigation works end-to-end
