// lib/auth/audit.ts
//
// Structured audit logging for auth decisions at the edge. Every allow/
// deny (or gap) is emitted as a single-line JSON object so Vercel function
// logs / log drains can join on userId + pathname. The authoritative audit
// trail for admin access and tenant mismatches lives in the backend (see
// BACKEND_HARDENING_PLAN) — this is the frontend complement for routing.

interface AuditEvent {
    event: string;
    userId?: string | null;
    pathname?: string;
    [k: string]: unknown;
}

function emit(evt: AuditEvent): void {
    // JSON.stringify keeps it single-line and suitably-shaped for log
    // pipeline ingestion. Never throws in the request path.
    try {
        console.info(JSON.stringify(evt));
    } catch {
        // ignore serialization failure — auth must not break on logging
    }
}

/** A route decision was made. `decision` is the resulting action. */
export function auditRouteDecision(opts: {
    userId?: string | null;
    pathname: string;
    decision: "next" | "redirect" | "sign-in";
    reason: string;
    persona?: string | null;
    tenantId?: string | null;
}): void {
    emit({
        event: "auth.route_decision",
        ts: Date.now(),
        ...opts,
    });
}

/** The request attempted to cross into a forbidden persona's tree. */
export function auditCrossPersonaAttempt(opts: {
    userId?: string | null;
    pathname: string;
    persona: string;
}): void {
    emit({
        event: "auth.cross_persona_attempt",
        ts: Date.now(),
        ...opts,
    });
}

/** userType claim was absent — legacy signals used (migration window). */
export function auditUnclassified(opts: { userId?: string | null; pathname?: string; source: string }): void {
    emit({
        event: "auth.user_type_unclassified",
        ts: Date.now(),
        ...opts,
    });
}