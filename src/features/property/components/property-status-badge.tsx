import { PropertyStatus } from "../types/property";

export const PropertyStatusBadge = ({
                                      status,
                                    }: {
  status: PropertyStatus;
}) => {
  const map: Record<PropertyStatus, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    ARCHIVED: "bg-gray-100 text-gray-600",
  };

  return (
      <span className={`badge ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};