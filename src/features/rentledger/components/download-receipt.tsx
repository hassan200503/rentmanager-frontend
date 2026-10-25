import type { TenantPaymentReceiptResponse } from "@/features/tenant-portal/api/tenant-portal-api";

/**
 * Loads the PDF machinery only when someone actually downloads a receipt.
 *
 * `@react-pdf/renderer` pulls in pdfkit, fontkit and yoga-layout, and importing
 * it at module scope put all of that into every bundle that can reach this
 * file — including the server bundle, which never renders a PDF at all. Almost
 * nobody downloads a receipt, and nobody does it on first paint.
 */
export async function downloadReceiptPdf(receipt: TenantPaymentReceiptResponse) {
    const [{ pdf }, { ReceiptPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./receipt-pdf"),
    ]);

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
