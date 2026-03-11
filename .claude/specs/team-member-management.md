# Feature: Team Member Management

> **Status**: Approved
> **Spec file**: `.claude/specs/team-member-management.md`
> **Prerequisite**: Project & Task Management

## Problem

Managers need a single place to maintain the roster of people available to work, their job titles, and weekly available hours. Without this, capacity calculations have no foundation and assignments cannot be made to real people.

## Users & Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| admin | Create, edit, delete team members | Nothing blocked |
| Team Member | View team roster | Create, edit, or delete team members |
| viewer | View team roster | Create, edit, or delete team members |

## User Stories

- As an **admin**, I want to add a team member with name, job title, and weekly available hours so capacity can be calculated
- As an **admin**, I want to edit a team member's details when their situation changes
- As an **admin**, I want to delete a team member who has left the team
- As **any user**, I want to see the team roster with each member's current utilization so I understand who is busy

## Acceptance Criteria

### Team Roster
- [ ] Team view displays all team members in a table: name, job title, hours/week, utilization %, actions
- [ ] Utilization = total `hoursAllocated` across all assignments for the member ÷ (`hoursPerWeek` × `QUARTER_WEEKS`)
- [ ] Utilization badge is color-coded: green < 90 %, yellow 90–110 %, red > 110 %
- [ ] Color is never the sole conveyor of information — badge always shows the percentage text
- [ ] Table supports search by name and filter by utilization level (all / healthy / at-risk / overallocated)
- [ ] Empty state shows a prompt for admin to add the first team member

### Create / Edit
- [ ] Admin can open a slide-out drawer to create a new team member
- [ ] Required fields: name, job title, hours per week (1–80, integer)
- [ ] Optional fields: start date, end date
- [ ] Admin can edit any field of an existing team member via the same drawer
- [ ] Inline validation: name required, hours 1–80, end date must be after start date if both set
- [ ] Duplicate name check is case-insensitive — blocks save with inline error

### Delete
- [ ] Admin sees a Delete button on each row (confirmation dialog required)
- [ ] Deleting a team member who has assignments on non-`done` tasks is **blocked** — error message lists the task names preventing deletion
- [ ] Deleting a team member with no active assignments cascade-deletes their assignments

### Data Persistence
- [ ] All changes persist across page refreshes (localStorage via Zustand persist)
- [ ] Seed data populates on first boot (same guard as projects)

### Accessibility
- [ ] All interactive elements keyboard-accessible
- [ ] ARIA labels on all icon-only buttons
- [ ] Focus trapped in drawers and dialogs
- [ ] Minimum 4.5:1 contrast ratio on text

## Data Model

No changes required — uses existing `TeamMember` and `Assignment` types:

```typescript
TeamMember {
  id: string
  name: string
  role: string          // job title
  hoursPerWeek: number  // 1–80
  startDate?: string    // ISO date, optional
  endDate?: string      // ISO date, optional
}

Assignment {
  id: string
  taskId: string
  memberId: string      // TeamMember.id
  hoursAllocated: number
}
```

## UI / UX Notes

- **Layout**: Table with columns — Name | Job Title | Hrs/Week | Utilization | Actions
- **Utilization badge**: pill badge showing percentage; green/yellow/red with text always present
- **Create / Edit**: slide-out `Sheet` drawer from the right (same pattern as project/task drawers)
- **Delete**: shadcn `Dialog` confirmation — same `DeleteConfirmDialog` component
- **Search & filter**: search input (name) + utilization filter dropdown above the table
- **Row actions**: Edit (pencil icon) and Delete (trash icon) — admin only; tooltips for accessibility

## Utilization Thresholds

| Level | Range | Badge color |
|-------|-------|-------------|
| Healthy | < 90 % | green |
| At-risk | 90 % – 110 % | yellow |
| Overallocated | > 110 % | red |

Thresholds defined in `src/lib/constants.ts` as `UTILIZATION_HEALTHY = 0.9` and `UTILIZATION_OVERALLOCATED = 1.1`.

## Notes

- Capacity math: `utilization = totalHours / (member.hoursPerWeek × QUARTER_WEEKS)`
- `QUARTER_WEEKS = 13` (already in `constants.ts`)
- Utilization is read-only in this feature — assignment management is in the next spec
- The `DeleteConfirmDialog` component is reusable — no new dialog component needed
- shadcn/ui components: `Sheet`, `Dialog`, `Badge`, `Table` (or plain styled div-table)
