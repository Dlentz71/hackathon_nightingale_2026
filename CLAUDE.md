# IT Capacity Planning Tool

A desktop-first web application for IT teams to plan projects, estimate effort, assign team members, and visualize capacity across multiple projects and quarters.

## Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build locally
npm run test     # Run Vitest test suite
npm run lint     # ESLint + TypeScript check
```

## Stack

- **Language**: TypeScript
- **Framework**: React 18 + Vite
- **State & Persistence**: Zustand with `persist` middleware → localStorage
- **UI Components**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library
- **Auth**: None (role selected via user switcher in UI)
- **Deployment**: Local only (`npm run dev`)

## Architecture

- Single-page app — no router needed beyond tab/view switching
- All state lives in Zustand stores: `useProjectStore`, `useTeamStore`, `useAssignmentStore`, `useAuthStore`
- Capacity calculation logic lives in `src/lib/capacity.ts` — pure functions, fully testable
- UI is split into views: Dashboard, Projects, Team, Capacity Report
- `src/data/seed.ts` imports `seed-data.json` and hydrates the store on first load
- `src/lib/rbac.ts` exports a `can(user, action)` helper used by all write operations

## Important Gotchas

- Zustand `persist` serializes to localStorage under the key `capacity-planner-store` — clear localStorage to reset to seed data
- `seed-data.json` is the source of truth for demo data; do not modify it at runtime
- T-shirt size → hours mapping lives in `src/lib/constants.ts` as `TSHIRT_HOURS` — change it there, nowhere else
- shadcn/ui components are added via `npx shadcn-ui@latest add <component>` — do not hand-write them
- Recharts requires a fixed pixel height on chart containers — use `h-[300px]` or similar, not `h-full`

## Required Engineering Standards

**NEVER commit changes unless explicitly asked.**

**ALWAYS use the `frontend-design` skill when creating or editing any UI.**

All capacity calculation functions in `src/lib/capacity.ts` MUST have Vitest unit tests.

Reusable UI patterns → extract to `src/components/ui/` (shadcn) or `src/components/` (project-specific).

Do not duplicate capacity math — all utilization, timeline, and allocation calculations go through `src/lib/capacity.ts`.

Pages that are not full-width must be centered — never hug the left edge.

## Rules

- @.claude/rules/code-style.md
- @.claude/rules/testing.md
- @.claude/rules/security.md
- @.claude/rules/git-workflow.md
- @.claude/rules/glossary.md
