"use client";

import { useRouter, useParams } from "next/navigation";
import { useRef } from "react";
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
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to property
            </button>

            <div className="mb-6 animate-fade-in-up">
                <h1 className="page-title mb-1">Add new unit</h1>
                <p className="page-subtitle mb-0">Add a unit to this property</p>
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