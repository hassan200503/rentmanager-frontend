// listing-pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ListingPaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function ListingPagination({
                                      page,
                                      totalPages,
                                      onPageChange,
                                  }: ListingPaginationProps) {
    return (
        <div className="flex items-center gap-3 justify-center mt-8">
            <button
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="btn-secondary flex items-center gap-1 px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4" />
                Previous
            </button>

            <span className="text-sm text-ink-muted">
                Page <span className="font-semibold text-ink">{page + 1}</span> of{" "}
                <span className="font-semibold text-ink">{totalPages}</span>
            </span>

            <button
                disabled={page + 1 >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="btn-secondary flex items-center gap-1 px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Next
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}