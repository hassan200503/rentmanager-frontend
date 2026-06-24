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

    const {
        data,
        isLoading,
        isError,
    } = usePublicProperties({
        keyword,
        page,
        size: 20,
    });

    if (isLoading) {
        return <LoadingState />;
    }

    if (isError) {
        return (
            <EmptyState
                title="Failed to load properties"
                description="Please try again later."
            />
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">

            <div>
                <h1 className="text-3xl font-bold">
                    Available Properties
                </h1>

                <p className="text-muted-foreground">
                    Browse available rental properties
                </p>
            </div>

            <ListingSearch
                value={keyword}
                onChange={setKeyword}
                placeholder="Search properties..."
            />

            {data?.empty ? (
                <EmptyState
                    title="No properties found"
                    description="Try a different search term."
                />
            ) : (
                <>
                    <PropertyGrid
                        properties={data?.content ?? []}
                    />

                    <ListingPagination
                        page={data?.number ?? 0}
                        totalPages={data?.totalPages ?? 0}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
}