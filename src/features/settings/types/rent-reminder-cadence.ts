// features/settings/types/rent-reminder-cadence.ts
// Mirrors backend RentReminderPolicyResponse / UpdateRentReminderCadenceRequest.

export type ReminderMilestone =
    | "T_MINUS_7"
    | "T_MINUS_3"
    | "DUE_TODAY"
    | "OVERDUE_1"
    | "OVERDUE_3"
    | "OVERDUE_7";

export interface RentReminderPolicy {
    milestone: ReminderMilestone;
    /** Signed days from the due date. Negative is before, positive is after. */
    dayOffset: number;
    /** Human label supplied by the backend, so the cadence is defined once. */
    label: string;
    enabled: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    notifyLandlord: boolean;
}

export interface UpdateRentReminderCadenceRequest {
    milestones: Array<{
        milestone: ReminderMilestone;
        enabled: boolean;
        smsEnabled: boolean;
        emailEnabled: boolean;
        whatsappEnabled: boolean;
        notifyLandlord: boolean;
    }>;
}
