"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, Pencil } from "lucide-react";
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
            <div className="page-container">
                <button
                    onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    Back to property
                </button>
                <div className="card border-danger/20 bg-danger/[0.03] text-center py-10 max-w-md mx-auto">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load this unit</p>
                    <p className="text-xs text-ink-muted">{errorUnit.message}</p>
                </div>
            </div>
        );
    }

    if (!unit) return null;

    const handleSubmit = async (data: CreateUnitRequest) => {
        const { unitNumber, propertyId: _propertyId, ...updatePayload } = data;
        await updateUnit(unitId, updatePayload as UpdateUnitRequest);
        router.push(`/dashboard/properties/${propertyId}/units/${unitId}`);
    };

    return (
        <div className="page-container max-w-2xl">
            <button
                onClick={() => router.push(`/dashboard/properties/${propertyId}/units/${unitId}`)}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to unit
            </button>

            <div className="mb-6 flex items-start gap-3 animate-fade-in-up">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                    <Pencil className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Units</p>
                    <h1 className="page-title mb-1">Edit unit {unit.unitNumber}</h1>
                    <p className="page-subtitle mb-0">Update details for this unit</p>
                </div>
            </div>

            {errorUpdate && (
                <div className="card-sm animate-fade-in-up border-l-4 border-danger bg-danger/[0.03] flex gap-3 mb-6">
                    <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                        <p className="text-sm font-semibold text-ink">Couldn&#39;t save changes</p>
                        <p className="text-xs text-ink-muted mt-0.5">{errorUpdate.message}</p>
                    </div>
                </div>
            )}

            <div className="card animate-fade-in-up">
                <UnitForm
                    propertyId={propertyId}
                    defaultValues={{
                        unitNumber: unit.unitNumber,
                        label: unit.label,
                        rentAmount: unit.rentAmount,
                        depositAmount: unit.depositAmount,
                        description: unit.description,
                    }}
                    onSubmit={handleSubmit}
                    loading={loadingUpdate}
                    submitLabel="Update unit"
                />
            </div>
        </div>
    );
}