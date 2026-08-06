"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, RefreshCw, AlertTriangle, MapPin, Search } from "lucide-react";
import { usePublicProperties } from "@/features/public-listings/hooks/use-public-properties";
import { PropertyGrid } from "@/features/public-listings/components/property-grid";
import { ListingPagination } from "@/features/public-listings/components/listing-pagination";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export default function ListingsPage() {
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

    const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
    const [location, setLocation] = useState(searchParams.get("location") ?? "");
    const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
    const [debouncedLocation, setDebouncedLocation] = useState(location);
    const [page, setPage] = useState(Number(searchParams.get("page") ?? 0));

    // Distinguishes the first paint from later refetches so the heavyweight
    // loading screen only appears once; subsequent reloads get the lighter
    // skeleton grid while old content stays in place.
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [prevIsLoading, setPrevIsLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword.trim());
            setDebouncedLocation(location.trim());
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [keyword, location]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedKeyword) params.set("q", debouncedKeyword);
        if (debouncedLocation) params.set("location", debouncedLocation);
        if (page > 0) params.set("page", String(page));
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [debouncedKeyword, debouncedLocation, page, pathname, router]);

    const { data, isLoading, isError } = usePublicProperties({
        keyword: debouncedKeyword,
        location: debouncedLocation,
        page,
        size: PAGE_SIZE,
    });

    if (prevIsLoading !== isLoading) {
        setPrevIsLoading(isLoading);
        if (!isLoading) {
            setHasLoadedOnce(true);
        }
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
                        className="btn-primary inline-flex items-center gap-2 mt-6"
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
            <div className="relative bg-gradient-to-b from-brand-50/60 via-surface to-surface border-b border-border">
                <div className="container mx-auto px-6 py-20 max-w-5xl">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold tracking-wide mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                            Rental Listings
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink leading-[1.1] tracking-tight">
                            Available Properties
                        </h1>
                        <p className="mt-3 text-ink-muted max-w-xl leading-relaxed">
                            Browse verified rental properties across Kenya and find your next home —
                            with real vacancies, not stale listings.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-2xl">
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <Search className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                                </div>
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Search by name or type..."
                                    className="form-input w-full !pl-10 text-sm shadow-sm transition-all duration-200 focus:shadow-md focus:shadow-brand/10 focus:border-brand-300"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                    <MapPin className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                                </div>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Location — city or neighborhood"
                                    className="form-input w-full !pl-10 text-sm shadow-sm transition-all duration-200 focus:shadow-md focus:shadow-brand/10 focus:border-brand-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky results toolbar */}
            <div className="sticky top-0 z-20 bg-canvas/80 backdrop-blur-xl border-b border-border">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="flex items-center justify-between gap-4 py-4">
                        <p className="text-sm text-ink-muted" aria-live="polite">
                            {isLoading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                    Searching…
                                </span>
                            ) : (
                                <>
                                    <span className="text-ink font-semibold">
                                        {data?.totalElements ?? 0}
                                    </span>{" "}
                                    {data?.totalElements === 1 ? "property" : "properties"} found
                                    {isSearching && (
                                        <span className="text-ink-muted/60">
                                            {" "}for {searchDescription}
                                        </span>
                                    )}
                                </>
                            )}
                        </p>

                        <div className="flex items-center gap-3">
                            {isSearching && (
                                <button
                                    onClick={clearSearch}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-12 max-w-5xl space-y-8">
                {isLoading && hasLoadedOnce ? (
                    <SkeletonGrid />
                ) : !hasResults ? (
                    <div className="py-12">
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
                                    className="text-sm font-medium text-brand hover:text-brand-700 transition-colors"
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

                        {(data?.totalPages ?? 0) > 1 && (
                            <div className="pt-4 border-t border-border">
                                <ListingPagination
                                    page={data?.number ?? 0}
                                    totalPages={data?.totalPages ?? 0}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <div className="skeleton aspect-[4/3] w-full rounded-none" />
                    <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="skeleton h-5 w-3/4" />
                            <div className="skeleton h-5 w-16 rounded-full shrink-0" />
                        </div>
                        <div className="skeleton h-4 w-1/2" />
                        <div className="skeleton h-3 w-full" />
                        <div className="skeleton h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
