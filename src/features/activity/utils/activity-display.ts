import { Building2, Home, FileText, Wrench } from "lucide-react";
import type { Activity } from "@/features/activity/types/activity";

export function timeAgo(dateString?: string): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.round(diffDays / 30);
    return `${diffMonths}mo ago`;
}

export const ENTITY_ICON: Record<string, typeof Building2> = {
    Property: Building2,
    Unit: Home,
    Lease: FileText,
    MaintenanceRequest: Wrench,
};

export function getActivityHref(activity: Activity): string | null {
    const entityId = activity.entityId;

    if (activity.entityType === "Property") return `/dashboard/properties/${entityId}`;

    if (activity.entityType === "Unit") {
        const pid = activity.metadata?.propertyId;
        if (pid && typeof pid === "string") return `/dashboard/properties/${pid}/units/${entityId}`;
        return `/dashboard/properties`;
    }

    if (activity.entityType === "Lease") return `/dashboard/leases/${entityId}`;

    if (activity.entityType === "MaintenanceRequest") return "/dashboard/requests";

    return null;
}

/** Extract the action suffix from a raw eventType string, e.g. UNIT_OCCUPANCY_CHANGED → OCCUPANCY_CHANGED */
export function getActionKey(eventType: string): string {
    const [, ...parts] = eventType.split("_");
    return parts.join("_");
}

const ACTION_VERB: Record<string, string> = {
    CREATED: "added",
    ACTIVATED: "activated",
    ARCHIVED: "archived",
    UPDATED: "updated",
    TERMINATED: "terminated",
    OCCUPANCY_CHANGED: "changed the occupancy of",
    REQUEST_SUBMITTED: "submitted a maintenance request for",
};

const OCCUPANCY_LABELS: Record<string, string> = {
    VACANT: "Vacant",
    OCCUPIED: "Occupied",
    PARTIALLY_OCCUPIED: "Partially Occupied",
    UNDER_MAINTENANCE: "Under Maintenance",
};

/** Semantic color per action type — drives dot and icon tint on the log page. */
export const ACTION_COLOR: Record<string, string> = {
    CREATED: "var(--color-success)",
    ACTIVATED: "var(--color-brand)",
    UPDATED: "var(--color-info)",
    ARCHIVED: "var(--color-fg-muted)",
    TERMINATED: "var(--color-danger)",
    OCCUPANCY_CHANGED: "var(--color-warning)",
    REQUEST_SUBMITTED: "var(--color-warning)",
};

export function getActionColor(eventType: string): string {
    return ACTION_COLOR[getActionKey(eventType)] ?? "var(--color-brand)";
}

function formatActor(activity: Activity, currentUserId?: string): string {
    if (!activity.actorId) return "System";
    if (currentUserId && activity.actorId === currentUserId) return "You";
    const name = activity.actorName ?? "";
    // actorName is currently an email (spec §7.3) — abbreviate to local part only.
    if (name.includes("@")) return name.split("@")[0];
    return name || "Someone";
}

/**
 * Produces a human-readable sentence for an activity entry.
 *
 * Pass currentUserId to get "You" instead of an email abbreviation for
 * self-actions. Omitting it is safe — the dashboard components call this
 * without it and render correctly.
 */
export function describe(activity: Activity, currentUserId?: string): string {
    const actor = formatActor(activity, currentUserId);
    const action = getActionKey(activity.eventType);

    // Enrich occupancy changes with the direction if the backend supplied it.
    if (action === "OCCUPANCY_CHANGED") {
        const rawOcc = activity.metadata?.newOccupancy ?? activity.metadata?.occupancy;
        const newOcc = typeof rawOcc === "string" ? rawOcc : undefined;
        if (newOcc) {
            const label = OCCUPANCY_LABELS[newOcc] ?? newOcc.toLowerCase().replace(/_/g, " ");
            return `${actor} marked ${activity.entityName} as ${label}`;
        }
        return `${actor} changed the occupancy of ${activity.entityName}`;
    }

    const verb = ACTION_VERB[action];
    if (!verb) return `${actor} updated ${activity.entityName}`;
    return `${actor} ${verb} ${activity.entityName}`;
}
