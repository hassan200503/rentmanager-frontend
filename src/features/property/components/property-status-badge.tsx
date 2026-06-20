import { PropertyStatus } from "../types/property";

export const PropertyStatusBadge = ({ status }: { status: PropertyStatus }) => {
    const map = {
        DRAFT: "bg-yellow-100 text-yellow-700",
        ACTIVE: "bg-green-100 text-green-700",
        ARCHIVED: "bg-gray-100 text-gray-600",
    };

    return (
        <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>
      {status}
    </span>
    );
};