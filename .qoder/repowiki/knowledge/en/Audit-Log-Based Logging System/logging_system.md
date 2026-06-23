## Overview

This Next.js application does **not** use a dedicated logging framework (e.g., pino, winston, bunyan). Instead, it relies on two complementary mechanisms:

1. **`console.*` for runtime diagnostics** — used ad-hoc in server actions and scripts for error reporting and seed progress.
2. **Database-backed `AuditLog` table** — serves as the structured, persistent audit trail for all data mutations across the platform.

---

## Key Files and Packages

| File | Role |
|------|------|
| `prisma/schema.prisma` (lines 455–466) | Defines the `AuditLog` model with fields: `action`, `entityType`, `entityId`, `oldValue` (JSON), `newValue` (JSON), `performedBy`, `createdAt`. |
| `src/app/actions/audit.ts` | Server actions for querying audit logs: `getEntityAuditLogs()`, `getAuditLogs()` (paginated, filterable), `getAuditLogActions()`. Enforces RBAC via `audit.view` permission. |
| `src/app/actions/wilayah.ts` (lines 11–25) | Contains the canonical `logAudit()` helper that wraps `prisma.auditLog.create()` with session-based `performedBy` attribution. Used by all wilayah CRUD operations. |
| `src/app/actions/residents.ts` (lines 380–411) | Inline audit log creation within `updateResident()`. Tracks field-level diffs for 17 tracked fields and writes JSON snapshots of old/new values. |
| `src/components/dashboard/audit-log/AuditLogClient.tsx` | Client-side UI component for the `/dashboard/audit-logs` page with filtering, search, and pagination. |
| `src/components/dashboard/ResidentDetailModal.tsx` | Embeds an audit log tab per resident entity, calling `getEntityAuditLogs()`. |

No external logging library is declared in `package.json`.

---

## Architecture and Conventions

### Audit Log Schema

The `AuditLog` Prisma model stores structured change records:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  action      String   // CREATE, UPDATE, DELETE, IMPORT, ROOM_TRANSFER, UPDATE_RESIDENT
  entityType  String   // COUNTRY, PROVINCE, REGENCY, DISTRICT, VILLAGE, RESIDENT
  entityId    String?
  oldValue    Json?
  newValue    Json?
  performedBy String?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
}
```

### Two Patterns for Writing Audit Logs

**Pattern A — Dedicated helper (`wilayah.ts`)**
```ts
async function logAudit(action: string, entityType: string, entityId: string | null, oldValue: unknown, newValue: unknown) {
  const session = await getServerSession(authOptions)
  const performedBy = session?.user?.name || session?.user?.email || "System"
  await prisma.auditLog.create({
    data: { action, entityType, entityId, oldValue: ..., newValue: ..., performedBy }
  })
}
```
Called after every CREATE/UPDATE/DELETE in the wilayah module.

**Pattern B — Inline diff tracking (`residents.ts`)**
Within `updateResident()`, the code compares 17 tracked fields between the old and new resident record, builds `changedFields[]`, `oldValues{}`, and `newValues{}` objects, then creates a single `AuditLog` entry only if changes are detected.

### Querying Audit Logs

- `getAuditLogs()` supports filtering by `action`, `entityType`, `performedBy`, date range (`dateFrom`/`dateTo`), and free-text `search` over JSON payloads.
- Results are paginated (default 25 per page).
- Access is gated behind the `audit.view` permission.

### Runtime Diagnostics via `console.*`

All server actions use `console.error()` in catch blocks to surface failures during development. Examples:
- `src/app/actions/residents.ts`: `console.error("Failed to fetch residents:", error)`
- `src/app/actions/absensiApel.ts`: `console.error("Error getApels:", error)`
- Seed scripts (`prisma/seed.ts`, `scripts/seed-audit.ts`) use `console.log()` for progress output.

These are **not** structured, not routed to external sinks, and are intended for developer visibility only.

---

## Rules Developers Should Follow

1. **Use `AuditLog` for all data mutations.** Every CREATE, UPDATE, DELETE, or IMPORT operation on domain entities must create an `AuditLog` record. Do not rely solely on `console.error` for operational traceability.

2. **Follow the `logAudit()` pattern from `wilayah.ts`.** Extract a reusable helper that captures `session.user` as `performedBy` and passes JSON-serializable `oldValue`/`newValue` snapshots.

3. **Track field-level diffs for complex updates.** When updating entities with many fields (like `Resident`), compare only relevant fields, build a `changedFields` array, and include both full snapshots in the audit payload.

4. **Gate audit log queries behind RBAC.** Always check `session.user.permissions.includes("audit.view")` before returning audit log data.

5. **Do not introduce a third-party logger without team consensus.** The current approach intentionally avoids external logging dependencies. If structured application-level logging (beyond audit trails) becomes necessary, evaluate pino or winston and document the decision.

6. **Use `console.error()` sparingly and only for unexpected failures.** Do not use `console.log()` for business logic tracing in production server actions — rely on `AuditLog` instead.
