// src/features/lease/utils/lease-csv-export.ts
import {LeaseSummaryResponse} from "@/features/lease/types/lease-response";

const escapeCsvCell = (value: string | number): string => {
    const str = String(value);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const exportLeasesToCsv = (leases: LeaseSummaryResponse[], filename = "leases-export.csv") => {
    const headers = ["Lease #", "Start Date", "End Date", "Rent (KES)", "Status"];
    const rows = leases.map((lease) => [
        lease.leaseNumber,
        lease.startDate,
        lease.endDate,
        lease.rentAmount,
        lease.status,
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};