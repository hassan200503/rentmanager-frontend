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
 * Fetches the initial activity batch via React Query, then layers live
 * updates from the SSE stream on top. Graceful degradation per integration
 * spec §9: if the stream never connects, the initial REST fetch still
 * renders a correct, non-live list — isConnected just stays false.
 *
 * tenantId comes straight from the caller (useCurrentUser, via the
 * dashboard) and is passed through to activityApi as-is — confirmed correct
 * end-to-end by inserting an activity_log row under this exact UUID and
 * seeing it render. An earlier version of this hook instead sourced tenant
 * id from useOrgStore (the Clerk org id, hashed via uuidv5), which matched
 * a different, unrelated backend endpoint by coincidence but pointed
 * activity queries at a tenant with no matching rows. Since this hook only
 * runs once tenantId is already resolved (DashboardContent doesn't mount
 * until user.tenantId is truthy), there's no store-hydration race to guard
 * against here — the prop is reliably available from the first render.
 */
export function useActivityFeed(tenantId: string | undefined) {
    const initialQuery = useQuery({
        queryKey: ["activities", tenantId],
        queryFn: () => activityApi.getRecent(20, tenantId),
        enabled: Boolean(tenantId),
    });

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const seededRef = useRef(false);

    // Seed local state from the initial REST fetch once, rather than
    // continuously syncing — otherwise a React Query cache update after the
    // stream has already started prepending live items would wipe them out.
    useEffect(() => {
        if (initialQuery.data && !seededRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActivities(initialQuery.data.slice(0, MAX_ACTIVITIES));
            seededRef.current = true;
        }
    }, [initialQuery.data]);

    // tenantId changing tears down and reopens the stream, and resets the
    // list/seed so one tenant's activities never leak into another's.
    useEffect(() => {
        // Intentional synchronous reset: the list/seed must be cleared
        // before the new tenant's connection starts below, so a prior
        // tenant's activities can't briefly linger on screen. Suppressing
        // the lint rule here rather than moving this into a callback, since
        // there is no user event to attach it to — it's driven by tenantId
        // changing.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        seededRef.current = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActivities([]);

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
                // Connection failed to open or errored mid-stream. Either way
                // we fall through to the reconnect scheduling below — the
                // initial REST fetch has already rendered a working list, so
                // there's nothing to blank out here.
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