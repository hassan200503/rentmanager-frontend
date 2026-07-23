import { PropertyStatus } from "../types/property";

const statusPillMap: Record<PropertyStatus, string> = {
    [PropertyStatus.DRAFT]: "pill-neutral",
    [PropertyStatus.ACTIVE]: "pill-success",
    [PropertyStatus.INACTIVE]: "pill-neutral",
    [PropertyStatus.UNDER_MAINTENANCE]: "pill-warning",
    [PropertyStatus.ARCHIVED]: "pill-neutral",
};

export const PropertyStatusBadge = ({ status }: { status: PropertyStatus }) => {
    return (
        <span className={statusPillMap[status] ?? "pill-neutral"}>
            {status.replaceAll("_", " ")}
        </span>
    );
};