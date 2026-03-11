# QA Checklist — IT Capacity Planning Tool

> **Dev server**: `cd app && npm run dev` → http://localhost:5173
> **Reset seed data**: clear `localStorage` in DevTools → refresh
> **Test users** (via User Switcher, top-right):
> - Gunter — `admin`
> - Ross Geller — `team-member`
> - Chandler Bing — `viewer`

---

## 1. App Shell

- [ ] App loads with **Dashboard** as the default view (not Projects)
- [ ] Left sidebar shows four nav items: Dashboard · Projects · Team · Capacity
- [ ] Active nav item is visually highlighted and has `aria-current="page"`
- [ ] Clicking each nav item renders the correct view
- [ ] Header title updates to match the active view
- [ ] User Switcher (top-right) shows the current user's name and role badge
- [ ] Switching users updates the current user globally across all views
- [ ] Keyboard: Tab through sidebar links; Enter/Space activates them
- [ ] No horizontal scrollbar on any view at 1280 px wide

---

## 2. Dashboard

- [ ] **Stat cards** (top row): Projects · Tasks · Open Tasks · Blocked Tasks all show non-zero numbers from seed data
- [ ] "Blocked Tasks" card is **red** when count > 0 (seed has at least one `blocked`-status task)
- [ ] **Projects by Status** panel lists statuses with their counts (Inflight, Pending, Planning, etc.)
- [ ] "View all" link navigates to Projects tab
- [ ] **Dependency Blocks** panel lists tasks that have unmet dependencies (not the same as `blocked` status)
- [ ] Each blocked-by-dep row shows: task name + project name + "blocked by N" orange badge
- [ ] If no dependency blocks exist, shows green "No blocked tasks" message
- [ ] "View all" link navigates to Projects tab
- [ ] **Team Capacity** panel lists all 7 seed members sorted by utilization (highest first)
- [ ] Ross Geller (~119%) and Phoebe Buffay (~114%) appear at top with **red** badges
- [ ] Rachel Green (~93%) and Monica Geller (~97%) show **amber** badges
- [ ] "Full report" link navigates to Capacity tab
- [ ] As admin: no visible write actions anywhere on Dashboard (read-only)
- [ ] As viewer: identical experience (no difference since Dashboard is already read-only)

---

## 3. Projects Grid

### Filters & Sort
- [ ] All 3 seed projects appear in the grid on load
- [ ] **Filter by Status** dropdown narrows visible projects correctly
- [ ] **Filter by Priority** dropdown narrows visible projects correctly
- [ ] **Sort** by Name / Start Date / Priority toggles asc/desc on each click
- [ ] Clearing filters restores all projects
- [ ] Empty state message appears when filters match nothing

### Project Card
- [ ] Each card shows: name, status badge, priority indicator (arrow + label), start date
- [ ] Target end date shown only when set
- [ ] Task breakdown text: "X done · Y in progress · Z todo"
- [ ] Progress bar width matches the done % (all-done → full bar)
- [ ] Expand/collapse chevron toggles the task list inline
- [ ] **Admin only**: Status dropdown visible on card; non-admin sees read-only badge
- [ ] Status transition rules enforced:
  - [ ] Cannot set Paused if any task is `in-progress` → inline error
  - [ ] Cannot set Completed if any assigned task is not `done` → inline error
  - [ ] Non-admin cannot set Completed → inline error

### Create Project (admin / team-member)
- [ ] "New Project" button opens slide-out drawer from right
- [ ] Form has: Name\*, Description\*, Start Date\*, Priority\*, Target End Date (optional)
- [ ] Submitting empty required fields shows inline errors, does not save
- [ ] Duplicate project name (case-insensitive) shows inline error, does not save
- [ ] Valid submission: drawer closes, new card appears immediately in grid
- [ ] Viewer: "New Project" button is not visible

### Edit Project (admin / team-member)
- [ ] Pencil icon on card opens drawer pre-filled with existing values
- [ ] Editing name to match another project (case-insensitive) shows duplicate error
- [ ] Valid edit: drawer closes, card updates immediately

### Delete Project (admin / team-member)
- [ ] Delete icon on card shows confirmation dialog
- [ ] If project has tasks with active (non-done) assignments: delete **blocked**, error names the tasks
- [ ] If no active assignments: confirm → project and its tasks and assignments removed
- [ ] Viewer: delete icon not visible

