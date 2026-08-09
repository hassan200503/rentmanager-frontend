// features/reviews/components/review-status-badge.tsx
import { reviewStatusMeta, type ReviewStatus } from "../types/review-response";

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
    const meta = reviewStatusMeta[status] ?? {
        label: status,
        chip: "bg-border-subtle text-fg-muted border-border",
        dot: "bg-fg-subtle",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}