// features/settings/api/rent-reminder-cadence-api.ts
// The landlord's rent reminder cadence.
//
// No tenant id in the path: the backend takes it from the verified JWT
// (AuthenticatedUser). Unlike /tenants/{tenantId}/settings there is nothing
// here for a caller to substitute.
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import {
    RentReminderPolicy,
    UpdateRentReminderCadenceRequest,
} from "../types/rent-reminder-cadence";

const CADENCE_URL = "/rent-reminders/cadence";

export const rentReminderCadenceApi = {
    get: async (): Promise<RentReminderPolicy[]> => {
        const { token } = await getAuthContext();
        return apiClient.get<RentReminderPolicy[]>(CADENCE_URL, token);
    },

    update: async (
        payload: UpdateRentReminderCadenceRequest,
    ): Promise<RentReminderPolicy[]> => {
        const { token } = await getAuthContext();
        return apiClient.put<RentReminderPolicy[]>(CADENCE_URL, payload, token);
    },
};
