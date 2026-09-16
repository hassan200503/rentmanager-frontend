// features/tenant/lib/onboarding-organization.ts
//
// Which Clerk organisation a landlord's onboarding should be registered
// against. The backend creates the tenant from the organisation in the verified
// token (OnboardingController.extractClerkOrgId) and refuses when there is
// none. Nothing in the web app used to create that organisation, so a brand-new
// landlord could never finish onboarding: the only accounts that worked had an
// organisation made by hand in the Clerk dashboard during development.
//
// Rule:
//   - Reuse the active organisation only when this person is its ADMIN. That
//     covers a retry after the organisation was created but the API call
//     failed, and an organisation the person made themselves.
//   - Otherwise create a new one. Never onboard into an organisation the person
//     was merely invited to as a member: registering it would make them OWNER
//     of another landlord's business.

export type OnboardingOrganizationDecision =
    | { action: "reuse"; organizationId: string }
    | { action: "create" };

export const CLERK_ORG_ADMIN_ROLE = "org:admin";

export function decideOnboardingOrganization(active: {
    organizationId: string | null | undefined;
    membershipRole: string | null | undefined;
}): OnboardingOrganizationDecision {
    if (active.organizationId && active.membershipRole === CLERK_ORG_ADMIN_ROLE) {
        return { action: "reuse", organizationId: active.organizationId };
    }
    return { action: "create" };
}
