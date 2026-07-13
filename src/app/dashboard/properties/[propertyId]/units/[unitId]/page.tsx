"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, AlertTriangle, DoorOpen } from "lucide-react";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { UnitDetails } from "@/features/unit/components/unit-details";
import Loading from "@/app/loading";

export default function UnitDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.propertyId as string;
    const unitId = params.unitId as string;

    const { data: unit, isLoading, error } = useUnit(unitId);

    useEffect(() => {
        if (!isLoading && !error && !unit) {
            router.replace(`/dashboard/properties/${propertyId}/units`);
        }
    }, [isLoading, error, unit, router, propertyId]);

    if (isLoading) return <Loading />;

    if (error) {
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
                    <p className="text-xs text-ink-muted">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!unit) return null;

    return (
        <div className="page-container max-w-3xl space-y-6">
            <button
                onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to property
            </button>

            <div className="flex items-start gap-3 animate-fade-in-up">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                    <DoorOpen className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Units</p>
                    <h1 className="page-title mb-0">Unit details</h1>
                </div>
            </div>

            <div className="card animate-fade-in-up">
                <UnitDetails unit={unit} />
            </div>
        </div>
    );
}