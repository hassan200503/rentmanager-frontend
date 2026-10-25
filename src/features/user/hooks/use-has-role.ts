import { useCurrentUser } from "./use-current-user";
import { UserRole } from "../types/user";
import { hasRole } from "../lib/roles";

// Returns false (not undefined) while the current user is still loading, so
// write controls stay hidden rather than flashing visible before role data
// arrives. Callers that need to distinguish "loading" from "denied" should
// read isLoading off useCurrentUser() directly.
export function useHasRole(allowed: UserRole[]): boolean {
    const { role } = useCurrentUser();
    return hasRole(role, allowed);
}
