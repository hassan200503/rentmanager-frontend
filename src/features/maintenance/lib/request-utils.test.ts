import { describe, expect, it } from "vitest";
import {
    PRIORITY_WEIGHT,
    avgResponseHoursLabel,
    priorityBadgeClass,
    sortRequests,
    statusBadgeClass,
} from "./request-utils";
import { MaintenancePriority, MaintenanceStatus } from "../types/maintenance-response";

describe("sortRequests", () => {
    const requests = [
        { id: "a", priority: "LOW" as MaintenancePriority, createdAt: "2026-08-01T10:00:00Z" },
        { id: "b", priority: "URGENT" as MaintenancePriority, createdAt: "2026-08-01T09:00:00Z" },
        { id: "c", priority: "HIGH" as MaintenancePriority, createdAt: "2026-08-02T10:00:00Z" },
    ];

    it("sorts by priority descending by default", () => {
        const sorted = sortRequests(requests, "priority", "DESC");
        expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
    });

    it("sorts by priority ascending when requested", () => {
        const sorted = sortRequests(requests, "priority", "ASC");
        expect(sorted.map((r) => r.id)).toEqual(["a", "c", "b"]);
    });

    it("sorts by createdAt descending", () => {
        const sorted = sortRequests(requests, "createdAt", "DESC");
        expect(sorted.map((r) => r.id)).toEqual(["c", "a", "b"]);
    });

    it("does not mutate the input array", () => {
        const copy = [...requests];
        sortRequests(requests, "priority", "DESC");
        expect(requests.map((r) => r.id)).toEqual(copy.map((r) => r.id));
    });
});

describe("priorityBadgeClass", () => {
    it("keeps URGENT and HIGH visually distinct", () => {
        expect(priorityBadgeClass("URGENT")).toBe("badge-danger");
        expect(priorityBadgeClass("HIGH")).toContain("orange");
        expect(priorityBadgeClass("HIGH")).not.toBe("badge-danger");
        expect(priorityBadgeClass("MEDIUM")).toBe("badge-warning");
        expect(priorityBadgeClass("LOW")).toBe("badge-neutral");
    });
});

describe("statusBadgeClass", () => {
    it("maps every status", () => {
        const statuses: MaintenanceStatus[] = [
            "SUBMITTED",
            "IN_REVIEW",
            "SCHEDULED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
        ];
        for (const s of statuses) {
            expect(statusBadgeClass(s)).toMatch(/^badge-/);
        }
    });
});

describe("avgResponseHoursLabel", () => {
    it("renders minutes below one hour", () => {
        expect(avgResponseHoursLabel(0.25)).toBe("15 min");
        expect(avgResponseHoursLabel(0.01)).toBe("1 min");
    });

    it("renders hours above one hour", () => {
        expect(avgResponseHoursLabel(24)).toBe("24.0 hrs");
        expect(avgResponseHoursLabel(5.5)).toBe("5.5 hrs");
    });

    it("renders a dash for null", () => {
        expect(avgResponseHoursLabel(null)).toBe("—");
    });
});

describe("PRIORITY_WEIGHT", () => {
    it("ranks URGENT highest", () => {
        expect(PRIORITY_WEIGHT.URGENT).toBeGreaterThan(PRIORITY_WEIGHT.HIGH);
        expect(PRIORITY_WEIGHT.HIGH).toBeGreaterThan(PRIORITY_WEIGHT.MEDIUM);
        expect(PRIORITY_WEIGHT.MEDIUM).toBeGreaterThan(PRIORITY_WEIGHT.LOW);
    });
});
