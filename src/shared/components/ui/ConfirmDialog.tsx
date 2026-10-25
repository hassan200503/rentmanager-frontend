"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    isLoading = false,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) onClose();
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && !isLoading) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, isLoading, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                ref={dialogRef}
                className="card max-w-md w-full p-6 animate-scale-in shadow-2xl"
                role="dialog"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
            >
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                variant === "danger"
                                    ? "bg-danger/10 text-danger"
                                    : "bg-warning/10 text-warning"
                            }`}
                        >
                            <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h2
                                id="dialog-title"
                                className="text-lg font-semibold text-fg dark:text-fg-dark"
                            >
                                {title}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Close dialog"
                    >
                        <X className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    </button>
                </div>

                <p
                    id="dialog-description"
                    className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6"
                >
                    {description}
                </p>

                <div className="flex items-center gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn-secondary"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                            variant === "danger"
                                ? "bg-danger hover:bg-danger-dark text-white"
                                : "bg-warning hover:bg-warning-dark text-white"
                        }`}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