---

## 4. Task List (inside Project Card)

### Display
- [ ] Tasks load inline when project is expanded
- [ ] Each task row shows: name, size badge (e.g. "M · 8h"), status badge, priority indicator, assigned member avatar chips
- [ ] Tasks with unmet dependencies show orange "Blocked by N" badge
- [ ] Assigned member avatar chips: initials, colour-coded (green/amber/red by utilization), max 3 + "+N" overflow
- [ ] Empty task list shows CTA prompt to add first task

### Filters & Search
- [ ] Search input filters tasks by name in real time
- [ ] Status dropdown filters correctly
- [ ] Priority dropdown filters correctly
- [ ] Combined filters work together

### Create Task (admin / team-member)
- [ ] "Add task" button opens task drawer
- [ ] Required: Name, Description; Size defaults to M, Priority to Medium
- [ ] Missing required fields shows inline errors
- [ ] Dependencies multi-select lists only sibling tasks (not itself, not tasks from other projects)
- [ ] Selected dependencies shown as badges below the picker
- [ ] "Save this task first" message shown in Assignments section when creating new
- [ ] New task appears in list immediately after save

### Edit Task (admin / team-member)
- [ ] Edit button opens drawer pre-filled
- [ ] Assignments section appears (edit mode only)
- [ ] All fields editable; changes persist on save
- [ ] Viewer: no edit button visible

### Delete Task (admin / team-member)
- [ ] Delete button shows confirmation dialog
- [ ] Confirm → task removed, assignments cascade-deleted
- [ ] Viewer: no delete button visible

### Bulk Delete (admin only)
- [ ] Checkboxes visible on task rows for admins only (hidden for team-member/viewer)
- [ ] Selecting tasks reveals bulk-delete toolbar
- [ ] Tasks with active (non-done) assignments trigger warning dialog listing affected tasks
- [ ] User can confirm to proceed or cancel; cancelling preserves all tasks
- [ ] Admin confirms → selected tasks and their assignments deleted

---

## 5. Task Assignments (inside Task Drawer — edit mode)

- [ ] Assignments section appears below divider in edit drawer
- [ ] Current assignments listed: member name + hours badge + Remove button
- [ ] "No one assigned yet" message when empty
- [ ] Add form: member select (only unassigned members) + hours input + Add button
- [ ] Adding with no member selected shows validation error
- [ ] Adding with invalid hours (0, negative, non-integer, > 999) shows validation error
- [ ] Valid add: assignment appears in list; task row avatar chip appears immediately
- [ ] When adding would push member above 110%: **amber warning** shown (but can still proceed)
- [ ] Remove button: assignment removed from list; avatar chip removed from task row
- [ ] All team members assigned → add form hides; "All team members are already assigned" shown
- [ ] Viewer: no Add / Remove controls (read-only list)

---

## 6. Team View

### Roster Table
- [ ] All 7 seed members load in the table: name, job title, hrs/week, utilization badge
- [ ] Utilization badges colour-coded: Ross/Phoebe → red; Rachel/Monica → amber; others → green
- [ ] Badge text always shows percentage (not colour-only)
- [ ] **Search** by name filters the table in real time
- [ ] **Filter by Utilization** dropdown: Healthy / At Risk / Overallocated filters correctly
- [ ] Empty state shown when no members match filters
- [ ] Viewer/team-member: no Edit/Delete buttons visible; table is read-only

### Create Team Member (admin only)
- [ ] "Add Member" button opens slide-out drawer
- [ ] Required: Name, Job Title, Hours/Week (1–80 integer)
- [ ] Optional: Start Date, End Date
- [ ] Missing required fields shows inline errors
- [ ] Hours outside 1–80 shows inline error
- [ ] Duplicate name (case-insensitive) shows inline error
- [ ] End date before start date shows inline error
- [ ] Valid save: drawer closes, new row appears in table

### Edit Team Member (admin only)
- [ ] Pencil icon opens drawer pre-filled
- [ ] Changes persist on save; table row updates immediately

### Delete Team Member (admin only)
- [ ] Trash icon shows confirmation dialog
- [ ] Member with active (non-done) assignments → **blocked**, error banner lists the task names
- [ ] Member with no active assignments → confirm → row removed, assignments cascade-deleted
- [ ] Error banner has a Dismiss button

