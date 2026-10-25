import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "../api/user-api";
import { InviteUserRequest } from "../types/user";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import { ApiError } from "@/lib/api/errors";

export const useInviteUserMutation = () => {
    return useMutation({
        mutationFn: (payload: InviteUserRequest) => userApi.invite(payload),
        onSuccess: (data) => {
            toast.success(`Invitation sent to ${data.email}`);
        },
        onError: (error) => {
            // Backend rejections we know can surface here even with a
            // "valid-looking" form: reused Clerk email, or a MANAGER
            // attempting to invite a MANAGER/OWNER (invite matrix, enforced
            // server-side since the frontend can't check inviter role yet).
            if (error instanceof ApiError && error.status === 409) {
                toast.error(error.message || "This email is already associated with an existing account.");
                return;
            }

            if (error instanceof ApiError && error.status === 403) {
                toast.error(error.message || "You don't have permission to invite this role.");
                return;
            }

            toast.error(
                getProcessErrorMessage(error, "Failed to send invitation. Please try again.")
            );
        },
    });
};