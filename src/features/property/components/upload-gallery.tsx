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

//debug
    console.log("media data:", JSON.stringify(media)); // 👈 add here


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
                    className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                    {upload.isPending ? "Uploading..." : "Upload Photos"}
                </button>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    Set as primary
                </label>
            </div>

            {upload.isError && (
                <p className="text-sm text-red-500">
                    {(upload.error as Error)?.message ?? "Upload failed"}
                </p>
            )}

            {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading media...</p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {media?.map((item) => (

                        <div
                            key={item.fileUrl}


                            className="group relative aspect-square overflow-hidden rounded-md border"
                        >
                            <img
                                src={item.fileUrl}
                                alt={item.caption ?? item.fileName}
                                className="h-full w-full object-cover"
                            />
                            {item.primaryMedia && (
                                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                                    Primary
                                </span>
                            )}
                            <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/0 p-1 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                                {!item.primaryMedia && (

                                    <button
                                        type="button"
                                        onClick={() => {

                                            setPrimary.mutate(item.id);
                                        }}
                                        className="rounded bg-white/90 px-1.5 py-0.5 text-[10px]"
                                    >
                                        Make primary
                                    </button>


                                )}
                                <button
                                    type="button"
                                    onClick={() => {

                                        remove.mutate(item.id);
                                    }}
                                    className="rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] text-white"
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