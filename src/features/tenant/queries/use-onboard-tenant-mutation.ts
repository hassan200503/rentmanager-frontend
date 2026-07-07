import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { tenantApi } from "../api/tenant-api";
import { OnboardingTenantRequest } from "../types/tenant-types";
import { userApi } from "@/features/user/api/user-api";
import { currentUserKeys } from "@/features/user/queries/use-current-user-query";
import { ApiError } from "@/lib/api/errors";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";

/**
 * CRITICAL (spec §3): a 200 from POST /onboarding/tenant does NOT mean the
 * current session is usable yet. ClerkJwtAuthenticationConverter only
 * re-resolves tenantId/role the NEXT time a token is verified server-side —
 * the token that authenticated THIS request still carries
 * ROLE_PENDING_ONBOARDING. Skipping the refresh below produces a
 * flaky "stuck in onboarding" bug: immediate redirects will intermittently
 * bounce back here or 403 on the dashboard depending on token cache timing.
 * Do not remove this step to "simplify" the hook.
 */
async function refreshSessionAndConfirmOnboarded(
    getToken: ReturnType<typeof useAuth>["getToken"]
) {
    await getToken({ skipCache: true, template: BACKEND_JWT_TEMPLATE });
    return userApi.getCurrentUser();
}

export const useOnboardTenantMutation = () => {
    const qc = useQueryClient();
    const router = useRouter();
    const { getToken } = useAuth();

    return useMutation({
        mutationFn: (payload: OnboardingTenantRequest) => tenantApi.onboard(payload),

        onSuccess: async () => {
            const fresh = await refreshSessionAndConfirmOnboarded(getToken);
            qc.setQueryData(currentUserKeys.all, fresh);

            if (fresh?.tenantId) {
                toast.success("Account set up successfully");
                router.replace("/dashboard");
            } else {
                // Token refresh didn't pick up the new tenant link. Surfacing
                // rather than redirecting blind, since that would bounce
                // straight back into this same guard.
                toast.error("Setup completed but we couldn't confirm your account. Please refresh the page.");
            }
        },

        onError: async (error) => {
            // ASSUMPTION (unverified — no OnboardingController/service source
            // seen yet): treating a duplicate-tenant conflict as a message-text
            // match rather than a specific status/errorCode, since
            // GlobalExceptionHandler maps IllegalStateException, IllegalArgumentException,
            // AND ConflictException all to 409 with different errorCodes, and a
            // BusinessException equivalent would be 400 instead — the doc's spec
            // itself flags this exact status as unconfirmed (§2 error table).
            // CONFIRM against the real onboarding service and tighten this to a
            // status/errorCode check once you have that source.
            const isDuplicateTenant =
                error instanceof ApiError &&
                (error.status === 409 || error.status === 400) &&
                /tenant already exists/i.test(error.message ?? "");

            if (isDuplicateTenant) {
                const fresh = await refreshSessionAndConfirmOnboarded(getToken);
                qc.setQueryData(currentUserKeys.all, fresh);

                if (fresh?.tenantId) {
                    router.replace("/dashboard");
                    return;
                }
            }

            if (error instanceof ApiError && error.status === 403) {
                toast.error("You're not eligible to create an account here.");
                router.replace("/dashboard");
                return;
            }

            toast.error(getProcessErrorMessage(error, "Failed to set up your account. Please try again."));
        },
    });
};