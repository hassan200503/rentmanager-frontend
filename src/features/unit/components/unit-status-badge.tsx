import { UnitStatus } from "../types/unit";

type UnitStatusBadgeProps = {
  status: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  [UnitStatus.INACTIVE]: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-800 border border-gray-200",
  },
  [UnitStatus.ACTIVE]: {
    label: "Active",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  [UnitStatus.MAINTENANCE]: {
    label: "Maintenance",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  [UnitStatus.ARCHIVED]: {
    label: "Archived",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

export const UnitStatusBadge = ({ status }: UnitStatusBadgeProps) => {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
      <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}
      >
      {config.label}
    </span>
  );
};
