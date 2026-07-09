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

export function PropertyMediaManager({ propertyId }: { propertyId: string }) {
    const { data: media, isLoading } = usePropertyMedia(propertyId);
    const upload = useUploadPropertyMedia(propertyId);
    const remove = useDeletePropertyMedia(propertyId);
    const setPrimary = useSetPrimaryPropertyMedia(propertyId);
    const [isPrimary, setIsPrimary] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach((file) => {
            upload.mutate({ file, primary: isPrimary });
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={upload.isPending}
                    className="btn-primary text-sm disabled:opacity-50"
                >
                    {upload.isPending ? "Uploading…" : "Upload photos"}
                </button>

                <label className="flex items-center gap-2 text-sm text-ink-muted">
                    <input
                        type="checkbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="rounded border-ink/20 text-primary focus:ring-primary-light"
                    />
                    Set as primary
                </label>
            </div>

            {upload.isError && (
                <p className="text-sm text-danger">
                    {(upload.error as Error)?.message ?? "Upload failed"}
                </p>
            )}

            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton aspect-square rounded-lg" />
                    ))}
                </div>
            ) : media?.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-ink/15 rounded-lg">
                    <p className="text-sm text-ink-muted">No photos yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {media?.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-ink/[0.08]"
                        >
                            <img
                                src={item.fileUrl}
                                alt={item.caption ?? item.fileName}
                                className="h-full w-full object-cover"
                            />
                            {item.primaryMedia && (
                                <span className="absolute left-1.5 top-1.5 pill-success text-[10px] px-2 py-0.5">
                                    Primary
                                </span>
                            )}
                            <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/0 p-1.5 opacity-0 transition-opacity duration-150 group-hover:bg-black/30 group-hover:opacity-100">
                                {!item.primaryMedia && (
                                    <button
                                        type="button"
                                        onClick={() => setPrimary.mutate(item.id)}
                                        className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-medium text-ink hover:bg-white transition-colors"
                                    >
                                        Make primary
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => remove.mutate(item.id)}
                                    className="rounded-md bg-danger/95 px-2 py-1 text-[10px] font-medium text-white hover:bg-danger transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}