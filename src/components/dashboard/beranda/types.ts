import { LucideIcon } from "lucide-react";

export interface DashboardUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  satkerId?: string | null;
  permissions?: string[];
}

export interface DashboardProps {
  user: DashboardUser;
}

export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "danger" | "primary";
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
  count?: number;
  dueAt?: Date | string;
  badge?: string;
  isCritical?: boolean;
}

export type ActivityCategory = "ASSIGNMENT" | "ABSENSI" | "MONITORING" | "SYSTEM" | "SECURITY";

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  timestamp: Date | string;
  actor?: string;
  meta?: string;
}

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedAt: Date | string;
  expiresAt?: Date | string;
  author?: string;
  targetRoles?: string[];
  actionLabel?: string;
  actionHref?: string;
}

export type ServiceStatus = "online" | "offline" | "maintenance" | "checking";

export interface SystemStatusData {
  database: ServiceStatus;
  notification: ServiceStatus;
  authentication: ServiceStatus;
  lastSync: Date | string;
  appVersion: string;
}
