"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, BadgeCheck, RefreshCw, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";
import { averageRating } from "@/features/landing/lib/testimonial-stats";
import { SectionHeader } from "./SectionHeader";

interface TestimonialItem {
  name: string;
  text: string;
  rating: number;
}

interface PublicTestimonial {
  reviewId: string;
  reviewerFirstName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

const TESTIMONIALS_QUERY_KEY = ["public-testimonials"] as const;

/**
 * Live testimonials wall — fed exclusively by GET /public/testimonials
 * (approved platform reviews, moderated). No static or curated content is
 * ever mixed in; if the feed is empty the section says so instead of
 * showing placeholder quotes. Refetches on window focus so newly approved
 * reviews appear without a manual reload.
 */
export function TestimonialsSection() {
  const { data: live, isPending, isError, refetch } = useQuery({
    queryKey: TESTIMONIALS_QUERY_KEY,
    queryFn: () => apiClient.get<PublicTestimonial[]>(publicEndpoints.testimonials()),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const items: TestimonialItem[] = useMemo(
    () =>
      (live ?? []).map((t) => ({
        name: t.reviewerFirstName ?? "Verified user",
        text: t.comment ?? "",
        rating: t.rating,
      })),
    [live]
  );

  const duplicated = [...items, ...items];
  const liveAverage = averageRating(live ?? []);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-jade-500/[0.04] to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-end gap-6 mb-14">
            <SectionHeader
              eyebrow="Testimonials"
              title="Trusted by renters and landlords"
              description="Hear from people who found their home — or their tenant — on RentManager. Every quote below is a live, moderated review."
            />
            {liveAverage !== null && (
              <div className="flex items-center gap-3 md:pb-2 shrink-0">
                <div className="flex text-jade-400" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-sm text-white/60">
                  <span className="font-semibold text-white">{liveAverage.toFixed(1)}/5</span> from platform users
                </p>
              </div>
            )}
          </div>
        </div>

        {isPending ? (
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 animate-pulse">
                  <div className="h-4 w-24 bg-white/10 rounded-full mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded-full w-full" />
                    <div className="h-3 bg-white/10 rounded-full w-4/5" />
                    <div className="h-3 bg-white/10 rounded-full w-3/5" />
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <div className="w-9 h-9 rounded-full bg-white/10" />
                    <div className="h-3 w-24 bg-white/10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="max-w-6xl mx-auto px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 text-center">
              <Sparkles className="w-6 h-6 text-jade-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-white/75">Couldn&rsquo;t load testimonials right now.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                Retry
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="max-w-6xl mx-auto px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 text-center">
              <Sparkles className="w-6 h-6 text-jade-400 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-white/75">
                No verified testimonials yet — the first reviews go live here after platform
                moderation. Rate your experience from your dashboard.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400 rounded-2xl"
            role="region"
            aria-label="Customer testimonials"
            tabIndex={0}
          >
            <div
              className="animate-scroll flex gap-6 w-max"
              onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
              onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
              onFocus={(e) => (e.currentTarget.style.animationPlayState = "paused")}
              onBlur={(e) => (e.currentTarget.style.animationPlayState = "running")}
            >
              {duplicated.map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="relative rounded-2xl w-80 flex-shrink-0 overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6"
                  aria-hidden={i >= items.length}
                >
                  <div className="flex text-jade-400 text-sm mb-4" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((_, j) => (
                      <Star
                        key={j}
                        className={`w-4 h-4 fill-current ${j < t.rating ? "" : "opacity-25"}`}
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-white/75 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-jade-500/30 to-jade-600/20 flex items-center justify-center text-sm font-bold text-jade-300 border border-jade-500/20" aria-hidden="true">
                      {t.name[0]}
                    </span>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {t.name}
                      <BadgeCheck className="w-3.5 h-3.5 text-jade-400" strokeWidth={2} aria-label="Verified user" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="relative max-w-6xl mx-auto px-6 mt-10 text-[11px] text-white/40 text-center">
          Live reviews are moderated and verified before publishing. Some testimonials appear after moderation.
        </p>
      </div>
    </section>
  );
}