import { UnitStatus } from "../types/unit";

type UnitStatusBadgeProps = {
  status: UnitStatus;
};

const config: Record<UnitStatus, { label: string; className: string; dot: string }> = {
  [UnitStatus.INACTIVE]: {
    label: "Inactive",
    className: "bg-ink/[0.05] text-ink-muted",
    dot: "bg-ink-muted/40",
  },
  [UnitStatus.ACTIVE]: {
    label: "Active",
    className: "bg-success-bg text-success-dark",
    dot: "bg-success shadow-sm shadow-success/30",
  },
  [UnitStatus.MAINTENANCE]: {
    label: "Maintenance",
    className: "bg-warning-bg text-warning-dark",
    dot: "bg-warning shadow-sm shadow-warning/30",
  },
  [UnitStatus.ARCHIVED]: {
    label: "Archived",
    className: "bg-danger/10 text-danger-dark",
    dot: "bg-danger shadow-sm shadow-danger/30",
  },
};

export const UnitStatusBadge = ({ status }: UnitStatusBadgeProps) => {
  const c = config[status] ?? {
    label: status,
    className: "bg-ink/[0.05] text-ink-muted",
    dot: "bg-ink-muted/40",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};
