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
            <EmptyState
                title="Failed to load properties"
                description="Please try again later."
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero banner */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-12">
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-widest mb-2">
                        Rental Listings
                    </p>
                    <h1 className="text-4xl font-bold text-gray-900">
                        Available Properties
                    </h1>
                    <p className="mt-2 text-gray-500 max-w-xl">
                        Browse available rental properties and find your next home.
                    </p>

                    <div className="mt-6 max-w-xl">
                        <ListingSearch
                            value={keyword}
                            onChange={setKeyword}
                            placeholder="Search by name, location, or type..."
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-10 space-y-8">
                {data?.empty ? (
                    <EmptyState
                        title="No properties found"
                        description="Try a different search term."
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {data?.totalElements ?? 0} properties found
                            </p>
                        </div>

                        <PropertyGrid properties={data?.content ?? []} />

                        <ListingPagination
                            page={data?.number ?? 0}
                            totalPages={data?.totalPages ?? 0}
                            onPageChange={setPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
}