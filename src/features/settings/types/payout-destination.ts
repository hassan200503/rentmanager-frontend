// features/settings/types/payout-destination.ts
// Mirrors backend PayoutDestinationResponse / UpdatePayoutDestinationRequest.

export interface PayoutDestinationResponse {
    configured: boolean;
    /** Masked. The API never returns the full number. */
    maskedPhoneNumber: string | null;
}

export interface UpdatePayoutDestinationRequest {
    /** Kenyan MSISDN, +2547XXXXXXXX. Validated server-side too. */
    payoutPhoneNumber: string;
}
