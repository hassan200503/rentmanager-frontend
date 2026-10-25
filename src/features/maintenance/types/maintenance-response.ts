// types/maintenance-response.ts
// Mirrors backend MaintenanceRequestResponse (enriched) + MaintenanceSlaSummaryResponse.

export type MaintenanceStatus =
    | "SUBMITTED"
    | "IN_REVIEW"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MaintenanceCategory =
    | "PLUMBING"
    | "ELECTRICAL"
    | "STRUCTURAL"
    | "APPLIANCE"
    | "PEST_CONTROL"
    | "GENERAL";

export interface MaintenanceRequestResponse {
    id: string;
    unitId: string;
    propertyId: string;
    tenantProfileId: string;
    leaseId: string | null;
    title: string;
    description: string | null;
    category: MaintenanceCategory;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    scheduledDate: string | null;
    completedAt: string | null;
    firstLandlordResponseAt: string | null;
    /** Set once when the landlord first saw the request (hub load or status action). Null = unviewed. */
    landlordViewedAt: string | null;
    notes: string | null;
    createdBy: string | null;
    assignedTo: string | null;
    propertyName: string | null;
    unitNumber: string | null;
    renterName: string | null;
    version: number | null;
    createdAt: string;
    updatedAt: string;
    /** Statuses this request may move to next, decided by the backend (TD-132). */
    allowedNextStatuses?: MaintenanceStatus[];
}

export interface MaintenanceSlaSummaryResponse {
    totalRequests: number;
    resolvedRequests: number;
    /** How many requests got a first reply. The denominator for the two below. */
    respondedRequests: number;
    /** Average first-reply time across ANSWERED requests only. */
    avgResponseHours: number;
    resolvedRequirementMet: boolean;
    /**
     * Punctuality among ANSWERED requests — of those replied to, how many
     * within 24h. Not coverage: a landlord who answers two and ignores eight
     * scores 100%. Never label this "response rate" on its own.
     */
    responseRatePct: number | null;
    /** Requests with no reply yet. Each one is a renter still waiting. */
    awaitingFirstResponse: number;
    /** Hours the longest-waiting unanswered request has been open; null when none. */
    oldestAwaitingHours: number | null;
}

export interface MaintenanceListParams {
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    sort?: "createdAt" | "priority" | "status" | "title" | "updatedAt";
    direction?: "ASC" | "DESC";
}
