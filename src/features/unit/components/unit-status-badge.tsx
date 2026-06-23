import { UnitStatus } from "../types/unit";

type UnitStatusBadgeProps = {
  status: UnitStatus;
};

const statusConfig: Record<
  UnitStatus,
  { label: string; className: string }
> = {
  [UnitStatus.VACANT]: {
    label: "Vacant",
    className:
      "bg-green-100 text-green-800 border border-green-200",
  },
  [UnitStatus.OCCUPIED]: {
    label: "Occupied",
    className:
      "bg-blue-100 text-blue-800 border border-blue-200",
  },
  [UnitStatus.RESERVED]: {
    label: "Reserved",
    className:
      "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  [UnitStatus.MAINTENANCE]: {
    label: "Maintenance",
    className:
      "bg-red-100 text-red-800 border border-red-200",
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
