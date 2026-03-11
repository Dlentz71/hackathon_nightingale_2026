# Testing

> Adapt the test runner and file conventions to your stack.

## General

- **All new features and enhancements MUST include tests** — this is non-negotiable
- Write tests alongside implementation — not after
- Test **behavior**, not implementation details
- Tests must be deterministic and idempotent
- No real network calls, database writes, or external API calls — mock everything external

## File Conventions

> Adapt to your stack:
> - JS/TS: `*.test.ts` or `*.spec.ts`, co-located with source
> - Python: `test_*.py` in a `/tests` folder or co-located
> - Go: `*_test.go` co-located with source

- Co-locate test files with the source they test when possible
- Name tests to describe behavior: `"returns 404 when user not found"`, not `"test user"`

## What to Test

- All API endpoints / route handlers — happy path + error cases + auth checks
- Core business logic functions
- Input validation / schema validation
- Permission and authorization boundaries

## What Not to Test

- Third-party library internals
- Static UI with no logic
- Trivial getters/setters with no logic

## Coverage

- Aim for >80% on core business logic
- 100% of happy paths on critical user flows (auth, payments, data mutations)
- Don't chase coverage numbers — chase confidence

## Test Structure (Arrange / Act / Assert)

```
// Arrange — set up the scenario
// Act — trigger the behavior
// Assert — verify the outcome
```

Keep each test focused on one behavior. If a test needs a long setup, extract a helper.
