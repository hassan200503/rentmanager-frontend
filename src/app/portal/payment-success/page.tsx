"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { tenantPortalApi, type TenantPaymentReceiptResponse } from "@/features/tenant-portal/api/tenant-portal-api";
import { formatCurrency, formatDateTime } from "@/features/tenant-portal/components/tenant-dashboard";
import { downloadReceiptPdf } from "@/features/rentledger/components/download-receipt";
import { CheckCircle, Loader2, Download, ArrowLeft, AlertTriangle, Home } from "lucide-react";

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-brand" strokeWidth={2} />
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Loading payment details…</p>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const requestId = searchParams.get("requestId");

    const [status, setStatus] = useState<"loading" | "not_found" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [receipt, setReceipt] = useState<TenantPaymentReceiptResponse | null>(null);
    const [downloading, setDownloading] = useState(false);

    const loadData = useCallback(async () => {
        if (!requestId) {
            setStatus("not_found");
            return;
        }
        try {
            const paymentStatus = await tenantPortalApi.getPaymentRequestStatus(requestId);
            if (paymentStatus.status !== "PAID") {
                setStatus("error");
                setErrorMessage(paymentStatus.status === "FAILED" ? "Payment failed." : "Payment is still pending.");
                return;
            }
            if (!paymentStatus.transactionId) {
                setStatus("error");
                setErrorMessage("Receipt is not yet available. Please try again shortly.");
                return;
            }
            const receiptData = await tenantPortalApi.getPaymentReceipt(paymentStatus.transactionId);
            setReceipt(receiptData);
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Failed to load payment details");
        }
    }, [requestId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDownload = async () => {
        if (!receipt) return;
        setDownloading(true);
        try {
            await downloadReceiptPdf(receipt);
        } catch {
            window.print();
        } finally {
            setDownloading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-brand" strokeWidth={2} />
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Loading payment details…</p>
            </div>
        );
    }

    if (status === "not_found") {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertTriangle className="h-12 w-12 text-warning" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-fg dark:text-fg-dark">No payment request found</h2>
                <button onClick={() => router.push("/portal")} className="btn-primary mt-2">
                    <Home className="h-4 w-4 mr-2 inline" />
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertTriangle className="h-12 w-12 text-danger" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-fg dark:text-fg-dark">Something went wrong</h2>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">{errorMessage}</p>
                <div className="flex gap-3 mt-2">
                    <button onClick={loadData} className="btn-outline">
                        <Loader2 className="h-4 w-4 mr-2 inline" />
                        Retry
                    </button>
                    <button onClick={() => router.push("/portal")} className="btn-primary">
                        <Home className="h-4 w-4 mr-2 inline" />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container max-w-lg mx-auto space-y-6 py-8 animate-fade-in-up">
            <div className="card-elevated p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-bg dark:bg-success-bg-dark animate-scale-in">
                        <CheckCircle className="h-10 w-10 text-success-dark dark:text-success" strokeWidth={2} />
                        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-success/20" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-fg dark:text-fg-dark mb-1">Payment Successful!</h2>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-1">
                    Your payment has been received and processed.
                </p>
                <p className="text-3xl font-bold font-data text-fg dark:text-fg-dark mt-4">
                    {formatCurrency(receipt?.amount ?? 0)}
                </p>
                <div className="flex justify-center mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-emerald-600 text-white px-1.5 py-0.5 rounded">M-Pesa</span>
                </div>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                    {receipt?.paymentDate ? formatDateTime(receipt.paymentDate) : ""}
                </p>
            </div>

            {receipt && (
                <div className="card-elevated p-6 transition-all duration-200 hover:shadow-dropdown">
                    <h3 className="font-semibold text-fg dark:text-fg-dark mb-4">Receipt Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Receipt Number</span>
                            <span className="font-data font-medium text-fg dark:text-fg-dark">{receipt.receiptNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Tenant</span>
                            <span className="font-medium text-fg dark:text-fg-dark">{receipt.tenantName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Unit</span>
                            <span className="font-medium text-fg dark:text-fg-dark">{receipt.unitNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Property</span>
                            <span className="font-medium text-fg dark:text-fg-dark">{receipt.propertyName}</span>
                        </div>
                        {receipt.mpesaTransactionId && (
                            <div className="flex justify-between">
                                <span className="text-fg-muted dark:text-fg-muted-dark">M-Pesa Ref</span>
                                <span className="font-data font-medium text-fg dark:text-fg-dark">{receipt.mpesaTransactionId}</span>
                            </div>
                        )}
                        <div className="border-t border-border dark:border-border-dark pt-3 mt-3">
                            <div className="flex justify-between text-base">
                                <span className="font-semibold text-fg dark:text-fg-dark">Amount Paid</span>
                                <span className="font-data font-bold text-success-dark dark:text-success">{formatCurrency(receipt.amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-fg-muted dark:text-fg-muted-dark mt-2">
                                <span>Balance after payment</span>
                                <span className="font-data">{formatCurrency(receipt.balanceAfterPayment)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-6">
                        <button onClick={handleDownload} disabled={downloading} className="btn-primary w-full justify-center py-2.5">
                            {downloading ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin inline" />
                            ) : (
                                <Download className="h-5 w-5 mr-2 inline" />
                            )}
                            {downloading ? "Generating PDF…" : "Download Receipt"}
                        </button>
                        <button onClick={() => router.push("/portal")} className="btn-outline w-full justify-center py-2.5">
                            <ArrowLeft className="h-5 w-5 mr-2 inline" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
