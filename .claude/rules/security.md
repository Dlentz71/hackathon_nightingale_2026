# Security Rules

These rules apply to all code written for this project. They are not suggestions.

## Authentication

- Every protected route or endpoint must verify the session/token before doing anything
- Use your auth library's official session helper — never trust client-supplied user IDs
- Session checks happen server-side. A client saying "I'm an admin" means nothing.

```
// Pattern: check session first, use session data — not request data
const session = getSession(request)
if (!session) return unauthorized()
const userId = session.userId  // ✅ from session
// NOT: const userId = request.body.userId  ❌ never trust this
```

## Authorization

- After confirming *who* a user is, confirm *what* they're allowed to do
- Role checks are always server-side — never rely on client-side role state
- When in doubt, deny access (fail closed, not open)

## Input Validation

- All user input is validated before use — no exceptions
- Validate on both the client (UX feedback) and the server (actual security)
- Never pass raw user input directly into a database query

## Secrets & Credentials

- Never hardcode API keys, tokens, or passwords in source code
- Store secrets in environment variables — not in config files committed to the repo
- Never commit `.env` files
- `NEXT_PUBLIC_*` / client-visible env vars: never put secrets there

## API Responses

- Never return password hashes, internal tokens, or unnecessary fields in API responses
- Select only the fields you need — don't return entire database rows
- Error messages must not leak stack traces or internal details in production

## Database

- All queries should use parameterized inputs — no string interpolation in SQL
- If using an ORM, let it handle parameterization; audit any raw query usage

## Dependencies

- Review new dependencies before adding them — check for active maintenance and CVEs
- Prefer well-audited packages with small dependency trees

## When You Find a Vulnerability

1. Do not commit a partial fix
2. Note the severity: Critical / Medium / Low
3. Document it in `.claude/docs/security-audit-report.md`
4. Fix it completely, then run `/security-audit` to verify it's resolved