---

## 7. Capacity Dashboard

### Summary Cards
- [ ] Four cards: Team Members (7) · Total Capacity (hrs) · Total Allocated (hrs) · Overallocated (2)
- [ ] "Overallocated" card is **red** (Ross + Phoebe)
- [ ] Sub-text on Total Allocated shows % of capacity
- [ ] Filtering by project recalculates all four cards

### Utilization Chart
- [ ] Horizontal bar chart renders with one bar per member
- [ ] Bars colour-coded: Ross/Phoebe red, Rachel/Monica amber, others green
- [ ] Percentage labels appear to the right of each bar (e.g. "119%")
- [ ] Dashed 100% reference line is visible
- [ ] Tooltip on hover shows member name, utilization %, allocated hours / capacity

### Allocation by Project Chart
- [ ] Stacked bar chart renders with one stacked bar per member
- [ ] Each project gets a distinct colour segment
- [ ] Legend shows project names
- [ ] Tooltip on hover shows member name + project name + hours
- [ ] Chart only appears when at least one project has assignments

### Filters
- [ ] "Filter by project" select defaults to "All Projects"
- [ ] Selecting a project: both charts and all summary cards update to show only that project's data
- [ ] Returning to "All Projects" resets to full team view

### Empty State
- [ ] When no assignments exist (after clearing localStorage), "No assignment data yet" message shown

---

## 8. RBAC — Role Switching

Switch user via the top-right User Switcher and verify:

| Feature | Admin (Gunter) | Team Member (Ross) | Viewer (Chandler) |
|---------|---------------|-------------------|-------------------|
| Create project | ✅ visible | ✅ visible | ❌ hidden |
| Edit project fields | ✅ | ✅ | ❌ |
| Change project status | ✅ dropdown | ❌ read-only badge | ❌ read-only badge |
| Delete project | ✅ | ✅ | ❌ |
| Create task | ✅ | ✅ | ❌ |
| Edit task | ✅ | ✅ | ❌ |
| Delete task | ✅ | ✅ | ❌ |
| Bulk-delete tasks | ✅ checkboxes visible | ❌ hidden | ❌ hidden |
| Add/remove assignments | ✅ | ✅ | ❌ read-only |
| Add team member | ✅ | ❌ | ❌ |
| Edit team member | ✅ | ❌ | ❌ |
| Delete team member | ✅ | ❌ | ❌ |

---

## 9. Data Persistence

- [ ] Create a project, refresh the page → project still visible
- [ ] Add a task, refresh → task still visible
- [ ] Add an assignment, refresh → assignment and avatar chip still visible
- [ ] Edit a team member, refresh → updated values persisted
- [ ] Switch user, refresh → selected user remembered

### Reset
- [ ] Open DevTools → Application → Local Storage → clear all `capacity-planner-*` keys → refresh → seed data reloads

---

## 10. Accessibility

- [ ] All views navigable with **Tab** key only (no mouse)
- [ ] Sidebar links have visible **focus rings**
- [ ] Drawers and dialogs **trap focus** — Tab cycles within the panel; Escape closes
- [ ] All icon-only buttons have `aria-label` (edit pencil, delete trash, remove X)
- [ ] Status and priority badges convey information via text, not colour alone
- [ ] Utilization badges show percentage text alongside colour
- [ ] Form fields have associated `<label>` elements
- [ ] Inline validation errors use `role="alert"` (announced to screen readers immediately)
- [ ] Charts have `role="img"` with descriptive `aria-label`
- [ ] Progress bar on project card has accessible text (percentage shown)

---

## 11. Edge Cases

- [ ] Project with zero tasks: progress bar at 0%, breakdown shows "0 done · 0 in progress · 0 todo"
- [ ] Task with no assignments: no avatar chips shown, no blocking on delete
- [ ] Member with no assignments: utilization shows 0% · Healthy
- [ ] Deleting the last task in a project: expanded panel shows empty state CTA
- [ ] All tasks done: progress bar full (100%), project can be set to Completed by admin
- [ ] Circular dependency potential: task A depends on B, B depends on A — both show "blocked by 1" badge (no infinite loop)
- [ ] Very long project/task names: truncate with ellipsis, no layout overflow
- [ ] Creating a project name that matches an existing one in different case (e.g. "central perk digital transformation") → duplicate error
