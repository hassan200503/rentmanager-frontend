import { pdf } from "@react-pdf/renderer";
import type { TenantLeaseResponse } from "@/features/tenant-portal/api/tenant-portal-api";
import { LeasePdfDocument } from "./lease-pdf";

export async function downloadLeasePdf(
    lease: TenantLeaseResponse,
    tenantName: string,
    tenantPhone: string,
) {
    const blob = await pdf(
        <LeasePdfDocument lease={lease} tenantName={tenantName} tenantPhone={tenantPhone} />,
    ).toBlob();

    const filename = `lease-${lease.leaseNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
