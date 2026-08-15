"use client";

import { formatUpdatedAt } from "@/features/landing/lib/format-updated-at";

interface VerifiedStatProps {
  /** Total count of verified listings; `undefined` while loading. */
  count?: number;
  /** ISO timestamp of the fetch that produced the count. */
  updatedAt?: string;
  /** Fetch failed — fall back to the static trust copy, never a broken UI. */
  isError?: boolean;
}

/**
 * Layer 3 — live verified-count readout for the trust line.
 *
 * - error  → original static copy ("Every unit is verified...")
 * - loading → skeleton reserving the final line height (zero CLS)
 * - ready  → "1,204 verified listings · updated 12 min ago"
 */
export function VerifiedStat({ count, updatedAt, isError = false }: VerifiedStatProps) {
  if (isError) {
    return (
      <p className="text-sm text-white/60 font-medium">
        Every unit is verified before it&apos;s listed
      </p>
    );
  }

  if (count === undefined || !updatedAt) {
    // Skeleton reserves the final line height — no layout shift on resolve
    return (
      <p
        className="text-sm text-white/60 font-medium trust-line--skeleton"
        aria-hidden="true"
      >
        &nbsp;
      </p>
    );
  }

  return (
    <p className="text-sm text-white/60 font-medium">
      <strong className="text-jade-300 font-semibold">
        {count.toLocaleString()}
      </strong>{" "}
      verified listings · updated {formatUpdatedAt(updatedAt)}
    </p>
  );
}
