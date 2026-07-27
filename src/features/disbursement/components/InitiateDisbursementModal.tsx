"use client";

import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { useInitiateDisbursementMutation } from "../hooks/use-disbursement-queries";
import type { InitiateDisbursementRequest } from "../types/disbursement-types";

interface FormValues {
    leaseId: string;
    amount: string;
    recipientPhone: string;
    recipientName: string;
    remarks: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function InitiateDisbursementModal({ open, onClose }: Props) {
    const mutation = useInitiateDisbursementMutation();
    const [form, setForm] = useState<FormValues>({
        leaseId: "",
        amount: "",
        recipientPhone: "",
        recipientName: "",
        remarks: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

    const validate = (): boolean => {
        const next: typeof errors = {};
        if (!form.leaseId) next.leaseId = "Lease ID is required";
        const amountNum = Number(form.amount);
        if (!form.amount || isNaN(amountNum)) next.amount = "Amount is required";
        else if (amountNum <= 0) next.amount = "Amount must be positive";
        else if (amountNum > 1_000_000) next.amount = "Maximum is 1,000,000";
        if (!form.recipientPhone || form.recipientPhone.length < 10) next.recipientPhone = "Phone number must be at least 10 digits";
        if (!form.recipientName || form.recipientName.length < 2) next.recipientName = "Recipient name is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload: InitiateDisbursementRequest = {
            leaseId: form.leaseId,
            amount: Number(form.amount),
            recipientPhone: form.recipientPhone,
            recipientName: form.recipientName,
            remarks: form.remarks || null,
        };

        await mutation.mutateAsync(payload);
        setForm({ leaseId: "", amount: "", recipientPhone: "", recipientName: "", remarks: "" });
        onClose();
    };

    if (!open) return null;

    return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-dropdown p-6 max-w-lg w-full mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-bg dark:bg-warning-bg-dark">
                            <Send className="h-4.5 w-4.5 text-warning dark:text-warning-dark" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-fg dark:text-fg-dark">Initiate B2C Disbursement</h2>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Send money to a tenant via M-Pesa</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
                    >
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-fg dark:text-fg-dark mb-1">Lease ID</label>
                        <input
                            value={form.leaseId}
                            onChange={handleChange("leaseId")}
                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                            className="form-input w-full"
                        />
                        {errors.leaseId && (
                            <p className="mt-1 text-xs text-danger dark:text-danger-dark">{errors.leaseId}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-fg dark:text-fg-dark mb-1">Amount (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.amount}
                                onChange={handleChange("amount")}
                                placeholder="0.00"
                                className="form-input w-full"
                            />
                            {errors.amount && (
                                <p className="mt-1 text-xs text-danger dark:text-danger-dark">{errors.amount}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-fg dark:text-fg-dark mb-1">Phone Number</label>
                            <input
                                value={form.recipientPhone}
                                onChange={handleChange("recipientPhone")}
                                placeholder="+254712345678"
                                className="form-input w-full"
                            />
                            {errors.recipientPhone && (
                                <p className="mt-1 text-xs text-danger dark:text-danger-dark">{errors.recipientPhone}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-fg dark:text-fg-dark mb-1">Recipient Name</label>
                        <input
                            value={form.recipientName}
                            onChange={handleChange("recipientName")}
                            placeholder="John Doe"
                            className="form-input w-full"
                        />
                        {errors.recipientName && (
                            <p className="mt-1 text-xs text-danger dark:text-danger-dark">{errors.recipientName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-fg dark:text-fg-dark mb-1">Remarks (optional)</label>
                        <textarea
                            value={form.remarks}
                            onChange={handleChange("remarks")}
                            rows={2}
                            placeholder="Reason for payment"
                            className="form-input w-full resize-none"
                        />
                        {errors.remarks && (
                            <p className="mt-1 text-xs text-danger dark:text-danger-dark">{errors.remarks}</p>
                        )}
                    </div>

                    {mutation.error && (
                        <div className="rounded-xl bg-danger-bg dark:bg-danger-bg-dark border border-danger/20 dark:border-danger-dark/20 p-3">
                            <p className="text-xs text-danger dark:text-danger-dark">{mutation.error.message}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={mutation.isPending}
                            className="btn-secondary text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="btn-primary text-xs gap-1.5"
                        >
                            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                            {mutation.isPending ? "Initiating..." : "Initiate Disbursement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
