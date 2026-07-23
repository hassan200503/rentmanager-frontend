"use client";

import { useRouter, useParams } from "next/navigation";
import { useRef } from "react";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { useCreateUnit } from "@/features/unit/hooks/use-create-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import { CreateUnitRequest } from "@/features/unit/types/unit-request";
import { ApiError } from "@/lib/api/errors";

export default function CreateUnitPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.propertyId as string;

    const { createUnit, isLoading } = useCreateUnit();
    const setUnitNumberError = useRef<((msg: string) => void) | null>(null);

    const handleSubmit = async (data: CreateUnitRequest, imageFile?: File) => {
        try {
            const result = await createUnit(data, imageFile);
            if (result?.id) {
                router.push(`/dashboard/properties/${propertyId}/units/${result.id}`);
            }
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                setUnitNumberError.current?.(err.message);
            }
        }
    };

    return (
        <div className="page-container max-w-2xl">
            <button
                onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                className="inline-flex items-center gap-1.5 text-sm text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors mb-4"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to property
            </button>

            <div className="mb-6 flex items-start gap-3 animate-fade-in-up">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                    <DoorOpen className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-xs font-medium text-fg-muted dark:text-fg-muted-dark uppercase tracking-wide mb-1">Units</p>
                    <h1 className="page-title mb-1">Add new unit</h1>
                    <p className="page-subtitle mb-0">Add a unit to this property</p>
                </div>
            </div>

            <div className="card animate-fade-in-up">
                <UnitForm
                    propertyId={propertyId}
                    onSubmit={handleSubmit}
                    loading={isLoading}
                    submitLabel="Create unit"
                    onSetUnitNumberError={(fn) => {
                        setUnitNumberError.current = fn;
                    }}
                />
            </div>
        </div>
    );
}