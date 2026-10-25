// Mirrors ConfigureDarajaCredentialsRequest (backend). All four fields are
// @NotBlank server-side — keep required here too so inline validation can
// fire before a round-trip.
export interface ConfigureDarajaCredentialsRequest {
    consumerKey: string;
    consumerSecret: string;
    businessShortCode: string;
    passkey: string;
}

// Mirrors DarajaCredentialsStatusResponse (backend). Deliberately minimal —
// the backend never echoes credential material, not even businessShortCode.
// Do not add fields here speculatively; if the backend response shape
// changes, this type should be updated to match it, not ahead of it.
export interface DarajaCredentialsStatusResponse {
    configured: boolean;
    /**
     * "DIRECT" — rent settles into the landlord's own M-Pesa; the platform
     * never holds it. "PLATFORM_CUSTODY" — legacy aggregation, requires CBK
     * authorisation. Optional so a response from a backend predating the
     * field does not break the page; treat a missing value as DIRECT, which
     * is both the default and the safe thing to claim.
     */
    collectionMode?: "DIRECT" | "PLATFORM_CUSTODY";
}

// Mirrors DarajaCredentialsTestResponse (backend). `message` and `error`
// carry Safaricom's own verdict — render them as-is. Rewording a provider
// error into something friendlier is what leaves a landlord unable to search
// for the actual code Safaricom returned.
export interface DarajaCredentialsTestResponse {
    ok: boolean;
    message: string;
    error: string | null;
    /** The Safaricom host that answered, so a sandbox reply is visible. */
    environment: string;
    /** What the test proved, and what it did not. */
    scope: string;
}

// Frontend-only view-state discriminator for the page component.
// Not a backend concept — derived from the status query result.
export type DarajaPageState =
    | { status: "loading" }
    | { status: "permission-denied" }
    | { status: "unconfigured" }
    | { status: "configured" }
    | { status: "editing" };