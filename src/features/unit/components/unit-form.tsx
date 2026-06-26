"use client";

import { Path, useForm } from "react-hook-form";
import { useRef, useEffect } from "react";
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
                    <span className="text-sm font-medium text-gray-700">Unit Number</span>
                    <input
                        className="input-field"
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
                    <span className="text-sm font-medium text-gray-700">Label</span>
                    <input
                        className="input-field"
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
                    <span className="text-sm font-medium text-gray-700">
                        Rent Amount (KES)
                    </span>
                    <input
                        className="input-field"
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
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea
                    className="input-field min-h-[100px]"
                    placeholder="Short unit description"
                    {...register("description")}
                />
            </label>

            {/* Image Upload */}
            <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Unit Image</span>
                <div className="flex items-center gap-3">
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="unit-image-upload"
                    />
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        Upload Image
                    </button>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className={`btn-primary w-full ${loading ? "opacity-60" : ""}`}
            >
                {loading ? "Saving…" : submitLabel}
            </button>
        </form>
    );
};