// features/settings/api/payout-destination-api.ts
//
// No tenant id in the path — the backend resolves it from the verified JWT.
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import {
    PayoutDestinationResponse,
    UpdatePayoutDestinationRequest,
} from "../types/payout-destination";

const URL = "/tenants/payout-destination";

export const payoutDestinationApi = {
    get: async (): Promise<PayoutDestinationResponse> => {
        const { token } = await getAuthContext();
        return apiClient.get<PayoutDestinationResponse>(URL, token);
    },

    update: async (
        payload: UpdatePayoutDestinationRequest,
    ): Promise<PayoutDestinationResponse> => {
        const { token } = await getAuthContext();
        return apiClient.put<PayoutDestinationResponse>(URL, payload, token);
    },
};
