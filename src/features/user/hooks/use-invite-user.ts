import { useInviteUserMutation } from "../queries/use-invite-user-mutation";
import { InviteUserRequest } from "../types/user";

export const useInviteUser = () => {
    const mutation = useInviteUserMutation();

    const inviteUser = async (payload: InviteUserRequest) => {
        return mutation.mutateAsync(payload);
    };

    return {
        inviteUser,
        isLoading: mutation.isPending,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
    };
};