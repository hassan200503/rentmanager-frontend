"use client";

import { useEffect, useRef } from "react";
import { useActivityFeed } from "@/features/activity/hooks/use-activity-feed";
import { useNotificationStore } from "@/stores/notification-store";
import { useToast } from "@/shared/components/dashboard/ToastProvider";
import { useOrgStore } from "@/stores/org-store";

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

    // Show toast
    const variant = getToastVariant(latest.eventType);
    const title = getToastTitle(latest.eventType, latest.entityName);
    toast({
      title,
      description: latest.actorName,
      variant,
      duration: 4000,
    });

    // Browser notification
    sendBrowserNotification(title, latest.actorName);
  }, [activities, mergeActivity, toast]);

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