import { PropertyResponse } from "../types/property-response";

export interface PropertyOccupancyLookup {
    totalUnits: number;
    occupiedUnits: number;
    occupancyPercent: number | null;
}

const CSV_HEADER = [
    "Name",
    "Type",
    "Premises",
    "Status",
    "City",
    "Total units",
    "Occupied units",
    "Occupancy %",
];

function escapeCsvValue(value: string | number): string {
    const str = String(value);
    // Quote (and double any embedded quotes) whenever the value could be
    // misread as a delimiter or line break by a CSV parser.
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildPropertiesCsv(
    properties: PropertyResponse[],
    occupancyByProperty: Map<string, PropertyOccupancyLookup>
): string {
    const rows = properties.map((p) => {
        const occupancy = occupancyByProperty.get(p.propertyId);
        return [
            p.name,
            p.propertyType,
            p.premisesType ?? "",
            p.status,
            p.address?.city ?? "",
            occupancy?.totalUnits ?? 0,
            occupancy?.occupiedUnits ?? 0,
            occupancy?.occupancyPercent ?? "",
        ];
    });

    return [CSV_HEADER, ...rows]
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
