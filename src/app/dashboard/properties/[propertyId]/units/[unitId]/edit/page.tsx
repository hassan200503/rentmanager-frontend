"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { useUpdateUnit } from "@/features/unit/hooks/use-update-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import { CreateUnitRequest, UpdateUnitRequest } from "@/features/unit/types/unit-request";
import { unitKeys } from "@/features/unit/queries/unit-keys";
import Loading from "@/app/loading";

export default function EditUnitPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.propertyId as string;
    const unitId = params.unitId as string;
    const queryClient = useQueryClient();

    const {
        data: unit,
        isLoading: loadingUnit,
        error: errorUnit,
    } = useUnit(unitId);
    const {
        updateUnit,
        isLoading: loadingUpdate,
        error: errorUpdate,
    } = useUpdateUnit();

    useEffect(() => {
        if (!loadingUnit && !errorUnit && !unit) {
            router.replace(`/dashboard/properties/${propertyId}/units`);
        }
    }, [loadingUnit, errorUnit, unit, router, propertyId]);

    if (loadingUnit) return <Loading />;
    if (errorUnit) {
        return (
            <div className="p-6 bg-white rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Error</h2>
                <p className="text-red-600">{errorUnit.message}</p>
            </div>
        );
    }
    if (!unit) return null;

    const handleSubmit = async (data: CreateUnitRequest) => {
        const { unitNumber, ...updatePayload } = data;
        await updateUnit(unitId, updatePayload as UpdateUnitRequest);
        await queryClient.refetchQueries({ queryKey: unitKeys.detail(unitId) });
        router.push(`/dashboard/properties/${propertyId}/units/${unitId}`);
    };

    return (
        <div className="p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-semibold mb-4">Edit Unit</h1>
            <UnitForm
                propertyId={propertyId}
                defaultValues={{
                    unitNumber: unit.unitNumber,
                    rentAmount: unit.rentAmount,
                    description: unit.description,
                }}
                onSubmit={handleSubmit}
                loading={loadingUpdate}
                submitLabel="Update Unit"
            />
        </div>
    );
}