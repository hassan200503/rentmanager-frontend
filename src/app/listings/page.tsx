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
        <div className="min-h-screen bg-gradient-to-b from-canvas via-canvas to-brand-50/10 dark:to-brand-900/5">
            {/* ═══════════ PREMIUM HERO SECTION ═══════════ */}
            <div className="relative bg-gradient-to-b from-white via-brand-50/20 to-white dark:from-surface-dark dark:via-brand-900/10 dark:to-surface-dark border-b-2 border-border/40 overflow-hidden">
                {/* Luxury background effects */}
                <div className="absolute inset-0 opacity-30 dark:opacity-20" aria-hidden="true">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(94,234,212,0.06)_0%,transparent_60%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
                </div>

                <div className="relative container mx-auto px-6 pt-16 pb-20 max-w-6xl">
                    <div className="max-w-3xl">
                        {/* Premium category badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-emerald-50 dark:from-brand-900/40 dark:to-emerald-900/20 border-2 border-brand-200/60 dark:border-brand-700/60 shadow-[0_2px_12px_rgba(5,150,105,0.15)] mb-8 backdrop-blur-sm animate-fade-in-up">
                            <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(5,150,105,0.6)] animate-pulse" />
                            <span className="text-xs font-extrabold text-brand-900 dark:text-brand-300 uppercase tracking-widest">
                                Rental Listings
                            </span>
                        </div>
                        
                        {/* Hero heading with gradient */}
                        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-ink via-ink to-ink/70 dark:from-white dark:via-white dark:to-white/80 leading-[1.05] tracking-[-0.02em] animate-fade-in-up drop-shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                            style={{ animationDelay: '100ms' }}
                        >
                            Available Properties
                        </h1>
                        
                        {/* Enhanced description */}
                        <p className="mt-6 text-base md:text-lg text-ink-muted dark:text-white/70 max-w-2xl leading-relaxed font-medium animate-fade-in-up"
                            style={{ animationDelay: '200ms' }}
                        >
                            Browse verified rental properties across Kenya and find your next home — with real vacancies, not stale listings.
                        </p>
                    </div>

                    {/* ──── Premium Search Interface ──── */}
                    <div className="mt-12 max-w-4xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search input - refined */}
                            <div className="group relative">
                                <label htmlFor="keyword-search" className="block text-xs font-bold text-ink-muted dark:text-white/70 uppercase tracking-widest mb-2 ml-1">
                                    Property Search
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                                        <Search className="w-5 h-5 text-ink-muted/60 dark:text-white/40 transition-colors group-focus-within:text-brand" strokeWidth={2} />
                                    </div>
                                    <input
                                        id="keyword-search"
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="Search by name, city or street..."
                                        className="w-full h-14 pl-12 pr-4 text-base font-medium bg-white dark:bg-white/[0.08] border-2 border-border/60 dark:border-white/[0.12] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 placeholder:text-ink-muted/50 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 focus:shadow-[0_4px_20px_-4px_rgba(5,150,105,0.25),0_0_0_4px_rgba(5,150,105,0.08)] focus:ring-0 hover:border-border dark:hover:border-white/[0.18] backdrop-blur-sm"
                                    />
                                </div>
                            </div>

                            {/* Location input - refined */}
                            <div className="group relative">
                                <label htmlFor="location-search" className="block text-xs font-bold text-ink-muted dark:text-white/70 uppercase tracking-widest mb-2 ml-1">
                                    Location Filter
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                                        <MapPin className="w-5 h-5 text-ink-muted/60 dark:text-white/40 transition-colors group-focus-within:text-brand" strokeWidth={2} />
                                    </div>
                                    <input
                                        id="location-search"
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter city or neighborhood..."
                                        className="w-full h-14 pl-12 pr-4 text-base font-medium bg-white dark:bg-white/[0.08] border-2 border-border/60 dark:border-white/[0.12] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 placeholder:text-ink-muted/50 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 focus:shadow-[0_4px_20px_-4px_rgba(5,150,105,0.25),0_0_0_4px_rgba(5,150,105,0.08)] focus:ring-0 hover:border-border dark:hover:border-white/[0.18] backdrop-blur-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Active filters display */}
                        {isSearching && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 animate-fade-in-up">
                                <span className="text-xs font-bold text-ink-muted/70 dark:text-white/60 uppercase tracking-wider">
                                    Active Filters:
                                </span>
                                {debouncedKeyword && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-xs font-bold text-brand-900 dark:text-brand-300">
                                        Search: "{debouncedKeyword}"
                                    </span>
                                )}
                                {debouncedLocation && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-xs font-bold text-brand-900 dark:text-brand-300">
                                        <MapPin className="w-3 h-3" strokeWidth={2.5} />
                                        {debouncedLocation}
                                    </span>
                                )}
                                <button
                                    onClick={clearSearch}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink/[0.06] dark:bg-white/[0.08] hover:bg-ink/[0.1] dark:hover:bg-white/[0.12] border border-ink/[0.08] dark:border-white/[0.1] text-xs font-bold text-ink-muted hover:text-ink dark:text-white/70 dark:hover:text-white transition-all duration-200"
                                >
                                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ STICKY RESULTS TOOLBAR ═══════════ */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border-b-2 border-border/40 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-3" aria-live="polite">
                            {isLoading ? (
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800">
                                    <div className="w-4 h-4 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-bold text-brand-900 dark:text-brand-300">
                                        Searching…
                                    </span>
                                </div>
                            ) : (
                                <div className="inline-flex items-baseline gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50/50 dark:from-brand-900/30 dark:to-emerald-900/20 border border-brand-200/60 dark:border-brand-700/60 shadow-sm">
                                    <span className="text-2xl font-black text-ink dark:text-white tabular-nums">
                                        {data?.totalElements ?? 0}
                                    </span>
                                    <span className="text-sm font-bold text-ink-muted dark:text-white/70">
                                        {data?.totalElements === 1 ? "property" : "properties"}
                                    </span>
                                </div>
                            )}
                            {isSearching && !isLoading && (
                                <p className="text-sm font-medium text-ink-muted dark:text-white/60">
                                    matching {searchDescription}
                                </p>
                            )}
                        </div>

                        {isSearching && (
                            <button
                                onClick={clearSearch}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border/60 dark:border-white/[0.12] bg-white dark:bg-white/[0.06] hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 text-sm font-bold text-ink-muted hover:text-brand dark:text-white/70 dark:hover:text-brand-400 transition-all duration-200 shadow-sm hover:shadow-md shrink-0"
                            >
                                <X className="w-4 h-4" strokeWidth={2.5} />
                                <span className="hidden sm:inline">Clear Search</span>
                                <span className="sm:hidden">Clear</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ CONTENT SECTION ═══════════ */}
            <div className="container mx-auto px-6 py-16 max-w-6xl space-y-8">
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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-gradient-to-br from-white to-brand-50/10 dark:from-surface-dark dark:to-brand-900/5 rounded-3xl border-2 border-border/50 dark:border-border-dark/50 overflow-hidden animate-fade-in-up shadow-sm"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <div className="skeleton aspect-[16/11] w-full rounded-none" />
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <div className="skeleton h-6 w-3/4 rounded-lg" />
                            <div className="skeleton h-4 w-1/2 rounded-lg" />
                        </div>
                        <div className="skeleton h-4 w-full rounded-lg" />
                        <div className="skeleton h-4 w-5/6 rounded-lg" />
                        <div className="pt-3 border-t border-border/40">
                            <div className="skeleton h-5 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
