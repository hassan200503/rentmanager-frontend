"use client";

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
        <div className="flex items-center gap-3 justify-center mt-6">
            <button
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="border px-3 py-2 rounded disabled:opacity-50"
            >
                Previous
            </button>

            <span>
                Page {page + 1} of {totalPages}
            </span>

            <button
                disabled={page + 1 >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="border px-3 py-2 rounded disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
}