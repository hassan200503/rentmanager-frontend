import { UserRole } from "../types/user";

// Mirrors the backend's @PreAuthorize convention on write endpoints
// (PropertyCommandController, UnitMediaController, PropertyMediaController):
// OWNER and MANAGER can write, STAFF is read-only. Reuse this constant
// wherever a frontend control gates a write action scoped the same way.
export const WRITE_ROLES: UserRole[] = [UserRole.OWNER, UserRole.MANAGER];

export function hasRole(role: UserRole | null | undefined, allowed: UserRole[]): boolean {
    return !!role && allowed.includes(role);
}
