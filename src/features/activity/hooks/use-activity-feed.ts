import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { activityApi } from "../api/activity-api";
import { Activity } from "../types/activity";

const MAX_ACTIVITIES = 50;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
// If a connection stays open at least this long before dropping, treat the
// drop as a normal disconnect (reset backoff) rather than a persistent
// failure (keep growing backoff).
const STABLE_CONNECTION_MS = 10000;

function mergeActivity(current: Activity[], incoming: Activity): Activity[] {
    if (current.some((a) => a.id === incoming.id)) {
        return current;
    }
    return [incoming, ...current].slice(0, MAX_ACTIVITIES);
}

/**
 * Merges a fresh batch from the REST API into the current local state.
 *
 * Strategy: union both sets by id, sort descending by createdAt, cap at
 * MAX_ACTIVITIES. This means:
 * - Items that arrived via SSE before the refetch are kept (no wipe).
 * - New items from the refetch that weren't in local state are inserted at
 *   their correct chronological position, not blindly prepended.
 * - Duplicates are deduplicated by id.
 */
function mergeFromRefetch(current: Activity[], incoming: Activity[]): Activity[] {
    const byId = new Map<string, Activity>();
    // Current first so incoming can overwrite with fresher server data for
    // any id that already exists locally (e.g. an update event arriving via
    // SSE before the REST refetch completes).
    for (const a of current) byId.set(a.id, a);
    for (const a of incoming) byId.set(a.id, a);

    return Array.from(byId.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_ACTIVITIES);
}

/**
 * Fetches the initial activity batch via React Query, then layers live
 * updates from the SSE stream on top. Graceful degradation per integration
 * spec §9: if the stream never connects, the initial REST fetch still
 * renders a correct, non-live list — isConnected just stays false.
 *
 * On each React Query cache update (e.g. triggered by invalidateQueries
 * after a property/unit mutation) the fresh server data is *merged* into
 * local state rather than replacing it — so SSE-prepended live items are
 * never wiped out by a background refetch.
 *
 * tenantId comes straight from the caller (useCurrentUser, via the
 * dashboard) and is passed through to activityApi as-is — confirmed correct
 * end-to-end by inserting an activity_log row under this exact UUID and
 * seeing it render.
 */
export function useActivityFeed(tenantId: string | undefined) {
    const initialQuery = useQuery({
        queryKey: ["activities", tenantId],
        queryFn: () => activityApi.getRecent(20, tenantId),
        enabled: Boolean(tenantId),
    });

    const [activities, setActivities] = useState<Activity[]>(() => initialQuery.data ?? []);
    const [isConnected, setIsConnected] = useState(false);

    const lastMergedDataRef = useRef<Activity[] | undefined>(undefined);

    // On tenant change or query refetch, merge the fresh REST data into
    // local state. Keyed by tenantId so navigating away and back always
    // re-seeds from cached (or freshly fetched) data.
    useEffect(() => {
        lastMergedDataRef.current = undefined;

        if (!initialQuery.data) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActivities([]);
            return;
        }

        lastMergedDataRef.current = initialQuery.data;
        setActivities((current) => mergeFromRefetch(current, initialQuery.data!));
    }, [initialQuery.data, tenantId]);

    // SSE stream: prepends live items and manages reconnection.
    useEffect(() => {
        if (!tenantId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsConnected(false);
            return;
        }

        const controller = new AbortController();
        let cancelled = false;
        let reconnectDelay = BASE_RECONNECT_DELAY_MS;
        let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

        const connect = async () => {
            if (cancelled) return;

            const attemptStartedAt = Date.now();

            try {
                await activityApi.connectToStream(
                    (activity) => {
                        if (cancelled) return;
                        setActivities((current) => mergeActivity(current, activity));
                    },
                    controller.signal,
                    () => {
                        if (!cancelled) setIsConnected(true);
                    },
                    tenantId
                );
            } catch {
            }

            if (cancelled) return;

            setIsConnected(false);

            const wasStable = Date.now() - attemptStartedAt > STABLE_CONNECTION_MS;
            reconnectDelay = wasStable
                ? BASE_RECONNECT_DELAY_MS
                : Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);

            reconnectTimeout = setTimeout(connect, reconnectDelay);
        };

        connect();

        return () => {
            cancelled = true;
            controller.abort();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            setIsConnected(false);
        };
    }, [tenantId]);

    return {
        activities,
        isConnected,
        isLoading: initialQuery.isLoading,
        isError: initialQuery.isError,
        refetch: initialQuery.refetch,
    };
}
