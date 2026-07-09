"use client";

import { Path, useForm } from "react-hook-form";
import { useRef, useEffect, useState } from "react";
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
        <form onSubmit={submit} className="space-y-6">
            {/* Basic info */}
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

            {/* Pricing */}
            <div className="grid gap-4 md:grid-cols-1">
                <label className="space-y-1">
                    <span className="form-label">Rent amount (KES)</span>
                    <input
                        className="form-input font-data"
                        type="number"
                        step="1"
                        placeholder="25000"
                        {...register("rentAmount", { valueAsNumber: true })}
                    />
                    {errors.rentAmount && (
                        <span className="text-xs text-danger">
                            {errors.rentAmount.message}
                        </span>
                    )}
                </label>
            </div>

            {/* Description */}
            <label className="block space-y-1">
                <span className="form-label">Description</span>
                <textarea
                    className="form-input min-h-[100px]"
                    placeholder="Short unit description"
                    {...register("description")}
                />
            </label>

            {/* Image Upload */}
            <div className="space-y-2">
                <span className="form-label">Unit image</span>
                <div className="flex items-center gap-3">
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="unit-image-upload"
                        onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
                    />
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        Upload image
                    </button>
                    {selectedFileName && (
                        <span className="text-sm text-ink-muted truncate max-w-[200px]">
                            {selectedFileName}
                        </span>
                    )}
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Saving…" : submitLabel}
            </button>
        </form>
    );
};