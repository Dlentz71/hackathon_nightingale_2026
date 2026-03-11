# Feature: Capacity Dashboard

> **Status**: Approved
> **Spec file**: `.claude/specs/capacity-dashboard.md`
> **Prerequisites**: Project & Task Management, Team Member Management, Task Estimation & Assignment

## Problem

Managers have no way to see — at a glance — who is over-allocated, which projects are consuming the most capacity, and whether the team can take on more work. This is the core value proposition of the tool.

## Users & Roles

All roles (admin, team-member, viewer) can view the Capacity Dashboard — it is read-only.

## User Stories

- As a **manager**, I want to see a summary of total team capacity, total allocated hours, and how many members are overallocated so I can act immediately
- As a **manager**, I want a bar chart showing each team member's utilization percentage so I can spot bottlenecks at a glance
- As a **manager**, I want to see how many hours each member is allocated to each project so I can rebalance
- As a **manager**, I want to filter the view by a specific project to focus on that project's team load

## Acceptance Criteria

### Summary Cards
- [ ] Four stat cards displayed in a row:
  1. **Team Members** — total headcount
  2. **Total Capacity** — sum of all members' quarterly capacity in hours (hrs)
  3. **Total Allocated** — sum of all `hoursAllocated` across all assignments (hrs)
  4. **Overallocated** — count of members with utilization > 110 %, coloured red when > 0
- [ ] Cards are responsive — stack to 2×2 on smaller screens

### Team Utilization Chart
- [ ] Horizontal bar chart (one bar per team member)
- [ ] X axis: utilization percentage (0 – max needed, at least 150 %)
- [ ] Y axis: member names
- [ ] Reference line at 100 %
- [ ] Each bar coloured: green < 90 %, yellow 90–110 %, red > 110 %
- [ ] Bar label shows exact percentage (e.g. "87 %")
- [ ] Chart height fixed at 320 px (Recharts requirement)
- [ ] Chart title: "Team Utilization"

### Allocation by Project Chart
- [ ] Stacked horizontal bar chart (one bar per team member)
- [ ] Each stack segment = one project (distinct colour per project, up to 6 projects)
- [ ] X axis: hours allocated
- [ ] Y axis: member names
- [ ] Legend shows project names
- [ ] Tooltip shows member name, project name, and hours on hover
- [ ] Chart height fixed at 320 px
- [ ] Chart title: "Allocation by Project"

### Filters
- [ ] "Filter by project" select above both charts (default: All Projects)
- [ ] When a project is selected, both charts recalculate to show only that project's assignments
- [ ] Summary cards also update to reflect the filtered data

### Accessibility
- [ ] Charts are wrapped in `role="img"` containers with descriptive `aria-label`
- [ ] Summary card values are read by screen readers (use `aria-label` on the value)
- [ ] Color is never the sole conveyor of information — bar labels and tooltips provide the data

## Data Model

No changes — reads from existing stores. New pure functions added to `src/lib/capacity.ts`:

```typescript
interface TeamCapacitySummary {
  memberCount: number
  totalCapacityHours: number
  totalAllocatedHours: number
  overAllocatedCount: number
}

interface MemberAllocationRow {
  memberId: string
  memberName: string
  utilization: number        // ratio 0–∞
  allocatedHours: number
  capacityHours: number
  byProject: Record<string, number>   // projectId → hoursAllocated
}

function getTeamCapacitySummary(members, assignments): TeamCapacitySummary
function getMemberAllocationRows(members, assignments, tasks, projects): MemberAllocationRow[]
```

## UI / UX Notes

- **Layout**: Full-width single column — cards row → utilization chart card → allocation chart card
- **Chart colours**: Use a fixed 6-colour palette for project segments (Tailwind-compatible hex values)
- **Project filter**: `Select` above the charts, default "All Projects"
- **Empty state**: If no assignments exist, show a friendly prompt to add assignments
- **Chart container**: `h-[320px]` wrapper with `ResponsiveContainer width="100%" height="100%"`
- **Recharts components**: `BarChart`, `Bar`, `Cell`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ReferenceLine`, `ResponsiveContainer`, `LabelList`

## Notes

- `QUARTER_WEEKS = 13` is the reference window for capacity
- `UTILIZATION_HEALTHY = 0.9`, `UTILIZATION_AT_RISK = 1.1` — from `constants.ts`
- All capacity math must go through `capacity.ts` — no inline calculations in the view
- shadcn/ui: `Card`, `CardHeader`, `CardTitle`, `CardContent` for summary cards and chart containers
