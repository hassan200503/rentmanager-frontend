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
}

// Frontend-only view-state discriminator for the page component.
// Not a backend concept — derived from the status query result.
export type DarajaPageState =
    | { status: "loading" }
    | { status: "permission-denied" }
    | { status: "unconfigured" }
    | { status: "configured" }
    | { status: "editing" };