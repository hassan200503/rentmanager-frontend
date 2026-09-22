"use client";

import { useCallback, useRef, useState } from "react";
import {
    ImagePlus,
    Loader2,
    Trash2,
    UploadCloud,
    Check,
    AlertCircle,
    Sparkles,
    Globe,
    MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { BadgeMark } from "@/shared/components/brand";
import { useAdminSettingsQuery } from "../hooks/use-admin-queries";
import {
    useUploadPlatformLogoMutation,
    useRemovePlatformLogoMutation,
} from "../hooks/use-admin-mutations";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Matches PlatformBrandIconService.MAX_BYTES: the icon is stored in our
// own database and served on nearly every page load, so it stays small.
const MAX_BYTES = 512 * 1024;

function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return "Unsupported file type — use PNG, JPG or WebP.";
    }
    if (file.size > MAX_BYTES) {
        return "File exceeds 5 MB — export a compressed logo and try again.";
    }
    return null;
}

/**
 * System-wide brand identity. The platform owner uploads a logo that is
 * rendered across every chrome surface (console sidebar, landlord/renter
 * shells, landing page, favicon, emails) via the public branding endpoint.
 *
 * Preview-first: the owner sees the logo exactly as visitors/operators will
 * — in the landing navbar (light) and the console sidebar (dark) — before
 * committing. Client-side validation mirrors the backend contract
 * (jpeg/png/webp, ≤ 5MB).
 */
export function BrandingCard({ disabled }: { disabled: boolean }) {
    const { data: settings } = useAdminSettingsQuery();
    const upload = useUploadPlatformLogoMutation();
    const remove = useRemovePlatformLogoMutation();

    const [selected, setSelected] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const persistedLogo = settings?.platform.logoUrl ?? null;
    const cacheBust = settings?.platform.updatedAt
        ? `?v=${encodeURIComponent(settings.platform.updatedAt)}`
        : "";
    const busy = upload.isPending || remove.isPending;

    const pick = useCallback((file: File | undefined | null) => {
        if (!file) return;
        const problem = validateFile(file);
        if (problem) {
            setError(problem);
            setSelected(null);
            setPreviewUrl(null);
            return;
        }
        setError(null);
        setSelected(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
        },
        [pick]
    );

    const handleUpload = () => {
        if (!selected) return;
        upload.mutate(selected, {
            onSuccess: () => {
                // Not "instantly". The app's own chrome updates now, because
                // this mutation invalidates the branding query it reads. Tab
                // icons and installed-app icons are served through a cached
                // route and follow within about a minute. Promising instant
                // and delivering a minute makes the owner think it failed and
                // upload again.
                toast.success("Platform logo updated. Tabs and installed apps follow within a minute.");
                setSelected(null);
                setPreviewUrl(null);
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : "Logo upload failed. Please retry.");
            },
        });
    };

    const handleRemove = () => {
        remove.mutate(undefined, {
            onSuccess: () => {
                toast.success("Platform logo removed — the default brand mark is back.");
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : "Could not remove the logo. Please retry.");
            },
        });
    };

    const currentUrl = previewUrl ?? persistedLogo;
    const showRemove = !selected && persistedLogo;

    return (
        <div className="card p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
                        <ImagePlus className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-fg dark:text-fg-dark flex items-center gap-2">
                            Platform logo
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300 border border-brand/20">
                                <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                                Global
                            </span>
                        </h3>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            One upload. Rendered across the whole platform — console, shells, landing page, tab icon and emails.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload zone + previews */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5">
                {/* Dropzone / large preview */}
                <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled && !busy) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`relative flex h-40 w-40 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 transition-all duration-200 disabled:opacity-50 ${
                        dragging
                            ? "border-brand bg-brand/5"
                            : "border-dashed border-border dark:border-border-dark hover:border-brand/40"
                    }`}
                    aria-label="Upload platform logo"
                >
                    {currentUrl ? (
                        <img
                            src={currentUrl + (currentUrl === persistedLogo ? cacheBust : "")}
                            alt="Platform logo preview"
                            className="h-32 w-32 object-contain p-2"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-fg-muted dark:text-fg-muted-dark">
                            <BadgeMark size={40} />
                            <span className="text-[11px] font-medium">Click or drop to upload</span>
                            <span className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                                PNG · JPG · WebP, ≤ 512 KB
                            </span>
                        </div>
                    )}
                    {busy && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm dark:bg-surface-dark/70">
                            <Loader2 className="h-6 w-6 animate-spin text-brand" strokeWidth={2} />
                        </div>
                    )}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => pick(e.target.files?.[0])}
                />

                {/* Real-context previews */}
                <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        Live preview — where it appears
                    </p>

                    {/* Landing navbar mock (light) */}
                    <div className="rounded-xl border border-border bg-white p-3 shadow-sm dark:border-border-dark">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {currentUrl ? (
                                    <img
                                        src={currentUrl + (currentUrl === persistedLogo ? cacheBust : "")}
                                        alt=""
                                        className="h-6 w-6 object-contain"
                                    />
                                ) : (
                                    <BadgeMark size={20} />
                                )}
                                <span className="font-display text-sm font-semibold tracking-tight text-slate-900">
                                    {settings?.platform.logoUrl ? "RentManager" : "RentManager"}
                                </span>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Globe className="h-3 w-3" strokeWidth={2} />
                                Public site
                            </span>
                        </div>
                    </div>

                    {/* Console sidebar mock (dark) */}
                    <div className="rounded-xl bg-[#0B1221] p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="logo-tile h-6 w-6 rounded-md">
                                    {currentUrl ? (
                                        <img
                                            src={currentUrl + (currentUrl === persistedLogo ? cacheBust : "")}
                                            alt=""
                                            className="h-4 w-4 object-contain"
                                        />
                                    ) : (
                                        <BadgeMark size={14} />
                                    )}
                                </div>
                                <span className="text-xs font-semibold tracking-tight text-slate-100">
                                    RentManager
                                </span>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <MonitorSmartphone className="h-3 w-3" strokeWidth={2} />
                                Every shell
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark leading-relaxed">
                        Square artwork with a transparent background renders best at every size.
                        The tab icon follows automatically.
                    </p>
                </div>
            </div>

            {/* Validation error */}
            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                    <span>{error}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selected || disabled || busy}
                    className="btn-primary gap-2"
                >
                    {upload.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    ) : (
                        <UploadCloud className="h-4 w-4" strokeWidth={2} />
                    )}
                    {selected ? "Upload new logo" : persistedLogo ? "Replace logo" : "Upload logo"}
                </button>

                {showRemove && (
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        disabled={busy || disabled}
                        className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                        Remove logo
                    </button>
                )}

                {selected && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelected(null);
                            setPreviewUrl(null);
                            setError(null);
                        }}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-border-subtle dark:text-fg-muted-dark dark:hover:bg-border-subtle-dark"
                    >
                        Cancel
                    </button>
                )}

                {!disabled && persistedLogo && !selected && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-dark dark:text-success">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Active globally
                    </span>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => {
                    setConfirmOpen(false);
                    handleRemove();
                }}
                isLoading={remove.isPending}
                title="Remove platform logo?"
                description="The system will fall back to the built-in RentManager mark across every surface. This cannot be undone without re-uploading."
                confirmLabel="Remove logo"
                variant="danger"
            />
        </div>
    );
}