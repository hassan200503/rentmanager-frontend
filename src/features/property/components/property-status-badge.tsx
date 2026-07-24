import { PropertyStatus } from "../types/property";

const config: Record<PropertyStatus, { className: string; dot: string }> = {
    [PropertyStatus.DRAFT]: {
        className: "bg-ink/[0.05] text-ink-muted",
        dot: "bg-ink-muted/40",
    },
    [PropertyStatus.ACTIVE]: {
        className: "bg-success-bg text-success-dark",
        dot: "bg-success shadow-sm shadow-success/30",
    },
    [PropertyStatus.INACTIVE]: {
        className: "bg-ink/[0.05] text-ink-muted",
        dot: "bg-ink-muted/40",
    },
    [PropertyStatus.UNDER_MAINTENANCE]: {
        className: "bg-warning-bg text-warning-dark",
        dot: "bg-warning shadow-sm shadow-warning/30",
    },
    [PropertyStatus.ARCHIVED]: {
        className: "bg-ink/[0.05] text-ink-muted",
        dot: "bg-ink-muted/40",
    },
};

export const PropertyStatusBadge = ({ status }: { status: PropertyStatus }) => {
    const c = config[status] ?? config[PropertyStatus.INACTIVE];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {status.replaceAll("_", " ")}
        </span>
    );
};
