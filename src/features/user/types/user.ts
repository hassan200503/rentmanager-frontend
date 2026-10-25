export enum UserRole {
    OWNER = "OWNER",
    MANAGER = "MANAGER",
    STAFF = "STAFF",
}

export interface InviteUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
}

export interface InviteUserResponse {
    userId: string;
    email: string;
    role: UserRole;
}




export interface UserResponse {
    userId: string;
    tenantId: string | null; // FIX: null for a user with ROLE_PENDING_ONBOARDING
    // (see ClerkJwtAuthenticationConverter.resolveTenantId()
    // — returns null when no local Tenant exists yet).
    // UserQueryServiceImpl.getCurrentUser() returns this
    // as-is off the domain User row, unmapped.
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole | null;   // FIX: same reasoning — role is never assigned
    // until resolveTenantId() runs successfully.
    active: boolean;
}





export interface UserListParams {
    page?: number;
    size?: number;
}

export interface UserPageResponse {
    content: UserResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;


}

/**
 * What this signed-in session is authorised for, from GET /users/me/access,
 * derived by the backend from the same authorities method security enforces.
 * Route on this, never on Clerk metadata or a self-declared persona.
 */
export interface SessionAccess {
    userId: string | null;
    landlordRole: "OWNER" | "MANAGER" | "STAFF" | null;
    landlordTenantId: string | null;
    renter: boolean;
    pendingOnboarding: boolean;
    platformAdmin: boolean;
}
