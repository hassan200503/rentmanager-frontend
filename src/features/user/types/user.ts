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
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
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