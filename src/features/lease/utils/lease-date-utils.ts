// src/features/lease/utils/lease-date-utils.ts
// Status is typed as `string` here (not the LeaseStatus enum) so these helpers
// work with both LeaseResponse and LeaseSummaryResponse without a cast.

/** Days remaining until an ISO date (negative if already past). */
export const daysUntil = (isoDate: string): number => {
    const target = new Date(isoDate);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const LIVE_STATUSES: string[] = ["ACTIVE", "RENEWED"];
const ACTION_NEEDED_STATUSES: string[] = ["DRAFT", "PENDING_APPROVAL", "AWAITING_DEPOSIT", "PENDING_ACTIVATION"];

export const isExpiringSoon = (status: string, endDate: string, withinDays = 30): boolean => {
    if (!LIVE_STATUSES.includes(status)) return false;
    const remaining = daysUntil(endDate);
    return remaining >= 0 && remaining <= withinDays;
};

export const needsAction = (status: string): boolean => ACTION_NEEDED_STATUSES.includes(status);

/** Human label for how urgent a lease's status is, used to rank the attention panel. */
export const urgencyRank = (status: string, endDate: string): number => {
    if (isExpiringSoon(status, endDate, 7)) return 0;
    if (needsAction(status)) return 1;
    if (isExpiringSoon(status, endDate, 30)) return 2;
    return 3;
};