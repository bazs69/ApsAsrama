## Overview

This Next.js + Prisma dormitory management platform uses a **uniform result-object pattern** for error handling across all server-side operations. There is no centralized error framework, custom error class hierarchy, or middleware-based error boundary system. Instead, every Server Action and API route wraps its logic in `try/catch` blocks and returns structured `{ success: ... }` or `{ error: ... }` objects.

---

## System / Approach

### 1. Result-Object Return Convention

All server functions (Server Actions under `src/app/actions/` and API routes under `src/app/api/`) follow a consistent return shape:

```ts
// Success
return { success: true, data: ... }

// Failure (validation or business rule)
return { error: "Human-readable message" }

// Failure (caught exception)
const message = error instanceof Error ? error.message : "Fallback message"
return { error: message }
```

Callers on the client side inspect the `error` field to determine whether the operation succeeded.

### 2. Try-Catch at Every Boundary

Every exported async function in the `actions/` directory is wrapped in a `try/catch` block:

- **Validation errors** (missing fields, duplicate NIM/NIUP, room capacity exceeded) are caught early and returned as `{ error: "..." }` before any database write.
- **Database/runtime errors** are caught in the outer `catch` clause, where `error instanceof Error` is used to extract the message, falling back to a generic string if the thrown value is not an `Error` instance.

### 3. Console Logging for Diagnostics

Most `catch` blocks log the full error object via `console.error(...)` before returning the sanitized message. This provides server-side visibility into failures without exposing stack traces to the client.

Example from `src/app/actions/residents.ts`:
```ts
catch (error) {
  console.error("Failed to fetch residents:", error)
  return []
}
```

### 4. Early Validation Guards

Before any database mutation, functions perform explicit validation checks and return descriptive error messages:

- Required-field validation (`validateRequiredResidentData`, `validateImportResidentData`)
- Uniqueness checks (NIM, NIUP, room number)
- Business-rule enforcement (room capacity, maintenance status, resident existence)

These guards prevent invalid data from reaching Prisma and avoid relying on database-level constraint errors.

### 5. Authorization Checks Inline

Functions that require permissions check the session inline and return `{ error: "Unauthorized" }` or `{ error: "Forbidden: ..." }` when access is denied. There is no separate authorization middleware layer; checks are embedded within each action.

Example from `src/app/actions/laporan.ts`:
```ts
if (!session || !session.user.permissions?.includes("dashboard.view")) return null
```

### 6. Transactional Safety

Complex multi-step operations (e.g., room transfers in `src/app/actions/roomTransfer.ts`) use `prisma.$transaction()` to ensure atomicity. If any step fails, the entire transaction rolls back and the outer `catch` returns the error.

### 7. Health-Check Endpoint

The `/api/health` route (`src/app/api/health/route.ts`) demonstrates minimal error handling: it catches any database ping failure and returns HTTP 503 with `{ status: "error" }`, suppressing the error details entirely.

---

## Key Files

| File | Role |
|------|------|
| `src/lib/prisma.ts` | Throws on missing `DATABASE_URL` during singleton initialization |
| `src/app/actions/residents.ts` | Representative Server Action with validation guards, try-catch, result-object returns |
| `src/app/actions/rooms.ts` | Similar pattern for room CRUD operations |
| `src/app/actions/absensiApel.ts` | Attendance actions following the same convention |
| `src/app/actions/roomTransfer.ts` | Uses `$transaction` with try-catch wrapper |
| `src/app/actions/laporan.ts` | Report/dashboard actions with inline auth checks and try-catch |
| `src/app/actions/audit.ts` | Audit log queries with permission gating and error wrapping |
| `src/app/api/upload/route.ts` | API route with typed `error: unknown` catch and Cloudinary error handling |
| `src/app/api/health/route.ts` | Minimal health-check with silent error suppression |
| `src/lib/auth.ts` | Returns `null` on failed authentication (no throw) |

---

## Architecture & Conventions

### Design Decisions

1. **No custom error classes**: The codebase does not define domain-specific error types (e.g., `ValidationError`, `NotFoundError`). All errors are plain strings.
2. **No error propagation via exceptions**: Server Actions never `throw`; they always return result objects. This aligns with Next.js Server Action conventions but means callers must always check for `error`.
3. **No global error handler**: There is no `error.tsx` boundary file in the `app/` directory, no middleware error handler, and no centralized logging service.
4. **Silent failures in read operations**: Functions like `getResidents()`, `getRooms()`, and `getApels()` return empty arrays (`[]`) on failure rather than propagating errors, which can mask problems from the UI.
5. **Mixed language in messages**: Error messages alternate between English ("Resident not found") and Indonesian ("Gagal membuat absen apel"), reflecting the bilingual nature of the application but lacking a unified localization strategy.

### Patterns Observed

| Pattern | Usage |
|---------|-------|
| `try/catch` + result object | Universal across all Server Actions |
| `error instanceof Error` | Standard guard before accessing `.message` |
| `console.error` | Diagnostic logging in most catch blocks |
| Early-return validation | Prevents invalid DB writes |
| Inline auth/permission checks | No middleware; checks duplicated across actions |
| `$transaction` for multi-step writes | Ensures atomicity in complex mutations |
| Empty-array fallback | Read operations suppress errors silently |

---

## Rules Developers Should Follow

1. **Always wrap Server Actions in try-catch**: Every exported async function in `src/app/actions/` must have a `try/catch` block that returns `{ error: string }` on failure.

2. **Use `error instanceof Error` before accessing `.message`**: Never assume the caught value is an `Error` instance.

3. **Validate before mutating**: Perform all input validation and business-rule checks before any Prisma write operation. Return descriptive error messages early.

4. **Return result objects, never throw**: Server Actions must not throw exceptions. Always return `{ success: true, ... }` or `{ error: "..." }`.

5. **Log errors with `console.error`**: Include the full error object in the log for debugging, but return only a user-friendly message to the caller.

6. **Check permissions inline**: Every action that modifies data or exposes sensitive information must verify the session and required permissions at the top of the function.

7. **Use transactions for multi-step mutations**: When an operation involves multiple Prisma writes that must succeed or fail together, wrap them in `prisma.$transaction()`.

8. **Handle read-operation failures gracefully**: Query functions should return empty arrays or `null` on failure rather than crashing, but consider adding optional error logging for observability.

9. **Keep error messages user-facing**: Messages returned in `{ error: "..." }` will be displayed to end users. Avoid exposing raw database errors or stack traces.

10. **Be consistent with language**: Prefer one language (Indonesian or English) for error messages within a module to maintain UX consistency.
