# Security Architecture & Access Control

<cite>
**Referenced Files in This Document**
- [auth.ts](file://src/lib/auth.ts)
- [permissions.ts](file://src/lib/permissions.ts)
- [proxy.ts](file://src/proxy.ts)
- [next-auth.d.ts](file://types/next-auth.d.ts)
- [schema.prisma](file://prisma/schema.prisma)
- [roles.ts](file://src/app/actions/roles.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [prisma.ts](file://src/lib/prisma.ts)
- [seed.ts](file://prisma/seed.ts)
- [route.ts](file://src/app/api/auth/[...nextauth]/route.ts)
- [rateLimiter.ts](file://src/lib/security/rateLimiter.ts)
- [passwordPolicy.ts](file://src/lib/security/passwordPolicy.ts)
- [permissionSync.ts](file://src/lib/security/permissionSync.ts)
- [permissionSync.test.ts](file://tests/permissionSync.test.ts)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive login rate limiting system with sliding window algorithm
- Integrated centralized password policy validation system with multiple security requirements
- Implemented dynamic permission synchronization mechanism for real-time authorization updates
- Enhanced authentication flow with fail-open security patterns for all new components
- Added extensive test coverage for permission synchronization logic

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [New Security Components](#new-security-components)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document presents the security architecture and access control design for ApsAsrama's authentication and authorization systems. It covers the NextAuth.js implementation, the custom credentials provider, JWT-based session management, role-based access control (RBAC), permission enforcement, middleware-based route protection, and secure API access patterns. The system now includes enhanced security measures including comprehensive login rate limiting, centralized password policy validation, and dynamic permission synchronization for real-time authorization updates.

## Project Structure
The security system spans several layers with enhanced security components:
- Authentication configuration and session management via NextAuth.js with integrated rate limiting
- Middleware-based route protection for the dashboard
- Server-side permission checks for protected actions
- Database schema enforcing RBAC and audit logging
- Utility modules for permission checks, Prisma client initialization, and security policies
- **New**: Comprehensive rate limiting system for brute force attack prevention
- **New**: Centralized password policy validation with multiple security requirements
- **New**: Dynamic permission synchronization for real-time authorization updates

```mermaid
graph TB
subgraph "Client"
UI["Next.js App Router Pages"]
LOGIN["Login Page"]
end
subgraph "Middleware Layer"
MW["Proxy Middleware<br/>Route Protection"]
end
subgraph "Auth Layer"
NA["NextAuth Options<br/>Credentials Provider<br/>Rate Limiting"]
JWT["JWT Callbacks<br/>Session Enrichment<br/>Permission Sync"]
TYPES["Typed Session/User Types"]
SECURITY["Security Modules<br/>Rate Limiter<br/>Password Policy<br/>Permission Sync"]
end
subgraph "Server Actions"
SA_ROLES["Roles & Permissions Actions"]
SA_AUDIT["Audit Log Actions"]
end
subgraph "Persistence"
PRISMA["Prisma Client"]
DB["PostgreSQL"]
SCHEMA["RBAC & Audit Schema"]
end
UI --> LOGIN
LOGIN --> NA
NA --> SECURITY
NA --> JWT
JWT --> TYPES
UI --> MW
MW --> NA
UI --> SA_ROLES
UI --> SA_AUDIT
SA_ROLES --> PRISMA
SA_AUDIT --> PRISMA
PRISMA --> DB
DB --> SCHEMA
```

**Diagram sources**
- [auth.ts:6-80](file://src/lib/auth.ts#L6-L80)
- [rateLimiter.ts:1-143](file://src/lib/security/rateLimiter.ts#L1-L143)
- [passwordPolicy.ts:1-113](file://src/lib/security/passwordPolicy.ts#L1-L113)
- [permissionSync.ts:1-83](file://src/lib/security/permissionSync.ts#L1-L83)
- [proxy.ts:24-55](file://src/proxy.ts#L24-L55)
- [next-auth.d.ts:3-18](file://types/next-auth.d.ts#L3-L18)
- [roles.ts:1-119](file://src/app/actions/roles.ts#L1-L119)
- [audit.ts:47-117](file://src/app/actions/audit.ts#L47-L117)
- [prisma.ts:1-31](file://src/lib/prisma.ts#L1-L31)
- [schema.prisma:103-193](file://prisma/schema.prisma#L103-L193)

**Section sources**
- [auth.ts:1-132](file://src/lib/auth.ts#L1-L132)
- [rateLimiter.ts:1-143](file://src/lib/security/rateLimiter.ts#L1-L143)
- [passwordPolicy.ts:1-113](file://src/lib/security/passwordPolicy.ts#L1-L113)
- [permissionSync.ts:1-83](file://src/lib/security/permissionSync.ts#L1-L83)
- [proxy.ts:1-60](file://src/proxy.ts#L1-L60)
- [next-auth.d.ts:1-19](file://types/next-auth.d.ts#L1-L19)
- [roles.ts:1-119](file://src/app/actions/roles.ts#L1-L119)
- [audit.ts:47-117](file://src/app/actions/audit.ts#L47-L117)
- [prisma.ts:1-31](file://src/lib/prisma.ts#L1-L31)
- [schema.prisma:103-193](file://prisma/schema.prisma#L103-L193)

## Core Components
- NextAuth.js configuration with a custom credentials provider, JWT callbacks, session enrichment, and integrated rate limiting
- Typed session/user interfaces extending NextAuth types
- Middleware-based proxy for route-level permission checks
- Permission utilities for server-side checks and enforcement
- Server actions implementing RBAC for roles and permissions
- Prisma client configured with PostgreSQL adapter and connection pooling
- Database schema modeling RBAC and audit logging
- **New**: Comprehensive rate limiting system preventing brute force attacks
- **New**: Centralized password policy validation with multiple security requirements
- **New**: Dynamic permission synchronization for real-time authorization updates

Key implementation references:
- NextAuth options and callbacks with rate limiting: [auth.ts:6-80](file://src/lib/auth.ts#L6-L80)
- Rate limiting implementation: [rateLimiter.ts:1-143](file://src/lib/security/rateLimiter.ts#L1-L143)
- Password policy validation: [passwordPolicy.ts:1-113](file://src/lib/security/passwordPolicy.ts#L1-L113)
- Permission synchronization: [permissionSync.ts:1-83](file://src/lib/security/permissionSync.ts#L1-L83)
- Typed session/user augmentation: [next-auth.d.ts:3-18](file://types/next-auth.d.ts#L3-L18)
- Proxy middleware and route permission mapping: [proxy.ts:4-59](file://src/proxy.ts#L4-L59)
- Permission utilities: [permissions.ts:4-20](file://src/lib/permissions.ts#L4-L20)
- Roles and permissions actions: [roles.ts:7-118](file://src/app/actions/roles.ts#L7-L118)
- Prisma client singleton and adapter: [prisma.ts:5-28](file://src/lib/prisma.ts#L5-L28)
- RBAC and audit schema: [schema.prisma:103-193](file://prisma/schema.prisma#L103-L193)

**Section sources**
- [auth.ts:6-80](file://src/lib/auth.ts#L6-L80)
- [rateLimiter.ts:1-143](file://src/lib/security/rateLimiter.ts#L1-L143)
- [passwordPolicy.ts:1-113](file://src/lib/security/passwordPolicy.ts#L1-L113)
- [permissionSync.ts:1-83](file://src/lib/security/permissionSync.ts#L1-L83)
- [next-auth.d.ts:3-18](file://types/next-auth.d.ts#L3-L18)
- [proxy.ts:4-59](file://src/proxy.ts#L4-L59)
- [permissions.ts:4-20](file://src/lib/permissions.ts#L4-L20)
- [roles.ts:7-118](file://src/app/actions/roles.ts#L7-L118)
- [prisma.ts:5-28](file://src/lib/prisma.ts#L5-L28)
- [schema.prisma:103-193](file://prisma/schema.prisma#L103-L193)

## Architecture Overview
The system enforces authentication and authorization across four planes with enhanced security measures:
- Authentication plane: NextAuth.js with a custom credentials provider validates user identity, applies rate limiting, and loads role/permissions
- Authorization plane: JWT callbacks enrich the token/session with role and permission arrays; middleware enforces route-level permissions; dynamic permission sync ensures real-time authorization updates
- Enforcement plane: Server actions validate permissions before executing sensitive operations; audit logs record changes
- **New**: Security plane: Comprehensive rate limiting prevents brute force attacks; centralized password policy validates credentials; dynamic permission synchronization maintains up-to-date authorization

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant NextAuth as "NextAuth Route"
participant RateLimiter as "Rate Limiter"
participant AuthLib as "Auth Config"
participant JWT as "JWT Callbacks"
participant Session as "Session Callbacks"
participant Proxy as "Proxy Middleware"
participant Action as "Server Action"
Browser->>NextAuth : "POST /api/auth/signin (credentials)"
NextAuth->>RateLimiter : "check(email)"
RateLimiter-->>NextAuth : "allowed status"
NextAuth->>AuthLib : "authorize(credentials)"
AuthLib-->>NextAuth : "user with role & permissions"
NextAuth->>RateLimiter : "recordSuccess/Failure"
NextAuth->>JWT : "jwt({ token, user })"
JWT->>JWT : "needsPermissionRefresh()"
JWT->>AuthLib : "refreshUserPermissions()"
JWT-->>NextAuth : "token enriched"
NextAuth->>Session : "session({ session, token })"
Session-->>NextAuth : "session enriched"
NextAuth-->>Browser : "JWT cookie"
Browser->>Proxy : "GET /dashboard/residents"
Proxy->>Proxy : "check token & required permission"
Proxy-->>Browser : "allow or redirect/rewrite"
Browser->>Action : "Server Action requiring role.create"
Action->>Action : "requirePermission('role.create')"
Action-->>Browser : "success or error"
```

**Diagram sources**
- [auth.ts:14-50](file://src/lib/auth.ts#L14-L50)
- [auth.ts:54-71](file://src/lib/auth.ts#L54-L71)
- [rateLimiter.ts:44-78](file://src/lib/security/rateLimiter.ts#L44-L78)
- [permissionSync.ts:18-23](file://src/lib/security/permissionSync.ts#L18-L23)
- [permissionSync.ts:32-82](file://src/lib/security/permissionSync.ts#L32-L82)
- [proxy.ts:25-48](file://src/proxy.ts#L25-L48)
- [permissions.ts:11-16](file://src/lib/permissions.ts#L11-L16)
- [roles.ts:41-64](file://src/app/actions/roles.ts#L41-L64)

## Detailed Component Analysis

### NextAuth.js Implementation and Session Management
- Custom credentials provider validates email/password with integrated rate limiting and loads user with role and permissions
- JWT callback stores role, permissions, user id, and optional satker id in the token with lastPermissionSync timestamp
- Session callback enriches the session with role, permissions, user id, and optional satker id
- Session strategy is JWT with 8-hour max age and 30-minute update age for permission refresh cycles
- Secret is sourced from environment variables
- Login page is redirected to the application's sign-in route

```mermaid
classDiagram
class CredentialsProvider {
+authorize(credentials) User|null
}
class RateLimiter {
+check(email) Result
+recordFailure(email) void
+recordSuccess(email) void
}
class JWTCallbacks {
+jwt({ token, user }) Token
}
class SessionCallbacks {
+session({ session, token }) Session
}
class AuthConfig {
+providers : CredentialsProvider[]
+callbacks : JWTCallbacks & SessionCallbacks
+pages.signIn
+session.strategy
+session.maxAge
+session.updateAge
+secret
}
AuthConfig --> CredentialsProvider : "uses"
AuthConfig --> RateLimiter : "integrates"
AuthConfig --> JWTCallbacks : "uses"
AuthConfig --> SessionCallbacks : "uses"
```

**Diagram sources**
- [auth.ts:8-51](file://src/lib/auth.ts#L8-L51)
- [auth.ts:54-71](file://src/lib/auth.ts#L54-L71)
- [auth.ts:78-131](file://src/lib/auth.ts#L78-L131)
- [rateLimiter.ts:44-123](file://src/lib/security/rateLimiter.ts#L44-L123)

**Section sources**
- [auth.ts:6-132](file://src/lib/auth.ts#L6-L132)
- [next-auth.d.ts:3-18](file://types/next-auth.d.ts#L3-L18)

### Middleware and Route Protection
- The proxy middleware leverages NextAuth middleware to guard dashboard routes
- It checks for a valid token and verifies required permissions per route prefix
- Unauthorized requests are rewritten to a forbidden page; missing tokens redirect to login
- The matcher targets all paths under /dashboard

```mermaid
flowchart TD
Start(["Incoming Request"]) --> HasToken{"Has token?"}
HasToken --> |No| Redirect["Redirect to /login"]
HasToken --> |Yes| GetPerms["Extract user permissions"]
GetPerms --> CheckRoute{"Route requires permission?"}
CheckRoute --> |Yes| HasPerm{"Has required permission?"}
HasPerm --> |No| Forbidden["Rewrite to /dashboard/forbidden"]
HasPerm --> |Yes| Next["Continue"]
CheckRoute --> |No| BaseDash{"Is base dashboard?"}
BaseDash --> |Yes| DashPerm{"Has dashboard.view?"}
DashPerm --> |No| Forbidden
DashPerm --> |Yes| Next
BaseDash --> |No| Next
Next --> End(["Allow"])
Forbidden --> End
Redirect --> End
```

**Diagram sources**
- [proxy.ts:25-48](file://src/proxy.ts#L25-L48)

**Section sources**
- [proxy.ts:4-59](file://src/proxy.ts#L4-L59)

### Role-Based Access Control (RBAC) and Permission Matrix
- RBAC is modeled with Role, Permission, and RolePermission entities
- Permissions are uniquely identified by a code combining module and action (e.g., "santri.view")
- Users belong to a single Role; Roles are linked to Permissions via RolePermission
- A seeded SUPER_ADMIN role receives all permissions by default
- Server actions enforce permissions before performing mutations

```mermaid
erDiagram
ROLE {
string id PK
string name UK
boolean isSystem
datetime createdAt
datetime updatedAt
}
PERMISSION {
string id PK
string module
string action
string code UK
string description
datetime createdAt
datetime updatedAt
}
ROLE_PERMISSION {
string roleId PK
string permissionId PK
}
USER {
string id PK
string name
string email UK
string roleId FK
string satkerId FK?
boolean isActive
datetime createdAt
datetime updatedAt
}
ROLE ||--o{ ROLE_PERMISSION : "has"
PERMISSION ||--o{ ROLE_PERMISSION : "grants"
USER }o--|| ROLE : "belongs to"
```

**Diagram sources**
- [schema.prisma:103-193](file://prisma/schema.prisma#L103-L193)
- [seed.ts:78-123](file://prisma/seed.ts#L78-L123)

**Section sources**
- [schema.prisma:103-193](file://prisma/schema.prisma#L103-L193)
- [seed.ts:78-123](file://prisma/seed.ts#L78-L123)
- [roles.ts:7-118](file://src/app/actions/roles.ts#L7-L118)

### Permission Utilities and Enforcement
- hasPermission checks the current server session for a specific permission code
- requirePermission throws an error if the permission is missing
- hasPermissionClient performs client-side checks using the permissions array from the session

```mermaid
flowchart TD
A["Call hasPermission(code)"] --> B["getServerSession()"]
B --> C{"Session exists?"}
C --> |No| D["Return false"]
C --> |Yes| E{"Session.user.permissions includes code?"}
E --> |Yes| F["Return true"]
E --> |No| G["Return false"]
H["Call requirePermission(code)"] --> I["hasPermission(code)"]
I --> J{"Result true?"}
J --> |Yes| K["Proceed"]
J --> |No| L["Throw Forbidden Error"]
```

**Diagram sources**
- [permissions.ts:4-16](file://src/lib/permissions.ts#L4-L16)

**Section sources**
- [permissions.ts:4-20](file://src/lib/permissions.ts#L4-L20)

### Server Actions and Data Protection
- Roles and permissions actions enforce permissions before CRUD operations
- Transactions are used to maintain atomicity during updates
- System roles (e.g., SUPER_ADMIN) are protected from unauthorized modifications
- Audit logs capture mutation events with entity type, IDs, and serialized values

```mermaid
sequenceDiagram
participant UI as "UI"
participant SA as "Server Action"
participant Perm as "Permission Utils"
participant DB as "Prisma Client"
UI->>SA : "createRole(name, permissions)"
SA->>Perm : "requirePermission('role.create')"
Perm-->>SA : "ok or error"
SA->>DB : "transaction : delete old links + create new links"
DB-->>SA : "result"
SA-->>UI : "role or error"
```

**Diagram sources**
- [roles.ts:41-101](file://src/app/actions/roles.ts#L41-L101)
- [permissions.ts:11-16](file://src/lib/permissions.ts#L11-L16)

**Section sources**
- [roles.ts:7-118](file://src/app/actions/roles.ts#L7-L118)
- [audit.ts:47-117](file://src/app/actions/audit.ts#L47-L117)

### Prisma Client and Database Adapter
- The Prisma client is initialized as a singleton with a PostgreSQL adapter
- Connection pooling is configured for serverless environments
- Environment validation ensures DATABASE_URL is present
- Audit logs and RBAC entities are stored in the database

```mermaid
classDiagram
class PrismaClientSingleton {
+prisma : PrismaClient
}
class PrismaPgAdapter {
+pool : Pool
}
class Database {
+PostgreSQL
}
PrismaClientSingleton --> PrismaPgAdapter : "uses"
PrismaPgAdapter --> Database : "connects to"
```

**Diagram sources**
- [prisma.ts:5-28](file://src/lib/prisma.ts#L5-L28)

**Section sources**
- [prisma.ts:1-31](file://src/lib/prisma.ts#L1-L31)
- [schema.prisma:455-466](file://prisma/schema.prisma#L455-L466)

## New Security Components

### Login Rate Limiting System
The system implements a comprehensive rate limiting mechanism to prevent brute force attacks:

- **Sliding Window Algorithm**: Uses configurable window size (15 minutes) with fixed-size entries
- **Fail-Open Design**: All operations are wrapped to never throw, ensuring system availability
- **Lockout Mechanism**: After 5 failed attempts, accounts are temporarily locked for 15 minutes
- **Memory Store**: In-memory Map-based storage with lazy cleanup every 60 seconds
- **Configuration**: Adjustable parameters for maximum attempts, window duration, and lockout period

```mermaid
flowchart TD
Start(["Login Attempt"]) --> CheckRate["check(email)"]
CheckRate --> Allowed{"Allowed?"}
Allowed --> |No| Block["Block Login<br/>Return retryAfter"]
Allowed --> |Yes| Validate["Validate Credentials"]
Validate --> Success{"Password Valid?"}
Success --> |No| RecordFail["recordFailure(email)"]
RecordFail --> ReturnNull["Return null"]
Success --> |Yes| RecordSuccess["recordSuccess(email)"]
RecordSuccess --> ReturnUser["Return user data"]
Block --> End(["End"])
ReturnNull --> End
ReturnUser --> End
```

**Diagram sources**
- [rateLimiter.ts:44-78](file://src/lib/security/rateLimiter.ts#L44-L78)
- [rateLimiter.ts:85-123](file://src/lib/security/rateLimiter.ts#L85-L123)

**Section sources**
- [rateLimiter.ts:1-143](file://src/lib/security/rateLimiter.ts#L1-L143)
- [auth.ts:21-29](file://src/lib/auth.ts#L21-L29)
- [auth.ts:50-65](file://src/lib/auth.ts#L50-L65)

### Centralized Password Policy System
The password policy provides centralized validation rules for all password-related operations:

- **Single Source of Truth**: All password validation uses consistent requirements across the application
- **Extensible Requirements**: Modular requirement system allowing easy addition of new rules
- **Comprehensive Coverage**: Validates minimum length, uppercase letters, lowercase letters, numbers, and special characters
- **Human-Readable Feedback**: Provides Indonesian descriptions for user-friendly error messages
- **Fail-Open Validation**: Validation results are returned even if individual requirement tests fail

```mermaid
flowchart TD
Input["Password Input"] --> Validate["validatePassword()"]
Validate --> CheckMin["Check Minimum Length"]
CheckMin --> CheckUpper["Check Uppercase"]
CheckUpper --> CheckLower["Check Lowercase"]
CheckLower --> CheckNumber["Check Number"]
CheckNumber --> CheckSpecial["Check Special Character"]
CheckSpecial --> Aggregate["Aggregate Results"]
Aggregate --> Return["Return {valid, errors}"]
```

**Diagram sources**
- [passwordPolicy.ts:77-90](file://src/lib/security/passwordPolicy.ts#L77-L90)

**Section sources**
- [passwordPolicy.ts:1-113](file://src/lib/security/passwordPolicy.ts#L1-L113)
- [seed.ts:143](file://prisma/seed.ts#L143)
- [settings.ts:41](file://src/app/actions/settings.ts#L41)
- [settings.ts:125](file://src/app/actions/settings.ts#L125)

### Dynamic Permission Synchronization
The system implements real-time permission updates to ensure authorization stays current:

- **30-Minute Refresh Cycle**: Permissions are automatically refreshed every 30 minutes
- **Fail-Open Logic**: Database failures don't disrupt existing sessions
- **User Deletion Handling**: Automatically clears permissions when users are deleted
- **Real-Time Updates**: Reflects role and permission changes immediately
- **Test Coverage**: Extensive unit tests validate all synchronization scenarios

```mermaid
flowchart TD
JWTCallback["JWT Callback"] --> CheckSync["needsPermissionRefresh()"]
CheckSync --> NeedsSync{"Needs Refresh?"}
NeedsSync --> |No| ReturnToken["Return Token"]
NeedsSync --> |Yes| QueryDB["refreshUserPermissions()"]
QueryDB --> Found{"User Found?"}
Found --> |Yes| UpdateToken["Update Token Data"]
Found --> |No| ClearAuth["Clear Authorization Data"]
UpdateToken --> SetTimestamp["Set Last Sync Timestamp"]
ClearAuth --> SetTimestamp
SetTimestamp --> ReturnToken
ReturnToken --> End(["End"])
```

**Diagram sources**
- [permissionSync.ts:18-23](file://src/lib/security/permissionSync.ts#L18-L23)
- [permissionSync.ts:32-82](file://src/lib/security/permissionSync.ts#L32-L82)

**Section sources**
- [permissionSync.ts:1-83](file://src/lib/security/permissionSync.ts#L1-L83)
- [auth.ts:96-108](file://src/lib/auth.ts#L96-L108)
- [permissionSync.test.ts:1-174](file://tests/permissionSync.test.ts#L1-L174)

## Dependency Analysis
The security system exhibits clear separation of concerns with enhanced security components:
- auth.ts depends on bcrypt for password comparison, Prisma for user/role/permission lookup, and new security modules
- permissions.ts depends on authOptions and NextAuth session retrieval
- proxy.ts depends on NextAuth middleware and route-to-permission mapping
- roles.ts depends on permissions.ts and Prisma for RBAC operations
- audit.ts depends on Prisma and authOptions for audit queries
- prisma.ts encapsulates Prisma client initialization and adapter configuration
- **New**: rateLimiter.ts provides standalone rate limiting functionality
- **New**: passwordPolicy.ts offers centralized password validation
- **New**: permissionSync.ts handles dynamic permission synchronization

```mermaid
graph LR
AUTH["auth.ts"] --> BC["bcrypt"]
AUTH --> PRISMA_LIB["prisma.ts"]
AUTH --> RATE_LIMIT["rateLimiter.ts"]
AUTH --> PERM_SYNC["permissionSync.ts"]
PERM["permissions.ts"] --> AUTH_OPTS["auth.ts (authOptions)"]
PROXY["proxy.ts"] --> AUTH_MW["next-auth/middleware"]
ROLES["roles.ts"] --> PERM
ROLES --> PRISMA_LIB
AUDIT["audit.ts"] --> PRISMA_LIB
PW_POLICY["passwordPolicy.ts"] --> AUTH
PW_POLICY --> ROLES
PW_POLICY --> SEED["seed.ts"]
PERM_SYNC --> PRISMA_LIB
PRISMA_LIB --> PG["PrismaPg Adapter"]
PG --> DB["PostgreSQL"]
```

**Diagram sources**
- [auth.ts:2-6](file://src/lib/auth.ts#L2-L6)
- [auth.ts:19-30](file://src/lib/auth.ts#L19-L30)
- [permissions.ts:1-2](file://src/lib/permissions.ts#L1-L2)
- [proxy.ts:1](file://src/proxy.ts#L1)
- [roles.ts:3-4](file://src/app/actions/roles.ts#L3-L4)
- [audit.ts:1-1](file://src/app/actions/audit.ts#L1-L1)
- [prisma.ts:1-3](file://src/lib/prisma.ts#L1-L3)
- [rateLimiter.ts:1-7](file://src/lib/security/rateLimiter.ts#L1-L7)
- [passwordPolicy.ts:1-6](file://src/lib/security/passwordPolicy.ts#L1-L6)
- [permissionSync.ts:1-9](file://src/lib/security/permissionSync.ts#L1-L9)

**Section sources**
- [auth.ts:1-132](file://src/lib/auth.ts#L1-L132)
- [permissions.ts:1-20](file://src/lib/permissions.ts#L1-L20)
- [proxy.ts:1-60](file://src/proxy.ts#L1-L60)
- [roles.ts:1-119](file://src/app/actions/roles.ts#L1-L119)
- [audit.ts:47-117](file://src/app/actions/audit.ts#L47-L117)
- [prisma.ts:1-31](file://src/lib/prisma.ts#L1-L31)
- [rateLimiter.ts:1-143](file://src/lib/security/rateLimiter.ts#L1-L143)
- [passwordPolicy.ts:1-113](file://src/lib/security/passwordPolicy.ts#L1-L113)
- [permissionSync.ts:1-83](file://src/lib/security/permissionSync.ts#L1-L83)

## Performance Considerations
- JWT-based sessions avoid server-side session storage and reduce load on shared state
- Password hashing uses bcrypt; ensure appropriate cost factors are configured in production
- Prisma client is a singleton with connection pooling suitable for serverless environments
- Middleware checks are lightweight and short-circuit on missing tokens or insufficient permissions
- Audit log queries support pagination and filtering to minimize payload sizes
- **New**: Rate limiter uses in-memory storage with lazy cleanup to minimize memory overhead
- **New**: Permission synchronization occurs every 30 minutes to balance freshness with performance
- **New**: Password policy validation is O(n) where n is number of requirements, optimized for minimal overhead

## Troubleshooting Guide
Common issues and resolutions:
- Missing NEXTAUTH_SECRET: Ensure the environment variable is set; otherwise, NextAuth configuration will fail
- Unauthorized access to dashboard routes: Verify the user's permissions array includes the required code for the route prefix
- Permission errors in server actions: Confirm that requirePermission is called before executing privileged operations
- Database connectivity failures: Check DATABASE_URL and connection pool settings
- Audit log queries failing: Validate filters and date ranges; note that search operates on serialized JSON fields
- **New**: Rate limiting blocking legitimate users: Check rate limiter configuration and cleanup intervals
- **New**: Password validation errors: Review password policy requirements and ensure they meet organizational standards
- **New**: Permission synchronization failures: Verify database connectivity and test the refreshUserPermissions function

**Section sources**
- [auth.ts:79](file://src/lib/auth.ts#L79)
- [proxy.ts:30-46](file://src/proxy.ts#L30-L46)
- [permissions.ts:11-16](file://src/lib/permissions.ts#L11-L16)
- [prisma.ts:6-9](file://src/lib/prisma.ts#L6-L9)
- [audit.ts:74-92](file://src/app/actions/audit.ts#L74-L92)
- [rateLimiter.ts:44-78](file://src/lib/security/rateLimiter.ts#L44-L78)
- [passwordPolicy.ts:77-90](file://src/lib/security/passwordPolicy.ts#L77-L90)
- [permissionSync.ts:32-82](file://src/lib/security/permissionSync.ts#L32-L82)

## Conclusion
ApsAsrama's security architecture integrates NextAuth.js with a custom credentials provider, JWT-based session management, and a robust RBAC model enforced at the middleware and server action layers. The system now includes enhanced security measures including comprehensive login rate limiting to prevent brute force attacks, centralized password policy validation for consistent credential requirements, and dynamic permission synchronization for real-time authorization updates. The proxy middleware protects dashboard routes using a route-to-permission mapping, while server actions enforce granular permissions for sensitive operations. Audit logging captures changes for compliance and traceability. Together, these components form a comprehensive layered defense-in-depth strategy aligned with modern web security best practices, providing centralized password validation, real-time authorization updates, and protection against brute force attacks.