"use client";

import { useRouter, useParams } from "next/navigation";
import { useRef } from "react";
import { useCreateUnit } from "@/features/unit/hooks/use-create-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import { CreateUnitRequest } from "@/features/unit/types/unit-request";
import { ApiError } from "@/lib/api/errors";
import Loading from "@/app/loading";

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

    if (isLoading) return <Loading />;

    return (
        <div className="p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-semibold mb-4">Add New Unit</h1>
            <UnitForm
                propertyId={propertyId}
                onSubmit={handleSubmit}
                loading={isLoading}
                submitLabel="Create Unit"
                onSetUnitNumberError={(fn) => {
                    return setUnitNumberError.current = fn;
                }}
            />
        </div>
    );
}