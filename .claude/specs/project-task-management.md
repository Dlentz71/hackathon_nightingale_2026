# Feature: Project & Task Management

> **Status**: Approved
> **Spec file**: `.claude/specs/project-task-management.md`

## Problem

IT teams have no single place to create projects, break them into tasks, and see all work in one list. Without this foundation, there is nothing to assign people to or calculate capacity against.

## Users & Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| admin | Create, edit, delete any project or task; bulk delete tasks; manage all project status transitions including Completed | Nothing blocked |
| Team Member | Create, edit, delete projects and tasks; edit project fields (name, description, priority, dates) | Manage project status; bulk task operations; mark project as Completed |
| viewer | Browse all projects and task lists | Create, edit, or delete anything |

## User Stories

- As a **Team Member**, I want to create a project with a name, description, start date, and priority so I can organise work
- As a **Team Member**, I want to add tasks to a project with a name, description, t-shirt size, and priority
- As a **Team Member**, I want to edit or delete a task so I can keep the list accurate
- As a **Team Member**, I want to view all tasks in a project as an inline expandable list so I can see the full scope of work
- As a **Team Member**, I want to search and filter the task list by name, status, and priority
- As a **Team Member**, I want to set task dependencies via a multi-select dropdown so I can model blocked work
- As an **admin**, I want to advance a project through its status workflow so stakeholders know where things stand
- As an **admin**, I want to mark a project as Completed once all assigned tasks are done
- As an **admin**, I want to bulk-delete tasks so I can clean up efficiently
- As a **viewer**, I want to browse all projects and task lists so I can stay informed

## Acceptance Criteria

### Projects
- [ ] A Team Member or admin can create a project with name (required), description (required), start date (required), target end date (optional), priority (required, defaults to Medium)
- [ ] Project names must be unique — case-insensitive duplicate check shows an inline error and blocks save
- [ ] A project card appears in the grid immediately after creation
- [ ] A Team Member or admin can edit project fields (name, description, start date, target end date, priority) via a slide-out drawer
- [ ] Only an **admin** can change project status
- [ ] Project status workflow: `Planning → Pending → Inflight → Paused → Completed`
- [ ] A project can only be set to `Paused` if it has no tasks in `in-progress` status
- [ ] Only an **admin** can set a project to `Completed` — requires all assigned tasks to be `done`
- [ ] Deleting a project whose tasks have no active assignments (or all assigned tasks are `done`) cascade-deletes its tasks and assignments
- [ ] Deleting a project that has tasks with assignments on non-`done` tasks is blocked — error message names the tasks preventing deletion
- [ ] Projects grid supports filter by status and priority, and sort by priority, start date, or name (ascending/descending)

### Tasks
- [ ] A Team Member or admin can add a task with name (required), description (required), t-shirt size (required, defaults to M), priority (required, defaults to Medium)
- [ ] Tasks appear as an inline expandable panel on the project card showing name, size, status, priority, and dependency badge
- [ ] An empty task list shows a prompt/CTA to add the first task
- [ ] A Team Member or admin can edit any task field via a slide-out drawer
- [ ] Task drawer includes a multi-select dropdown listing all other tasks in the same project for setting dependencies
- [ ] A Team Member or admin can delete a task with a confirmation prompt
- [ ] Task status workflow: `todo | in-progress | blocked | done`
  - `blocked` is a **manual** status set by the user (e.g. waiting on an external dependency)
  - Dependency enforcement is **separate** — a task with unmet dependencies cannot be moved to `in-progress` regardless of its status field
- [ ] When all of a task's dependencies move to `done`, the dependency badge clears automatically — user still manually advances the task status
- [ ] Tasks with unmet dependencies show a "blocked by N tasks" badge on the task row
- [ ] Task list supports search by name and filter by status and priority
- [ ] Admin can select multiple tasks via checkboxes and bulk-delete
  - If any selected tasks have assignments on non-`done` tasks, show a warning: "X tasks have active assignments — deleting them will also remove those assignments. Continue?"
  - User can confirm to proceed or cancel
- [ ] All changes persist across page refreshes (localStorage)
- [ ] All interactive elements meet WCAG 2.2 AA: keyboard navigable, ARIA-labelled, focus trapped in drawers/dialogs, colour is never the sole conveyor of information, minimum 4.5:1 contrast ratio

