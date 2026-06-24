"use client";

import { useRouter, useParams } from "next/navigation";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { useUpdateUnit } from "@/features/unit/hooks/use-update-unit";
import { UnitForm } from "@/features/unit/components/unit-form";
import { CreateUnitRequest, UpdateUnitRequest } from "@/features/unit/types/unit-request";
import Loading from "@/app/loading";

export default function EditUnitPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.propertyId as string;
    const unitId = params.unitId as string;

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

    if (loadingUnit) return <Loading />;
    if (errorUnit) {
        return (
            <div className="p-6 bg-white rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Error</h2>
                <p className="text-red-600">{errorUnit.message}</p>
            </div>
        );
    }
    if (!unit) {
        router.replace(`/dashboard/properties/${propertyId}/units`);
        return null;
    }

    const handleSubmit = async (data: CreateUnitRequest) => {
        const { unitNumber, ...updatePayload } = data;
        await updateUnit(unitId, updatePayload as UpdateUnitRequest);
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