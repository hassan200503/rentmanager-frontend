"use client";

import { useEffect, useState } from "react";

/**
 * Minimal shape of the Network Information API we rely on. It is not in
 * lib.dom yet and is absent in Safari and Firefox, which is why every read is
 * optional and the default is permissive.
 */
interface NetworkInformationLike {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener?: (type: "change", listener: () => void) => void;
    removeEventListener?: (type: "change", listener: () => void) => void;
}

/** Connections on which an ambient background video is not worth its cost. */
const SLOW_EFFECTIVE_TYPES = new Set(["slow-2g", "2g", "3g"]);

/**
 * Whether this visitor should be served decorative, heavyweight media.
 *
 * <h2>Why this exists</h2>
 * The landing page's hero video is 18.9 MB. Measured on the live site, it took
 * 36 s to arrive and — because it saturated the connection — dragged the
 * page's own JavaScript chunks out to 24–30 s each, despite those being small.
 * The video is pure decoration behind a headline.
 *
 * In Kenya most visitors arrive on mobile data they pay for by the megabyte.
 * Spending 18.9 MB of someone's bundle on a background loop, and making the
 * page slower while doing it, is the kind of default that loses a user before
 * they have read a sentence.
 *
 * <h2>What it decides on</h2>
 * Two signals the browser gives us, and nothing inferred:
 *
 * - `saveData` — the visitor has explicitly asked for less data. That is a
 *   direct instruction, so it is honoured without qualification.
 * - `effectiveType` — the browser's own estimate of the connection. On 3g and
 *   below the video would finish long after the visitor had scrolled past it.
 *
 * <h2>Why it defaults to allowing</h2>
 * The Network Information API is Chromium-only. On Safari, Firefox, or any
 * browser that does not report it, this returns `true` and the page behaves as
 * it always did. A default of `false` would strip the video from desktop
 * Safari on fibre, which is a worse mistake than serving it to someone who
 * could have been spared it — and the video is deferred until after load
 * regardless, so the cost of guessing wrong is bounded.
 */
export function useHeavyMediaAllowed(): boolean {
    const [allowed, setAllowed] = useState(true);

    useEffect(() => {
        const connection = (
            navigator as Navigator & { connection?: NetworkInformationLike }
        ).connection;
        if (!connection) {
            return;
        }

        const update = () => {
            const effectiveType = connection.effectiveType ?? "";
            setAllowed(!connection.saveData && !SLOW_EFFECTIVE_TYPES.has(effectiveType));
        };

        update();
        connection.addEventListener?.("change", update);
        return () => connection.removeEventListener?.("change", update);
    }, []);

    return allowed;
}

/**
 * True once the page has finished loading everything it needs to work.
 *
 * Used to hold decorative media back until the JavaScript that makes the page
 * usable has had the bandwidth to itself. On a fast connection this is a
 * fraction of a second and nobody notices; on a slow one it is the difference
 * between a page that works and a page still waiting on a video loop.
 *
 * The poster frame shows throughout, so there is no blank area while waiting —
 * and because the poster becomes the largest paint instead of the video, this
 * tends to improve the measured LCP rather than delay it.
 */
export function useAfterPageLoad(): boolean {
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (document.readyState === "complete") {
            setDone(true);
            return;
        }
        const onLoad = () => setDone(true);
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);

    return done;
}
