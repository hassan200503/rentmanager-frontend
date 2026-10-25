"use client";

type UnitDialogsProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export function UnitDialogs({
                                open,
                                title,
                                description,
                                confirmLabel = "Confirm",
                                loading = false,
                                onConfirm,
                                onClose,
                            }: UnitDialogsProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}