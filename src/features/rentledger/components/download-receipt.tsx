import { pdf } from "@react-pdf/renderer";
import type { TenantPaymentReceiptResponse } from "@/features/tenant-portal/api/tenant-portal-api";
import { ReceiptPdfDocument } from "./receipt-pdf";

export async function downloadReceiptPdf(receipt: TenantPaymentReceiptResponse) {
    const blob = await pdf(<ReceiptPdfDocument receipt={receipt} />).toBlob();

    const filename = `receipt-${receipt.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
