import { PropertyStatus } from "../types/property";

// FIXED: was using ad-hoc inline Tailwind color combos (bg-amber-100 text-amber-800...)
// instead of the established .pill / .pill-success / .pill-warning / .pill-danger /
// .pill-neutral component classes already defined in the design system.
//
// ASSUMPTION FLAGGED: there are 5 PropertyStatus values but only 4 non-default pill
// variants. DRAFT and INACTIVE both fall back to pill-neutral below and will look
// visually identical — confirm whether that's acceptable or whether Draft needs its
// own treatment (e.g. a 5th variant) before shipping this.
const statusPillMap: Record<PropertyStatus, string> = {
    [PropertyStatus.DRAFT]: "pill pill-neutral",
    [PropertyStatus.ACTIVE]: "pill pill-success",
    [PropertyStatus.INACTIVE]: "pill pill-neutral",
    [PropertyStatus.UNDER_MAINTENANCE]: "pill pill-warning",
    [PropertyStatus.ARCHIVED]: "pill pill-danger",
};

export const PropertyStatusBadge = ({
                                        status,
                                    }: {
    status: PropertyStatus;
}) => {
    return (
        <span className={statusPillMap[status] ?? "pill pill-neutral"}>
      {status.replaceAll("_", " ")}
    </span>
    );
};