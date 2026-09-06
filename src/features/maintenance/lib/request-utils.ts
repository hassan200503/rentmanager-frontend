// lib/request-utils.ts
// Pure helpers for the Requests hub (unit-testable, no React/HTTP deps).
import {
    MaintenancePriority,
    MaintenanceStatus,
} from "../types/maintenance-response";

export const PRIORITY_WEIGHT: Record<MaintenancePriority, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
};

export const PRIORITY_LABEL: Record<MaintenancePriority, string> = {
    URGENT: "Urgent",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
};

export const STATUS_LABEL: Record<MaintenanceStatus, string> = {
    SUBMITTED: "Submitted",
    IN_REVIEW: "In Review",
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

/**
 * Priority badge styling. HIGH gets orange so URGENT (red) stays distinct.
 */
export function priorityBadgeClass(priority: MaintenancePriority): string {
    switch (priority) {
        case "URGENT":
            return "badge-danger";
        case "HIGH":
            return "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800";
        case "MEDIUM":
            return "badge-warning";
        case "LOW":
            return "badge-neutral";
    }
}

export function statusBadgeClass(status: MaintenanceStatus): string {
    switch (status) {
        case "COMPLETED":
            return "badge-success";
        case "CANCELLED":
            return "badge-neutral";
        case "IN_PROGRESS":
            return "badge-info";
        case "SCHEDULED":
            return "badge-info";
        case "IN_REVIEW":
            return "badge-warning";
        case "SUBMITTED":
            return "badge-warning";
    }
}

export function sortRequests<T extends { priority: MaintenancePriority; createdAt: string }>(
    requests: T[],
    by: "priority" | "createdAt",
    direction: "ASC" | "DESC",
): T[] {
    const factor = direction === "DESC" ? -1 : 1;
    return [...requests].sort((a, b) => {
        if (by === "priority") {
            return (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) * factor;
        }
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
    });
}

export function avgResponseHoursLabel(hours: number | null): string {
    if (hours === null) return "—";
    if (hours < 1) {
        const minutes = Math.max(1, Math.round(hours * 60));
        return `${minutes} min`;
    }
    return `${hours.toFixed(1)} hrs`;
}

/**
 * Humanises a wait in hours for the "longest wait" figure.
 *
 * Deliberately coarse and deliberately blunt. "528h" is technically accurate
 * and completely fails to land; "22 days" is the number a landlord reacts to.
 */
export function waitingLabel(hours: number | null | undefined): string {
    if (hours == null || hours < 0) return "—";
    if (hours < 1) return "under an hour";
    if (hours < 24) return `${Math.floor(hours)} hr${Math.floor(hours) === 1 ? "" : "s"}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * How overdue an unanswered request is, as a severity band the UI can style.
 * 24h is the SLA the backend rates against, so it is the first threshold.
 */
export function waitSeverity(hours: number | null | undefined): "none" | "watch" | "late" | "critical" {
    if (hours == null) return "none";
    if (hours >= 72) return "critical";
    if (hours >= 24) return "late";
    if (hours >= 8) return "watch";
    return "none";
}
