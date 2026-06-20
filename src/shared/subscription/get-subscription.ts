/**
 * SaaS-grade subscription resolver
 * Source of truth: JWT claims (Clerk session)
 */
type ClerkClaimsWindow = Window & {
    Clerk?: {
        session?: {
            claims?: {
                subscription?: string;
            };
        };
    };
};

export function getIsPremiumFromSession(): boolean {
    if (typeof window === "undefined") return false;

    const session = (window as ClerkClaimsWindow).Clerk?.session;

    if (!session) return false;

    const claims = session?.claims;

    return claims?.subscription === "premium";
}
