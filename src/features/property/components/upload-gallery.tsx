"use client";

import { useState, useRef } from "react";
import {
    usePropertyMedia,
} from "@/features/property/hooks/use-property-media";
import {
    useUploadPropertyMedia,
    useDeletePropertyMedia,
    useSetPrimaryPropertyMedia,
} from "@/features/property/queries/use-property-media-mutations";
import { useHasRole } from "@/features/user/hooks/use-has-role";
import { WRITE_ROLES } from "@/features/user/lib/roles";
import { Upload, Trash2, Star, ImagePlus, Loader2, Lock } from "lucide-react";
import Image from "next/image";

export function PropertyMediaManager({ propertyId }: { propertyId: string }) {
    const { data: media, isLoading } = usePropertyMedia(propertyId);
    const canWrite = useHasRole(WRITE_ROLES);
    const upload = useUploadPropertyMedia(propertyId);
    const remove = useDeletePropertyMedia(propertyId);
    const setPrimary = useSetPrimaryPropertyMedia(propertyId);
    const [isPrimary, setIsPrimary] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach((file) => {
            upload.mutate({ file, primary: isPrimary });
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    return (
        <div className="space-y-5">
            {canWrite ? (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                        isDragOver
                            ? "border-brand bg-brand-50 shadow-sm"
                            : "border-border hover:border-brand-300 hover:bg-ink/[0.02]"
                    }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />

                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            isDragOver ? "bg-brand-100" : "bg-ink/[0.05]"
                        }`}>
                            {upload.isPending ? (
                                <Loader2 className="w-6 h-6 text-brand animate-spin" strokeWidth={1.5} />
                            ) : (
                                <Upload className={`w-6 h-6 transition-colors ${
                                    isDragOver ? "text-brand" : "text-ink-muted"
                                }`} strokeWidth={1.5} />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink">
                                {upload.isPending
                                    ? "Uploading..."
                                    : isDragOver
                                        ? "Drop files to upload"
                                        : "Drop images here or click to browse"
                                }
                            </p>
                            <p className="text-xs text-ink-muted mt-1">
                                PNG, JPG, WebP up to 10MB
                            </p>
                        </div>
                    </div>

                    {!upload.isPending && (
                        <label
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-ink/[0.05] hover:bg-ink/[0.08] transition-colors cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={isPrimary}
                                onChange={(e) => setIsPrimary(e.target.checked)}
                                className="rounded border-border text-brand focus:ring-brand/30"
                            />
                            <span className="text-xs font-medium text-ink-muted">Set as primary photo</span>
                        </label>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-ink/[0.04] border border-border">
                    <Lock className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={1.5} />
                    <p className="text-xs text-ink-muted">
                        Only owners and managers can add or edit photos.
                    </p>
                </div>
            )}

            {canWrite && upload.isError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20">
                    <p className="text-sm text-danger-dark font-medium">
                        {(upload.error as Error)?.message ?? "Upload failed"}
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-ink-muted animate-spin" strokeWidth={1.5} />
                    <span className="ml-2 text-sm text-ink-muted">Loading media...</span>
                </div>
            ) : media && media.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {media?.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-ink/[0.02] shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-200"
                        >
                            <Image
                                src={item.fileUrl}
                                alt={item.caption ?? item.fileName}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {item.primaryMedia && (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-brand/90 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm shadow-sm">
                                    <Star className="w-3 h-3 fill-white" strokeWidth={2} />
                                    Primary
                                </span>
                            )}
                            {canWrite && (
                                <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent p-3 opacity-0 transition-all duration-200 group-hover:opacity-100">
                                    {!item.primaryMedia && (
                                        <button
                                            type="button"
                                            onClick={() => setPrimary.mutate(item.id)}
                                            className="flex-1 rounded-lg bg-white/95 px-2 py-1.5 text-[11px] font-medium text-ink shadow-sm hover:bg-white transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Star className="w-3 h-3" strokeWidth={1.5} />
                                            Make primary
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => remove.mutate(item.id)}
                                        className="rounded-lg bg-danger/90 px-2 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-danger transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-ink/[0.05] flex items-center justify-center">
                        <ImagePlus className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-ink-muted">No photos yet</p>
                    <p className="text-xs text-ink-muted/60">
                        {canWrite ? "Upload images above to showcase this property" : "No photos have been added yet"}
                    </p>
                </div>
            )}
        </div>
    );
}
