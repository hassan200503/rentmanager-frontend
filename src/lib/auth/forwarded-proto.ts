/**
 * Tells the request what scheme the browser actually used.
 *
 * <h2>The bug this exists for</h2>
 * Deno Deploy terminates TLS at its edge and forwards the request to the
 * Next.js server over plain HTTP **without** an `x-forwarded-proto` header.
 * Next and Clerk both fall back to the socket's scheme when that header is
 * missing, so every absolute URL the server generated came out as `http://`.
 * Measured on the live deployment, signed out:
 *
 *     GET /dashboard
 *     → 307 Location: http://<host>/public/sign-in?redirect_url=http%3A%2F%2F<host>%2Fdashboard
 *
 * Sending the same request with `X-Forwarded-Proto: https` produced the
 * correct `https://` in both places, which is what identifies the missing
 * header — rather than Next or Clerk — as the cause.
 *
 * <h2>Why it is worth fixing rather than tolerating</h2>
 * The edge answers `http://` with a 301 to `https://`, so a signed-out
 * visitor merely takes an extra hop. The flow that does not survive it is
 * Clerk's handshake: Clerk redirects to its Frontend API carrying the current
 * URL, the Frontend API redirects back to that URL, and the response that
 * sets the session cookie is then an **http** response. A `Secure` cookie set
 * there is dropped by the browser, the middleware sees no session, and the
 * handshake starts again — a sign-in loop that ends in Clerk's redirect-count
 * error page. That only happens for users who reach the point of having a
 * session, which is precisely the case no anonymous smoke test can reach.
 *
 * <h2>What it does, and what it deliberately does not do</h2>
 * It rewrites the request handed to Clerk, not the response, and only when
 * every one of these holds:
 *
 *  - the deployment's own public origin is `https` (from `NEXT_PUBLIC_APP_URL`),
 *    so a local `http://localhost:3000` build is untouched;
 *  - no `x-forwarded-proto` is present, so a host that sets one correctly —
 *    Netlify, Render, a reverse proxy — keeps its own value and is believed;
 *  - the request is a GET or HEAD.
 *
 * That last condition is a safety margin, not a functional limit. A request
 * with a body cannot be cloned here without transferring its stream, and the
 * URLs that matter — the sign-in redirect, the handshake, the persona
 * redirects — are all produced on document navigations. A POST keeps the old
 * behaviour: an `http://` Location that the edge immediately upgrades.
 *
 * The header is fabricated, not forwarded, so it must never be treated as
 * evidence about the client. It says only "this deployment is served over
 * HTTPS", which is a fact about the deployment and is read from our own
 * configuration, not from anything the caller sent.
 */

/** Parsed once: the origin this deployment is reached on, if it is https. */
export function httpsPublicOrigin(appUrl: string | undefined): string | null {
    if (!appUrl) return null;
    try {
        const { origin, protocol } = new URL(appUrl);
        return protocol === "https:" ? origin : null;
    } catch {
        return null;
    }
}

export interface ProtoRewrite {
    /** The absolute https URL the request should be understood as. */
    url: string;
    /** The value to set for `x-forwarded-proto`. */
    proto: "https";
}

/**
 * Decides whether the request handed to Clerk needs an `x-forwarded-proto`.
 * Returns `null` when it should be passed through untouched.
 */
export function resolveProtoRewrite(input: {
    method: string;
    forwardedProto: string | null;
    protocol: string;
    pathname: string;
    search: string;
    httpsOrigin: string | null;
}): ProtoRewrite | null {
    const { method, forwardedProto, protocol, pathname, search, httpsOrigin } = input;

    if (!httpsOrigin) return null;
    if (forwardedProto) return null;
    if (protocol === "https:") return null;
    if (method !== "GET" && method !== "HEAD") return null;

    return { url: `${httpsOrigin}${pathname}${search}`, proto: "https" };
}
