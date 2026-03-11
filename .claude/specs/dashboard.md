# Feature: Dashboard

> **Status**: Approved
> **Spec file**: `.claude/specs/dashboard.md`
> **Prerequisites**: All other features

## Problem

Users land on a placeholder screen. There is no single place to quickly see the health of all projects and the team without navigating to each tab individually.

## Users & Roles

All roles can view the Dashboard — it is read-only for everyone.

## User Stories

- As **any user**, I want to see a health snapshot of all work when I open the app, so I know immediately if anything needs attention
- As a **manager**, I want to see overallocated team members highlighted at the top so I can act quickly
- As **any user**, I want to see blocked tasks across all projects in one list so nothing gets lost

## Acceptance Criteria

### Summary Stats Row
- [ ] Four stat cards in a row (2×2 on smaller screens):
  1. **Projects** — total project count
  2. **Tasks** — total task count
  3. **Open Tasks** — tasks with status `todo` or `in-progress`
  4. **Blocked Tasks** — tasks with status `blocked` — coloured red when > 0

### Project Status Breakdown
- [ ] Card showing count of projects per status (Planning / Pending / Inflight / Paused / Completed)
- [ ] Each status shown as a row: status label + count badge
- [ ] Clicking a status navigates to Projects view (future: filtered — for now, just navigates)

### Team Capacity Snapshot
- [ ] Card listing all team members with their utilization %
- [ ] Overallocated members (> 110 %) shown with red badge at top
- [ ] At-risk members (90–110 %) shown with amber badge
- [ ] Healthy members shown last with green badge
- [ ] "All clear" message shown if no members are overallocated
- [ ] Clicking "View Team" navigates to Team tab

### Blocked Tasks Panel
- [ ] Card listing tasks that have unmet dependencies (dependency badge logic, not status field)
- [ ] Each row: task name + project name + "blocked by N" badge
- [ ] Empty state: "No blocked tasks — everything is unblocked"
- [ ] Clicking "View Projects" navigates to Projects tab

### Navigation
- [ ] Dashboard is the default landing view (replaces `projects` as the initial `activeView`)
- [ ] CTA links in each panel navigate to the relevant tab

### Accessibility
- [ ] All stat card values have `aria-label`
- [ ] Section headings use proper heading hierarchy

## UI / UX Notes

- **Layout**: full-width two-column grid below the stats row — left: project status + blocked tasks; right: team capacity
- **No new data** — all derived from existing stores and lib functions
- **No drawers, no forms** — pure read display
- shadcn/ui: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Button`
