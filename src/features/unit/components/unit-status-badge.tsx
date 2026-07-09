import { UnitStatus } from "../types/unit";

type UnitStatusBadgeProps = {
  // TIGHTENED: was `status: string` despite UnitStatus already being imported and
  // used as the statusConfig object's keys — no reason to give up type safety here.
  status: UnitStatus;
};

// FIXED: was using ad-hoc inline Tailwind color combos instead of the established
// .pill / .pill-success / .pill-warning / .pill-danger / .pill-neutral component
// classes. Unlike PropertyStatus, UnitStatus has exactly 4 values, so this maps
// 1:1 onto the 4 pill variants with no collision.
const statusConfig: Record<UnitStatus, { label: string; className: string }> = {
  [UnitStatus.INACTIVE]: {
    label: "Inactive",
    className: "pill pill-neutral",
  },
  [UnitStatus.ACTIVE]: {
    label: "Active",
    className: "pill pill-success",
  },
  [UnitStatus.MAINTENANCE]: {
    label: "Maintenance",
    className: "pill pill-warning",
  },
  [UnitStatus.ARCHIVED]: {
    label: "Archived",
    className: "pill pill-danger",
  },
};

export const UnitStatusBadge = ({ status }: UnitStatusBadgeProps) => {
  const config = statusConfig[status] ?? {
    label: status,
    className: "pill pill-neutral",
  };

  return (
      <span className={config.className}>
      {config.label}
    </span>
  );
};