"use client";

import { formatUpdatedAt } from "@/features/landing/lib/format-updated-at";

interface VacancyStatProps {
  /** Number of units currently listed publicly; `undefined` while loading. */
  count?: number;
  /** ISO timestamp of the fetch that produced the count. */
  updatedAt?: string;
  /** Fetch failed — fall back to the static trust copy, never a broken UI. */
  isError?: boolean;
}

/**
 * Live listing count for the coverage trust line.
 *
 * <p>The figure is `totalElements` from the public units query, which the
 * backend restricts to an ACTIVE unit with no active lease under an ACTIVE
 * property. So it is a count of units actually available right now — which is
 * what this line now says. It previously said "verified listings", and nothing
 * in the system verifies an individual listing: the column that once implied
 * it, `tenants.verified`, was backfilled to true for every row and then
 * dropped outright in V87. The number was always real; only the word for it
 * was wrong, and on a public page that is the kind of claim that costs trust
 * the first time a renter tests it.
 *
 * - error   → static copy about what listing actually means
 * - loading → skeleton reserving the final line height (zero CLS)
 * - ready   → "1,204 homes available now · updated 12 min ago"
 */
export function VacancyStat({ count, updatedAt, isError = false }: VacancyStatProps) {
  if (isError) {
    return (
      <p className="text-sm text-white/60 font-medium">
        A unit is listed only while it is vacant
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
      {count === 1 ? "home" : "homes"} available now · updated {formatUpdatedAt(updatedAt)}
    </p>
  );
}
