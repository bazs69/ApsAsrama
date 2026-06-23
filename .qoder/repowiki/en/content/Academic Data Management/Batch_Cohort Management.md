# Batch/Cohort Management

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [masterData.ts](file://src/app/actions/masterData.ts)
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [residents.ts](file://src/app/actions/residents.ts)
- [residents.tsx](file://src/components/dashboard/residents/ResidentsTable.tsx)
- [types.ts](file://src/components/dashboard/residents/types.ts)
- [constants.ts](file://src/components/dashboard/residents/constants.ts)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains batch and cohort management capabilities within the system, focusing on academic year tracking, student cohort grouping, and enrollment cycles. It covers batch creation workflows, cohort assignment mechanisms, academic progression tracking, batch-specific reporting, cohort analytics, and historical cohort management. The system supports hierarchical academic structures (Faculty → Department → Cohort/Batch) and integrates with student assignment tracking and monitoring systems to enable cohort analytics and progress reporting.

## Project Structure
The batch/cohort management functionality spans database modeling, server actions, and client components:
- Academic hierarchy modeling via Prisma (Faculty, Department, Cohort)
- Server actions for CRUD operations on academic hierarchy and resident cohort associations
- Client components for interactive management and reporting
- Assignment and monitoring actions supporting cohort analytics

```mermaid
graph TB
subgraph "Data Layer"
PRISMA["Prisma Schema<br/>models: Resident, Fakultas, Prodi, Angkatan"]
end
subgraph "Server Actions"
MD["masterData.ts<br/>Academic hierarchy CRUD"]
RES["residents.ts<br/>Resident CRUD + cohort fields"]
ASS["assignments.ts<br/>Assignment CRUD"]
MON["monitoring.ts<br/>Monthly monitoring"]
LAP["laporan.ts<br/>Reporting utilities"]
RT["roomTransfer.ts<br/>Room transfer + history"]
AUD["audit.ts<br/>Audit logging"]
end
subgraph "UI Components"
AK["AkademikClient.tsx<br/>Hierarchy management UI"]
AT["AssignmentListClient.tsx<br/>Assignment UI"]
RTBL["ResidentsTable.tsx<br/>Resident listing"]
end
PRISMA --> MD
PRISMA --> RES
PRISMA --> ASS
PRISMA --> MON
PRISMA --> LAP
PRISMA --> RT
PRISMA --> AUD
MD --> AK
RES --> AT
ASS --> AT
MON --> LAP
RT --> AUD
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [masterData.ts](file://src/app/actions/masterData.ts)
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [residents.ts](file://src/app/actions/residents.ts)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [masterData.ts](file://src/app/actions/masterData.ts)
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [residents.ts](file://src/app/actions/residents.ts)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)

## Core Components
- Academic hierarchy models (Faculty, Department, Cohort) define the cohort structure and relationships.
- Server actions manage CRUD operations for hierarchy entities and resident cohort associations.
- Client components render the hierarchy UI, manage cohort assignments, and support reporting.
- Assignment and monitoring actions enable cohort analytics and progress tracking.

Key implementation references:
- Academic hierarchy CRUD: [masterData.ts](file://src/app/actions/masterData.ts)
- Cohort-aware resident operations: [residents.ts](file://src/app/actions/residents.ts)
- Cohort assignment management: [assignments.ts](file://src/app/actions/assignments.ts)
- Cohort analytics and reporting: [laporan.ts](file://src/app/actions/laporan.ts), [monitoring.ts](file://src/app/actions/monitoring.ts)
- Cohort transfer and room history: [roomTransfer.ts](file://src/app/actions/roomTransfer.ts), [audit.ts](file://src/app/actions/audit.ts)

**Section sources**
- [masterData.ts](file://src/app/actions/masterData.ts)
- [residents.ts](file://src/app/actions/residents.ts)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)

## Architecture Overview
The system implements a layered architecture:
- Data model layer defines academic hierarchy and cohort relationships.
- Server action layer encapsulates business logic for cohort management and analytics.
- UI component layer provides interactive dashboards for managing cohorts and assignments.
- Reporting layer aggregates cohort performance metrics from monitoring data.

```mermaid
classDiagram
class Fakultas {
+string id
+string name
+Fakultas[] prodis
+Resident[] residents
}
class Prodi {
+string id
+string name
+string fakultasId
+Fakultas fakultas
+Angkatan[] angkatans
+Resident[] residents
}
class Angkatan {
+string id
+string name
+string prodiId
+Prodi prodi
+Resident[] residents
}
class Resident {
+string id
+string name
+string? nim
+string? niup
+string? angkatan
+string? prodi
+string? fakultas
+string? angkatanId
+string? prodiId
+string? fakultasId
+Angkatan? angkatanRef
+Prodi? prodiRef
+Fakultas? fakultasRef
}
Fakultas --> Prodi : "has many"
Prodi --> Angkatan : "has many"
Angkatan --> Resident : "has many"
Prodi --> Resident : "has many"
Fakultas --> Resident : "has many"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)

## Detailed Component Analysis

### Academic Year Tracking and Cohort Grouping
The academic year tracking and cohort grouping are modeled through the hierarchy:
- Faculty (Fakultas): Top-level academic unit.
- Department (Prodi): Contains multiple cohorts.
- Cohort/Batch (Angkatan): Defines the academic year cohort within a department.

```mermaid
sequenceDiagram
participant UI as "AkademikClient.tsx"
participant Action as "masterData.ts"
participant DB as "Prisma Schema"
UI->>Action : createAngkatan(name, prodiId)
Action->>DB : angkatan.create({ name, prodiId })
DB-->>Action : Angkatan record
Action-->>UI : {success, data}
UI->>Action : updateAngkatan(id, name, prodiId)
Action->>DB : angkatan.update({ where : { id }, data })
DB-->>Action : Angkatan record
Action-->>UI : {success, data}
UI->>Action : deleteAngkatan(id)
Action->>DB : angkatan.delete({ where : { id } })
DB-->>Action : success
Action-->>UI : {success}
```

**Diagram sources**
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [masterData.ts](file://src/app/actions/masterData.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [masterData.ts](file://src/app/actions/masterData.ts)
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [schema.prisma](file://prisma/schema.prisma)

### Student Cohort Assignment and Enrollment Cycles
Students are associated with cohorts via both legacy string fields and new foreign keys. The wizard and resident actions support cohort assignment during registration and updates.

```mermaid
sequenceDiagram
participant Wizard as "Santri Wizard"
participant Action as "residents.ts"
participant DB as "Prisma Schema"
Wizard->>Action : createResident({ name, nim?, niup?, angkatanId?, prodiId?, fakultasId?, ... })
Action->>DB : resident.create({ angkatanId, prodiId, fakultasId, angkatan, prodi, fakultas })
DB-->>Action : Resident record
Action-->>Wizard : {success, resident}
Wizard->>Action : updateResident(id, { angkatanId?, prodiId?, fakultasId?, ... })
Action->>DB : resident.update({ where : { id }, data })
DB-->>Action : Resident record
Action-->>Wizard : {success, resident}
```

**Diagram sources**
- [residents.ts](file://src/app/actions/residents.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [residents.ts](file://src/app/actions/residents.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Cohort Assignment Algorithms and Enrollment Cycles
Enrollment cycles are managed through the assignment system, which links students to organizational units (Satker) with defined roles and periods.

```mermaid
sequenceDiagram
participant UI as "AssignmentListClient.tsx"
participant Action as "assignments.ts"
participant DB as "Prisma Schema"
UI->>Action : createAssignment({ residentId, satkerId, position, status, startDate, endDate })
Action->>DB : assignment.upsert({ where : { residentId, satkerId }, update, create })
DB-->>Action : Assignment record
Action-->>UI : {success, assignment}
UI->>Action : updateAssignment(id, formData)
Action->>DB : assignment.update({ where : { id }, data })
DB-->>Action : Assignment record
Action-->>UI : {success, assignment}
UI->>Action : deleteAssignment(id)
Action->>DB : assignment.delete({ where : { id } })
DB-->>Action : success
Action-->>UI : {success}
```

**Diagram sources**
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [assignments.ts](file://src/app/actions/assignments.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [schema.prisma](file://prisma/schema.prisma)

### Academic Progression Tracking
Progression tracking leverages monthly monitoring data aggregated per assignment, enabling cohort-level analytics.

```mermaid
sequenceDiagram
participant UI as "AssignmentListClient.tsx"
participant Action as "monitoring.ts"
participant Report as "laporan.ts"
participant DB as "Prisma Schema"
UI->>Action : saveBulkMonitoring(satkerId, bulan, tahun, kesimpulan, monitorings[])
Action->>DB : laporanBulananSatker.upsert(...)
Action->>DB : monitoringPenugasan.create/update(...)
DB-->>Action : success
Action-->>UI : {success}
UI->>Report : generateCohortAnalytics()
Report->>DB : query assignments + monitorings
DB-->>Report : cohort metrics
Report-->>UI : analytics results
```

**Diagram sources**
- [monitoring.ts](file://src/app/actions/monitoring.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [monitoring.ts](file://src/app/actions/monitoring.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [schema.prisma](file://prisma/schema.prisma)

### Batch-Specific Reporting and Cohort Analytics
Cohort analytics compile average scores and activity statuses from monitoring records, enabling batch-specific reporting.

```mermaid
flowchart TD
Start(["Start Analytics"]) --> FetchAssignments["Fetch Assignments with Monitorings"]
FetchAssignments --> ComputeScores["Compute Scores per Monitoring"]
ComputeScores --> Aggregate["Aggregate by Cohort"]
Aggregate --> Rank["Rank Cohorts by Average Score"]
Rank --> Output["Return Analytics Results"]
Output --> End(["End"])
```

**Diagram sources**
- [laporan.ts](file://src/app/actions/laporan.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)

**Section sources**
- [laporan.ts](file://src/app/actions/laporan.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)

### Graduation Tracking
Graduation tracking is supported by marking assignments as completed and associating students with their final cohorts. Historical cohort membership is preserved through audit logs and room transfer history.

```mermaid
sequenceDiagram
participant UI as "AssignmentListClient.tsx"
participant Action as "assignments.ts"
participant History as "audit.ts"
participant RoomHist as "roomTransfer.ts"
participant DB as "Prisma Schema"
UI->>Action : updateAssignment(id, { status : "COMPLETED", ... })
Action->>DB : assignment.update({ where : { id }, data })
DB-->>Action : Assignment record
Action-->>UI : {success, assignment}
UI->>RoomHist : recordRoomTransfer(...)
RoomHist->>DB : residentRoomHistory.create(...)
RoomHist->>DB : auditLog.create(...)
DB-->>RoomHist : success
RoomHist-->>UI : {success}
```

**Diagram sources**
- [assignments.ts](file://src/app/actions/assignments.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [assignments.ts](file://src/app/actions/assignments.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [schema.prisma](file://prisma/schema.prisma)

### Batch Data Synchronization and Cohort Transfer Operations
Data synchronization ensures consistency across legacy and new cohort fields. Cohort transfers are handled via room transfer actions with historical tracking.

```mermaid
sequenceDiagram
participant Sync as "residents.ts"
participant DB as "Prisma Schema"
Sync->>DB : resident.create({ angkatanId, prodiId, fakultasId, angkatan, prodi, fakultas })
DB-->>Sync : Resident with dual fields
Sync-->>Sync : Validate uniqueness (nim, niup)
Sync-->>DB : Update room status if applicable
DB-->>Sync : success
```

**Diagram sources**
- [residents.ts](file://src/app/actions/residents.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [residents.ts](file://src/app/actions/residents.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Historical Cohort Management
Historical cohort membership is maintained through:
- Audit logs capturing cohort field changes
- Room transfer history preserving cohort transitions
- Cohort analytics leveraging historical monitoring data

```mermaid
classDiagram
class AuditLog {
+string id
+string action
+string entityType
+string? entityId
+Json? oldValue
+Json? newValue
+string? performedBy
}
class ResidentRoomHistory {
+string id
+string residentId
+string? fromRoomId
+string? toRoomId
+string? fromWilayah
+string? toWilayah
+string? alasan
+string? transferedBy
}
ResidentRoomHistory --> Resident : "residentId"
AuditLog --> Resident : "entityId"
```

**Diagram sources**
- [audit.ts](file://src/app/actions/audit.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [audit.ts](file://src/app/actions/audit.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [schema.prisma](file://prisma/schema.prisma)

## Dependency Analysis
The system exhibits clear separation of concerns:
- Data models define academic hierarchy and cohort relationships.
- Server actions encapsulate business logic for cohort management and analytics.
- UI components depend on server actions for data persistence and retrieval.
- Reporting depends on monitoring data aggregation.

```mermaid
graph TB
MD["masterData.ts"] --> SCHEMA["schema.prisma"]
RES["residents.ts"] --> SCHEMA
ASS["assignments.ts"] --> SCHEMA
MON["monitoring.ts"] --> SCHEMA
LAP["laporan.ts"] --> MON
RT["roomTransfer.ts"] --> SCHEMA
AUD["audit.ts"] --> SCHEMA
AK["AkademikClient.tsx"] --> MD
AT["AssignmentListClient.tsx"] --> ASS
RTBL["ResidentsTable.tsx"] --> RES
```

**Diagram sources**
- [masterData.ts](file://src/app/actions/masterData.ts)
- [residents.ts](file://src/app/actions/residents.ts)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [schema.prisma](file://prisma/schema.prisma)
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [residents.tsx](file://src/components/dashboard/residents/ResidentsTable.tsx)

**Section sources**
- [masterData.ts](file://src/app/actions/masterData.ts)
- [residents.ts](file://src/app/actions/residents.ts)
- [assignments.ts](file://src/app/actions/assignments.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)
- [laporan.ts](file://src/app/actions/laporan.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [schema.prisma](file://prisma/schema.prisma)
- [AkademikClient.tsx](file://src/components/dashboard/AkademikClient.tsx)
- [AssignmentListClient.tsx](file://src/components/dashboard/AssignmentListClient.tsx)
- [residents.tsx](file://src/components/dashboard/residents/ResidentsTable.tsx)

## Performance Considerations
- Use database indexes on frequently queried fields (e.g., resident cohort fields, assignment dates).
- Batch operations for cohort analytics reduce round-trips and improve throughput.
- Transaction boundaries in monitoring and reporting actions ensure data consistency.
- Client-side pagination and filtering minimize rendering overhead for large datasets.

## Troubleshooting Guide
Common issues and resolutions:
- Unique constraint violations for cohort names or student identifiers are handled with explicit error messages in server actions.
- Room capacity checks prevent over-occupancy during cohort transfers.
- Audit logs capture cohort-related changes for traceability and reconciliation.
- Monitoring data validation ensures only valid scores contribute to analytics.

**Section sources**
- [residents.ts](file://src/app/actions/residents.ts)
- [roomTransfer.ts](file://src/app/actions/roomTransfer.ts)
- [audit.ts](file://src/app/actions/audit.ts)
- [monitoring.ts](file://src/app/actions/monitoring.ts)

## Conclusion
The system provides robust batch and cohort management through a clear academic hierarchy, cohort-aware resident operations, assignment-driven progression tracking, and cohort analytics powered by monitoring data. Historical cohort management is ensured via audit logs and room transfer history, while batch-specific reporting enables actionable insights for academic administration.