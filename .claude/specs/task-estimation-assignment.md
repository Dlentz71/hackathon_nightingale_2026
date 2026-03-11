# Feature: Task Estimation & Assignment

> **Status**: Approved
> **Spec file**: `.claude/specs/task-estimation-assignment.md`
> **Prerequisites**: Project & Task Management, Team Member Management

## Problem

Tasks exist and team members exist, but there is no way to say "Ross is doing this task and has 16 hours allocated to it." Without assignments, the capacity dashboard has nothing to visualise and managers cannot see who is over- or under-allocated.

## Users & Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| admin | Add / remove assignments on any task | Nothing blocked |
| Team Member | Add / remove assignments on any task | Nothing blocked |
| viewer | View assignments | Add or remove assignments |

## User Stories

- As an **admin / Team Member**, I want to assign one or more team members to a task and specify the hours each person is allocated, so capacity can be calculated
- As an **admin / Team Member**, I want to remove an assignment when a person is no longer working on a task
- As **any user**, I want to see who is assigned to a task at a glance in the task list
- As an **admin / Team Member**, I want to be warned (not blocked) when an assignment would push a member over 110 % utilization

## Acceptance Criteria

### Assignment Management
- [ ] Assignments section appears in the task drawer **only when editing an existing task** (a task must be saved before it can be assigned); when creating, a note prompts the user to save the task first
- [ ] Section lists current assignments: member name + hours allocated + Remove button
- [ ] "Add Assignment" inline form: team member select (lists all team members not already assigned to this task) + hours input (positive integer, max 999)
- [ ] Clicking Add saves the assignment immediately to the store and updates `Task.assignmentIds`
- [ ] Removing an assignment deletes it from the store and updates `Task.assignmentIds`
- [ ] If adding the assignment would push the member's utilization above 110 %, show an inline amber warning — user can still proceed
- [ ] Viewer role: assignments are displayed read-only (no Add / Remove controls)

### Task Row Display
- [ ] Task row shows initials avatars for each assigned team member (max 3 shown, "+N more" if more)
- [ ] Avatars have `aria-label="Assigned to: Name1, Name2"` for accessibility

### Capacity Math
- [ ] All utilization / allocation calculations live in `src/lib/capacity.ts`
- [ ] `getMemberUtilization(member, assignments)` — ratio of total assigned hours to quarterly capacity
- [ ] `getProjectedUtilization(member, assignments, additionalHours)` — hypothetical after adding hours
- [ ] All functions in `capacity.ts` have Vitest unit tests

### Data Persistence
- [ ] All changes persist via Zustand persist (localStorage)

## Data Model

No changes — uses existing models:

```typescript
Assignment {
  id: string
  taskId: string
  memberId: string
  hoursAllocated: number   // positive integer
}

// Task.assignmentIds: string[] is kept in sync
```

## UI / UX Notes

- **Assignments section**: appears below the Divider at the bottom of the task drawer edit form, with heading "Assignments"
- **Assignment list row**: member name (left) | hours badge | Remove button (right)
- **Add form**: inline row — member Select + hours Input (w-20) + Add button; only shown to admin / team-member
- **Over-allocation warning**: amber `Alert` component directly above the Add button when the selected member's projected utilization would exceed 110 %
- **Task row avatars**: small circles (h-6 w-6) with member initials, coloured by utilization level (green / yellow / red), shown as a stacked chip list after the priority indicator
- **Separator**: divider between task form fields and assignments section in the drawer

## Notes

- `getMemberUtilization` was previously in `teamRules.ts` — move it to `capacity.ts` and update `teamRules.ts` to import from there
- `QUARTER_WEEKS`, `UTILIZATION_HEALTHY`, `UTILIZATION_AT_RISK` — already in `constants.ts`
- shadcn/ui: `Separator`, `Alert` (add if not present), `Avatar` (use simple initials div to avoid extra install)
- Assignment ID generation: `crypto.randomUUID()`
