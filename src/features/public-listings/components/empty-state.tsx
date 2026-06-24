"use client";

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export function EmptyState({
                               title = "No results found",
                               description = "Try adjusting your search criteria.",
                           }: EmptyStateProps) {
    return (
        <div className="py-12 text-center">
            <h3 className="font-semibold">
                {title}
            </h3>

            <p className="mt-2 text-sm text-gray-600">
                {description}
            </p>
        </div>
    );
}