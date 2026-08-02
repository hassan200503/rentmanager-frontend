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

    // Property events: direct to the property detail page.
    if (activity.entityType === "Property") {
        return `/dashboard/properties/${entityId}`;
    }

    // Unit events: navigate to the unit within its parent property context.
    // This is the most relevant page since units are managed inside properties.
    if (activity.entityType === "Unit") {
        const pid = activity.metadata?.propertyId;
        if (pid && typeof pid === "string") {
            return `/dashboard/properties/${pid}/units/${entityId}`;
        }
        return `/dashboard/properties`;
    }

    // Lease events: direct to the lease detail page.
    if (activity.entityType === "Lease") {
        return `/dashboard/leases/${entityId}`;
    }

    // Maintenance-request events: the Requests hub is where they're handled.
    if (activity.entityType === "MaintenanceRequest") {
        return "/dashboard/requests";
    }

    return null;
}

const ACTION_VERB: Record<string, string> = {
    CREATED: "added",
    ACTIVATED: "activated",
    ARCHIVED: "archived",
    UPDATED: "updated",
    TERMINATED: "terminated",
    OCCUPANCY_CHANGED: "changed the occupancy of",
    REQUEST_SUBMITTED: "submitted",
};

export function describe(activity: Activity): string {
    const [, ...actionParts] = activity.eventType.split("_");
    const action = actionParts.join("_");
    const verb = ACTION_VERB[action];
    if (!verb) {
        return `${activity.actorName} — ${activity.entityName} was updated`;
    }
    return `${activity.actorName} ${verb} ${activity.entityName}`;
}
