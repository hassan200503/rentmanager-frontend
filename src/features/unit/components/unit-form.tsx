"use client";

import { Path, useForm } from "react-hook-form";
import { useRef, useEffect, useState } from "react";
import { DoorOpen, Wallet, FileText, ImagePlus, X, Loader2 } from "lucide-react";
import { CreateUnitRequest } from "../types/unit-request";
import { UnitFormValues, unitSchema } from "../validations/unit-schema";

type UnitFormProps = {
    propertyId: string;
    defaultValues?: Partial<UnitFormValues>;
    onSubmit: (data: CreateUnitRequest, imageFile?: File) => Promise<void> | void;
    onSetUnitNumberError?: (fn: (msg: string) => void) => void;
    loading?: boolean;
    submitLabel?: string;
};

const emptyValues = (propertyId: string): UnitFormValues => ({
    propertyId,
    unitNumber: "",
    label: undefined,
    rentAmount: 0,
    description: undefined,
});

function SectionHeader({
                           icon: Icon,
                           title,
                       }: {
    icon: typeof DoorOpen;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink/[0.05]">
                <Icon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
    );
}

export const UnitForm = ({
                             propertyId,
                             defaultValues,
                             onSubmit,
                             onSetUnitNumberError,
                             loading = false,
                             submitLabel = "Save",
                         }: UnitFormProps) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<UnitFormValues>({
        defaultValues: { ...emptyValues(propertyId), ...defaultValues },
    });

    useEffect(() => {
        onSetUnitNumberError?.((msg) => {
            setError("unitNumber", { type: "manual", message: msg });
        });
    }, [onSetUnitNumberError, setError]);

    // Revoke the object URL on unmount / when replaced, so we don't leak
    // blob URLs as the user swaps images before submitting.
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFileName(file?.name ?? null);
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : null;
        });
    };

    const handleRemoveImage = () => {
        setSelectedFileName(null);
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const submit = handleSubmit(async (values) => {
        const parsed = unitSchema.safeParse(values);

        if (!parsed.success) {
            parsed.error.issues.forEach((issue) => {
                setError(issue.path.join(".") as Path<UnitFormValues>, {
                    type: "manual",
                    message: issue.message,
                });
            });
            return;
        }

        const imageFile = imageInputRef.current?.files?.[0];
        return onSubmit(parsed.data as CreateUnitRequest, imageFile);
    });

    return (
        <form onSubmit={submit} className="space-y-8">
            {/* Basic info */}
            <div>
                <SectionHeader icon={DoorOpen} title="Unit details" />
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1">
                        <span className="form-label">Unit number</span>
                        <input
                            className="form-input"
                            placeholder="A-101"
                            {...register("unitNumber")}
                        />
                        {errors.unitNumber && (
                            <span className="text-xs text-danger">
                                {errors.unitNumber.message}
                            </span>
                        )}
                    </label>

                    <label className="space-y-1">
                        <span className="form-label">Label</span>
                        <input
                            className="form-input"
                            placeholder="Optional label"
                            {...register("label")}
                        />
                        {errors.label && (
                            <span className="text-xs text-danger">{errors.label.message}</span>
                        )}
                    </label>
                </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-ink/10 pt-8">
                <SectionHeader icon={Wallet} title="Pricing" />
                <label className="space-y-1 block max-w-xs">
                    <span className="form-label">Rent amount</span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted font-data pointer-events-none">
                            KES
                        </span>
                        <input
                            className="form-input font-data pl-12"
                            type="number"
                            step="1"
                            min="0"
                            placeholder="25000"
                            {...register("rentAmount", { valueAsNumber: true })}
                        />
                    </div>
                    {errors.rentAmount && (
                        <span className="text-xs text-danger">
                            {errors.rentAmount.message}
                        </span>
                    )}
                </label>
            </div>

            {/* Description */}
            <div className="border-t border-ink/10 pt-8">
                <SectionHeader icon={FileText} title="Description" />
                <textarea
                    className="form-input min-h-[100px]"
                    placeholder="Short unit description"
                    {...register("description")}
                />
            </div>

            {/* Image Upload */}
            <div className="border-t border-ink/10 pt-8">
                <SectionHeader icon={ImagePlus} title="Unit photo" />

                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="unit-image-upload"
                    onChange={handleImageChange}
                />

                {previewUrl ? (
                    <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Selected unit"
                            className="h-20 w-20 rounded-lg object-cover border border-ink/10"
                        />
                        <div className="min-w-0">
                            <p className="text-sm text-ink truncate max-w-[240px]">{selectedFileName}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <button
                                    type="button"
                                    className="text-xs font-medium text-primary hover:underline"
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    Change
                                </button>
                                <button
                                    type="button"
                                    className="text-xs font-medium text-danger inline-flex items-center gap-1 hover:underline"
                                    onClick={handleRemoveImage}
                                >
                                    <X className="h-3 w-3" strokeWidth={2} />
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border border-dashed border-ink/15 bg-ink/[0.015] py-8 text-center hover:bg-ink/[0.03] hover:border-ink/25 transition-colors"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05]">
                            <ImagePlus className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium text-ink">Click to upload a photo</span>
                        <span className="text-xs text-ink-muted">PNG or JPG</span>
                    </button>
                )}
            </div>

            {/* Submit */}
            <div className="border-t border-ink/10 pt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                    {loading ? "Saving…" : submitLabel}
                </button>
            </div>
        </form>
    );
};