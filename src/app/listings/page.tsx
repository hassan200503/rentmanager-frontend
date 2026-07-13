// app/listings/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, RefreshCw, AlertTriangle, MapPin } from "lucide-react";
import { usePublicProperties } from "@/features/public-listings/hooks/use-public-properties";
import { ListingSearch } from "@/features/public-listings/components/listing-search";
import { PropertyGrid } from "@/features/public-listings/components/property-grid";
import { ListingPagination } from "@/features/public-listings/components/listing-pagination";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export default function ListingsPage() {
    // useSearchParams requires a Suspense boundary in the App Router,
    // otherwise the production build fails on static generation.
    return (
        <Suspense fallback={<LoadingState message="Loading properties…" />}>
            <ListingsPageContent />
        </Suspense>
    );
}

function ListingsPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Seed from the URL so a search is shareable, bookmarkable, and survives
    // a refresh or back/forward navigation.
    const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
    const [location, setLocation] = useState(searchParams.get("location") ?? "");
    const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
    const [debouncedLocation, setDebouncedLocation] = useState(location);
    const [page, setPage] = useState(Number(searchParams.get("page") ?? 0));

    // Tracks whether we've completed at least one load, so the full-page
    // loader only shows once. This is intentionally a conditional setState
    // during render (React's documented pattern for "adjust state based on
    // a value change") rather than a useEffect — doing it in an Effect
    // would fire an extra render after paint for no benefit.
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Debounce both fields together — don't fire a request on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword.trim());
            setDebouncedLocation(location.trim());
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [keyword, location]);

    // Keep the URL in sync with the active search + page.
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedKeyword) params.set("q", debouncedKeyword);
        if (debouncedLocation) params.set("location", debouncedLocation);
        if (page > 0) params.set("page", String(page));
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [debouncedKeyword, debouncedLocation, page, pathname, router]);

    // NOTE: `location` is assumed here as a new field on PublicListingFilters.
    // Wasn't able to see that type — add `location?: string` to it (and to
    // the query key / API call inside usePublicPropertiesQuery) if it isn't
    // there yet, or this will just be silently ignored by the backend.
    const { data, isLoading, isError } = usePublicProperties({
        keyword: debouncedKeyword,
        location: debouncedLocation,
        page,
        size: PAGE_SIZE,
    });

    if (!isLoading && !hasLoadedOnce) {
        setHasLoadedOnce(true);
    }

    const hasResults = (data?.content?.length ?? 0) > 0;
    const isSearching = debouncedKeyword.length > 0 || debouncedLocation.length > 0;
    const searchDescription = [
        debouncedKeyword && `"${debouncedKeyword}"`,
        debouncedLocation && `in "${debouncedLocation}"`,
    ]
        .filter(Boolean)
        .join(" ");

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const clearSearch = () => {
        setKeyword("");
        setLocation("");
        setDebouncedKeyword("");
        setDebouncedLocation("");
        setPage(0);
    };

    // Only the very first load blocks the whole page. Every load after that
    // (typing a search, changing page) keeps the header in place and swaps
    // just the results area, so the page never feels like it's reloading.
    if (isLoading && !hasLoadedOnce) {
        return <LoadingState message="Loading properties…" />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
                <div className="max-w-sm w-full text-center">
                    <EmptyState
                        title="Failed to load properties"
                        description="Something went wrong on our end. Please try again."
                        icon={AlertTriangle}
                        tone="danger"
                    />
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas">
            {/* Hero banner */}
            <div className="bg-surface border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 py-16 max-w-5xl">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Rental Listings
                    </p>
                    <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink leading-[1.1] tracking-tight">
                        Available Properties
                    </h1>
                    <p className="mt-3 text-ink-muted max-w-xl leading-relaxed">
                        Browse verified rental properties across Kenya and find your next home —
                        with real vacancies, not stale listings.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
                        <div className="flex-1">
                            <ListingSearch
                                value={keyword}
                                onChange={setKeyword}
                                placeholder="Search by name or type..."
                            />
                        </div>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Location — city or neighborhood"
                                className="form-input w-full pl-10 text-sm shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky results toolbar */}
            <div className="sticky top-0 z-10 bg-canvas/85 backdrop-blur-sm border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="flex items-center justify-between gap-4 py-4">
                        <p className="text-sm font-medium text-ink-muted" aria-live="polite">
                            {isLoading ? (
                                "Searching…"
                            ) : (
                                <>
                                    <span className="text-ink font-semibold">
                                        {data?.totalElements ?? 0}
                                    </span>{" "}
                                    {data?.totalElements === 1 ? "property" : "properties"} found
                                    {isSearching && <> for {searchDescription}</>}
                                </>
                            )}
                        </p>

                        {isSearching && (
                            <button
                                onClick={clearSearch}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                                Clear search
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-10 max-w-5xl space-y-8">
                {isLoading && hasLoadedOnce ? (
                    <SkeletonGrid />
                ) : !hasResults ? (
                    <div className="py-8">
                        <EmptyState
                            title={isSearching ? "No properties found" : "No properties available"}
                            description={
                                isSearching
                                    ? `We couldn't find anything matching ${searchDescription}. Try different search terms.`
                                    : "Check back soon — new listings are added regularly."
                            }
                        />
                        {isSearching && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={clearSearch}
                                    className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                                >
                                    Clear search and view all properties
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div
                            key={`${page}-${debouncedKeyword}-${debouncedLocation}`}
                            className="animate-fade-in-up"
                        >
                            <PropertyGrid properties={data?.content ?? []} />
                        </div>

                        <div className="pt-4 border-t border-ink/[0.08]">
                            <ListingPagination
                                page={data?.number ?? 0}
                                totalPages={data?.totalPages ?? 0}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-sm space-y-3">
                    <div className="skeleton aspect-[4/3] w-full" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                </div>
            ))}
        </div>
    );
}