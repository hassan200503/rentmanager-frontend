import { create } from "zustand";
import type { Activity } from "@/features/activity/types/activity";
import { getActivityHref } from "@/features/activity/utils/activity-display";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  href: string | null;
  icon: string;
  color: string;
  createdAt: string;
  read: boolean;
}

function formatActorName(raw: string): string {
  if (!raw.includes("@")) return raw;
  return raw
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getNotificationColor(eventType: string): string {
  const [, ...parts] = eventType.split("_");
  const action = parts.join("_");
  const colorMap: Record<string, string> = {
    CREATED: "#16A34A",
    ACTIVATED: "#059669",
    UPDATED: "#2563EB",
    ARCHIVED: "#6B7280",
    TERMINATED: "#DC2626",
    OCCUPANCY_CHANGED: "#D97706",
    REQUEST_SUBMITTED: "#D97706",
  };
  return colorMap[action] ?? "#059669";
}

function getNotificationIcon(eventType: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes("lease")) return "FileText";
  if (lower.includes("payment") || lower.includes("rent")) return "Receipt";
  if (lower.includes("property") || lower.includes("unit")) return "Building2";
  if (lower.includes("tenant") || lower.includes("reservation")) return "Users";
  if (lower.includes("maintenance")) return "Wrench";
  return "Activity";
}

function activityToNotification(a: Activity): AppNotification {
  const [, ...parts] = a.eventType.split("_");
  const action = parts.join("_");

  const verbMap: Record<string, string> = {
    CREATED: "added",
    ACTIVATED: "activated",
    ARCHIVED: "archived",
    UPDATED: "updated",
    TERMINATED: "terminated",
    OCCUPANCY_CHANGED: "changed occupancy of",
    REQUEST_SUBMITTED: "submitted",
  };

  const verb = verbMap[action] ?? "updated";

  const isMaintenanceRequest = a.eventType === "MAINTENANCE_REQUEST_SUBMITTED";
  const unitNumber =
    typeof a.metadata?.unitNumber === "string" ? a.metadata.unitNumber : null;
  const actor = formatActorName(a.actorName);
  const description = isMaintenanceRequest
    ? `submitted by ${actor}${unitNumber ? ` · Unit ${unitNumber}` : ""}`
    : `${verb} by ${actor}`;

  return {
    id: a.id,
    title: a.entityName,
    description,
    entityType: a.entityType,
    entityId: a.entityId,
    href: getActivityHref(a),
    icon: getNotificationIcon(a.eventType),
    color: getNotificationColor(a.eventType),
    createdAt: a.createdAt,
    read: false,
  };
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  isConnected: boolean;

  setActivities: (activities: Activity[]) => void;
  mergeActivity: (activity: Activity) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setConnected: (connected: boolean) => void;
  clear: () => void;
}

const MAX_NOTIFICATIONS = 50;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isConnected: false,

  setActivities: (activities) => {
    const notifications = activities
      .map(activityToNotification)
      .slice(0, MAX_NOTIFICATIONS);
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  },

  mergeActivity: (activity) => {
    const { notifications } = get();
    if (notifications.some((n) => n.id === activity.id)) return;
    const notification = activityToNotification(activity);
    const updated = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS);
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAsRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllAsRead: () => {
    const { notifications } = get();
    set({
      notifications: notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
  },

  setOpen: (open) => set({ isOpen: open }),

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

  setConnected: (connected) => set({ isConnected: connected }),

  clear: () => set({ notifications: [], unreadCount: 0 }),
}));