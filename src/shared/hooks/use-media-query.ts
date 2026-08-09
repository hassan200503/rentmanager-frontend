"use client";

import { useMemo, useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const media = window.matchMedia(query);
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(query: string) {
  return () => (typeof window === "undefined" ? false : window.matchMedia(query).matches);
}

export function useMediaQuery(query: string): boolean {
  const subscribeFn = useMemo(() => subscribe(query), [query]);
  const snapshotFn = useMemo(() => getSnapshot(query), [query]);
  return useSyncExternalStore(subscribeFn, snapshotFn);
}