import { PropertyStatus } from "../types/property";

export const PropertyStatusBadge = ({
                                      status,
                                    }: {
  status: PropertyStatus;
}) => {
  const map: Record<PropertyStatus, string> = {
    DRAFT: "bg-amber-100 text-amber-800 border border-amber-200",
    ACTIVE: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    INACTIVE: "bg-gray-100 text-gray-700 border border-gray-200",
    UNDER_MAINTENANCE: "bg-blue-100 text-blue-800 border border-blue-200",
    ARCHIVED: "bg-red-100 text-red-700 border border-red-200",
  };

  return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
      >
      {status.replaceAll("_", " ")}
    </span>
  );
};
