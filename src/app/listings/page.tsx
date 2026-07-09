// app/listings/page.tsx
"use client";

import { useState } from "react";
import { usePublicProperties } from "@/features/public-listings/hooks/use-public-properties";
import { ListingSearch } from "@/features/public-listings/components/listing-search";
import { PropertyGrid } from "@/features/public-listings/components/property-grid";
import { ListingPagination } from "@/features/public-listings/components/listing-pagination";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

export default function ListingsPage() {
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);

    const { data, isLoading, isError } = usePublicProperties({
        keyword,
        page,
        size: 20,
    });

    if (isLoading) return <LoadingState />;

    if (isError) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <EmptyState
                    title="Failed to load properties"
                    description="Please try again later."
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas">
            {/* Hero banner */}
            <div className="bg-white border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 py-16 max-w-5xl">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                        Rental Listings
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-ink leading-[1.1] tracking-tight">
                        Available Properties
                    </h1>
                    <p className="mt-3 text-ink-muted max-w-xl leading-relaxed">
                        Browse verified rental properties across Kenya and find your next home —
                        with real vacancies, not stale listings.
                    </p>

                    <div className="mt-8 max-w-xl">
                        <ListingSearch
                            value={keyword}
                            onChange={setKeyword}
                            placeholder="Search by name, location, or type..."
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-12 max-w-5xl space-y-8">
                {data?.empty ? (
                    <EmptyState
                        title="No properties found"
                        description="Try a different search term."
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-between border-b border-ink/[0.08] pb-4">
                            <p className="text-sm font-medium text-ink-muted">
                                <span className="text-ink font-semibold">
                                    {data?.totalElements ?? 0}
                                </span>{" "}
                                properties found
                            </p>
                        </div>

                        <PropertyGrid properties={data?.content ?? []} />

                        <div className="pt-4">
                            <ListingPagination
                                page={data?.number ?? 0}
                                totalPages={data?.totalPages ?? 0}
                                onPageChange={setPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}