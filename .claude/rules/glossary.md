# Glossary

Project-specific terminology for the IT Capacity Planning Tool.

---

## Roles

| Term | Definition |
|------|------------|
| admin | Full access: manage users, all projects, all team members, all reports |
| planner | Can create/edit projects, tasks, assignments, and team members. Cannot manage user accounts |
| viewer | Read-only. Can see all dashboards and reports. Linked to a TeamMember via `teamMemberId` |

## Domain Terms

| Term | Definition |
|------|------------|
| Project | A named body of work with a start date, description, and status. Contains tasks |
| Task | A unit of work within a project. Has a t-shirt size estimate, assignees, optional dependencies, and a status |
| TeamMember | A person on the IT team. Has a name, role, and `hoursPerWeek` availability |
| Assignment | The link between a Task and a TeamMember. Stores `hoursAllocated` — how many of the task's total hours belong to that person |
| Capacity | A TeamMember's total available hours over a given time window (`hoursPerWeek × weeks`) |
| Utilization | `totalAssignedHours / capacity × 100`. Expressed as a percentage. Over 100% = overallocated |
| Overallocated | A TeamMember whose utilization exceeds 100% in the planning window |
| T-shirt Size | The estimation unit for tasks: S=4h, M=8h, L=16h, XL=32h, XXL=40h. Defined in `TSHIRT_HOURS` |
| Planning Window | The time period used to calculate utilization. Defaults to the current quarter (13 weeks) |
| Quarter | 13 weeks. Used as the default aggregate capacity view |

## Technical Terms

| Term | Definition |
|------|------------|
| `useProjectStore` | Zustand store for projects and tasks |
| `useTeamStore` | Zustand store for team members |
| `useAssignmentStore` | Zustand store for assignments |
| `useAuthStore` | Zustand store for the active user (RBAC) |
| `capacity.ts` | Pure functions for all capacity/utilization math. Single source of truth |
| `TSHIRT_HOURS` | Constant map of t-shirt size → hours in `src/lib/constants.ts` |
| `can(user, action)` | RBAC helper in `src/lib/rbac.ts`. Returns boolean. Used before any write operation |
| seed data | `seed-data.json` — the Friends cast demo dataset. Loaded on first app boot |

## Abbreviations

| Abbreviation | Meaning |
|---|---|
| SPA | Single-Page Application — this app has no server |
| RBAC | Role-Based Access Control |
| ERD | Entity Relationship Diagram |
