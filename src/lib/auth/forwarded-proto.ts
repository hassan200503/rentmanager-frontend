/**
 * Tells the request what scheme and host the browser actually used.
 *
 * <h2>The bug this exists for</h2>
 * Deno Deploy terminates TLS at its edge, forwards to the Next.js server over
 * plain HTTP, and then reports that inner hop as the truth. Measured on the
 * live deployment with a temporary probe in the proxy:
 *
 *     { "nextUrlProtocol": "http:",
 *       "reqUrl":          "http://0.0.0.0:3000/",
 *       "xForwardedProto": "http",
 *       "xForwardedHost":  "rentmanagerke.hassan200503.deno.net" }
 *
 * Next and Clerk both believe `x-forwarded-proto`, so every absolute URL the
 * server generated came out as `http://`:
 *
 *     GET /dashboard
 *     -> 307 Location: http://<host>/public/sign-in?redirect_url=http%3A%2F%2F<host>%2Fdashboard
 *
 * Note `reqUrl`: without the forwarded headers there is no usable origin at
 * all, only the internal socket. The host survives because `x-forwarded-host`
 * is right; it is only the scheme that is wrong.
 *
 * <h2>Why it is worth fixing rather than tolerating</h2>
 * The edge answers `http://` with a 301 to `https://`, so a signed-out
 * visitor merely takes an extra hop — which is exactly why this looks
 * harmless. The flow that does not survive it is Clerk's handshake: Clerk
 * redirects to its Frontend API carrying the current URL, the Frontend API
 * redirects back to that URL, and the response that sets the session cookie
 * is therefore an **http** response. A `Secure` cookie set there is dropped
 * by the browser, the middleware sees no session, and the handshake starts
 * again — a sign-in loop that ends at Clerk's redirect-count error page.
 * Only a user who has a session can reach that state, so no anonymous check
 * of the deployment can find it.
 *
 * <h2>The rule, and the one it replaced</h2>
 * The first attempt deferred to `x-forwarded-proto` whenever the header was
 * present, reasoning that a host which bothers to set it is telling the
 * truth. That is precisely this host, and it is wrong, so the fix changed
 * nothing and the probe above is what settled it. The header describes the
 * edge's connection to the origin server, not the browser's connection to the
 * edge, and nothing obliges a platform to rewrite it.
 *
 * So the scheme comes from our own configuration instead. If
 * `NEXT_PUBLIC_APP_URL` is an https origin then this deployment is served
 * over HTTPS: that is a fact about the deployment, set by whoever deployed
 * it, and it does not depend on trusting anything a caller or an edge sent.
 * The fabricated header is therefore never evidence about the client — it
 * asserts one thing, and that thing is read from configuration.
 *
 * A local `http://localhost:3000` build yields no https origin and is left
 * entirely alone, as is any host that already reports https over https.
 *
 * The remaining condition is the method. A request with a body cannot be
 * cloned here without transferring its stream, so POST and friends keep the
 * old behaviour: an `http://` Location that the edge immediately upgrades.
 * That is a safety margin rather than a functional limit, because every URL
 * that matters — the sign-in redirect, its return target, Clerk's handshake,
 * the persona redirects — is produced on a document navigation.
 */

/** The origin this deployment is reached on, but only when it is https. */
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
 * Decides whether the request handed to Clerk needs its origin corrected.
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
    if (method !== "GET" && method !== "HEAD") return null;

    // Already right on both counts: a host reporting https, over https.
    const reported = (forwardedProto ?? protocol.replace(/:$/, "")).trim().toLowerCase();
    if (reported === "https" && protocol === "https:") return null;

    return { url: `${httpsOrigin}${pathname}${search}`, proto: "https" };
}
