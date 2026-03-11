# Code Style

> Customize these rules for your project and stack. Remove sections that don't apply.
> These should reflect decisions your team has made — not general best practices Claude already knows.

## General

- Prefer explicit over implicit — if the intent isn't obvious, make it obvious
- Keep functions small and focused — one thing, done well
- Prefer `const` over mutable variables wherever possible
- Delete dead code — don't comment it out

## Naming

> Adapt these to your language's conventions.

- Variables and functions: `camelCase` (JS/TS) or `snake_case` (Python/Go)
- Types/Classes/Components: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Files: match the primary export (e.g. `UserCard.tsx`, `user_service.py`)
- Boolean variables: prefix with `is`, `has`, `can`, `should` (e.g. `isLoading`, `hasPermission`)

## Imports & Dependencies

- Group imports: standard library → external packages → internal modules → relative
- Remove unused imports — no dead imports
- [Add your path alias convention here, e.g. `@/` for src/]

## [Frontend — remove if not applicable]

- Server/async components by default — only add client-side rendering when necessary
- Keep components under ~200 lines — extract sub-components if larger
- Co-locate component tests and styles with the component file
- Use a utility function (e.g. `cn()`) for conditional class merging

## [Backend/API — remove if not applicable]

- Validate all inputs at the boundary — never trust incoming data
- Return consistent response shapes across all endpoints
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 409, 500)

## [Database — remove if not applicable]

- Table names are singular: `user`, `order_item`, `session`
- Every table has `created_at` and `updated_at`
- All queries go through the ORM — no raw string interpolation

## Comments

- Don't comment what the code does — comment **why** if the reason isn't obvious
- If you need a comment to explain logic, consider if the logic can be clearer first
- TODO comments must include an owner or ticket: `// TODO(tyler): fix after #123`
