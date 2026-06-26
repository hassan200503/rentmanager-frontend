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
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                <ChevronLeft className="w-4 h-4" />
                Previous
            </button>

            <span className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-800">{page + 1}</span> of{" "}
                <span className="font-semibold text-gray-800">{totalPages}</span>
            </span>

            <button
                disabled={page + 1 >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                Next
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}