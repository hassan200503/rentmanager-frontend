export interface Activity {
    id: string;
    tenantId: string;
    // Open string union, not a closed enum — more event types will be added
    // over time (see integration spec §6). Don't build a switch that throws
    // on unrecognized values.
    eventType: string;
    // Will grow beyond these three (see spec §5). Consumers must fall back
    // gracefully for unknown values rather than assume this list is closed.
    entityType: "Property" | "Unit" | "Lease" | "MaintenanceRequest";
    entityId: string;
    entityName: string;
    actorId: string | null;
    // Currently an email address, not a display name — see spec §7.3.
    actorName: string;
    metadata: Record<string, unknown> | null;
    // ISO-8601, UTC
    createdAt: string;
}