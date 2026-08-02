"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useActivityFeed } from "@/features/activity/hooks/use-activity-feed";
import { useNotificationStore } from "@/stores/notification-store";
import { useToast } from "@/shared/components/dashboard/ToastProvider";
import { useOrgStore } from "@/stores/org-store";
import { maintenanceKeys } from "@/features/maintenance/hooks/use-maintenance-query";

export const MAINTENANCE_REQUEST_SUBMITTED = "MAINTENANCE_REQUEST_SUBMITTED";

function getToastVariant(eventType: string): "success" | "warning" | "info" | "error" {
  const [, ...parts] = eventType.split("_");
  const action = parts.join("_");
  if (action === "CREATED" || action === "ACTIVATED") return "success";
  if (action === "TERMINATED" || action === "ARCHIVED") return "warning";
  if (action === "UPDATED" || action === "OCCUPANCY_CHANGED") return "info";
  return "info";
}

function getToastTitle(eventType: string, entityName: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes("payment") || lower.includes("rent")) return `Payment — ${entityName}`;
  if (lower.includes("lease")) return `Lease — ${entityName}`;
  if (lower.includes("property")) return `Property — ${entityName}`;
  if (lower.includes("maintenance")) return `Maintenance — ${entityName}`;
  if (lower.includes("tenant") || lower.includes("reservation")) return `Reservation — ${entityName}`;
  return entityName;
}

function requestBrowserPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: "rentmanager-notification",
    });
  } catch {}
}

export default function NotificationSync() {
  const tenantId = useOrgStore((s) => s.tenantId);
  const { activities, isLoading } = useActivityFeed(tenantId ?? undefined);
  const { setActivities, mergeActivity, unreadCount } = useNotificationStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const processedIds = useRef(new Set<string>());

  // Request browser notification permission
  useEffect(() => {
    requestBrowserPermission();
  }, []);

  // Sync full activity list to notification store on load
  useEffect(() => {
    if (activities.length > 0 && !isLoading) {
      setActivities(activities);
      // Mark all IDs as processed
      activities.forEach((a) => processedIds.current.add(a.id));
    }
  }, [activities, isLoading, setActivities]);

  // Watch for new activities (live feed) and show toasts
  useEffect(() => {
    if (!activities || activities.length === 0) return;

    const latest = activities[0];
    if (!latest || processedIds.current.has(latest.id)) return;

    processedIds.current.add(latest.id);
    mergeActivity(latest);

    const isMaintenanceRequest = latest.eventType === MAINTENANCE_REQUEST_SUBMITTED;

    // V54: a fresh maintenance request must move the sidebar badge and the
    // Requests hub immediately - no waiting for the next poll.
    if (isMaintenanceRequest) {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
    }

    // Show toast
    const unitNumber =
      typeof latest.metadata?.unitNumber === "string" ? latest.metadata.unitNumber : null;
    const title = isMaintenanceRequest
      ? "New maintenance request"
      : getToastTitle(latest.eventType, latest.entityName);
    const description = isMaintenanceRequest
      ? `"${latest.entityName}"${unitNumber ? ` · Unit ${unitNumber}` : ""} · ${latest.actorName}`
      : latest.actorName;
    const variant = isMaintenanceRequest ? "warning" : getToastVariant(latest.eventType);
    toast({ title, description, variant, duration: 4000 });

    // Browser notification
    sendBrowserNotification(title, description);
  }, [activities, mergeActivity, toast, queryClient]);

  // Update document title with unread count
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) RentManager`;
    } else {
      document.title = "RentManager — Property Management Platform";
    }
  }, [unreadCount]);

  return null;
}