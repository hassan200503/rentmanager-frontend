// src/features/lease/utils/lease-csv-export.ts
import { LeaseSummaryResponse } from "@/features/lease/types/lease-response";
import { LeaseBalanceSummaryResponse } from "@/features/rentledger/types/rent-ledger-response";

const escapeCsvCell = (value: string | number): string => {
    const str = String(value);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const exportLeasesToCsv = (
    leases: LeaseSummaryResponse[],
    filename = "leases-export.csv",
    balanceByLease: Map<string, LeaseBalanceSummaryResponse> = new Map()
) => {
    const headers = [
        "Tenant", "Phone", "Property", "Unit", "Lease #",
        "Start Date", "End Date", "Rent (KES)", "Lease Status",
        "Rent Status", "Outstanding (KES)",
    ];
    const rows = leases.map((lease) => {
        const balance = balanceByLease.get(lease.id);
        return [
            lease.tenantFullName ?? "",
            lease.tenantPhone ?? "",
            lease.propertyName ?? "",
            lease.unitLabel ?? "",
            lease.leaseNumber,
            lease.startDate,
            lease.endDate,
            lease.rentAmount,
            lease.status,
            balance?.status ?? (lease.status === "ACTIVE" || lease.status === "RENEWED" ? "PAID" : ""),
            balance?.outstandingBalance ?? "0",
        ];
    });

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
