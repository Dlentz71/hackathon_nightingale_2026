# Git Workflow

## Branches

> Adapt branch naming to your team's convention.

- `main` — production, always deployable, protected
- `feature/description` — new features (e.g. `feature/user-dashboard`)
- `fix/description` — bug fixes (e.g. `fix/login-redirect`)
- `chore/description` — tooling, deps, config
- `docs/description` — documentation only

## Commits

Use **Conventional Commits** format:

```
feat: add user authentication flow
fix: correct date formatting in reports
chore: upgrade dependencies
docs: add API endpoint documentation
refactor: extract validation into shared utility
test: add unit tests for billing calculations
```

Rules:
- One logical change per commit
- Present tense, lowercase, no period at the end
- Describe **why**, not just what changed
- Do NOT include "Co-Authored-By" in commit messages

## Pull Requests

- PR title follows the same conventional commit format
- Link to the relevant spec: `.claude/specs/feature-name.md`
- Must pass CI (lint, tests, build) before merging
- Squash and merge into main

## Never

- Force push to `main`
- Commit `.env` files, secrets, or credentials
- Merge without CI passing
- Commit unless the user explicitly asks
