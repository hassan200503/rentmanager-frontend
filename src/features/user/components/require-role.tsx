"use client";

import { ReactNode } from "react";
import { useHasRole } from "../hooks/use-has-role";
import { UserRole } from "../types/user";

interface RequireRoleProps {
    roles: UserRole[];
    children: ReactNode;
    fallback?: ReactNode;
}

// Wraps a block of UI that only some landlord roles may see or use.
// For scattered per-control gating (e.g. hiding one button among several),
// prefer the useHasRole() hook directly instead of wrapping each control.
export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
    return useHasRole(roles) ? <>{children}</> : <>{fallback}</>;
}
