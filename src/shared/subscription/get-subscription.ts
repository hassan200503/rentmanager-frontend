/**
 * Shared subscription resolver - thin re-export of the canonical
 * subscription feature module. Kept at this path so existing imports
 * resolve; the source of truth lives in features/subscription.
 *
 * Source of truth for subscription state is the backend
 * GET /api/v1/tenants/subscription endpoint, which reflects the real
 * billing state (billing mode, period, grace, Ratiba standing order).
 * There is deliberately NO client-only premium flag - the JWT-claims
 * shortcut was removed because it could never reflect grace periods,
 * lapsed reverts, or period end.
 */
export {
    subscriptionApi,
    getIsPremium,
} from "@/features/subscription/api/subscription-api";
import {
    subscriptionApi,
    getIsPremium,
} from "@/features/subscription/api/subscription-api";
export type {
    BillingMode,
    SubscriptionStatus,
    StandingOrderStatus,
    SubscriptionPaymentPurpose,
    SubscriptionPaymentRequestStatus,
    SubscriptionStatusResponse,
    SwitchToPremiumRequest,
    SubscriptionPaymentRequestResponse,
    RatibaSetupResponse,
    SubscriptionPlan,
} from "@/features/subscription/types/subscription-types";

/**
 * Fetches the real subscription state from the backend. The tenant is
 * resolved server-side from the JWT (TenantContext) - nothing tenant- or
 * plan-related is ever taken from the client.
 */
export function getSubscriptionStatus() {
    return subscriptionApi.getStatus();
}

export { getIsPremium as getPremium };
