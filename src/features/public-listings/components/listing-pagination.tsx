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
        <div className="flex items-center justify-center gap-2">
            <button
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink bg-surface border border-border rounded-xl hover:border-brand-200 hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:shadow-none"
            >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Previous
            </button>

            <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const pageNum = i === 0 ? 0
                        : i === Math.min(totalPages, 7) - 1 ? totalPages - 1
                        : page + i - 2;

                    if (pageNum < 0 || pageNum >= totalPages) return null;

                    const isActive = pageNum === page;
                    const needsEllipsis = i > 0 && i < Math.min(totalPages, 7) - 1 &&
                        pageNum - 1 > page + i - 3;

                    return (
                        <span key={pageNum} className="flex items-center">
                            {needsEllipsis && (
                                <span className="px-1 text-ink-muted/40 text-sm">…</span>
                            )}
                            <button
                                onClick={() => onPageChange(pageNum)}
                                className={`min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? "bg-brand text-white shadow-sm shadow-brand/20"
                                        : "text-ink-muted hover:text-ink hover:bg-ink/[0.04]"
                                }`}
                            >
                                {pageNum + 1}
                            </button>
                        </span>
                    );
                })}
            </div>

            <button
                disabled={page + 1 >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink bg-surface border border-border rounded-xl hover:border-brand-200 hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:shadow-none"
            >
                Next
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
        </div>
    );
}
