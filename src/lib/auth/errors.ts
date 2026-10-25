// lib/auth/errors.ts
//
// Structured auth errors with distinct HTTP statuses + stable error codes so
// UI and observability can react precisely. All auth-layer rejection paths
// should throw these — never bare errors or guessed literals.

/** Base class for all auth-layer failures. */
export class AuthError extends Error {
    readonly name: string;
    readonly status: number;
    readonly code: string;

    constructor(message: string, opts: { status?: number; code?: string; cause?: unknown } = {}) {
        super(message);
        this.name = "AuthError";
        this.status = opts.status ?? 500;
        this.code = opts.code ?? "AUTH_ERROR";
        if (opts.cause !== undefined) this.cause = opts.cause;
    }
}

/** Session/claims could not be validated. Client should re-authenticate. */
export class InvalidClaimsError extends AuthError {
    override readonly name = "InvalidClaimsError";

    constructor(message: string, cause?: unknown) {
        super(message, { status: 401, code: "AUTH_INVALID_CLAIMS", cause });
    }
}

/** Caller is authenticated but not permitted for the requested scope. */
export class ForbiddenError extends AuthError {
    override readonly name = "ForbiddenError";

    constructor(message = "Forbidden", cause?: unknown) {
        super(message, { status: 403, code: "AUTH_FORBIDDEN", cause });
    }
}

/**
 * The tenant context asserted by the caller does not match the tenant the
 * verified JWT grants access to (confused-deputy guard for tenant-scoped
 * requests). This is a SECURITY event — callers should audit-log loudly.
 */
export class TenantMismatchError extends AuthError {
    override readonly name = "TenantMismatchError";
    /** The tenant claim from the verified JWT. */
    readonly expectedTenantId?: string;
    /** The tenant context the caller attempted to assert. */
    readonly actualTenantId?: string;

    constructor(opts: { expectedTenantId?: string; actualTenantId?: string; cause?: unknown }) {
        super(
            `Tenant mismatch: JWT grants ${opts.expectedTenantId ?? "(none)"}, request claimed ${opts.actualTenantId ?? "(none)"}`,
            { status: 403, code: "AUTH_TENANT_MISMATCH", cause: opts.cause }
        );
        this.expectedTenantId = opts.expectedTenantId;
        this.actualTenantId = opts.actualTenantId;
    }
}

/** An auth guard consumed an incomplete/ambiguous auth context. */
export class UnclassifiedClaimsError extends AuthError {
    override readonly name = "UnclassifiedClaimsError";

    constructor(message: string, cause?: unknown) {
        super(message, { status: 401, code: "AUTH_UNCLASSIFIED", cause });
    }
}