### Project Card
- [ ] Each project card displays: name, status badge, priority indicator, start date, target end date (if set)
- [ ] Task count shown as a status breakdown: `X done · Y in progress · Z todo`
- [ ] Progress bar showing percentage of tasks in `done` status

## Out of Scope

- Bulk task operations for non-admin roles
- Task reordering beyond priority sorting
- Project archiving (separate from Completed status)
- Move tasks between projects
- Task comments or activity log
- Notifications or alerts for status changes

## Data Model Changes

```typescript
Project {
  id: string
  name: string                    // required, unique (case-insensitive)
  description: string             // required
  startDate: string               // ISO date string, required
  targetEndDate?: string          // ISO date string, optional
  status: 'planning' | 'pending' | 'inflight' | 'paused' | 'completed'
  priority: 'high' | 'medium' | 'low'
  createdBy: string               // userId
  updatedBy: string               // userId
  createdAt: string
  updatedAt: string
}

Task {
  id: string
  projectId: string
  name: string                    // required
  description: string             // required
  estimate: { size: 'S'|'M'|'L'|'XL'|'XXL', hours: number }
  status: 'todo' | 'in-progress' | 'blocked' | 'done'
  priority: 'high' | 'medium' | 'low'
  assignmentIds: string[]
  dependencies: string[]          // taskIds that must be 'done' before this task can move to 'in-progress'
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}
```

## UI / UX Notes

- **Layout**: Left sidebar navigation — tabs: Dashboard | Projects | Team | Capacity
- **Projects view**: Cards in a responsive grid, each showing name, status badge, priority indicator, start date, target end date (if set), task status breakdown, and progress bar
- **Task list**: Inline expandable panel on each project card. Collapsed by default, expands to show task rows with name, size, status, priority, and dependency badge
- **Create / Edit**: Slide-out drawer panel from the right — used for both projects and tasks. Task drawer includes a multi-select dependency picker listing other tasks in the same project
- **Search & filter**: Filter bar above the task list (search input + status dropdown + priority dropdown); projects grid has sort controls (priority, start date, name — asc/desc) in addition to status/priority filters
- **Bulk select**: Checkbox on each task row, visible on hover. Bulk action toolbar appears when ≥1 task selected (admin only). Confirms with warning if any selected tasks have active assignments
- **Project status controls**: Status dropdown visible only to admins. Transition rules enforced with inline error messages
- **Accessibility**: WCAG 2.2 AA — all controls keyboard accessible, ARIA labels on all interactive elements, focus trapped in drawers and dialogs, colour is never the sole conveyor of information, minimum 4.5:1 contrast ratio on text

## Open Questions

- [x] Projects grid supports sorting by priority, start date, and name (ascending/descending) — **yes**
- [x] Task dependencies are both enforced as a rule AND shown as a visual badge — **yes**
- [x] `blocked` status vs dependency blocking are separate concerns — **confirmed**
- [x] Active assignments = assignments on non-`done` tasks — **confirmed**
- [x] Dependency UX = multi-select dropdown in the task drawer — **confirmed**
- [x] When dependency completes = badge clears automatically, user advances manually — **confirmed**
- [x] `targetEndDate` is optional on Project — **confirmed**
- [x] Only admins manage project status transitions — **confirmed**
- [x] Bulk delete with active assignments = warning dialog, user confirms — **confirmed**
- [x] Project card = status breakdown + progress bar — **confirmed**
- [x] Duplicate project name check is case-insensitive — **confirmed**

## Notes

- T-shirt size → hours mapping is defined in `src/lib/constants.ts` as `TSHIRT_HOURS` — do not hardcode anywhere else
- Project uniqueness check runs against the Zustand store — case-insensitive (`name.toLowerCase()`)
- shadcn/ui components: `Sheet` for drawer, `Dialog` for confirmation/warning prompts, `Checkbox` for bulk select, `Progress` for task progress bar, `Badge` for status and dependency indicators
- At least one task in seed data should have `status: "blocked"` to demo that state
- This spec is a prerequisite for: Team Member Management, Task Estimation & Assignment, Capacity Dashboard
